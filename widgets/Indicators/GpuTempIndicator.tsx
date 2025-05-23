// widgets/Indicators/GpuTempIndicator.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import GLib from 'gi://GLib';
import { interval } from 'astal/time';
import { Gtk } from 'astal/gtk3';
import { execAsync } from 'astal/process';

const GPU_TEMP_ICON = 'video-display-symbolic';
let amdGpuTempPath: string | null = null;

// findAmdGpuTempPath pozostaje async
const findAmdGpuTempPath = async () => {
	if (amdGpuTempPath) return;
	// ... (logika bez zmian, używa GLib.file_test, który jest synchroniczny)
	const commonPaths = [
		'/sys/class/drm/card0/device/hwmon/hwmon0/temp1_input',
		'/sys/class/drm/card0/device/hwmon/hwmon1/temp1_input',
	];
	for (const path of commonPaths) {
		try {
			if (
				GLib.file_test(path, GLib.FileTest.IS_REGULAR | GLib.FileTest.EXISTS)
			) {
				amdGpuTempPath = path;
				console.log(
					`GpuTempIndicator: Znaleziono potencjalną ścieżkę temperatury AMD GPU: ${amdGpuTempPath}`
				);
				return;
			}
		} catch (e) {
			/* ignoruj */
		}
	}
	console.warn(
		'GpuTempIndicator: Nie udało się automatycznie znaleźć ścieżki temperatury AMD GPU.'
	);
};

// getGpuTemp POZOSTAJE async
const getGpuTemp = async (): Promise<number | null> => {
	try {
		// NVIDIA
		const nvidiaOutput = await execAsync([
			'nvidia-smi',
			'--query-gpu=temperature.gpu',
			'--format=csv,noheader,nounits',
		]);
		const temp = parseInt(nvidiaOutput.trim(), 10);
		if (!isNaN(temp)) return temp;
	} catch (e) {
		/* nvidia-smi nie znalezione lub błąd */
	}

	if (amdGpuTempPath) {
		// AMD
		try {
			const [success, tempContents] = GLib.file_get_contents(amdGpuTempPath); // Synchroniczny odczyt
			if (success) {
				const tempMilliC = parseInt(
					new TextDecoder().decode(tempContents).trim(),
					10
				);
				if (!isNaN(tempMilliC)) return Math.round(tempMilliC / 1000);
			}
		} catch (e) {}
	}
	return null;
};

export const GpuTempIndicator = () => {
	const gpuTemp = Variable<number | null>(null);
	const displayIcon = GPU_TEMP_ICON;

	// update MUSI być async, bo getGpuTemp jest async
	const update = async () => {
		const temp = await getGpuTemp();
		if (gpuTemp.get() !== temp) {
			gpuTemp.set(temp);
		}
	};

	// Inicjalizacja
	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		// Obie funkcje są async, więc wywołujemy je i obsługujemy Promise
		findAmdGpuTempPath()
			.then(() => update()) // Po znalezieniu ścieżki AMD (lub nie), wykonaj update
			.catch((e) =>
				console.error('GpuTempIndicator: Błąd podczas inicjalizacji GPU', e)
			);
		return GLib.SOURCE_REMOVE;
	});

	// Dla interval, funkcja callback nie może być async.
	// Musimy opakować wywołanie funkcji async.
	interval(5000, () => {
		update().catch((e) =>
			console.error(
				'GpuTempIndicator: Błąd w cyklicznej aktualizacji GPU temp:',
				e
			)
		);
	});

	return (
		<box
			orientation={Gtk.Orientation.HORIZONTAL}
			className="gpu-temp-indicator"
			spacing={5}
			visible={bind(gpuTemp).as((temp) => temp !== null)}
		>
			<icon icon={displayIcon} />
			<label
				label={bind(gpuTemp).as((temp) =>
					temp !== null && temp >= 0 ? `${temp}°C` : 'GPU --°C'
				)}
			/>
		</box>
	);
};
