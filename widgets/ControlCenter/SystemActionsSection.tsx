// widgets/ControlCenter/SystemActionsSection.tsx
import { Gtk } from 'astal/gtk3';
import { execAsync } from 'astal/process';

export const SystemActionsSection = () => {
    // TODO: Zweryfikować komendy dla Hyprland / Systemd
    const lockScreenCmd = 'loginctl lock-session'; // Powinno działać
    const logoutCmd = 'gnome-session-quit --logout --no-prompt'; // Dla GNOME session, dostosuj dla Hyprland
    const shutdownCmd = 'gnome-session-quit --power-off --no-prompt'; // Dla GNOME session, dostosuj dla Hyprland/systemd
    // const restartCmd = 'systemctl reboot'; // Wymaga uprawnień lub pkexec
    // const sleepCmd = 'systemctl suspend'; // Wymaga uprawnień lub pkexec

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
                tooltip_text="Ustawienia Systemowe"
                onClicked={() => execAsync('gnome-control-center').catch(err => console.error("Błąd otwierania gnome-control-center", err))}
            >
                <icon icon="preferences-system-symbolic" />
            </button>
            <button
                tooltip_text="Zablokuj Ekran"
                onClicked={() => execAsync(lockScreenCmd).catch(err => console.error("Błąd blokowania ekranu", err))}
            >
                <icon icon="system-lock-screen-symbolic" />
            </button>
            <button
                tooltip_text="Wyloguj"
                onClicked={() => execAsync(logoutCmd).catch(err => console.error("Błąd wylogowywania", err))}
            >
                <icon icon="system-log-out-symbolic" />
            </button>
            <button
                tooltip_text="Zamknij System"
                onClicked={() => execAsync(shutdownCmd).catch(err => console.error("Błąd zamykania systemu", err))}
            >
                <icon icon="system-shutdown-symbolic" />
            </button>
            {/* TODO: Dodać przyciski Restart i Uśpij z odpowiednimi komendami */}
        </box>
    );
};