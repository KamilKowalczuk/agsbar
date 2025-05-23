// widgets/Popups/ControlCenterPopup.tsx
import { App, Astal, Gtk } from 'astal/gtk3';
import { bind, Variable } from 'astal';
import { execAsync } from 'astal/process';
import GLib from 'gi://GLib';

// Importujemy potrzebne stany i komponenty
import {
	systemVolumePercent,
	systemIsMuted,
	updateSharedVolumeState,
} from '../../services/VolumeService';
import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
import { PowerSourceWidget } from '../Bar/PowerSourceWidget';

const Gdk = imports.gi.Gdk;
export const CONTROL_CENTER_POPUP_NAME = 'control-center-popup';

export const ControlCenterPopup = () => {
	let focusOutHandlerId = 0; // Dodajemy, jeśli będziemy tego potrzebować
	let keyPressHandlerId = 0;
	let showHandlerId = 0;

	return (
		<window
			name={CONTROL_CENTER_POPUP_NAME}
			application={App}
			className="control-center-popup-window"
			type={Gtk.WindowType.TOPLEVEL}
			focusable={true}
			decorated={false}
			resizable={false}
			layer={Astal.Layer.TOP}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			margin={[
				45, // Odstęp od góry (wysokość paska + mały margines)
				10, // Odstęp od prawej
				10, // Odstęp od dołu
				0,
			]}
			exclusive_zone={-1}
			keymode={Astal.Keymode.ON_DEMAND} // Aby przechwytywać klawisze
			setup={(self: Gtk.Window) => {
				self.hide();
				self.set_skip_taskbar_hint(true);
				self.set_skip_pager_hint(true);

				if (!self.get_can_focus()) {
					self.set_can_focus(true);
				}

				const mainBarWindow = App.get_window('bar-1'); // Lub 'bar-0'
				if (mainBarWindow instanceof Gtk.Window) {
					self.set_transient_for(mainBarWindow);
				}

				showHandlerId = self.connect('show', () => {
					self.grab_focus();
				});

				keyPressHandlerId = self.connect('key-press-event', (_w, e) => {
					const keyval = e.get_keyval()[1];
					if (keyval === Gdk.KEY_Escape) {
						Astal.close_window(CONTROL_CENTER_POPUP_NAME);
						return Gdk.EVENT_STOP;
					}
					return Gdk.EVENT_PROPAGATE;
				});

				// ------ OBSŁUGA FOCUS-OUT-EVENT (opcjonalnie, jeśli potrzebne) ------
				// focusOutHandlerId = self.connect('focus-out-event', () => {
				//     // Potrzebna bardziej zaawansowana logika, aby nie zamykać,
				//     // gdy focus przechodzi do elementu potomnego.
				//     // Na razie proste:
				//     // App.close_window(CONTROL_CENTER_POPUP_NAME);
				//     // console.log("ControlCenterPopup: focus-out-event");
				//     return Gdk.EVENT_STOP;
				// });
				// --------------------------------------------------------------------

				self.connect('destroy', () => {
					if (showHandlerId) self.disconnect(showHandlerId);
					if (keyPressHandlerId) self.disconnect(keyPressHandlerId);
					if (focusOutHandlerId) self.disconnect(focusOutHandlerId); // Jeśli używasz
					showHandlerId = 0;
					keyPressHandlerId = 0;
					focusOutHandlerId = 0;
				});
			}}
		>
			<box
				className="control-center-content"
				orientation={Gtk.Orientation.VERTICAL}
				spacing={10} // Zmniejszony spacing dla bardziej zwartego wyglądu
				css="padding: 15px; min-width: 320px; min-height: 400px;"
			>
				{/* --- SEKCJA SZYBKICH PRZEŁĄCZNIKÓW --- */}
				<box
					className="cc-quick-toggles"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
					halign={Gtk.Align.CENTER}
					css="margin-bottom: 10px;"
				>
					<button tooltip_text="Ustawienia Sieci">
						{/* Używamy wskaźnika jako zawartości przycisku */}
						<NetworkIndicatorWidget />
					</button>
					<button tooltip_text="Ustawienia Bluetooth">
						<BluetoothIndicatorWidget />
					</button>
					<button tooltip_text="Tryb Nie Przeszkadzać">
						<icon icon="notifications-disabled-symbolic" />
					</button>
					{/* Możesz dodać więcej przycisków */}
				</box>

				{/* --- SEKCJA GŁOŚNOŚCI --- */}
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
							const unsubscribe = systemVolumePercent.subscribe(() => {
								if (selfSlider.get_value() !== systemVolumePercent.get()) {
									selfSlider.set_value(systemVolumePercent.get());
								}
							});
							selfSlider.connect('destroy', () => unsubscribe());
						}}
						onValueChanged={(selfSlider: Gtk.Scale) => {
							const newVolume = Math.round(selfSlider.get_value());
							if (systemVolumePercent.get() !== newVolume) {
								systemVolumePercent.set(newVolume);
								execAsync([
									'wpctl',
									'set-volume',
									'@DEFAULT_AUDIO_SINK@',
									`${newVolume}%`,
								]).catch((err) =>
									console.error('CC Popup: Error setting volume', err)
								);
							}
						}}
					/>
				</box>

				{/* --- SEKCJA JASNOŚCI EKRANU (placeholder) --- */}
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
						// TODO: dodać logikę zmiany jasności, np. przez `brightnessctl`
					/>
				</box>

				{/* --- SEKCJA ZASILANIA/BATERII --- */}
				<box
					className="cc-section power-section"
					orientation={Gtk.Orientation.HORIZONTAL} // Zmienione na HORIZONTAL dla lepszego ułożenia
					spacing={10}
					align={Gtk.Align.CENTER} // Wyśrodkowanie w pionie
				>
					{/* Użyj pełnego PowerSourceWidget, który ma ikonę i procenty */}
					<PowerSourceWidget />
					{/* Jeśli chcesz wyświetlić tooltip_text jako label, musisz uzyskać ten tekst ze stanu lub eksportu PowerSourceWidget */}
					{/* Przykład: jeśli masz zmienną eksportowaną np. powerSourceTooltipText */}
					{/* <label
						label={bind(powerSourceTooltipText)}
						vexpand={true}
						halign={Gtk.Align.START}
						wrap={true}
					/> */}
					{/* TODO: Dodać przycisk do zmiany profili mocy, jeśli to PC */}
				</box>

				{/* --- DOLNA BELKA Z PRZYCISKAMI SYSTEMOWYMI --- */}
				<box
					className="cc-system-actions"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
					halign={Gtk.Align.END} // Wyrównaj do prawej
					hexpand={true} // Rozciągnij, aby wypełnić przestrzeń
					vexpand={true} // Wypchnij na sam dół
					valign={Gtk.Align.END} // Wyrównaj do dołu
				>
					<button
						tooltip_text="Ustawienia Systemowe"
						onClicked={() => execAsync('gnome-control-center')}
					>
						<icon icon="preferences-system-symbolic" />
					</button>
					<button
						tooltip_text="Zablokuj Ekran"
						onClicked={() => execAsync('loginctl lock-session')}
					>
						<icon icon="system-lock-screen-symbolic" />
					</button>
					<button
						tooltip_text="Wyloguj"
						onClicked={() =>
							execAsync('gnome-session-quit --logout --no-prompt')
						}
					>
						<icon icon="system-log-out-symbolic" />
					</button>
					<button
						tooltip_text="Zamknij System"
						onClicked={() =>
							execAsync('gnome-session-quit --power-off --no-prompt')
						}
					>
						<icon icon="system-shutdown-symbolic" />
					</button>
				</box>
			</box>
		</window>
	);
};
