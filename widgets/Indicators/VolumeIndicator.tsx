import { App, Gtk } from 'astal/gtk3';
import { bind } from 'astal';
import Variable from 'astal/variable';
//import GLib from 'gi://GLib';
import { execAsync } from 'astal/process';
import {
	systemVolumePercent,
	systemIsMuted,
	updateSharedVolumeState,
} from '../../services/VolumeService';

// declare global {
// 	// Deklarujemy, że przestrzeń nazw Gdk istnieje i ma pewne właściwości/typy
// 	// To jest uproszczona deklaracja, tylko dla tych części Gdk, których używamy.
// 	// Pełne typy są w @girs/gdk-3.0, ale czasem TS potrzebuje "podpowiedzi".
// 	namespace Gdk {
// 		// Deklarujemy enum ScrollDirection (zakładając, że jest częścią Gdk)
// 		// Rzeczywiste wartości liczbowe nie są tu aż tak istotne dla TypeScriptu,
// 		// bardziej chodzi o to, że taki typ istnieje.
// 		enum ScrollDirection {
// 			UP,
// 			DOWN,
// 			LEFT,
// 			RIGHT,
// 			SMOOTH,
// 		}

// 		// Deklarujemy interfejs dla EventScroll
// 		// To jest uproszczona wersja, dodaj tylko te pola, których faktycznie używasz (np. 'direction')
// 		interface EventScroll {
// 			direction: ScrollDirection; // Używamy naszego zadeklarowanego enum ScrollDirection
// 			// Możesz tu dodać inne właściwości EventScroll, jeśli ich potrzebujesz, np.
// 			// time: number;
// 			// x: number;
// 			// y: number;
// 			// state: ModifierType; // ModifierType też trzeba by zadeklarować
// 			// delta_x: number;
// 			// delta_y: number;
// 			// is_stop: boolean;
// 			// get_scroll_deltas(): [number, number]; // Przykład metody
// 		}

// 		// Deklarujemy stałe dla klawiszy, np. KEY_Escape
// 		// Te wartości są zazwyczaj liczbami.
// 		const KEY_Escape: number;

// 		// Deklarujemy EventMask, jeśli jest potrzebne (np. Gdk.EventMask.SCROLL_MASK)
// 		enum EventMask {
// 			SCROLL_MASK,
// 			SMOOTH_SCROLL_MASK,
// 			// ... inne maski ...
// 		}
// 	}
// }

// Teraz, gdy mamy globalne deklaracje (uproszczone), spróbujmy ich użyć:
const Gdk_local = imports.gi.Gdk; // Nadal importujemy Gdk dla wartości runtime

