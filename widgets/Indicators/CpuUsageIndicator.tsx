// widgets/Indicators/CpuUsageIndicator.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import GLib from 'gi://GLib';
import { interval } from 'astal/time'; // Używamy interval z astal/time
import { Gtk } from 'astal/gtk3';

const CPU_ICON = 'my-processor-symbolic';

interface CpuTimes {
	user: number;
	nice: number;
	system: number;
	idle: number;
	iowait: number;
	irq: number;
	softirq: number;
	steal: number;
	guest: number;
	guest_nice: number;
}

const parseCpuTimes = (line: string): CpuTimes | null => {
	const times = line.split(/\s+/).slice(1).map(Number);
	if (times.length < 10) return null;
	return {
		user: times[0],
		nice: times[1],
		system: times[2],
		idle: times[3],
		iowait: times[4],
		irq: times[5],
		softirq: times[6],
		steal: times[7],
		guest: times[8],
		guest_nice: times[9],
	};
};

let previousCpuTimes: CpuTimes | null = null;

// getCpuUsage POZOSTAJE async, bo używa asynchronicznego odczytu pliku (lub może używać)
// Jednak dla /proc/stat możemy bezpiecznie użyć wersji synchronicznej
const getCpuUsage = (): number | null => {
	// Zmieniamy na funkcję synchroniczną
	try {
		// Używamy SYNCHRONICZNEJ wersji GLib.file_get_contents
		// To jest bezpieczne i znacznie prostsze dla /proc/stat
		const [success, contents_bytes] = GLib.file_get_contents('/proc/stat');

		if (!success) {
			console.error(
				'CpuUsageIndicator: Nie udało się odczytać /proc/stat (synchronicznie).'
			);
			return null;
		}

		const decoder = new TextDecoder();
		const currentProcStat = decoder.decode(contents_bytes);
		const firstLine = currentProcStat.split('\n')[0];
		const currentTimes = parseCpuTimes(firstLine);

		if (!currentTimes) {
			console.error(
				'CpuUsageIndicator: Nie udało się sparsować obecnych czasów CPU.'
			);
			return null;
		}

		let usagePercent = null;
		if (previousCpuTimes) {
			const prevIdle = previousCpuTimes.idle + previousCpuTimes.iowait;
			const currentIdle = currentTimes.idle + currentTimes.iowait;

			const prevNonIdle =
				previousCpuTimes.user +
				previousCpuTimes.nice +
				previousCpuTimes.system +
				previousCpuTimes.irq +
				previousCpuTimes.softirq +
				previousCpuTimes.steal;
			const currentNonIdle =
				currentTimes.user +
				currentTimes.nice +
				currentTimes.system +
				currentTimes.irq +
				currentTimes.softirq +
				currentTimes.steal;

			const prevTotal = prevIdle + prevNonIdle;
			const currentTotal = currentIdle + currentNonIdle;

			const totalDiff = currentTotal - prevTotal;
			const idleDiff = currentIdle - prevIdle;

			if (totalDiff > 0) {
				usagePercent = Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
			} else {
				usagePercent = 0;
			}
		}

		previousCpuTimes = currentTimes;
		return usagePercent;
	} catch (error) {
		console.error('CpuUsageIndicator: Błąd w getCpuUsage:', error);
		previousCpuTimes = null;
		return null;
	}
};

export const CpuUsageIndicator = () => {
	const cpuUsagePercent = Variable<number | null>(null);
	const displayIcon = CPU_ICON;

	// updateCpu NIE JEST JUŻ async, bo getCpuUsage jest synchroniczne
	const updateCpu = () => {
		const newCpuUsage = getCpuUsage();
		if (newCpuUsage !== null) {
			if (cpuUsagePercent.get() !== newCpuUsage) {
				cpuUsagePercent.set(newCpuUsage);
			}
		}
	};

	// Pierwsze dwa wywołania, aby zainicjować i uzyskać pierwszy wynik
	// GLib.idle_add i GLib.timeout_add oczekują funkcji zwracającej boolean, a nie Promise
	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		getCpuUsage(); // Pierwsze wywołanie (inicjalizuje previousCpuTimes), wynik nie jest jeszcze używany
		return GLib.SOURCE_REMOVE; // Wykonaj tylko raz
	});

	GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 100, () => {
		// Po 100ms
		updateCpu(); // Drugie wywołanie, które powinno dać już wynik procentowy i ustawić Variable
		return GLib.SOURCE_REMOVE; // Wykonaj tylko raz
	});

	// Regularne odpytywanie za pomocą interval z astal/time
	interval(1500, updateCpu); // Aktualizuj co 1.5 sekundy

	return (
		<box
			orientation={Gtk.Orientation.HORIZONTAL}
			className="cpu-usage-indicator"
			spacing={5}
		>
			<icon icon={displayIcon} />
			<label
				label={bind(cpuUsagePercent).as((percent) =>
					percent !== null && percent >= 0 ? `${percent}%` : 'CPU --%'
				)}
			/>
		</box>
	);
};
