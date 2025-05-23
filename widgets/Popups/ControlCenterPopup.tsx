// widgets/Popups/ControlCenterPopup.tsx
import { App, Astal, Gtk } from 'astal/gtk3'; // Astal dla LayerShell
import { bind } from 'astal';
import { execAsync } from 'astal/process';

// Importujemy potrzebne stany i komponenty (lub ich logikę)
import {
	systemVolumePercent,
	systemIsMuted,
	updateSharedVolumeState,
	barVolumeIconName as volumeIconNameForMuteButton,
} from '../../services/VolumeService'; // Zmieniamy alias dla ikony
import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator'; // Możemy reużyć całego widgetu lub tylko jego logiki/ikony
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
import { PowerSourceWidget } from '../Bar/PowerSourceWidget';
// import { formatTimeFromSeconds } from '../../lib/formatters'; // Jeśli potrzebne

const Gdk = imports.gi.Gdk;
export const CONTROL_CENTER_POPUP_NAME = 'control-center-popup';

export const ControlCenterPopup = () => {
	return (
		<window
			name={CONTROL_CENTER_POPUP_NAME}
			application={App}
			className="control-center-popup-window" // Nowa klasa CSS
			type={Gtk.WindowType.TOPLEVEL} // Zacznijmy od TOPLEVEL
			focusable={true}
			decorated={false} // Bez dekoracji systemowych
			resizable={false}
			// default_width={350} // Dostosuj szerokość

			// Ustawienia gtk-layer-shell dla pozycjonowania (np. prawy górny róg)
			layer={Astal.Layer.TOP}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			margin={[
				10, // Odstęp od góry (tuż pod paskiem lub z małym marginesem)
				10, // Odstęp od prawej
				10, // Odstęp od dołu (jeśli chcemy, aby nie był za wysoki)
				0, // Bez lewego marginesu
			]}
			exclusive_zone={-1} // Nie rezerwuje przestrzeni
			setup={(self: Gtk.Window) => {
				self.hide(); // Domyślnie ukryty
				self.set_skip_taskbar_hint(true);
				self.set_skip_pager_hint(true);
				// self.set_type_hint(Gdk.WindowTypeHint.UTILITY); // Można eksperymentować

				if (!self.get_can_focus()) self.set_can_focus(true);

				let sH = 0,
					kPH = 0; // showHandlerId, keyPressHandlerId
				sH = self.connect('show', () => {
					self.grab_focus();
				});
				kPH = self.connect('key-press-event', (_w, e) => {
					if (e.get_keyval()[1] === Gdk.KEY_Escape) {
						self.hide(); // Zamknij siebie
						// Jeśli masz inne okno do zamknięcia, wywołaj odpowiednią metodę na nim
						return true;
					}
					return false;
				});
				self.connect('destroy', () => {
					if (sH) self.disconnect(sH);
					if (kPH) self.disconnect(kPH);
				});
			}}
		>
			<box
				className="control-center-content"
				orientation={Gtk.Orientation.VERTICAL}
				spacing={15}
				css="padding: 15px;"
			>
				{/* Sekcja Sieci */}
				<box
					className="cc-section"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
				>
					<NetworkIndicatorWidget />
					<label label="Sieć" /> {/* TODO: Dodać więcej info / akcji */}
				</box>

				{/* Sekcja Bluetooth */}
				<box
					className="cc-section"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
				>
					<BluetoothIndicatorWidget />
					<label label="Bluetooth" /> {/* TODO: Dodać więcej info / akcji */}
				</box>

				{/* Sekcja Głośności */}
				<box
					className="cc-section"
					orientation={Gtk.Orientation.VERTICAL}
					spacing={5}
				>
					<label label="Głośność" halign={Gtk.Align.START} />
					<box
						orientation={Gtk.Orientation.HORIZONTAL}
						spacing={10}
						align={Gtk.Align.CENTER}
					>
						<button
							className="popup-mute-button" // Możemy reużyć stylu
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
							className="volume-slider" // Możemy reużyć stylu
							hexpand={true}
							valign={Gtk.Align.CENTER}
							min={0}
							max={100}
							value={systemVolumePercent.get()}
							setup={(selfSlider: any) => {
								/* ... hook ... */
							}}
							onDragged={(selfSlider: any) => {
								/* ... execAsync ... */
							}}
						/>
					</box>
				</box>

				{/* Sekcja Zasilania/Baterii */}
				<box
					className="cc-section"
					orientation={Gtk.Orientation.HORIZONTAL}
					spacing={10}
				>
					<PowerSourceWidget />
					{/* Tooltip z PowerSourceIndicatorWidget będzie działał, ale możemy też wyświetlić tu tekst */}
					<label label="Zasilanie" />
					{/* TODO: Wyświetlić szczegóły z PowerSourceWidget jeśli dostępne */}
				</box>

				{/* TODO: Przełączniki (VPN, Nocny, Caffeine) */}
				{/* TODO: Przyciski Zasilania (systemowe) */}
			</box>
		</window>
	);
};
