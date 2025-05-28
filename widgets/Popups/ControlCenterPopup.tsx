// widgets/Popups/ControlCenterPopup.tsx
import { App, Astal, Gtk } from 'astal/gtk3';
// Usunięto 'bind' i 'execAsync', bo nie są już tu bezpośrednio potrzebne
import GLib from 'gi://GLib';
import {
	CONTROL_CENTER_POPUP_NAME,
	POPUP_OVERLAY_NAME,
	POPUP_CLICKED_INSIDE,
} from '../../app';

// Importy poszczególnych sekcji
import { QuickTogglesSection } from '../ControlCenter/QuickTogglesSection';
import { VolumeSection } from '../ControlCenter/VolumeSection';
import { BrightnessSection } from '../ControlCenter/BrightnessSection';
import { SystemActionsSection } from '../ControlCenter/SystemActionsSection';
import { PowerProfilesSection } from '../ControlCenter/PowerProfilesSection'; 
import { NetworkSection } from '../ControlCenter/NetworkSection'; 
import { NightLightToggle } from '../ControlCenter/NightLightToggle'; 

// Importy wskaźników i serwisów, które były tu wcześniej, a teraz są w sekcjach, zostały usunięte.

const GdkRuntime = imports.gi.Gdk;

export const ControlCenterPopup = () => {
	let keyPressHandlerId = 0;
	let showHandlerId = 0;
	let hideHandlerId = 0;
	let selfButtonPressHandlerId = 0;

	return (
		<window
			name={CONTROL_CENTER_POPUP_NAME}
			application={App}
			className="control-center-popup-window"
			focusable={true}
			decorated={false}
			resizable={false}
			layer={Astal.Layer.OVERLAY}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			margin={[45, 10, 10, 0]}
			keymode={Astal.Keymode.ON_DEMAND}
			setup={(self: Gtk.Window) => {
				self.hide();
				self.set_skip_taskbar_hint(true);
				self.set_skip_pager_hint(true);

				if (!self.get_can_focus()) {
					self.set_can_focus(true);
				}

				self.add_events(GdkRuntime.EventMask.BUTTON_PRESS_MASK);
				selfButtonPressHandlerId = self.connect('button-press-event', () => {
					POPUP_CLICKED_INSIDE.set(true);
					return GdkRuntime.EVENT_PROPAGATE;
				});

				showHandlerId = self.connect('show', () => {
					POPUP_CLICKED_INSIDE.set(false);

					const overlay = App.get_window(POPUP_OVERLAY_NAME);
					if (overlay && !overlay.visible) {
						overlay.show();
					}

					GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 50, () => {
						if (self.visible) {
							self.get_window()?.raise();
							self.grab_focus();
						}
						return GLib.SOURCE_REMOVE;
					});
				});

				hideHandlerId = self.connect('hide', () => {
					const overlay = App.get_window(POPUP_OVERLAY_NAME);
					if (overlay?.visible) {
						overlay.hide();
					}
				});

				keyPressHandlerId = self.connect(
					'key-press-event',
					(_widget, event) => {
						const keyval = event.get_keyval()[1];
						if (keyval === GdkRuntime.KEY_Escape) {
							self.hide();
							return GdkRuntime.EVENT_STOP;
						}
						return GdkRuntime.EVENT_PROPAGATE;
					}
				);

				self.connect('destroy', () => {
					if (showHandlerId) self.disconnect(showHandlerId);
					if (hideHandlerId) self.disconnect(hideHandlerId);
					if (keyPressHandlerId) self.disconnect(keyPressHandlerId);
					if (selfButtonPressHandlerId)
						self.disconnect(selfButtonPressHandlerId);
				});
			}}
		>
			{/* Główny kontener zawartości CCP */}
			<box
				className="control-center-content"
				orientation={Gtk.Orientation.VERTICAL}
				spacing={10}
				css="padding: 15px; min-width: 320px; min-height: 400px;" // min-height może wymagać dostosowania
			>
				<NetworkSection />
				<QuickTogglesSection />
				<VolumeSection />
				<BrightnessSection />
				<NightLightToggle />
				<PowerProfilesSection /> 
				{/* Tutaj dodasz więcej sekcji w przyszłości, np. NetworkSection, BluetoothSection, VpnSection */}

				{/* Sekcja Akcji Systemowych na samym dole, wypchnięta przez vexpand w jej własnym <box> */}
				<SystemActionsSection />
			</box>
		</window>
	);
};
