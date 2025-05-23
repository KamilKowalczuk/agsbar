import Variable from 'astal/variable';
import { bind } from 'astal';
import { execAsync } from 'astal/process';

export const ActiveWindowWidget = () => {
	// Zmienna przechowująca tytuł aktywnego okna
	// Odpytujemy co 500ms - możesz dostosować. Częstsze odpytywanie = większe obciążenie.
	// Idealnie byłoby nasłuchiwać na sygnał z Hyprland (activewindowv2), ale na razie poll.
	const windowTitle = Variable('');

	windowTitle.poll(500, async (prevValue) => {
		try {
			const windowOutput = await execAsync(['hyprctl', 'activewindow', '-j']);
			if (windowOutput) {
				const windowInfo = JSON.parse(windowOutput);
				return windowInfo.title || ''; // Zwróć tytuł lub pusty string
			}
			return '';
		} catch (error) {
			// console.error("Błąd pobierania informacji o aktywnym oknie:", error);
			// W przypadku błędu (np. brak aktywnego okna na pustym pulpicie)
			// hyprctl activewindow może zwrócić błąd. Zwracamy wtedy pusty string.
			return '';
		}
	});

	return (
		<label
			className="active-window-widget"
			label={bind(windowTitle).as((title) =>
				title ? `| ${title.substring(0, 50)}` : ''
			)} // Skracamy tytuł do 50 znaków
			maxWidthChars={50} // Dodatkowe zabezpieczenie szerokości
			truncate="end" // Jak skracać tekst (start, middle, end)
			visible={bind(windowTitle).as((title) => !!title)} // Ukryj, jeśli brak tytułu
		/>
	);
};
