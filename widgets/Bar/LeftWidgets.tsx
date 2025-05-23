import { Gtk } from "astal/gtk3"; 
import { WorkspacesWidget } from './Workspaces'; // W tym samym katalogu 'Bar/' 

import { ActiveWindowWidget } from './ActiveWindow'; // W tym samym katalogu 'Bar/'


export const LeftWidgets = () => {
    return (
        <box
            className="left-widgets"
            orientation={Gtk.Orientation.HORIZONTAL}
            halign={Gtk.Align.START} // Użyj Gtk.Align.START zamiast globalnego START jeśli masz problemy
            spacing={8} // Odstęp między widgetami po lewej
        >
            <WorkspacesWidget />
            <ActiveWindowWidget />
            {/* Tutaj w przyszłości dodamy np. nazwę aktywnego okna */}
        </box>
    );
};