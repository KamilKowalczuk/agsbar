import { App, Astal, Gtk } from 'astal/gtk3';
import { LeftWidgets } from './LeftWidgets'; // W tym samym katalogu 'Bar/'
import { ClockWidget } from './Clock'; // W tym samym katalogu 'Bar/'
import { DateWidget } from './DateWidget';
import { RightWidgets } from './RightWidgets'; // W tym samym katalogu 'Bar/'

export const TopBar = (monitor: number = 0) => {
	return (
		<window
			name={`bar-${monitor}`}
			className="bar-window"
			application={App} // Pamiętaj, że 'name' musi być przed 'application'
			monitor={monitor}
			anchor={
				Astal.WindowAnchor.TOP |
				Astal.WindowAnchor.LEFT |
				Astal.WindowAnchor.RIGHT
			}
			exclusivity={Astal.Exclusivity.EXCLUSIVE}
		>
			{/* Używamy właściwości start_widget, center_widget, end_widget dla CenterBox */}
			<centerbox
				className="bar-centerbox"
				start_widget={
					<LeftWidgets /> // Nasze lewe widgety
				}
				center_widget={
					// Kontener dla zegara, aby mógł się rozszerzać i utrzymać zegar na środku
					<box
						className="center-widget-container"
						orientation={Gtk.Orientation.HORIZONTAL} // Ustawiamy orientację na poziomą
						halign={Gtk.Align.CENTER}
						hexpand={true}
						spacing={10} // Odstęp między datą a zegarem (dostosuj)
					>
						<DateWidget />
						<ClockWidget />
					</box>
				}
				end_widget={
					<RightWidgets /> // Nasze prawe widgety
				}
			/>
		</window>
	);
};
