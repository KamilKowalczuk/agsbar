// widgets/Popups/PopupOverlay.tsx
import { App, Astal, Gtk } from 'astal/gtk3';
import { CONTROL_CENTER_POPUP_NAME, POPUP_OVERLAY_NAME } from '../../app';

const Gdk = imports.gi.Gdk; // Dla GJS runtime
const Cairo = imports.gi.cairo;

export const PopupOverlay = () => {
	return (
		<window
			name={POPUP_OVERLAY_NAME}
			application={App}
			className="popup-overlay-window"
			layer={Astal.Layer.TOP}
			anchor={
				Astal.WindowAnchor.TOP |
				Astal.WindowAnchor.BOTTOM |
				Astal.WindowAnchor.LEFT |
				Astal.WindowAnchor.RIGHT
			}
			exclusivity={Astal.Exclusivity.IGNORE}
			focusable={false}
			decorated={false}
			resizable={false}
			visible={false}
			setup={(self: Gtk.Window) => {
				console.log(`[${POPUP_OVERLAY_NAME}] Setup: Window initialized on Layer TOP.`);
				self.set_can_focus(false);

				const realizeHandlerId = self.connect('realize', (widget: Gtk.Window) => {
					const gdkWin = widget.get_window();
					if (gdkWin) {
						const allocation = widget.get_allocation();
						const rect = new Gdk.Rectangle({
							x: 0, y: 0,
							width: allocation.width, height: allocation.height,
						});
						try {
							const region = new Cairo.Region();
							region.unionRectangle(rect);
							gdkWin.input_shape_combine_region(region, 0, 0);
							console.log(`[${POPUP_OVERLAY_NAME}] Input shape combined.`);
						} catch (e) {
							console.error(`[${POPUP_OVERLAY_NAME}] Error setting input shape:`, e);
						}
					}
				});

				self.add_events(Gdk.EventMask.BUTTON_PRESS_MASK);
				const buttonPressHandlerId = self.connect(
					'button-press-event',
					// Używamy 'any' dla event, aby zbadać jego strukturę w czasie wykonania
					(_widget, event: any) => {
						console.log(`[${POPUP_OVERLAY_NAME}] 'button-press-event' received. Event object:`, event);

						// Sprawdźmy, czy obiekt event ma oczekiwane właściwości/metody
						if (event && typeof event.get_x === 'function' && typeof event.get_y === 'function' && typeof event.get_button === 'function') {
							console.log(`[${POPUP_OVERLAY_NAME}] Event object seems to be Gdk.EventButton-like.`);
							const clickX = event.get_x();
							const clickY = event.get_y();
							const buttonNumber = event.get_button()[1]; // [1] to wartość przycisku
							console.log(`[${POPUP_OVERLAY_NAME}] Click at (${clickX}, ${clickY}), Button: ${buttonNumber}`);

							let closePopupsBecauseClickedOutside = true;
							const ccWindow = App.get_window(CONTROL_CENTER_POPUP_NAME);

							if (ccWindow && ccWindow.visible) {
								const ccAllocation = ccWindow.get_allocation();
								const [ccWindowX, ccWindowY] = ccWindow.get_position();

								if (
									clickX >= ccWindowX &&
									clickX <= ccWindowX + ccAllocation.width &&
									clickY >= ccWindowY &&
									clickY <= ccWindowY + ccAllocation.height
								) {
									console.log(`[${POPUP_OVERLAY_NAME}] Click INSIDE CC boundaries. Propagating.`);
									closePopupsBecauseClickedOutside = false;
									return Gdk.EVENT_PROPAGATE;
								} else {
									console.log(`[${POPUP_OVERLAY_NAME}] Click OUTSIDE CC boundaries.`);
								}
							}

							if (closePopupsBecauseClickedOutside) {
								console.log(`[${POPUP_OVERLAY_NAME}] Click (outside CC) triggered closing.`);
								if (ccWindow?.visible) {
									App.toggle_window(CONTROL_CENTER_POPUP_NAME);
								}
								if (self.visible) {
									App.toggle_window(POPUP_OVERLAY_NAME);
								}
								return Gdk.EVENT_STOP;
							}
						} else {
							console.error(`[${POPUP_OVERLAY_NAME}] Received event object is NOT a Gdk.EventButton or is malformed!`, event);
                            // Wypisz dostępne klucze obiektu event, aby zobaczyć co zawiera
                            if (event) {
                                console.log(`[${POPUP_OVERLAY_NAME}] Keys in event object:`, Object.keys(event));
                                // Jeśli to Gdk.Event, może mieć właściwość .type
                                if (event.type) {
                                    console.log(`[${POPUP_OVERLAY_NAME}] Event type: ${Gdk.EventType[event.type] || event.type}`);
                                }
                            }
						}
						return Gdk.EVENT_PROPAGATE; // Domyślnie propaguj, jeśli coś poszło nie tak z logiką
					}
				);

				self.connect('destroy', () => {
					console.log(`[${POPUP_OVERLAY_NAME}] Signal 'destroy': Disconnecting handlers.`);
					if (realizeHandlerId) self.disconnect(realizeHandlerId);
					if (buttonPressHandlerId) self.disconnect(buttonPressHandlerId);
				});
			}}
		>
			<box className="popup-overlay-content" />
		</window>
	);
};