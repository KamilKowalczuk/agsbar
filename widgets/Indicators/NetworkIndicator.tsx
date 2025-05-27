// widgets/Indicators/NetworkIndicatorIcon.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';

export const NetworkIndicatorWidget = () => {
    const iconName = Variable('network-offline-symbolic'); // Domyślna ikona

    // Logika odpytywania stanu sieci (taka sama jak w Twoim NetworkIndicatorWidget)
    iconName.poll(5000, async (prevIcon) => {
        try {
            const connectivityResult = await execAsync(['nmcli', '-t', '-f', 'CONNECTIVITY', 'general', 'status']);
            const connectivity = connectivityResult.trim().toLowerCase();
            if (connectivity === 'none' || connectivity === 'portal') {
                return 'network-offline-symbolic';
            }
            // ... (reszta Twojej logiki nmcli do wyboru odpowiedniej ikony na podstawie typu i siły sygnału)
            // Przykład uproszczony:
            const devicesOutput = await execAsync(['nmcli', '-t', '-f', 'DEVICE,TYPE,STATE', 'device']);
            const lines = devicesOutput.trim().split('\n');
            let activeType = '';
            for (const line of lines) {
                const parts = line.split(':');
                if (parts.length >= 3 && parts[2].toLowerCase().includes('connected')) {
                    activeType = parts[1].toLowerCase();
                    break;
                }
            }

            if (activeType.includes('ethernet')) {
                return 'network-wired-symbolic';
            } else if (activeType.includes('wifi')) {
                // Tutaj Twoja bardziej zaawansowana logika dla siły sygnału Wi-Fi
                return 'network-wireless-signal-good-symbolic'; // Przykładowo
            }
            return 'help-faq-symbolic'; // Jakaś domyślna, jeśli nic nie pasuje

        } catch (error) {
            // console.error('N: Krytyczny błąd podczas pobierania stanu sieci:', error);
            return prevIcon || 'network-offline-symbolic';
        }
    });

    // Zwracamy TYLKO widget <icon>
    return <icon icon={bind(iconName).as((name) => name)} />;
};