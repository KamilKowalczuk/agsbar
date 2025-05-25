// widgets/Bar/GroupedIndicatorsButton.tsx
import { App, Gtk } from 'astal/gtk3';
import { CONTROL_CENTER_POPUP_NAME } from '../../app'; // Importujemy z app.tsx
// GLib nie jest już tu potrzebny do grab_focus
// import GLib from 'gi://GLib';

// Importy Twoich wskaźników (bez zmian)
import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
import { VolumeIndicatorWidget } from '../Indicators/VolumeIndicator'; // Upewnij się, że ścieżka jest poprawna
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
import { PowerSourceWidget } from './PowerSourceWidget';

export const GroupedIndicatorsButton = () => {
	return (
		<button
			className="grouped-indicators-button"
			onClicked={() => {
				// Po prostu przełączamy widoczność ControlCenterPopup.
				// Logika pokazywania/ukrywania PopupOverlay oraz zarządzania focusem
				// jest teraz wewnątrz ControlCenterPopup (sygnały 'show' i 'hide').
				App.toggle_window(CONTROL_CENTER_POPUP_NAME);
			}}
			tooltip_text="Otwórz Centrum Kontroli"
		>
			<box
				className="grouped-indicators-box"
				orientation={Gtk.Orientation.HORIZONTAL}
				spacing={5} // Mały odstęp między ikonami w grupie
				halign={Gtk.Align.CENTER}
				valign={Gtk.Align.CENTER}
			>
				{/* Wskaźniki wewnątrz przycisku (bez zmian) */}
				<NetworkIndicatorWidget />
				<PowerSourceWidget />
				<VolumeIndicatorWidget />
				<BluetoothIndicatorWidget />
			</box>
		</button>
	);
};