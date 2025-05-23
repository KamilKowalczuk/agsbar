// widgets/Bar/Clock.tsx
import Variable from 'astal/variable';
import { interval } from 'astal/time';
import { bind } from 'astal';

export const ClockWidget = () => {
	// ... (bez zmian) ...
	const time = Variable(
		new Date().toLocaleTimeString('pl-PL', {
			hour: '2-digit',
			minute: '2-digit',
			//second: '2-digit',
		})
	);

	interval(1000, () => {
		time.set(
			new Date().toLocaleTimeString('pl-PL', {
				hour: '2-digit',
				minute: '2-digit',
				//second: '2-digit',
			})
		);
	});

	return <label className="clock-widget" label={bind(time).as((t) => t)} />;
};
