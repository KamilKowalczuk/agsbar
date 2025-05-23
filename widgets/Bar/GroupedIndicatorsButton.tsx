// widgets/Bar/GroupedIndicatorsButton.tsx
import { App, Gtk } from 'astal/gtk3'; // Gtk dla orientacji i wyrównania
import { CONTROL_CENTER_POPUP_NAME } from '../Popups/ControlCenterPopup';
import GLib from 'gi://GLib'; // Dla GLib.idle_add

// Importujemy "skrócone" wersje wskaźników (tylko ikony) lub pełne, jeśli chcemy je tam widzieć
// Na potrzeby tego przycisku, zazwyczaj chcemy tylko ikony, a pełne kontrolki będą w popupie.
// Możemy stworzyć uproszczone warianty tych widgetów lub na razie użyć istniejących.
// Dla uproszczenia, na razie użyjemy istniejących, ale normalnie w tym miejscu
// byłyby tylko statyczne lub lekko dynamiczne ikonki.

import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
import { VolumeIndicatorWidget } from '../Indicators/VolumeIndicator';
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
import { PowerSourceWidget } from './PowerSourceWidget'; // Jest w Bar/

export const GroupedIndicatorsButton = () => {
	return (
		<button
			className="grouped-indicators-button"
			onClicked={() => {
				App.toggle_window(CONTROL_CENTER_POPUP_NAME);
				const ccWindow = App.get_window(CONTROL_CENTER_POPUP_NAME);
				if (ccWindow && ccWindow.visible) {
					GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
						if (ccWindow.visible) {
							ccWindow.grab_focus();
						}
						return GLib.SOURCE_REMOVE;
					});
				}
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
				{/* Tutaj umieszczamy tylko te wskaźniki, które mają być widoczne jako część przycisku */}
				{/* Zazwyczaj są to tylko ikony. Pełne widgety z suwakami itp. będą w ControlCenterPopup */}
				{/* W tej chwili Twoje widgety Network, Volume, Bluetooth, PowerSource to już przyciski z ikonami */}
				{/* Aby to działało jak jeden przycisk, te wewnętrzne widgety NIE powinny być same w sobie klikalne */}
				{/* lub ich kliknięcie powinno być zignorowane/przekazane do rodzica. */}
				{/* Na razie zostawiamy je tak, jak są, ale idealnie byłoby mieć wersje "tylko ikona". */}

				<NetworkIndicatorWidget />
				<PowerSourceWidget />
				<VolumeIndicatorWidget />
				<BluetoothIndicatorWidget />
			</box>
		</button>
	);
};
