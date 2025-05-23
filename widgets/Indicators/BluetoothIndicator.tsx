import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';
// import { App } from "astal/gtk3"; // Jeśli potrzebne

export const BluetoothIndicatorWidget = () => {
	const iconName = Variable('bluetooth-disabled-symbolic');

	iconName.poll(5000, async () => {
		// Odpytuj co 5 sekund
		try {
			// Sprawdź, czy jakiś kontroler jest włączony
			const showOutput = await execAsync(['bluetoothctl', 'show']);
			const isPoweredOn = showOutput.includes('Powered: yes');

			if (!isPoweredOn) {
				return 'bluetooth-disabled-symbolic'; // Potwierdź nazwę
			}

			// Jeśli włączony, sprawdź, czy są połączone urządzenia
			const devicesOutput = await execAsync([
				'bluetoothctl',
				'devices',
				'Connected',
			]);
			const connectedDevices = devicesOutput
				.trim()
				.split('\n')
				.filter((line) => line.startsWith('Device '));

			if (connectedDevices.length > 0) {
				return 'bluetooth-active-symbolic'; // Lub specjalna ikona dla "połączono", np. 'bluetooth-connected-symbolic' - musisz ją znaleźć
			} else {
				return 'bluetooth-active-symbolic'; // Bluetooth włączony, ale nic nie połączono
			}
		} catch (error) {
			console.error('Błąd pobierania stanu Bluetooth:', error);
			return 'bluetooth-disabled-symbolic';
		}
	});

	return (
		<button
			className="control-center-button bluetooth-button"
			onClicked={() => console.log('Bluetooth button clicked')}
		>
			<icon icon={bind(iconName).as((name) => name)} />
		</button>
	);
};
