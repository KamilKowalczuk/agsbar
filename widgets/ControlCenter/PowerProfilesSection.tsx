// widgets/ControlCenter/PowerSection.tsx
import { Gtk } from 'astal/gtk3';
import { PowerSourceWidget } from '../Bar/PowerSourceWidget'; // Ścieżka do PowerSourceWidget

export const PowerSection = () => {
    return (
        <box
            className="cc-section power-section"
            orientation={Gtk.Orientation.HORIZONTAL} // Zmienione na HORIZONTAL, jeśli tylko jeden element
            spacing={10}
            align={Gtk.Align.CENTER} // lub START, jeśli wolisz
            // Możesz chcieć, aby ta sekcja była pionowa, jeśli dodasz tu więcej elementów (np. przyciski profili mocy)
            // orientation={Gtk.Orientation.VERTICAL}
        >
            {/* <label label="Zasilanie" halign={Gtk.Align.START} hexpand={true} /> */}
            <PowerSourceWidget />
            {/* Tutaj w przyszłości można dodać PowerProfilesToggleWidget */}
        </box>
    );
};