import Variable from 'astal/variable';
import { execAsync } from 'astal/process';
import GLib from 'gi://GLib';
import { interval } from 'astal/time';

export const systemVolumePercent = Variable(50);
export const systemIsMuted = Variable(false);
export const barVolumeIconName = Variable('audio-volume-medium-symbolic');

export const updateSharedVolumeState = async () => {
	try {
		const output = await execAsync([
			'wpctl',
			'get-volume',
			'@DEFAULT_AUDIO_SINK@',
		]);
		const isMuted = output.includes('[MUTED]');
		systemIsMuted.set(isMuted);

		let currentPercent = 0;
		let newIconForBar = 'audio-volume-off-symbolic'; // Domyślna ikona w razie błędu parsowania

		if (isMuted) {
			newIconForBar = 'audio-volume-muted-symbolic';
			// Zachowaj ostatnią znaną głośność lub odczytaj ją mimo wyciszenia,
			// bo `wpctl get-volume` nadal pokazuje poziom głośności nawet przy [MUTED]
			const matchMuted = output.match(/Volume:\s*([0-9\.]+)/);
			if (matchMuted && matchMuted[1]) {
				currentPercent = Math.round(parseFloat(matchMuted[1]) * 100);
			}
		} else {
			const match = output.match(/Volume:\s*([0-9\.]+)/);
			if (match && match[1]) {
				const volume = parseFloat(match[1]);
				currentPercent = Math.round(volume * 100);

				if (currentPercent > 66) newIconForBar = 'audio-volume-high-symbolic';
				else if (currentPercent > 33)
					newIconForBar = 'audio-volume-medium-symbolic';
				else if (currentPercent > 0)
					newIconForBar = 'audio-volume-low-symbolic';
				else newIconForBar = 'audio-volume-muted-symbolic'; // Dla 0%
			}
		}
		systemVolumePercent.set(currentPercent);
		barVolumeIconName.set(newIconForBar);
		// console.log(`VolumeState: Vol=${currentPercent}%, Muted=${isMuted}, Icon=${newIconForBar}`);
	} catch (error) {
		console.error(
			'Błąd pobierania stanu głośności (updateSharedVolumeState):',
			error
		);
		barVolumeIconName.set('audio-volume-muted-symbolic'); // Ikona błędu/wyciszenia
		systemVolumePercent.set(0); // Resetuj w razie błędu
		systemIsMuted.set(true); // Załóż wyciszenie w razie błędu
	}
};

// Inicjalizacja i odpytywanie stanu głośności
GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
	updateSharedVolumeState();
	return GLib.SOURCE_REMOVE;
});
interval(1000, updateSharedVolumeState); // Odpytuj co sekundę
