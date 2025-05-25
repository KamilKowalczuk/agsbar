// widgets/Popups/ControlCenterPopup.tsx
import { App, Astal, Gtk } from 'astal/gtk3';
import { bind, Variable } from 'astal';
import { execAsync } from 'astal/process';
import GLib from 'gi://GLib';
import { CONTROL_CENTER_POPUP_NAME, POPUP_OVERLAY_NAME } from '../../app';

import {
	systemVolumePercent,
	systemIsMuted,
	updateSharedVolumeState,
} from '../../services/VolumeService';
import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
import { PowerSourceWidget } from '../Bar/PowerSourceWidget';

const Gdk = imports.gi.Gdk;

export const ControlCenterPopup = () => {
	let keyPressHandlerId = 0;
	let showHandlerId = 0;
	let hideHandlerId = 0;
	let focusInHandlerId = 0;
	let focusOutHandlerId = 0;

	// Zmienna do śledzenia, czy popup powinien mieć fokus
	const shouldHaveFocus = Variable(false);

	return (
		<window
			name={CONTROL_CENTER_POPUP_NAME}
			application={App}
			className="control-center-popup-window"
			// type={Gtk.WindowType.TOPLEVEL} // Usunięte, aby sprawdzić, czy to rozwiązuje błąd GLib
			focusable={true} // Kluczowe dla otrzymywania zdarzeń klawiatury
			decorated={false}
			resizable={false}
			layer={Astal.Layer.TOP}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			margin={[45, 10, 10, 0]}
			exclusive_zone={-1}
			keymode={Astal.Keymode.ON_DEMAND} // Pozwala na programowe przyznanie fokusu
			setup={(self: Gtk.Window) => {
				self.hide();
				console.log(`[${CONTROL_CENTER_POPUP_NAME}] Setup: Window initialized (Layer TOP).`);
				self.set_skip_taskbar_hint(true);
				self.set_skip_pager_hint(true);

				if (!self.get_can_focus()) {
					self.set_can_focus(true);
				}
				// self.set_accept_focus(true); // Dodatkowa właściwość, którą można przetestować

				const mainBarWindow = App.get_window('bar-1');
				if (mainBarWindow instanceof Gtk.Window) {
					self.set_transient_for(mainBarWindow);
				}

				showHandlerId = self.connect('show', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'show': Window is now visible.`);
					
					const overlay = App.get_window(POPUP_OVERLAY_NAME);
					if (overlay && !overlay.visible) {
						console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'show': Showing overlay '${POPUP_OVERLAY_NAME}'.`);
						App.toggle_window(POPUP_OVERLAY_NAME); 
					}

					GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
						if (self.visible) {
							const gdkSelfWin = self.get_window();
							if (gdkSelfWin) {
								gdkSelfWin.raise(); 
								console.log(`[${CONTROL_CENTER_POPUP_NAME}] Raised self window.`);
							}
							console.log(`[${CONTROL_CENTER_POPUP_NAME}] Attempting to grab focus (after raise).`);
							// self.grab_focus(); // Próba fokusu

                            // Kluczowe: Ustawienie keyboard grab, jeśli to możliwe i pożądane
                            // To jest bardziej zaawansowane i może wymagać innego podejścia
                            // if (gdkSelfWin) {
                            //     const seat = Gdk.Display.get_default()?.get_default_seat();
                            //     seat?.grab(gdkSelfWin, Gdk.SeatCapabilities.KEYBOARD, false, null, null, null);
                            //     console.log(`[${CONTROL_CENTER_POPUP_NAME}] Attempted keyboard grab.`);
                            // }


							GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 50, () => {
								if (self.visible && self.has_focus) {
									console.log(`[${CONTROL_CENTER_POPUP_NAME}] Focus check (after raise): Has focus.`);
								} else if (self.visible) {
									console.warn(`[${CONTROL_CENTER_POPUP_NAME}] Focus check (after raise): FAILED to grab/keep focus.`);
								}
								return GLib.SOURCE_REMOVE;
							});
						}
						return GLib.SOURCE_REMOVE;
					});
				});

				hideHandlerId = self.connect('hide', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'hide': Hiding popup.`);
					// const seat = Gdk.Display.get_default()?.get_default_seat(); // Jeśli używasz keyboard grab
                    // seat?.ungrab(); // Zwolnij keyboard grab
                    // console.log(`[${CONTROL_CENTER_POPUP_NAME}] Ungrabbed keyboard.`);

					const overlay = App.get_window(POPUP_OVERLAY_NAME);
					if (overlay?.visible) {
						console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'hide': Hiding overlay '${POPUP_OVERLAY_NAME}'.`);
						App.toggle_window(POPUP_OVERLAY_NAME);
					}
				});

				hideHandlerId = self.connect('hide', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'hide': Hiding popup.`);
					const overlay = App.get_window(POPUP_OVERLAY_NAME);
					if (overlay?.visible) {
						console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'hide': Hiding overlay '${POPUP_OVERLAY_NAME}'.`);
						App.toggle_window(POPUP_OVERLAY_NAME);
					}
				});

				hideHandlerId = self.connect('hide', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'hide': Hiding popup.`);
					shouldHaveFocus.set(false);
					const overlay = App.get_window(POPUP_OVERLAY_NAME);
					if (overlay?.visible) {
						console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'hide': Hiding overlay '${POPUP_OVERLAY_NAME}'.`);
						App.toggle_window(POPUP_OVERLAY_NAME);
					}
				});

				// Logowanie zdarzeń fokusu
				focusInHandlerId = self.connect('focus-in-event', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'focus-in-event': Gained focus.`);
					return Gdk.EVENT_PROPAGATE;
				});

				focusOutHandlerId = self.connect('focus-out-event', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'focus-out-event': Lost focus.`);
					// Jeśli okno traci fokus, a nie powinno (np. przez kliknięcie w inne okno aplikacji, a nie overlay)
					// To jest bardziej skomplikowany scenariusz, na razie tylko logujemy.
					// W idealnym świecie, kliknięcie poza (na overlay) powinno zamknąć popup.
					// Jeśli fokus ucieka gdzie indziej, a overlay jest widoczny,
					// to może być problem z warstwami lub menedżerem okien.
					return Gdk.EVENT_PROPAGATE;
				});


				keyPressHandlerId = self.connect('key-press-event', (_widget, event) => {
					const keyval = event.get_keyval()[1];
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'key-press-event': Key ${Gdk.keyval_name(keyval)} pressed.`);
					if (keyval === Gdk.KEY_Escape) {
						console.log(`[${CONTROL_CENTER_POPUP_NAME}] Escape pressed. Closing window.`);
						App.toggle_window(CONTROL_CENTER_POPUP_NAME);
						return Gdk.EVENT_STOP;
					}
					return Gdk.EVENT_PROPAGATE;
				});

				self.connect('destroy', () => {
					console.log(`[${CONTROL_CENTER_POPUP_NAME}] Signal 'destroy': Disconnecting handlers.`);
					if (showHandlerId) self.disconnect(showHandlerId);
					if (hideHandlerId) self.disconnect(hideHandlerId);
					if (keyPressHandlerId) self.disconnect(keyPressHandlerId);
					if (focusInHandlerId) self.disconnect(focusInHandlerId);
					if (focusOutHandlerId) self.disconnect(focusOutHandlerId);
					showHandlerId = 0;
					hideHandlerId = 0;
					keyPressHandlerId = 0;
					focusInHandlerId = 0;
					focusOutHandlerId = 0;
				});
			}}
		>
			{/* ... (reszta zawartości bez zmian) ... */}
            <box
				className="control-center-content"
				orientation={Gtk.Orientation.VERTICAL}
				spacing={10}
				css="padding: 15px; min-width: 320px; min-height: 400px;"
			>
				{/* SEKCJA SZYBKICH PRZEŁĄCZNIKÓW */}
				<box
					className="cc-quick-toggles"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
					halign={Gtk.Align.CENTER}
					css="margin-bottom: 10px;"
				>
					<button tooltip_text="Ustawienia Sieci">
						<NetworkIndicatorWidget />
					</button>
					<button tooltip_text="Ustawienia Bluetooth">
						<BluetoothIndicatorWidget />
					</button>
					<button tooltip_text="Tryb Nie Przeszkadzać">
						<icon icon="notifications-disabled-symbolic" />
					</button>
				</box>

				{/* SEKCJA GŁOŚNOŚCI */}
				<box
					className="cc-section volume-section"
					orientation={Gtk.Orientation.VERTICAL}
					spacing={5}
				>
					<box
						orientation={Gtk.Orientation.HORIZONTAL}
						spacing={10}
						align={Gtk.Align.CENTER}
					>
						<label label="Głośność" halign={Gtk.Align.START} hexpand={true} />
						<button
							className="popup-mute-button"
							tooltip_text={bind(systemIsMuted).as((m) =>
								m ? 'Włącz dźwięk' : 'Wycisz'
							)}
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
					</box>
					<slider
						className="volume-slider"
						hexpand={true}
						min={0}
						max={100}
						value={systemVolumePercent.get()}
						setup={(selfSlider: Gtk.Scale) => {
							selfSlider.set_draw_value(false);
							const volumeSub = systemVolumePercent.subscribe((volume) => {
								if (selfSlider.get_value() !== volume) {
									selfSlider.set_value(volume);
								}
							});
							selfSlider.connect('destroy', () => {
								volumeSub();
							});
						}}
						onValueChanged={(selfSlider: Gtk.Scale) => {
							const newVolume = Math.round(selfSlider.get_value());
							if (systemVolumePercent.get() !== newVolume) {
								execAsync([
									'wpctl',
									'set-volume',
									'@DEFAULT_AUDIO_SINK@',
									`${newVolume}%`,
								])
								.then(updateSharedVolumeState)
								.catch((err) =>
									console.error('CC Popup: Error setting volume', err)
								);
							}
						}}
					/>
				</box>

				{/* SEKCJA JASNOŚCI EKRANU */}
				<box
					className="cc-section brightness-section"
					orientation={Gtk.Orientation.VERTICAL}
					spacing={5}
				>
					<label label="Jasność Ekranu" halign={Gtk.Align.START} />
					<slider
						className="brightness-slider"
						hexpand={true}
						min={5}
						max={100}
						value={80}
						setup={(selfSlider: Gtk.Scale) => selfSlider.set_draw_value(false)}
					/>
				</box>

				{/* SEKCJA ZASILANIA/BATERII */}
				<box
					className="cc-section power-section"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
					align={Gtk.Align.CENTER}
				>
					<PowerSourceWidget />
				</box>

				{/* DOLNA BELKA Z PRZYCISKAMI SYSTEMOWYMI */}
				<box
					className="cc-system-actions"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
					halign={Gtk.Align.END}
					hexpand={true}
					vexpand={true}
					valign={Gtk.Align.END}
				>
					<button
						tooltip_text="Ustawienia Systemowe"
						onClicked={() => execAsync('gnome-control-center').catch(err => console.error("Błąd otwierania gnome-control-center", err))}
					>
						<icon icon="preferences-system-symbolic" />
					</button>
					<button
						tooltip_text="Zablokuj Ekran"
						onClicked={() => execAsync('loginctl lock-session').catch(err => console.error("Błąd blokowania ekranu", err))}
					>
						<icon icon="system-lock-screen-symbolic" />
					</button>
					<button
						tooltip_text="Wyloguj"
						onClicked={() =>
							execAsync('gnome-session-quit --logout --no-prompt').catch(err => console.error("Błąd wylogowywania", err))
						}
					>
						<icon icon="system-log-out-symbolic" />
					</button>
					<button
						tooltip_text="Zamknij System"
						onClicked={() =>
							execAsync('gnome-session-quit --power-off --no-prompt').catch(err => console.error("Błąd zamykania systemu", err))
						}
					>
						<icon icon="system-shutdown-symbolic" />
					</button>
				</box>
			</box>
		</window>
	);
};