import { Gtk } from 'astal/gtk3';
import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';

interface HyprlandWorkspace {
	id: number;
	name: string;
	monitor: string;
	windows: number;
	active: boolean; // Dodamy to pole sami
}
export const WorkspacesWidget = () => {
	// Najpierw tworzymy zmienną z wartością początkową
	const workspaces = Variable<HyprlandWorkspace[]>([]);

	// Następnie konfigurujemy odpytywanie za pomocą metody .poll()
	// Użyjemy sygnatury .poll(interwał, funkcjaAktualizująca)
	// funkcjaAktualizująca może zwracać nową wartość lub Promise z nową wartością
	workspaces.poll(1000, async (prevValue) => {
		// Interwał 1000ms
		try {
			const wsOutput = await execAsync(['hyprctl', 'workspaces', '-j']);
			const activeWsOutput = await execAsync([
				'hyprctl',
				'activeworkspace',
				'-j',
			]);

			const allWorkspacesData: Omit<HyprlandWorkspace, 'active'>[] =
				JSON.parse(wsOutput); // Używamy Omit, bo 'active' tu jeszcze nie ma
			const activeWorkspaceInfo = JSON.parse(activeWsOutput);

			return allWorkspacesData
				.map((ws) => ({
					...ws,
					active: ws.id === activeWorkspaceInfo.id,
				}))
				.sort((a, b) => a.id - b.id);
		} catch (error) {
			console.error('Błąd pobierania informacji o pulpitach Hyprland:', error);
			// W przypadku błędu możemy zwrócić poprzednią wartość lub pustą tablicę
			// Zwrócenie `prevValue` zapobiegnie "mruganiu" UI jeśli odczyt chwilowo zawiedzie
			return prevValue;
			// return []; // Alternatywnie, jeśli chcesz wyczyścić w razie błędu
		}
	});

	// Zwracamy komponent box, który zawiera przyciski pulpitów
	return (
		<box
			className="workspaces-widget"
			orientation={Gtk.Orientation.HORIZONTAL}
			spacing={5}
			// Używamy 'children' z wiązaniem do zmiennej 'workspaces'
			// Binding children of widgets will implicitly call .destroy() on widgets that would be left without a parent. [cite: 89]
			children={bind(workspaces).as((wsList) =>
				wsList.map((ws) => (
					<button
						key={ws.id} // Ważne dla reaktywności listy w JSX (chociaż AGS może tego nie wymagać jak React)
						className={`workspace-button ${ws.active ? 'active' : ''}`}
						onClicked={() =>
							execAsync(['hyprctl', 'dispatch', 'workspace', `${ws.id}`])
						}
						label={`${ws.name}`} // Na razie wyświetlamy nazwę/ID
					/>
				))
			)}
		/>
	);
};
