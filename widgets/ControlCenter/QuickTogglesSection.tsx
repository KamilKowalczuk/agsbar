// widgets/ControlCenter/QuickTogglesSection.tsx
import { Gtk } from 'astal/gtk3';
import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';

export const QuickTogglesSection = () => {
    return (
        <box
            className="cc-quick-toggles"
            orientation={Gtk.Orientation.HORIZONTAL}
            spacing={10}
            halign={Gtk.Align.CENTER}
            css="margin-bottom: 10px;"
        >
            <button tooltip_text="Ustawienia Sieci">
                <NetworkIndicatorWidget />
            </button>
            <button tooltip_text="Ustawienia Bluetooth">
                <BluetoothIndicatorWidget />
            </button>
            <button tooltip_text="Tryb Nie Przeszkadzać (TODO)"> {/* TODO: Dodać logikę dla tego przycisku */}
                <icon icon="notifications-disabled-symbolic" />
            </button>
        </box>
    );
};