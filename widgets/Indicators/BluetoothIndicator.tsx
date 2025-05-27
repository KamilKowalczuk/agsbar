// widgets/Indicators/BluetoothIndicatorIcon.tsx
import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';

export const BluetoothIndicatorWidget = () => {
    const iconName = Variable('bluetooth-disabled-symbolic');

    // Logika odpytywania stanu Bluetooth (taka sama jak w Twoim BluetoothIndicatorWidget)
    iconName.poll(5000, async () => {
        try {
            const showOutput = await execAsync(['bluetoothctl', 'show']);
            const isPoweredOn = showOutput.includes('Powered: yes');
            if (!isPoweredOn) {
                return 'bluetooth-disabled-symbolic';
            }
            const devicesOutput = await execAsync(['bluetoothctl', 'devices', 'Connected']);
            const connectedDevices = devicesOutput.trim().split('\n').filter((line) => line.startsWith('Device '));
            if (connectedDevices.length > 0) {
                return 'bluetooth-active-symbolic'; // Lub 'bluetooth-connected-symbolic'
            } else {
                return 'bluetooth-active-symbolic';
            }
        } catch (error) {
            // console.error('Błąd pobierania stanu Bluetooth:', error);
            return 'bluetooth-disabled-symbolic';
        }
    });

    // Zwracamy TYLKO widget <icon>
    return <icon icon={bind(iconName).as((name) => name)} />;
};