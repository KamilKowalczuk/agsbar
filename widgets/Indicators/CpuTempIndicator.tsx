// widgets/Indicators/CpuTempIndicator.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import GLib from 'gi://GLib';
import { interval } from 'astal/time';
import { Gtk } from 'astal/gtk3';
import { execAsync } from 'astal/process';

const CPU_TEMP_ICON = 'temperature-symbolic';
let cpuTempFilePath: string | null = null;

const findAndSetCpuThermalZonePath = async () => {
	if (cpuTempFilePath) return;
	try {
		const thermalZonesOutput = await execAsync(['ls', '/sys/class/thermal']);
		const zones = thermalZonesOutput
			.trim()
			.split('\n')
			.filter((z) => z.startsWith('thermal_zone'));
		for (const zone of zones) {
			try {
				const typePath = `/sys/class/thermal/${zone}/type`;
				const [success, typeContents] = GLib.file_get_contents(typePath); // Synchroniczny odczyt jest tu OK
				if (success) {
					const type = new TextDecoder()
						.decode(typeContents)
						.trim()
						.toLowerCase();
					if (
						type.includes('x86_pkg_temp') ||
						type.includes('cpu_thermal') ||
						type.includes('coretemp') ||
						(type.includes('acpitz') && !cpuTempFilePath)
					) {
						cpuTempFilePath = `/sys/class/thermal/${zone}/temp`;
						if (!type.includes('acpitz')) break;
					}
				}
			} catch (e) {
				/* ignoruj */
			}
		}
		if (!cpuTempFilePath)
			console.warn(
				'CpuTempIndicator: Nie udało się automatycznie znaleźć strefy termicznej CPU.'
			);
	} catch (error) {
		console.error(
			'CpuTempIndicator: Błąd podczas listowania stref termicznych:',
			error
		);
	}
};

const getCpuTemp = (): number | null => {
	// Zmieniamy na funkcję synchroniczną
	if (!cpuTempFilePath) return null;
	try {
		const [success, tempContents] = GLib.file_get_contents(cpuTempFilePath); // Odczyt synchroniczny
		if (success) {
			const tempStr = new TextDecoder().decode(tempContents).trim();
			const tempMilliC = parseInt(tempStr, 10);
			if (!isNaN(tempMilliC)) return Math.round(tempMilliC / 1000);
		}
		console.warn(
			`CpuTempIndicator: Nie udało się odczytać temperatury z ${cpuTempFilePath}`
		);
		return null;
	} catch (error) {
		console.error(
			`CpuTempIndicator: Błąd odczytu temperatury CPU z ${cpuTempFilePath}:`,
			error
		);
		return null;
	}
};

export const CpuTempIndicator = () => {
	const cpuTemp = Variable<number | null>(null);
	const displayIcon = CPU_TEMP_ICON;

	const update = () => {
		// update nie musi być async, jeśli getCpuTemp jest synchroniczne
		const temp = getCpuTemp();
		if (cpuTemp.get() !== temp) {
			cpuTemp.set(temp);
		}
	};

	// Inicjalizacja
	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		// findAndSetCpuThermalZonePath jest async, więc wywołujemy go w ten sposób:
		findAndSetCpuThermalZonePath()
			.then(() => {
				// Po znalezieniu ścieżki, wykonaj pierwszą aktualizację
				update();
			})
			.catch((e) =>
				console.error(
					'CpuTempIndicator: Błąd podczas inicjalizacji strefy CPU',
					e
				)
			);
		return GLib.SOURCE_REMOVE;
	});

	interval(5000, update);

	return (
		<box
			orientation={Gtk.Orientation.HORIZONTAL}
			className="cpu-temp-indicator"
			spacing={5}
		>
			<icon icon={displayIcon} />
			<label
				label={bind(cpuTemp).as((temp) =>
					temp !== null && temp >= 0 ? `${temp}°C` : 'CPU --°C'
				)}
			/>
		</box>
	);
};
