// widgets/Bar/DateWidget.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import { interval } from 'astal/time'; // Do cyklicznego sprawdzania
import GLib from 'gi://GLib'; // Do pierwszego odświeżenia

const getFormattedDate = (): string => {
	return new Date().toLocaleDateString('pl-PL', {
		day: 'numeric', // np. "22"
		month: 'long', // np. "maja"
		// Możesz dodać, jeśli chcesz:
		// weekday: 'short', // np. "czw."
		// year: 'numeric', // np. "2025" (raczej zbędne na pasku)
	});
	// Wynik np: "22 maja"
};

export const DateWidget = () => {
	const currentDateString = Variable(getFormattedDate());

	// Sprawdzaj co minutę (60000 ms), czy data się zmieniła
	// To wystarczająco częste, aby złapać zmianę o północy.
	interval(60000, () => {
		const newDate = getFormattedDate();
		if (currentDateString.get() !== newDate) {
			currentDateString.set(newDate);
		}
	});

	// Upewnij się, że data jest aktualna przy pierwszym uruchomieniu
	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		currentDateString.set(getFormattedDate());
		return GLib.SOURCE_REMOVE;
	});

	return (
		<label
			className="date-widget"
			label={bind(currentDateString).as((dateStr) => dateStr)}
		/>
	);
};
