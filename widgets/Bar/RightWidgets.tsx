// widgets/Bar/RightWidgets.tsx
import { Gtk } from 'astal/gtk3'; // Ścieżki z widgets/Bar/ do widgets/Indicators/
// import { NetworkIndicatorWidget } from '../Indicators/NetworkIndicator';
// import { VolumeIndicatorWidget } from '../Indicators/VolumeIndicator'; // Poprawiona nazwa
// import { BluetoothIndicatorWidget } from '../Indicators/BluetoothIndicator';
//import { PowerSourceWidget } from './PowerSourceWidget'; // Założenie, że widget jest w Indicators
import { RamUsageIndicator } from '../Indicators/RamUsageIndicator';
import { CpuUsageIndicator } from '../Indicators/CpuUsageIndicator';
import { CpuTempIndicator } from '../Indicators/CpuTempIndicator';
import { GpuTempIndicator } from 'widgets/Indicators/GpuTempIndicator';
import { GroupedIndicatorsButton } from './GroupedIndicatorsButton';

export const RightWidgets = () => {
	return (
		<box
			className="right-widgets"
			orientation={Gtk.Orientation.HORIZONTAL}
			halign={Gtk.Align.END} // Wyrównanie do prawej
			spacing={8} // Odstęp między ikonami
		>
			<GpuTempIndicator />
			<CpuUsageIndicator />
			<CpuTempIndicator />
			<RamUsageIndicator />
			{/* Nasz nowy zgrupowany przycisk, który zastępuje indywidualne wskaźniki */}
			<GroupedIndicatorsButton />
			{/* Tutaj w przyszłości przycisk zasilania, statystyki systemowe itp. */}
		</box>
	);
};
