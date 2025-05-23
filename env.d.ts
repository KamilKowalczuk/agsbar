// ~/.config/ags/env.d.ts

/// <reference types="@girs/gtk-3.0/gtk-3.0-ambient" />
/// <reference types="@girs/gdk-3.0/gdk-3.0-ambient" />
/// <reference types="@girs/glib-2.0/glib-2.0-ambient" />
/// <reference types="@girs/gobject-2.0/gobject-2.0-ambient" />
// Inne potrzebne referencje @girs

declare namespace JSX {
	// Na razie używamy 'any', aby uprościć. Doprecyzujemy później.
	interface IntrinsicElements {
		box: any;
		button: any;
		label: any;
		window: any;
		centerbox: any;
		// Dodaj inne widgety, których planujesz używać
	}
}

declare const SRC: string;

// Twoje wcześniejsze deklaracje modułów dla plików
declare module 'inline:*' {
	const content: string;
	export default content;
}
declare module '*.scss' {
	const content: string;
	export default content;
}
declare module '*.css' {
	const content: string;
	export default content;
}
declare module '*.blp' {
	const content: string;
	export default content;
}
