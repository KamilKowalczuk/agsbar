// widgets/Indicators/RamUsageIndicator.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';
import GLib from 'gi://GLib';
import { interval } from 'astal/time';
import { Gtk } from 'astal/gtk3'; // Dodajemy import Gtk dla Gtk.Orientation

const RAM_ICON = 'my-flash-memory-symbolic';

interface RamInfo {
	percentage: number;
	usedGb: number;
	totalGb: number;
}

const getRamUsage = async (): Promise<RamInfo | null> => {
	try {
		const freeOutput = await execAsync(['free', '-b']); // Używamy '-b' dla bajtów

		const lines = freeOutput.trim().split('\n');
		if (lines.length < 2) {
			return null;
		}

		// Szukamy linii zaczynającej się od "Mem:" (lub "Pamięć:" w niektórych lokalizacjach)
		const memLine = lines.find((line) => line.trim().match(/^(Mem|Pamięć):/i));
		if (!memLine) {
			return null;
		}

		const values = memLine.trim().split(/\s+/); // Dzielimy po spacjach

		// Oczekiwany format po splicie: ["Mem:", total, used, free, shared, buff/cache, available]
		// Lub ["Pamięć:", total, used, free, dzielone, bufor/pam.podr, dostępna]
		// Indeksy:                    0,     1,    2,    3,      4,            5,         6
		if (values.length < 7) {
			return null;
		}

		const totalRam = parseInt(values[1], 10);
		const availableRam = parseInt(values[6], 10); // 'available' jest dobrym wskaźnikiem wolnej pamięci dla aplikacji

		if (isNaN(totalRam) || isNaN(availableRam) || totalRam === 0) {
			return null;
		}

		const usedRamForPercentage = totalRam - availableRam;

		const percentage = Math.round((usedRamForPercentage / totalRam) * 100);
		// Konwersja na GiB (Gibibajty, 1024^3)
		const usedGb = parseFloat(
			(usedRamForPercentage / (1024 * 1024 * 1024)).toFixed(1)
		);
		const totalGb = parseFloat((totalRam / (1024 * 1024 * 1024)).toFixed(1));
		return { percentage, usedGb, totalGb };
	} catch (error) {
		return null;
	}
};

export const RamUsageIndicator = () => {
	const ramInfo = Variable<RamInfo | null>(null);
	const displayIcon = RAM_ICON;

	const updateRam = async () => {
		const newRamInfo = await getRamUsage();
		// console.log("RamUsageIndicator DEBUG: updateRam otrzymał newRamInfo:", newRamInfo); // Możesz odkomentować dla dodatkowego logu

		// Prostsza logika aktualizacji - set zawsze wywoła 'changed' jeśli referencja obiektu jest inna,
		// lub jeśli poprzednia wartość była null a nowa nie jest (i vice-versa).
		// Jeśli newRamInfo i ramInfo.get() to oba null, nic się nie stanie.
		// Jeśli newRamInfo jest obiektem, a ramInfo.get() był null, 'changed' zostanie wyemitowane.
		// Jeśli oba są obiektami, AGS/Astal może robić płytkie porównanie lub polegać na referencji.
		// Aby być pewnym, że zmiana jest wykrywana, gdy zmieniają się właściwości obiektu,
		// można by użyć JSON.stringify, ale to kosztowne.
		// Dla obiektów zwracanych z funkcji (jak u nas), referencja zawsze będzie nowa, więc .set() zadziała.
		ramInfo.set(newRamInfo);
	};

	interval(2000, updateRam); // Aktualizuj co 2 sekundy

	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		updateRam();
		return GLib.SOURCE_REMOVE;
	});

	return (
		<box
			orientation={Gtk.Orientation.HORIZONTAL}
			className="ram-usage-indicator"
			spacing={5}
		>
			<icon icon={displayIcon} />
			<label
				label={bind(ramInfo).as(
					(info) => (info ? `${info.percentage}%` : 'RAM --%') // To jest wyświetlane, gdy info jest null
				)}
			/>
		</box>
	);
};
