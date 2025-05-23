// widgets/Popups/VolumeSliderPopup.tsx
import { App, Gtk } from 'astal/gtk3'; // Usunąłem Astal, bo nie używamy tu LayerShell
import { bind } from 'astal';
import { execAsync } from 'astal/process';
import {
	systemVolumePercent,
	systemIsMuted,
	updateSharedVolumeState,
} from '../../services/VolumeService';
const Gdk = imports.gi.Gdk;

export const VolumeSliderPopup = () => {
	return (
		<window
			name="volume-popup"
			application={App}
			className="volume-popup-window test-popup"
			type={Gtk.WindowType.TOPLEVEL}
			focusable={true}
			decorated={true}
			resizable={true}
			default_width={300}
			// === WŁAŚCIWOŚCI GTK-LAYER-SHELL ZAKOMENTOWANE NA CZAS TESTÓW FOCUS/CLOSE ===
			// layer={Astal.Layer.TOP}
			// anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			// margin={[50, 50, 0, 0]}
			// exclusive_zone={-1}

			setup={(self: Gtk.Window) => {
				self.hide();
				// console.log('VolumeSliderPopup: Setup - wywołano self.hide() na starcie.');

				const topBarWindow = App.get_window('bar-0');
				if (topBarWindow instanceof Gtk.Window) {
					self.set_transient_for(topBarWindow);
					self.set_destroy_with_parent(true);
					// console.log("VolumeSliderPopup: Ustawiono transient_for na 'bar-0'.");
				} 

				self.set_type_hint(Gdk.WindowTypeHint.DIALOG); // Spróbujmy DIALOG lub NORMAL
				self.set_skip_taskbar_hint(true);
				self.set_skip_pager_hint(true);

				if (!self.get_can_focus()) {
					self.set_can_focus(true);
				}

				// === DODAJEMY MASKĘ ZDARZEŃ ===
				// To mówi GTK, że to okno chce otrzymywać zdarzenia zmiany fokusu i klawiatury
				self.add_events(
					Gdk.EventMask.FOCUS_CHANGE_MASK | Gdk.EventMask.KEY_PRESS_MASK
				);
				console.log(
					'VolumeSliderPopup: Dodano FOCUS_CHANGE_MASK i KEY_PRESS_MASK do zdarzeń okna.'
				);

				let showHandlerId = 0,
					focusOutHandlerId = 0,
					keyPressHandlerId = 0;

				showHandlerId = self.connect('show', () => {
					console.log(
						'VolumeSliderPopup: Pokazano okno. Próba self.grab_focus().'
					);
					self.grab_focus();
				});

				focusOutHandlerId = self.connect('focus-out-event', () => {
					console.log(
						'VolumeSliderPopup: Utrata fokusu, ukrywam okno (przez App.toggleWindow).'
					);
					App.toggle_window('volume-popup');
					return true;
				});

				keyPressHandlerId = self.connect(
					'key-press-event',
					(_widget, event) => {
						const keyval = event.get_keyval()[1];
						if (keyval === Gdk.KEY_Escape) {
							console.log(
								'VolumeSliderPopup: Naciśnięto Escape, ukrywam okno (przez App.toggleWindow).'
							);
							App.toggle_window('volume-popup');
							return true;
						}
						return false;
					}
				);

				self.connect('destroy', () => {
					if (showHandlerId !== 0) self.disconnect(showHandlerId);
					if (focusOutHandlerId !== 0) self.disconnect(focusOutHandlerId);
					if (keyPressHandlerId !== 0) self.disconnect(keyPressHandlerId);
					// console.log("VolumeSliderPopup: Sygnały rozłączone przy destroy.");
				});
			}}
		>
			{/* Zawartość pop-upa (box z przyciskiem mute i suwakiem) bez zmian */}
			<box
				className="volume-popup-content"
				orientation={Gtk.Orientation.HORIZONTAL}
				spacing={10}
				hexpand={true}
				vexpand={true}
				valign={Gtk.Align.CENTER}
				css="padding: 12px; min-height: 40px;"
			>
				<button
					className="popup-mute-button"
					onClicked={() => {
						execAsync([
							'wpctl',
							'set-mute',
							'@DEFAULT_AUDIO_SINK@',
							'toggle',
						]).then(updateSharedVolumeState);
					}}
				>
					<icon
						icon={bind(systemIsMuted).as((m) =>
							m
								? 'audio-volume-muted-symbolic'
								: systemVolumePercent.get() > 0
								? 'audio-volume-high-symbolic'
								: 'audio-volume-off-symbolic'
						)}
					/>
				</button>
				<slider
					className="volume-slider"
					hexpand={true}
					valign={Gtk.Align.CENTER}
					min={0}
					max={100}
					value={systemVolumePercent.get()}
					setup={(selfSlider: any) => {
						selfSlider.hook(systemVolumePercent, () => {
							if (selfSlider.value !== systemVolumePercent.get()) {
								selfSlider.value = systemVolumePercent.get();
							}
						});
					}}
					onDragged={(selfSlider: any) => {
						const newVolume = Math.round(selfSlider.value);
						systemVolumePercent.set(newVolume);
						execAsync([
							'wpctl',
							'set-volume',
							'@DEFAULT_AUDIO_SINK@',
							`${newVolume}%`,
						]);
					}}
				/>
			</box>
		</window>
	);
};
