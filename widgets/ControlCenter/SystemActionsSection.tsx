// widgets/ControlCenter/SystemActionsSection.tsx
import { Gtk } from 'astal/gtk3';
import { execAsync } from 'astal/process';

export const SystemActionsSection = () => {
	const settingsCmdArray = ['gnome-control-center']; // To nadal może być problematyczne
	const lockScreenCmdArray = ['loginctl', 'lock-session']; // To powinno działać

	// Nowe komendy używające systemctl
	const suspendCmdArray = ['systemctl', 'suspend'];
	const rebootCmdArray = ['systemctl', 'reboot'];
	const shutdownCmdArray = ['systemctl', 'poweroff'];

	// Wylogowanie - specyficzne dla Hyprland
	const logoutCmdArray = ['hyprctl', 'dispatch', 'exit']; // Zakładając, że to jest pożądana akcja

	const handleAction = async (commandParts: string[], actionName: string) => {
		// Usunięto specjalną logikę dla 'isLogout', bo hyprctl dispatch exit jest prostsze
		try {
			console.log(`Executing ${actionName}: ${commandParts.join(' ')}`);
			await execAsync(commandParts);
		} catch (error) {
			console.error(`Błąd podczas ${actionName}:`, error);
		}
	};

	return (
		<box
			className="cc-system-actions"
			orientation={Gtk.Orientation.HORIZONTAL}
			spacing={10}
			halign={Gtk.Align.END}
			hexpand={true}
			vexpand={true}
			valign={Gtk.Align.END}
		>
			<button
				tooltip_text="Ustawienia Systemowe" // Nadal może powodować ostrzeżenia GTK
				onClicked={() => handleAction(settingsCmdArray, 'otwierania ustawień')}
			>
				<icon icon="preferences-system-symbolic" />
			</button>
			<button
				tooltip_text="Zablokuj Ekran"
				onClicked={() => handleAction(lockScreenCmdArray, 'blokowania ekranu')}
			>
				<icon icon="system-lock-screen-symbolic" />
			</button>
			<button
				tooltip_text="Uśpij"
				onClicked={() => handleAction(suspendCmdArray, 'usypiania systemu')}
			>
				<icon icon="weather-clear-night-symbolic" />
			</button>
			<button
				tooltip_text="Wyloguj"
				onClicked={() => handleAction(logoutCmdArray, 'wylogowywania')}
			>
				<icon icon="system-log-out-symbolic" />
			</button>
			<button
				tooltip_text="Uruchom Ponownie"
				onClicked={() => handleAction(rebootCmdArray, 'restartowania systemu')}
			>
				<icon icon="system-reboot-symbolic" />
			</button>
			<button
				tooltip_text="Zamknij System"
				onClicked={() => handleAction(shutdownCmdArray, 'zamykania systemu')}
			>
				<icon icon="system-shutdown-symbolic" />
			</button>
		</box>
	);
};
