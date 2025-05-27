// widgets/Popups/PopupOverlay.tsx
import { App, Astal, Gtk } from 'astal/gtk3';
// Zaimportuj współdzieloną flagę i nazwy
import {
	CONTROL_CENTER_POPUP_NAME,
	POPUP_OVERLAY_NAME,
	POPUP_CLICKED_INSIDE,
} from '../../app'; // lub '../../lib/popupState'
import GLib from 'gi://GLib';

const GdkRuntime = imports.gi.Gdk;

export const PopupOverlay = () => {
	return (
		<window
			name={POPUP_OVERLAY_NAME}
			application={App}
			className="popup-overlay-window"
			layer={Astal.Layer.TOP} // PO może zostać na TOP, jeśli CCP jest na OVERLAY
			anchor={
				Astal.WindowAnchor.TOP |
				Astal.WindowAnchor.BOTTOM |
				Astal.WindowAnchor.LEFT |
				Astal.WindowAnchor.RIGHT
			}
			exclusivity={Astal.Exclusivity.IGNORE}
			focusable={false}
			decorated={false}
			resizable={false}
			setup={(self: Gtk.Window) => {
				self.hide();
				self.set_can_focus(false);
				self.set_skip_taskbar_hint(true);
				self.set_skip_pager_hint(true);

				let realizeHandlerId = self.connect('realize', () => {});

				self.add_events(GdkRuntime.EventMask.BUTTON_PRESS_MASK);
				const buttonPressHandlerId = self.connect(
					'button-press-event',
					(_widget, event: any) => {
						// Sprawdź flagę *przed* podjęciem decyzji
						if (POPUP_CLICKED_INSIDE.get()) {
							POPUP_CLICKED_INSIDE.set(false); // Zresetuj flagę
							return GdkRuntime.EVENT_PROPAGATE; // Pozwól CCP obsłużyć swoje zdarzenie
						}

						// Jeśli flaga jest false, oznacza to kliknięcie naprawdę "poza" CCP
						const ccWindow = App.get_window(CONTROL_CENTER_POPUP_NAME);
						if (ccWindow?.visible) {
							ccWindow.hide();
						}

						if (self.visible) {
							// Ukryj również overlay
							self.hide();
						}
						return GdkRuntime.EVENT_STOP;
					}
				);

				self.connect('destroy', () => {
					if (realizeHandlerId) self.disconnect(realizeHandlerId);
					if (buttonPressHandlerId) self.disconnect(buttonPressHandlerId);
				});
			}}
		>
			<box className="popup-overlay-content" />
		</window>
	);
};
