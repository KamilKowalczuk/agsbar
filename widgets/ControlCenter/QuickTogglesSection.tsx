// widgets/ControlCenter/QuickTogglesSection.tsx
import { Gtk } from 'astal/gtk3';
// Poprawne importy do nowych komponentów-ikon
// import { NetworkIndicatorIcon } from '../Indicators/NetworkIndicatorIcon';
// If the correct file is 'NetworkIndicator.tsx' and the export is 'NetworkIndicatorIcon', use:
import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
// Or update the path/filename to match the actual file and export.
// import { BluetoothIndicatorIcon } from '../Indicators/BluetoothIndicatorIcon';
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
// If the correct export is different, adjust accordingly:
// import { BluetoothIndicator } from '../Indicators/BluetoothIndicator';

export const QuickTogglesSection = () => {
	const handleNetworkClick = () => {
		// TODO: Zdefiniuj akcję po kliknięciu przycisku Sieci
		// Np. otwarcie jakiegoś okna dialogowego z ustawieniami sieci
		// lub przełączenie głównego stanu sieci (nmcli radio wifi on/off)
		console.log('Przycisk Sieci kliknięty - TODO: akcja');
		// Przykład: App.toggleWindow('network-popup'); lub execAsync('nmcli radio wifi toggle');
	};

	const handleBluetoothClick = () => {
		// TODO: Zdefiniuj akcję po kliknięciu przycisku Bluetooth
		console.log('Przycisk Bluetooth kliknięty - TODO: akcja');
		// Przykład: App.toggleWindow('bluetooth-popup'); lub execAsync('bluetoothctl power toggle');
	};

	const handleDndClick = () => {
		// TODO: Zdefiniuj akcję dla Trybu Nie Przeszkadzać
		console.log('Przycisk DND kliknięty - TODO: akcja');
	};

	return (
		<box
			className="cc-quick-toggles"
			orientation={Gtk.Orientation.HORIZONTAL}
			spacing={10}
			halign={Gtk.Align.CENTER}
			css="margin-bottom: 10px;"
		>
			<button
				tooltip_text="Ustawienia Sieci"
				onClicked={handleNetworkClick} // Dodajemy akcję
			>
				<NetworkIndicatorWidget />
			</button>
			<button
				tooltip_text="Ustawienia Bluetooth"
				onClicked={handleBluetoothClick} // Dodajemy akcję
			>
				<BluetoothIndicatorWidget />
			</button>
			<button
				tooltip_text="Tryb Nie Przeszkadzać"
				onClicked={handleDndClick} // Dodajemy akcję
			>
				<icon icon="notifications-disabled-symbolic" />
			</button>
		</box>
	);
};
