// widgets/ControlCenter/BrightnessSection.tsx
import { Gtk } from 'astal/gtk3';
// import Variable from 'astal/variable'; // Jeśli będziesz miał stan dla jasności
// import { bind } from 'astal'; // Jeśli będziesz miał stan dla jasności

// TODO: Dodać logikę dla serwisu jasności (np. brightnessctl)
// const screenBrightness = Variable(80); // Przykładowa zmienna stanu

export const BrightnessSection = () => {
    return (
        <box
            className="cc-section brightness-section"
            orientation={Gtk.Orientation.VERTICAL}
            spacing={5}
        >
            <label label="Jasność Ekranu" halign={Gtk.Align.START} />
            <slider
                className="brightness-slider"
                hexpand={true}
                min={5}  // Minimalna sensowna jasność
                max={100}
                value={80} // Przykładowa/początkowa wartość, docelowo z Variable
                setup={(selfSlider: Gtk.Scale) => selfSlider.set_draw_value(false)}
                // onValueChanged={(selfSlider: Gtk.Scale) => {
                //     const newBrightness = Math.round(selfSlider.get_value());
                //     // screenBrightness.set(newBrightness);
                //     // execAsync(['brightnessctl', 's', `${newBrightness}%`]);
                //     console.log(`Brightness changed to: ${newBrightness}% (TODO: implement backend)`);
                // }}
            />
        </box>
    );
};