//import { App } from 'astal/gtk3';
import { bind } from 'astal';
import Variable from 'astal/variable';
//import GLib from 'gi://GLib';
import { Gtk } from 'astal/gtk3';
import { execAsync } from 'astal/process';

export const PowerSourceWidget = () => {
	const icon = Variable('dialog-question-symbolic');
	const tooltipText = Variable('Sprawdzanie stanu zasilania...');
	const batteryPercentageLabel = Variable(''); // NOWA ZMIENNA dla tekstu "%" obok ikony

	const updatePowerState = async () => {
		try {
			let isBatteryPresent = false;
			let batterySysPath = ''; // np. /sys/class/power_supply/BAT1
			let batteryNameForUPower = ''; // np. BAT1

			try {
				const powerSupplies = await execAsync([
					'ls',
					'/sys/class/power_supply/',
				]);
				const supplyLines = powerSupplies.trim().split('\n');
				for (const supply of supplyLines) {
					if (supply.startsWith('BAT')) {
						const typeOut = await execAsync([
							'cat',
							`/sys/class/power_supply/${supply}/type`,
						]);
						if (typeOut.trim().toLowerCase() === 'battery') {
							isBatteryPresent = true;
							batterySysPath = `/sys/class/power_supply/${supply}`;
							batteryNameForUPower = supply;
							break;
						}
					}
				}
			} catch (e) {
				isBatteryPresent = false;
			}

			if (isBatteryPresent && batterySysPath) {
				const statusOut = await execAsync(['cat', `${batterySysPath}/status`]);
				const capacityOut = await execAsync([
					'cat',
					`${batterySysPath}/capacity`,
				]);

				const status = statusOut.trim().toLowerCase(); // np. charging, discharging, full, unknown
				const percentage = parseInt(capacityOut.trim(), 10);

				batteryPercentageLabel.set(`${percentage}%`);

				let newIcon = 'battery-missing-symbolic';
				let newTooltip = ''; // Inicjujemy pustym stringiem
				const level = Math.floor(percentage / 10) * 10;
				let timeDetail = '';

				try {
					const upowerDevicePath = `/org/freedesktop/UPower/devices/battery_${batteryNameForUPower}`;
					const upowerOutput = await execAsync([
						'upower',
						'-i',
						upowerDevicePath,
					]);

					if (status === 'charging') {
						const timeToFullMatch = upowerOutput.match(
							/time to full:\s*([^\n]+)/
						);
						if (timeToFullMatch && timeToFullMatch[1]) {
							timeDetail = ` (${timeToFullMatch[1].trim()} do pełna)`;
						}
					} else if (status === 'discharging') {
						const timeToEmptyMatch = upowerOutput.match(
							/time to empty:\s*([^\n]+)/
						);
						if (timeToEmptyMatch && timeToEmptyMatch[1]) {
							timeDetail = ` (${timeToEmptyMatch[1].trim()} pracy)`;
						}
					}
				} catch (upowerError) {
					console.warn(
						'PowerSourceWidget: Błąd odczytu danych z upower:',
						upowerError
					);
				}

				// GŁÓWNA LOGIKA IKON I TOOLTIPU
				if (status === 'full' || (status === 'charging' && percentage >= 98)) {
					// Jeśli status to "Full" LUB "Charging" i procent jest bardzo wysoki (np. >=98%)
					// Niektóre systemy zgłaszają "Charging" nawet przy 100%, inne przełączają na "Full"
					newIcon = `battery-full-charged-symbolic`; // Lub battery-level-100-charged-symbolic
					newTooltip = `W pełni naładowana (${percentage}%)`;
					// Jeśli jest "Full", ale procent jest np. 99%, to nie ma sensu pokazywać "czasu do pełna"
					// Jeśli jest "Charging" i >=98%, "czas do pełna" może być bardzo krótki lub "unknown"
					if (
						status === 'charging' &&
						percentage < 100 &&
						timeDetail.includes('do pełna')
					) {
						newTooltip = `Ładowanie: ${percentage}%${timeDetail}`; // Pokaż "do pełna" jeśli jeszcze nie 100%
					} else if (status === 'charging' && percentage >= 99) {
						newTooltip = `W pełni naładowana (Ładowanie ${percentage}%)`; // Specjalny przypadek
					}
				} else if (status === 'charging') {
					newIcon = `battery-level-${level}-charging-symbolic`;
					// Fallback dla niskich poziomów ładowania, jeśli nie ma ikony -0-charging
					if (level === 0 && percentage < 10)
						newIcon = 'battery-level-10-charging-symbolic';
					newTooltip = `Ładowanie: ${percentage}%${timeDetail}`;
				} else if (status === 'discharging') {
					newIcon = `battery-level-${level}-symbolic`;
					if (percentage < 10 && level === 0)
						newIcon = 'battery-caution-symbolic';
					else if (percentage === 100) newIcon = 'battery-level-100-symbolic'; // Rzadkie, ale możliwe: 100% i rozładowuje
					newTooltip = `Pozostało: ${percentage}%${timeDetail}`;
				} else {
					// unknown lub inny nieprzewidziany stan
					newIcon =
						percentage < 20 ? 'battery-caution-symbolic' : 'battery-symbolic';
					newTooltip = `Bateria: ${percentage}% (Stan: ${status})${timeDetail}`;
				}

				// Poprawka dla ikon typu -0- gdy procent jest >0 i <10 (poza ładowaniem)
				if (
					newIcon.includes('-0-') &&
					level === 0 &&
					percentage > 0 &&
					percentage < 10 &&
					status !== 'charging'
				) {
					newIcon = `battery-level-10-symbolic`;
				}

				icon.set(newIcon);
				tooltipText.set(newTooltip);
			} else {
				// Tryb PC (Profile Mocy) lub brak baterii
				batteryPercentageLabel.set('');
				// ... (logika dla profili mocy bez zmian) ...
				const profileOut = await execAsync(['powerprofilesctl', 'get']);
				const activeProfile = profileOut.trim().toLowerCase();
				let newIcon = 'power-profile-balanced-symbolic';
				let profileNameFriendly = 'Zrównoważony';

				if (activeProfile.includes('performance')) {
					newIcon = 'speedometer-symbolic';
					profileNameFriendly = 'Wydajność';
				} else if (activeProfile.includes('power-saver')) {
					newIcon = 'preferences-desktop-screensaver-symbolic';
					profileNameFriendly = 'Oszczędzanie energii';
				}
				icon.set(newIcon);
				tooltipText.set(`Profil mocy: ${profileNameFriendly}`);
			}
		} catch (error) {
			console.error(
				'PowerSourceWidget: Błąd krytyczny w updatePowerState:',
				error
			);
			icon.set('dialog-error-symbolic');
			tooltipText.set('Błąd stanu zasilania');
			batteryPercentageLabel.set('ERR'); // Wskaż błąd w etykiecie procentowej
		}
		// console.log(`PowerSourceWidget: Zaktualizowano: icon=${icon.value}, tooltip="${tooltipText.value}", label="${batteryPercentageLabel.value}"`);
	};

	const pollInterval = Variable(5000);
	pollInterval.poll(5000, async () => {
		await updatePowerState();
		return pollInterval.get();
	});
	// Można zainicjować pierwsze wywołanie, jeśli poll od razu nie startuje
	// GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => { updatePowerState(); return GLib.SOURCE_REMOVE; });

	return (
		<button
			className="control-center-button power-source-button"
			tooltip_text={bind(tooltipText).as((tt) => tt)}
			onClicked={() =>
				console.log('Kliknięto PowerSourceWidget. Tooltip:', tooltipText.get())
			}
		>
			{/* Używamy wewnętrznego boxa, aby ikona i procenty były obok siebie */}
			<box orientation={Gtk.Orientation.HORIZONTAL} spacing={3}>
				<icon icon={bind(icon).as((name) => name)} />
				<label
					className="battery-percentage-label"
					label={bind(batteryPercentageLabel).as((text) => text)}
					// Poniższa linia sprawi, że etykieta będzie widoczna tylko, gdy ma tekst
					// To jest lepsze niż CSS :empty dla dynamicznych zmian w AGS
					visible={bind(batteryPercentageLabel).as((text) => text !== '')}
				/>
			</box>
		</button>
	);
};
