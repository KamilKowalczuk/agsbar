// widgets/ControlCenter/NetworkSection.tsx
import { Gtk } from 'astal/gtk3'; // Upewnij się, że Gtk jest tutaj
import { App } from 'astal/gtk3'; // <--- DODAJ TEN IMPORT
import { bind, Variable } from 'astal';
import { execAsync } from 'astal/process';
import GLib from 'gi://GLib';
import { interval } from 'astal/time'; // Dodany import
import { CONTROL_CENTER_POPUP_NAME } from '../../app'; // <--- DODAJ TEN IMPORT (upewnij się, że ścieżka jest poprawna)

// Typy dla informacji o sieci (będziemy je rozwijać)
interface NetworkState {
	connected: boolean;
	type: 'ethernet' | 'wifi' | 'none' | 'unknown' | 'portal' | 'limited';
	icon: string;
	activeConnectionName?: string;
	ipAddress?: string;
}

interface WifiAccessPoint {
	ssid: string;
	bssid: string;
	signal: number;
	inUse: boolean;
	secure: boolean;
	frequency?: string;
	rate?: string;
}

export const NetworkSection = () => {
	// --- Tutaj Twoje definicje Variable: networkState, availableWifiAPs, isScanningWifi, detailsRevealed ---
	const networkState = Variable<NetworkState>({
		connected: false,
		type: 'none',
		icon: 'network-offline-symbolic',
	});
	const availableWifiAPs = Variable<WifiAccessPoint[]>([]);
	const isScanningWifi = Variable(false);
	const detailsRevealed = Variable(false);

	// --- Tutaj Twoje funkcje: updateNetworkState, scanWifiNetworks, toggleNetworking, handleToggleDetails, connectToWifi ---
	// (Skopiuj je z naszej ostatniej działającej wersji lub tej, którą podałem wcześniej,
	//  z poprawkami dla nmcli i pobierania IP)
	const updateNetworkState = async () => {
		// console.log("NetworkSection: updateNetworkState - START");
		try {
			let currentIcon = 'network-offline-symbolic';
			let currentType: NetworkState['type'] = 'none';
			let currentConnected = false;
			let currentActiveConnectionName: string | undefined;
			let currentIpAddress: string | undefined;

			const connectivityResult = await execAsync([
				'nmcli',
				'-t',
				'-f',
				'CONNECTIVITY',
				'general',
				'status',
			]);
			const connectivity = connectivityResult.trim().toLowerCase();

			if (
				connectivity === 'full' ||
				connectivity === 'limited' ||
				connectivity === 'portal'
			) {
				currentConnected = true;
				const devicesOutput = await execAsync([
					'nmcli',
					'-t',
					'-f',
					'DEVICE,TYPE,STATE,CONNECTION,CON-PATH',
					'device',
				]);
				const lines = devicesOutput.trim().split('\n');
				let activeDeviceLine: string | undefined;
				activeDeviceLine = lines.find((line) => {
					const parts = line.split(':');
					return (
						parts.length >= 3 &&
						parts[1].toLowerCase().includes('ethernet') &&
						parts[2].toLowerCase().includes('connected')
					);
				});
				if (!activeDeviceLine) {
					activeDeviceLine = lines.find((line) => {
						const parts = line.split(':');
						return (
							parts.length >= 3 &&
							parts[1].toLowerCase().includes('wifi') &&
							parts[2].toLowerCase().includes('connected')
						);
					});
				}

				if (activeDeviceLine) {
					const parts = activeDeviceLine.split(':');
					const deviceName = parts[0];
					const deviceType = parts[1].toLowerCase();
					currentActiveConnectionName = parts[3] || 'Połączono';

					try {
						const devShowOutput = await execAsync([
							'nmcli',
							'-t',
							'-f',
							'all',
							'dev',
							'show',
							deviceName,
						]);
						const devLines = devShowOutput.trim().split('\n');
						const ip4Line = devLines.find((line) =>
							line.startsWith('IP4.ADDRESS[')
						);
						if (ip4Line) {
							currentIpAddress = ip4Line
								.substring(ip4Line.indexOf(':') + 1)
								.split('/')[0];
						}
					} catch (e) {
						console.warn(
							`NetworkSection: Nie udało się pobrać szczegółów dla urządzenia ${deviceName}`,
							e
						);
					}

					if (deviceType.includes('ethernet')) {
						currentType = 'ethernet';
						currentIcon = 'network-wired-symbolic';
					} else if (deviceType.includes('wifi')) {
						currentType = 'wifi';
						try {
							const wifiListOut = await execAsync([
								'nmcli',
								'-t',
								'-f',
								'IN-USE,SIGNAL',
								'device',
								'wifi',
								'list',
								'ifname',
								deviceName,
							]);
							const wifiLines = wifiListOut.trim().split('\n');
							const activeWifiLine = wifiLines.find((line) =>
								line.startsWith('*')
							);
							if (activeWifiLine) {
								const signal = parseInt(activeWifiLine.split(':')[1], 10);
								if (signal > 80)
									currentIcon = 'network-wireless-signal-excellent-symbolic';
								else if (signal > 55)
									currentIcon = 'network-wireless-signal-good-symbolic';
								else if (signal > 30)
									currentIcon = 'network-wireless-signal-ok-symbolic';
								else if (signal > 5)
									currentIcon = 'network-wireless-signal-weak-symbolic';
								else currentIcon = 'network-wireless-signal-none-symbolic';
							} else {
								currentIcon = 'network-wireless-symbolic';
							}
						} catch (e) {
							currentIcon = 'network-wireless-symbolic';
							// console.warn("NetworkSection: Error getting WiFi signal strength", e);
						}
					} else {
						currentType = 'unknown';
						currentIcon = 'help-faq-symbolic';
					}
				} else {
					currentType = connectivity as NetworkState['type'];
					currentIcon = 'network-error-symbolic';
				}
			} else {
				currentConnected = false;
				currentType = 'none';
				currentIcon = 'network-offline-symbolic';
			}

			const newState = {
				connected: currentConnected,
				type: currentType,
				icon: currentIcon,
				activeConnectionName: currentActiveConnectionName,
				ipAddress: currentIpAddress,
			};
			if (JSON.stringify(networkState.get()) !== JSON.stringify(newState)) {
				networkState.set(newState);
			}
		} catch (error) {
			// console.error("NetworkSection: Błąd aktualizacji stanu sieci:", error);
			if (
				JSON.stringify(networkState.get()) !==
				JSON.stringify({
					connected: false,
					type: 'none',
					icon: 'network-error-symbolic',
				})
			) {
				networkState.set({
					connected: false,
					type: 'none',
					icon: 'network-error-symbolic',
				});
			}
		}
	};

	const scanWifiNetworks = async () => {
		if (isScanningWifi.get()) return;
		isScanningWifi.set(true);
		availableWifiAPs.set([]);
		// console.log("NetworkSection: Rozpoczynanie skanowania sieci Wi-Fi...");
		try {
			const output = await execAsync([
				'nmcli',
				'-t',
				'-f',
				'SSID,BSSID,SIGNAL,IN-USE,SECURITY,FREQ,RATE',
				'dev',
				'wifi',
				'list',
			]);
			const lines = output.trim().split('\n');
			const aps: WifiAccessPoint[] = lines
				.map((line) => {
					const parts = line.split(':', 7); // Limit split to avoid issues with SSID containing ':'
					return {
						ssid: parts[0] || 'Ukryta sieć',
						bssid: parts[1],
						signal: parseInt(parts[2], 10) || 0,
						inUse: parts[3] === '*',
						secure: parts[4] !== '' && parts[4].toLowerCase() !== 'open',
						frequency: parts[5],
						rate: parts[6],
					};
				})
				.sort((a, b) => b.signal - a.signal);
			availableWifiAPs.set(aps);
			// console.log(`NetworkSection: Znaleziono ${aps.length} sieci Wi-Fi.`);
		} catch (error) {
			// console.error("NetworkSection: Błąd skanowania sieci Wi-Fi:", error);
			availableWifiAPs.set([]);
		} finally {
			isScanningWifi.set(false);
		}
	};

	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		updateNetworkState().catch((err) =>
			console.error('NW_SECTION_DEBUG: Initial updateNetworkState failed:', err)
		);
		return GLib.SOURCE_REMOVE;
	});
	const networkPollInterval = interval(5000, () => {
		// Zapisz referencję do interwału
		updateNetworkState().catch((err) =>
			console.error('NW_SECTION_DEBUG: Polled updateNetworkState failed:', err)
		);
	});

	const toggleNetworking = async () => {
		try {
			const currentState = networkState.get();
			const command = currentState.connected ? 'off' : 'on';
			await execAsync(['nmcli', 'networking', command]);
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
				updateNetworkState();
				return GLib.SOURCE_REMOVE;
			});
		} catch (error) {
			console.error('NetworkSection: Błąd przełączania stanu sieci:', error);
		}
	};

	const handleToggleDetails = () => {
		const newRevealedState = !detailsRevealed.get();
		detailsRevealed.set(newRevealedState);
		if (newRevealedState && networkState.get().type === 'wifi') {
			scanWifiNetworks();
		}
	};

	const connectToWifi = async (ssid: string, bssid?: string) => {
		console.log(
			`NetworkSection: Próba połączenia z ${ssid}` +
				(bssid ? ` (${bssid})` : '')
		);
		try {
			await execAsync(
				bssid
					? ['nmcli', 'dev', 'wifi', 'connect', bssid]
					: ['nmcli', 'dev', 'wifi', 'connect', ssid]
			);
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
				updateNetworkState();
				if (detailsRevealed.get()) scanWifiNetworks();
				return GLib.SOURCE_REMOVE;
			});
		} catch (error) {
			console.error(`NetworkSection: Błąd połączenia z Wi-Fi ${ssid}:`, error);
		}
	};

	// --- Pełny RETURN dla NetworkSection ---
	return (
		<box
			className="cc-section network-section"
			orientation={Gtk.Orientation.VERTICAL}
			spacing={8}
		>
			{/* Główny wiersz z przełącznikiem i przyciskiem rozwijania */}
			<box
				orientation={Gtk.Orientation.HORIZONTAL}
				spacing={10}
				align={Gtk.Align.CENTER}
			>
				<button
					className="network-main-toggle"
					onClicked={toggleNetworking}
					hexpand={true}
					halign={Gtk.Align.FILL}
				>
					<box
						orientation={Gtk.Orientation.HORIZONTAL}
						spacing={8}
						margin_start={5}
						margin_end={5}
					>
						<icon icon={bind(networkState).as((state) => state.icon)} />
						<label
							label={bind(networkState).as(
								(state) =>
									state.activeConnectionName ||
									(state.connected ? 'Połączono' : 'Rozłączono')
							)}
							halign={Gtk.Align.START}
							hexpand={true}
						/>
					</box>
				</button>
				<button
					className="network-details-toggle"
					onClicked={handleToggleDetails}
					tooltip_text={bind(detailsRevealed).as((rev) =>
						rev ? 'Ukryj szczegóły' : 'Pokaż szczegóły'
					)}
				>
					<icon
						icon={bind(detailsRevealed).as((rev) =>
							rev ? 'pan-up-symbolic' : 'pan-down-symbolic'
						)}
					/>
				</button>
			</box>

			{/* Sekcja szczegółów (rozwijana) */}
			<revealer
				reveal_child={bind(detailsRevealed)}
				transition_type={Gtk.RevealerTransitionType.SLIDE_DOWN}
				transition_duration={250}
				valign={Gtk.Align.START} // Ważne dla kontroli wysokości
				setup={(self: Gtk.Revealer) => {
					let notifyChildRevealedHandlerId = 0;
					notifyChildRevealedHandlerId = self.connect(
						'notify::child-revealed',
						() => {
							// Ten sygnał jest emitowany, gdy właściwość child-revealed się zmienia.
							// Animacja może jeszcze trwać lub właśnie się zakończyła.
							const isRevealed = self.get_child_revealed();
							console.log(
								`Revealer: child-revealed state changed to: ${isRevealed}. Transition duration: ${self.transition_duration}`
							);

							// Wymuś przerysowanie CCP po ZAKOŃCZENIU animacji.
							// Czas opóźnienia powinien być równy lub nieco większy niż self.transition_duration.
							GLib.timeout_add(
								GLib.PRIORITY_DEFAULT_IDLE,
								self.transition_duration + 50,
								() => {
									// np. 250ms + 50ms
									const ccWindow = App.get_window(CONTROL_CENTER_POPUP_NAME);
									if (ccWindow && ccWindow.visible) {
										console.log(
											'Forcing CCP queue_resize after revealer animation completed.'
										);
										ccWindow.queue_resize();
									}
									return GLib.SOURCE_REMOVE;
								}
							);
						}
					);
					self.connect('destroy', () => {
						if (notifyChildRevealedHandlerId !== 0)
							self.disconnect(notifyChildRevealedHandlerId);
					});
				}}
				child={
					<box
						className="network-details-content"
						orientation={Gtk.Orientation.VERTICAL}
						spacing={10}
						margin_top={10}
					>
						{bind(networkState).as((state) => {
							if (!state.connected && state.type === 'none') {
								return (
									<label
										label="Sieć jest wyłączona lub niedostępna."
										css="font-style: italic;"
									/>
								);
							}
							if (state.type === 'ethernet') {
								return (
									<box orientation={Gtk.Orientation.VERTICAL} spacing={5}>
										<label
											halign={Gtk.Align.START}
											use_markup={true}
											label={`<b>Połączenie przewodowe:</b> ${
												state.activeConnectionName || 'Aktywne'
											}`}
										/>
										{state.ipAddress && (
											<label
												halign={Gtk.Align.START}
												label={`Adres IP: ${state.ipAddress}`}
											/>
										)}
									</box>
								);
							}
							if (state.type === 'wifi') {
								return (
									<box orientation={Gtk.Orientation.VERTICAL} spacing={5}>
										<label
											halign={Gtk.Align.START}
											use_markup={true}
											label={`<b>Połączono z Wi-Fi:</b> ${
												state.activeConnectionName || 'Brak nazwy'
											}`}
										/>
										{state.ipAddress && (
											<label
												halign={Gtk.Align.START}
												label={`Adres IP: ${state.ipAddress}`}
											/>
										)}
										{/* Użyj Gtk.Separator bezpośrednio */}
										<box className="network-details-separator">
											<Gtk.Separator orientation={Gtk.Orientation.HORIZONTAL} />
										</box>
										<box
											orientation={Gtk.Orientation.HORIZONTAL}
											spacing={5}
											margin_bottom={5}
										>
											<label
												label="Dostępne sieci Wi-Fi:"
												hexpand={true}
												halign={Gtk.Align.START}
											/>
											<button
												onClicked={scanWifiNetworks}
												sensitive={bind(isScanningWifi).as((s) => !s)}
											>
												<icon
													icon={bind(isScanningWifi).as((s) =>
														s
															? 'process-working-symbolic'
															: 'view-refresh-symbolic'
													)}
												/>
											</button>
										</box>

										<scrollable
											height_request={150}
											hscrollbar_policy={Gtk.PolicyType.NEVER}
											vscrollbar_policy={Gtk.PolicyType.AUTOMATIC}
											// css="min-width: 330px;" // Możesz to dodać, jeśli potrzebne
											child={
												<box
													orientation={Gtk.Orientation.VERTICAL}
													spacing={3}
													className="wifi-ap-list-container-box" // Użyj klasy do stylizacji marginesu prawego w CSS
												>
													{bind(availableWifiAPs).as((aps) =>
														aps.length > 0 ? (
															aps.map((ap) => (
																<button
																	key={ap.bssid}
																	className={`wifi-ap-button ${
																		ap.inUse ? 'active' : ''
																	}`}
																	onClicked={() =>
																		connectToWifi(ap.ssid, ap.bssid)
																	}
																	sensitive={!ap.inUse}
																>
																	<box
																		orientation={Gtk.Orientation.HORIZONTAL}
																		spacing={6}
																		hexpand={true}
																		halign={Gtk.Align.FILL}
																	>
																		<icon
																			icon={
																				ap.signal > 80
																					? 'network-wireless-signal-excellent-symbolic'
																					: ap.signal > 55
																					? 'network-wireless-signal-good-symbolic'
																					: ap.signal > 30
																					? 'network-wireless-signal-ok-symbolic'
																					: ap.signal > 5
																					? 'network-wireless-signal-weak-symbolic'
																					: 'network-wireless-signal-none-symbolic'
																			}
																		/>
																		<label
																			label={ap.ssid}
																			hexpand={true}
																			halign={Gtk.Align.START}
																			truncate="end"
																			maxWidthChars={18} // Dostosuj w razie potrzeby
																		/>
																		{ap.secure && (
																			<icon icon="network-wireless-encrypted-symbolic" />
																		)}
																		{ap.inUse && (
																			<icon
																				icon="object-select-symbolic"
																				tooltip_text="Połączono"
																			/>
																		)}
																	</box>
																</button>
															))
														) : (
															<label
																label="Skanowanie lub brak sieci..."
																css="font-style: italic;"
															/>
														)
													)}
												</box>
											}
										/>
									</box>
								);
							}
							// Fallback, jeśli stan jest nieoczekiwany
							return (
								<label
									label={`Nieznany stan sieci: ${state.type}`}
									css="font-style: italic;"
								/>
							);
						})}
					</box>
				}
			/>
		</box>
	);
};