export const VolumeIndicatorWidget = () => {
	const iconName = Variable('audio-volume-medium-symbolic'); // Wartość początkowa

	const handleScroll = (_widget: Gtk.Widget, event: any): boolean => {
		let dx: number = 0;
		let dy: number = 0;
		let interpreted = false;

		if (event && typeof event.get_scroll_deltas === 'function') {
			try {
				const deltas = event.get_scroll_deltas();

				// Sprawdzamy, czy deltas to tablica i czy ma co najmniej 3 elementy,
				// oraz czy elementy na pozycjach 1 i 2 są liczbami.
				if (
					Array.isArray(deltas) &&
					deltas.length >= 3 &&
					typeof deltas[1] === 'number' &&
					typeof deltas[2] === 'number'
				) {
					dx = deltas[1]; // Zakładamy, że deltas[1] to delta_x
					dy = deltas[2]; // Zakładamy, że deltas[2] to delta_y
					interpreted = true;
				} else {
					console.warn(
						'get_scroll_deltas() nie zwróciło oczekiwanej struktury tablicy. Deltas:',
						deltas
					);
				}
			} catch (e) {
				console.error('Błąd przy wywołaniu event.get_scroll_deltas():', e);
			}
		}

		if (!interpreted) {
			// Fallback, jeśli get_scroll_deltas zawiodło, spróbuj odczytać event.direction
			// (chociaż wcześniej było undefined, ale zostawmy dla kompletności)
			if (event && typeof event.direction === 'number') {
				const direction = event.direction;
				if (direction === Gdk_local.ScrollDirection.UP)
					dy = -1; // Symuluj deltę
				else if (direction === Gdk_local.ScrollDirection.DOWN)
					dy = 1; // Symuluj deltę
				else {
					return false;
				}
				interpreted = true; // Oznaczamy, że udało się zinterpretować
			} else {
				return false; // Zakończ, jeśli nie da się zinterpretować
			}
		}

		// Jeśli dy jest bardzo małe (bliskie zeru), a dx jest znaczące, to jest to scroll poziomy
		if (Math.abs(dy) < 0.01 && Math.abs(dx) > 0.1) {
			return false; // Ignorujemy scroll poziomy dla głośności
		}

		// Jeśli dy jest nadal zbyt małe po sprawdzeniu scrolla poziomego, zignoruj
		if (Math.abs(dy) < 0.01) {
			return false;
		}

		let currentSystemVolume = systemVolumePercent.get();
		let newVolumeTarget = currentSystemVolume;
		let volumeChanged = false;

		// dy < 0 : scroll kółkiem w górę -> zwiększ głośność
		// dy > 0 : scroll kółkiem w dół -> zmniejsz głośność
		if (dy < 0) {
			newVolumeTarget = Math.min(100, currentSystemVolume + 5);
			volumeChanged = true;
		} else if (dy > 0) {
			newVolumeTarget = Math.max(0, currentSystemVolume - 5);
			volumeChanged = true;
		}

		if (volumeChanged && newVolumeTarget !== currentSystemVolume) {
			if (systemIsMuted.get() && newVolumeTarget > 0) {
				execAsync(['wpctl', 'set-mute', '@DEFAULT_AUDIO_SINK@', '0']);
			}
			execAsync([
				'wpctl',
				'set-volume',
				'@DEFAULT_AUDIO_SINK@',
				`${newVolumeTarget}%`,
			])
				.then(updateSharedVolumeState)
				.catch((err) =>
					console.error('Błąd przy execAsync wpctl set-volume:', err)
				);
		}

		return true; // Zdarzenie obsłużone, jeśli doszliśmy tutaj
	};

	iconName.poll(1000, async (prevIcon) => {
		// Odpytuj co sekundę
		try {
			const output = await execAsync([
				'wpctl',
				'get-volume',
				'@DEFAULT_AUDIO_SINK@',
			]);
			// Przykładowy output: "Volume: 0.50" lub "Volume: 0.50 [MUTED]"

			const muted = output.includes('[MUTED]');
			if (muted) {
				return 'audio-volume-muted-symbolic'; // Upewnij się, że masz tę ikonę
			}

			const match = output.match(/Volume:\s*([0-9\.]+)/);
			let newIcon = prevIcon || 'audio-volume-off-symbolic'; // Domyślnie poprzednia lub "off"

			if (match && match[1]) {
				const volume = parseFloat(match[1]);
				const percent = Math.round(volume * 100);

				// Logika wyboru ikony na podstawie procentów
				if (percent > 66) newIcon = 'audio-volume-high-symbolic';
				else if (percent > 33) newIcon = 'audio-volume-medium-symbolic';
				else if (percent > 0) newIcon = 'audio-volume-low-symbolic';
				else newIcon = 'audio-volume-muted-symbolic'; // Dla 0% też może być ikona wyciszenia
			}
			return newIcon;
		} catch (error) {
			// console.error("Błąd pobierania stanu głośności:", error);
			return prevIcon || 'audio-volume-muted-symbolic'; // W razie błędu, zwróć poprzednią ikonę lub wyciszoną
		}
	});

	return (
		<button
			className="control-center-button volume-button"
			onClicked={() => {
				console.log('akcja kliknięcia');
			}}
			//onScrollEvent={handleScroll}
			setup={(self: Gtk.Button) => {
				// Używamy Gdk_local dla wartości runtime enumów

				self.add_events(
					Gdk_local.EventMask.SCROLL_MASK |
						Gdk_local.EventMask.SMOOTH_SCROLL_MASK
				);
				self.connect('scroll-event', (_w, ev) => handleScroll(_w, ev));
			}}
		>
			<icon icon={bind(iconName).as((name) => name)} />
			{/* Usunęliśmy label z procentami */}
		</button>
	);
};
