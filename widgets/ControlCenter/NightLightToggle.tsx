// widgets/ControlCenter/NightLightToggle.tsx
import { Gtk } from 'astal/gtk3';
import { bind, Variable } from 'astal';
import { execAsync, exec } from 'astal/process'; // exec dla synchronicznego sprawdzania procesu
import GLib from 'gi://GLib'; // Dla pierwszego sprawdzenia
import { interval } from 'astal/time';

const NIGHT_LIGHT_ON_ICON = 'weather-clear-night-symbolic'; // Lub inna pasująca ikona
const NIGHT_LIGHT_OFF_ICON = 'weather-clear-symbolic'; // Lub inna pasująca ikona
const HYPRSUNSET_PROCESS_NAME = 'hyprsunset'; // Nazwa procesu

// Definicje wartości enumów GLib.SpawnError i GLib.ProcessError
// Te wartości można znaleźć w dokumentacji GLib lub przez eksperymenty.
// Są to typowe wartości, ale mogą się różnić w zależności od wersji.
const G_SPAWN_ERROR_QUARK_NAME = 'g-spawn-error-quark';
const G_PROCESS_ERROR_QUARK_NAME = 'g-process-error-quark';

// Typowe kody błędów (mogą wymagać weryfikacji dla Twojej wersji GLib/GJS)
enum GSpawnErrorCode {
	NOENT = 2, // No such file or directory (dla SpawnError)
	// inne kody SpawnError...
}

enum GProcessErrorCode {
	FAILED = 1, // Ogólny błąd dla ProcessError (np. killall nie znalazł procesu)
	// inne kody ProcessError...
}

export const NightLightToggle = () => {
	const isNightLightActive = Variable(false);
	const isLoading = Variable(false);

	const checkHyprsunsetProcess = async (): Promise<boolean> => {
		try {
			await execAsync(['pgrep', '-x', HYPRSUNSET_PROCESS_NAME]);
			return true;
		} catch (e) {
			return false;
		}
	};

	const updateNightLightState = async () => {
		const isActive = await checkHyprsunsetProcess();
		if (isNightLightActive.get() !== isActive) {
			isNightLightActive.set(isActive);
		}
	};

	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		updateNightLightState().catch((err) =>
			console.error('Error in initial updateNightLightState: ', err)
		);
		return GLib.SOURCE_REMOVE;
	});

	interval(3000, () => {
		updateNightLightState().catch((e) =>
			console.error(
				'NightLightToggle: Błąd w cyklicznej aktualizacji stanu Hyprsunset:',
				e
			)
		);
	});

	const toggleNightLight = async () => {
		if (isLoading.get()) return;
		isLoading.set(true);

		const currentlyActive = await checkHyprsunsetProcess();

		if (currentlyActive) {
			console.log('toggleNightLight: Attempting to turn OFF hyprsunset...');
			try {
				await execAsync(['killall', HYPRSUNSET_PROCESS_NAME]);
				console.log('toggleNightLight: killall command executed.');
			} catch (error: any) {
				let handled = false;
				if (error instanceof GLib.Error) {
					const errorDomainString = GLib.quark_to_string(error.domain);
					// console.log(`Killall GLib Error: Domain='${errorDomainString}', Code=${error.code}, Message='${error.message}'`);
					// killall zwraca kod wyjścia 1 (FAILED w domenie g-process-error-quark), gdy nie znajdzie procesu
					if (
						errorDomainString === G_PROCESS_ERROR_QUARK_NAME &&
						error.code === GProcessErrorCode.FAILED
					) {
						console.warn(
							'toggleNightLight: killall did not find hyprsunset process (this is often OK if it was already off).'
						);
						handled = true;
					} else if (
						errorDomainString === G_SPAWN_ERROR_QUARK_NAME &&
						error.code === GSpawnErrorCode.NOENT
					) {
						console.warn(
							"toggleNightLight: Command 'killall' itself not found. Error: ",
							error.message
						);
						handled = true;
					}
				}
				// Sprawdzenie 'status' dodawanego przez Astal execAsync w przypadku błędu
				if (
					!handled &&
					typeof error.status === 'number' &&
					error.status === 1
				) {
					console.warn(
						'toggleNightLight: killall exited with status 1 (likely process not found).'
					);
					handled = true;
				}
				if (!handled) {
					console.error(
						'toggleNightLight: Unhandled error during killall hyprsunset:',
						error.message || error
					);
				}
			}
		} else {
			console.log('toggleNightLight: Attempting to turn ON hyprsunset...');
			try {
				await execAsync([HYPRSUNSET_PROCESS_NAME]);
				console.log('toggleNightLight: hyprsunset command executed.');
			} catch (error: any) {
				console.error(
					'toggleNightLight: Error starting hyprsunset:',
					error.message || error
				);
				if (error instanceof GLib.Error) {
					const errorDomainString = GLib.quark_to_string(error.domain);
					console.error(
						`GLib Error (start): Domain='${errorDomainString}', Code=${error.code}, Message='${error.message}'`
					);
				}
			}
		}

		GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 500, () => {
			updateNightLightState()
				.then(() => {
					isLoading.set(false);
				})
				.catch((err) => {
					console.error(
						'Error in final updateNightLightState after toggle: ',
						err
					);
					isLoading.set(false);
				});
			return GLib.SOURCE_REMOVE;
		});
	};

	return (
		// ... (JSX bez zmian) ...
		<button
			className="cc-toggle-button night-light-toggle"
			onClicked={toggleNightLight}
			sensitive={bind(isLoading).as((loading) => !loading)}
			tooltip_text={bind(isNightLightActive).as((active) =>
				active
					? 'Wyłącz filtr światła niebieskiego'
					: 'Włącz filtr światła niebieskiego'
			)}
		>
			<box
				orientation={Gtk.Orientation.HORIZONTAL}
				spacing={8}
				hexpand={true}
				halign={Gtk.Align.FILL}
			>
				<icon
					icon={bind(isLoading).as((loading) => {
						if (loading) return 'process-working-symbolic';
						return isNightLightActive.get()
							? NIGHT_LIGHT_ON_ICON
							: NIGHT_LIGHT_OFF_ICON;
					})}
				/>
				<label
					label="Filtr Światła Nieb."
					hexpand={true}
					halign={Gtk.Align.START}
				/>
				<label
					label={bind(isLoading).as((loading) => {
						if (loading) return '...';
						return isNightLightActive.get() ? 'WŁ' : 'WYŁ';
					})}
					css="font-size: 0.8em;"
				/>
			</box>
		</button>
	);
};
