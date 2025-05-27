// widgets/ControlCenter/PowerProfilesSection.tsx
import { Gtk } from 'astal/gtk3';
import { bind, Variable } from 'astal';
import { execAsync, exec } from 'astal/process';
import { interval } from 'astal/time'; // Importujemy interval
import GLib from 'gi://GLib'; // Potrzebny do pierwszego wywołania

interface PowerProfile {
	name: string;
	displayName: string;
	icon: string;
}

const PROFILES: PowerProfile[] = [
	{
		name: 'power-saver',
		displayName: 'Oszczędzanie Energii',
		icon: 'preferences-desktop-screensaver-symbolic',
	},
	{
		name: 'balanced',
		displayName: 'Zrównoważony',
		icon: 'power-profile-balanced-symbolic',
	},
	{
		name: 'performance',
		displayName: 'Wydajność',
		icon: 'speedometer-symbolic',
	},
];

export const PowerProfilesSection = () => {
	const activeProfileName = Variable('balanced');

	const updateActiveProfile = async () => {
		try {
			const profileOutput = await execAsync(['powerprofilesctl', 'get']);
			const currentProfile = profileOutput.trim().toLowerCase();
			// Używamy .get() do odczytu wartości
			if (activeProfileName.get() !== currentProfile) {
				activeProfileName.set(currentProfile);
				console.log(`Power profile updated to: ${currentProfile}`);
			}
		} catch (error) {
			console.error('Błąd pobierania aktywnego profilu mocy:', error);
		}
	};

	// Inicjalizacja stanu
	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		// Pierwsze wywołanie może być synchroniczne, jeśli to krytyczne,
		// lub asynchroniczne, jeśli akceptujemy lekkie opóźnienie w UI.
		// Spróbujmy najpierw synchronicznie dla inicjalizacji:
		try {
			const initialProfileOutput = exec(['powerprofilesctl', 'get']); // Synchroniczne
			const initialProfile = initialProfileOutput.trim().toLowerCase();
			activeProfileName.set(initialProfile);
			console.log(`Initial power profile set to: ${initialProfile}`);
		} catch (e) {
			console.error('Błąd inicjalnego pobierania profilu mocy (sync):', e);
			// Jeśli synchroniczne zawiedzie, pierwsze asynchroniczne odpytanie poniżej to naprawi.
			updateActiveProfile(); // Spróbuj asynchronicznie jako fallback
		}
		return GLib.SOURCE_REMOVE; // Wykonaj tylko raz
	});

	// Używamy interval z astal/time do cyklicznego odpytywania
	interval(5000, updateActiveProfile); // Odpytuj co 5 sekund

	const setProfile = async (profileName: string) => {
		try {
			await execAsync(['powerprofilesctl', 'set', profileName]);
			activeProfileName.set(profileName);
		} catch (error) {
			console.error(`Błąd ustawiania profilu mocy na ${profileName}:`, error);
			await updateActiveProfile(); // Przywróć rzeczywisty stan w razie błędu
		}
	};

	return (
		<box
			className="cc-section power-profiles-section"
			orientation={Gtk.Orientation.VERTICAL}
			spacing={10}
		>
			<label
				label="Tryb Zasilania"
				halign={Gtk.Align.START}
				css="margin-bottom: 5px;"
			/>
			<box
				className="power-profiles-buttons"
				orientation={Gtk.Orientation.HORIZONTAL}
				spacing={5}
				halign={Gtk.Align.CENTER}
				homogeneous={true}
			>
				{PROFILES.map((profile) => (
					<button
						key={profile.name}
						// Używamy .get() wewnątrz transformacji .as() dla dynamicznej klasy
						className={bind(activeProfileName).as(
							(activeName) =>
								`power-profile-button ${
									profile.name === activeName ? 'active' : ''
								}`
						)}
						onClicked={() => setProfile(profile.name)}
						tooltip_text={profile.displayName}
					>
						<box
							orientation={Gtk.Orientation.VERTICAL}
							spacing={3}
							hexpand={true}
							vexpand={true}
							halign={Gtk.Align.CENTER}
							valign={Gtk.Align.CENTER}
						>
							<icon
								icon={profile.icon}
								css="font-size: 20px; margin-bottom: 2px;"
							/>
							<label
								label={profile.displayName}
								lines={2}
								wrap={true}
								justify={Gtk.Justification.CENTER}
							/>
						</box>
					</button>
				))}
			</box>
		</box>
	);
};
