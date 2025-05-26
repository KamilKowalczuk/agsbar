import { App, Astal, Gtk } from 'astal/gtk3';
import GLib from 'gi://GLib';
import Variable from 'astal/variable';

// Zaimportuj tylko te moduły, które muszą być "uruchomione" lub których komponenty są tu bezpośrednio używane.
// Jeśli sharedState.ts sam inicjuje swoje odpytywanie, wystarczy go zaimportować dla efektu ubocznego.
import './lib/sharedState'; // Uruchomi logikę w sharedState.ts (w tym odpytywanie głośności)
import { PopupOverlay } from './widgets/Popups/PopupOverlay'; // NOWY IMPORT

// Główny komponent paska i komponenty okien pop-up
import { TopBar } from './widgets/Bar/TopBar';
// Update the path below if the actual file location or name is different
import { ControlCenterPopup } from './widgets/Popups/ControlCenterPopup';

const customIconDir = GLib.get_home_dir() + '/.config/ags/assets/icons';

export const POPUP_CLICKED_INSIDE = Variable(false);
export const CONTROL_CENTER_POPUP_NAME = 'control-center-popup';
export const POPUP_OVERLAY_NAME = 'popup-overlay';

declare global {
	const START: Gtk.Align;
	const CENTER: Gtk.Align;
	const END: Gtk.Align;
	const FILL: Gtk.Align;
}

Object.assign(globalThis, {
	START: Gtk.Align.START,
	CENTER: Gtk.Align.CENTER,
	END: Gtk.Align.END,
	FILL: Gtk.Align.FILL,
});

console.log('AGS szuka ikon w:', customIconDir);

App.start({
	css: './css/style.css',
	icons: customIconDir,
	main: () => {
		// Upewnij się, że ten numer odpowiada Twojemu głównemu monitorowi
		const mainMonitorId = 1; // ZMIEŃ TUTAJ jeśli Twój główny monitor ma inny ID
		TopBar(mainMonitorId);
		ControlCenterPopup(); // Tworzymy nowy Control Center
		//VolumeSliderPopup();
		PopupOverlay();
	},
});

export {};
