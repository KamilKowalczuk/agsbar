import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';
import { App } from 'astal/gtk3'; // Jeśli potrzebne

export const NetworkIndicatorWidget = () => {
	const iconName = Variable('network-offline-symbolic'); // Domyślna ikona

	iconName.poll(5000, async (prevIcon) => {
		//console.log('N: Rozpoczynam sprawdzanie stanu sieci...');
		try {
			// 1. Sprawdź ogólną łączność
			const connectivityResult = await execAsync([
				'nmcli',
				'-t',
				'-f',
				'CONNECTIVITY',
				'general',
				'status',
			]);
			const connectivity = connectivityResult.trim().toLowerCase();
			//console.log(`N: Ogólna łączność: ${connectivity}`);

			if (connectivity === 'none' || connectivity === 'portal') {
				console.log('N: Wykryto brak połączenia lub portal.');
				return 'network-offline-symbolic';
			}

			// 2. Mamy łączność, znajdź aktywne urządzenia i ich typy
			const devicesOutput = await execAsync([
				'nmcli',
				'-t',
				'-f',
				'DEVICE,TYPE,STATE,CONNECTION',
				'device',
			]);
			const lines = devicesOutput.trim().split('\n');
			// console.log(
			// 	'N: Lista urządzeń (DEVICE:TYPE:STATE:CONNECTION):\n',
			// 	devicesOutput
			// );

			let foundActiveWifiDevice: string | null = null;
			let foundActiveEthernetDevice: string | null = null;

			for (const line of lines) {
				const parts = line.split(':');
				if (parts.length < 3) continue; // Oczekujemy co najmniej DEVICE,TYPE,STATE

				const device = parts[0];
				const type = parts[1].toLowerCase();
				const state = parts[2].toLowerCase();
				// const connectionName = parts[3]; // Nazwa profilu połączenia, może być pusta

				// Szukamy urządzenia, które jest faktycznie "connected"
				if (state.includes('connected')) {
					if (type.includes('ethernet')) {
						//console.log(`N: Znaleziono aktywne połączenie Ethernet: ${device}`);
						foundActiveEthernetDevice = device;
						break; // Ethernet ma priorytet
					}
					if (type.includes('wifi') && !foundActiveWifiDevice) {
						// Bierzemy pierwsze aktywne Wi-Fi
						//console.log(`N: Znaleziono aktywne połączenie Wi-Fi: ${device}`);
						foundActiveWifiDevice = device;
					}
				}
			}

			if (foundActiveEthernetDevice) {
				//console.log('N: Ustawiam ikonę dla Ethernet.');
				return 'network-wired-symbolic'; // Upewnij się, że masz tę ikonę
			}

			if (foundActiveWifiDevice) {
				//console.log(`N: Przetwarzam aktywne Wi-Fi: ${foundActiveWifiDevice}`);
				const wifiListOut = await execAsync([
					'nmcli',
					'-t',
					'-f',
					'IN-USE,SIGNAL',
					'device',
					'wifi',
					'list',
					'ifname',
					foundActiveWifiDevice,
				]);
				const wifiLines = wifiListOut.trim().split('\n');
				// console.log(
				// 	`N: Lista Wi-Fi dla ${foundActiveWifiDevice}:\n`,
				// 	wifiListOut
				// );

				for (const line of wifiLines) {
					if (line.startsWith('*')) {
						// Aktywne ("IN-USE") połączenie Wi-Fi dla tego urządzenia
						const wifiParts = line.split(':');
						if (wifiParts.length < 2) continue;
						const signal = parseInt(wifiParts[1], 10);
						//console.log(`N: Wykryto sygnał Wi-Fi: ${signal}`);

						if (signal > 80)
							return 'network-wireless-signal-excellent-symbolic';
						if (signal > 55) return 'network-wireless-signal-good-symbolic';
						if (signal > 30) return 'network-wireless-signal-ok-symbolic';
						if (signal > 5) return 'network-wireless-signal-weak-symbolic';
						return 'network-wireless-signal-none-symbolic'; // Potwierdź te nazwy ikon
					}
				}
				// Jeśli pętla nie znalazła linii z '*', ale mamy aktywny interfejs Wi-Fi
				// console.log(
				// 	'N: Aktywne Wi-Fi, ale nie znaleziono szczegółów sygnału IN-USE. Ustawiam ogólną ikonę Wi-Fi.'
				// );
				return 'network-wireless-symbolic';
			}

			// Jeśli doszliśmy tutaj, a łączność jest 'full' lub 'limited', to nie rozpoznaliśmy typu jako eth/wifi
			// console.log(
			// 	"N: Łączność jest, ale nie zidentyfikowano jako Ethernet/Wi-Fi w pętli. Ustawiam ikonę 'help-faq'."
			// );
			return 'help-faq-symbolic';
		} catch (error) {
			// console.error('N: Krytyczny błąd podczas pobierania stanu sieci:', error);
			return prevIcon || 'network-offline-symbolic'; // W razie błędu, zwróć poprzednią ikonę lub offline
		}
	});

	return (
		<button
			className="control-center-button network-button"
			onClicked={() => {}}
		>
			<icon icon={bind(iconName).as((name) => name)} />
		</button>
	);
};
