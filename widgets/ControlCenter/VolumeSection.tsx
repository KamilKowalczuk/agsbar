// widgets/ControlCenter/VolumeSection.tsx
import { Gtk } from 'astal/gtk3';
import { bind } from 'astal';
import { execAsync } from 'astal/process';
import {
    systemVolumePercent,
    systemIsMuted,
    updateSharedVolumeState, // Jeśli ta funkcja jest nadal potrzebna po akcji użytkownika
} from '../../services/VolumeService'; // Ścieżka do VolumeService

export const VolumeSection = () => {
    return (
        <box
            className="cc-section volume-section"
            orientation={Gtk.Orientation.VERTICAL}
            spacing={5}
        >
            <box
                orientation={Gtk.Orientation.HORIZONTAL}
                spacing={10}
                align={Gtk.Align.CENTER}
            >
                <label label="Głośność" halign={Gtk.Align.START} hexpand={true} />
                <button
                    className="popup-mute-button"
                    tooltip_text={bind(systemIsMuted).as((m) =>
                        m ? 'Włącz dźwięk' : 'Wycisz'
                    )}
                    onClicked={() => {
                        execAsync([
                            'wpctl',
                            'set-mute',
                            '@DEFAULT_AUDIO_SINK@',
                            'toggle',
                        ]).then(updateSharedVolumeState); // Lub pozwól VolumeService samemu zaktualizować stan
                    }}
                >
                    <icon
                        icon={bind(systemIsMuted).as((m) =>
                            m
                                ? 'audio-volume-muted-symbolic'
                                : systemVolumePercent.get() > 0
                                ? 'audio-volume-high-symbolic'
                                : 'audio-volume-off-symbolic'
                        )}
                    />
                </button>
            </box>
            <slider
                className="volume-slider"
                hexpand={true}
                min={0}
                max={100}
                value={systemVolumePercent.get()} // Inicjalizacja wartości
                setup={(selfSlider: Gtk.Scale) => {
                    selfSlider.set_draw_value(false);
                    // Subskrypcja do zmian systemVolumePercent, aby aktualizować suwak
                    const volumeSub = systemVolumePercent.subscribe((volume) => {
                        if (selfSlider.get_value() !== volume) {
                            selfSlider.set_value(volume);
                        }
                    });
                    selfSlider.connect('destroy', () => {
                        volumeSub(); // Odłącz subskrypcję
                    });
                }}
                // Reaguj na zmiany wartości suwaka przez użytkownika
                onValueChanged={(selfSlider: Gtk.Scale) => {
                    const newVolume = Math.round(selfSlider.get_value());
                    if (systemVolumePercent.get() !== newVolume) {
                        systemVolumePercent.set(newVolume); // Ustaw nową wartość w Variable
                        execAsync([
                            'wpctl',
                            'set-volume',
                            '@DEFAULT_AUDIO_SINK@',
                            `${newVolume}%`,
                        ])
                        // updateSharedVolumeState jest odpytywane w VolumeService,
                        // więc nie trzeba go tu wywoływać, chyba że chcemy natychmiastowej reakcji
                        .catch((err) =>
                            console.error('CC Popup: Error setting volume', err)
                        );
                    }
                }}
            />
        </box>
    );
};