/*
    Dynamic day/night cycle theme for myhud.
    Imported from a previous project of mine called "clockbook"
*/

import { Theme } from "../theme";
import { Color } from "./color";

function timeMark(hour: number, min: number) {
    // 24 hour time converted to a number between 0 and 1, 1 being 11:59 pm
    return hour / 24 + min / 24 / 60;
}

class ColorScheme {
    time: number;
    bottom: Color;
    top: Color;
    textColor: Color;
    constructor(at: number, bottom: Color, top: Color, textColor: Color) {
        this.time = at;
        this.bottom = bottom;
        this.top = top;
        this.textColor = textColor;
    }
}

const colorSchemes: ColorScheme[] = [];

colorSchemes.push(
    new ColorScheme(
        timeMark(0, 0),
        new Color("#131420"),
        new Color("#0F131B"),
        new Color("#688C85")
    )
); // midnight
colorSchemes.push(
    new ColorScheme(
        timeMark(3, 0),
        new Color("#131420"),
        new Color("#0F131B"),
        new Color("#688C85")
    )
); // 3am
colorSchemes.push(
    new ColorScheme(
        timeMark(8, 0),
        new Color("#D89EBC"),
        new Color("#DEAE87"),
        new Color("#FFE8E8")
    )
); // morning
colorSchemes.push(
    new ColorScheme(
        timeMark(12, 0),
        new Color("#D8BD9E"),
        new Color("#87B0DE"),
        new Color("#FFFBEB")
    )
); // noon
colorSchemes.push(
    new ColorScheme(
        timeMark(15, 0),
        new Color("#AC7989"),
        new Color("#FF9292"),
        new Color("#FFDFD4")
    )
); // afternoon
colorSchemes.push(
    new ColorScheme(
        timeMark(19, 0),
        new Color("#595D87"),
        new Color("#EFBCE8"),
        new Color("#DAEFFA")
    )
); // evening
colorSchemes.push(
    new ColorScheme(
        timeMark(22, 0),
        new Color("#0A0B17"),
        new Color("#35253E"),
        new Color("#5C566F")
    )
); // night

function findNearestBefore(time: number) {
    for (let i = 0; i < colorSchemes.length; i++) {
        let bg = colorSchemes[i];
        if (time < bg.time) {
            return colorSchemes[i - 1];
        }
    }
    return colorSchemes[colorSchemes.length - 1];
}

function findNearestAfter(time: number) {
    for (let i = 0; i < colorSchemes.length; i++) {
        let bg = colorSchemes[i];
        if (time < bg.time) {
            return colorSchemes[i];
        }
    }
    return colorSchemes[0];
}

function _mod(a: number, b: number) {
    // modulo operator but with slightly modified behaviour for negative numbers
    if (a >= 0) {
        return a % b;
    }
    return b - (-a % b);
}

function lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
}

function hueInterpol(start: number, end: number, t: number): number {
    // linear interpolate forward between start and end, assuming ability to wrap from 360 back to 0
    if (start > end) {
        return hueInterpol(end, start, 1 - t);
    }

    if (end - start < 360 - end + start) {
        return start + (end - start) * t;
    } else {
        return start - (360 - end + start) * t;
    }
}

function reverseTimeInterp(start: number, end: number, time: number) {
    if (start > end) {
        return _mod(time - start, 1) / (1 - start + end);
    } else {
        return (time - start) / (end - start);
    }
}

function hsvInterp(start: Color, end: Color, t: number) {
    // console.log("se", start.hue(), end.hue(), t);
    // console.log("hi", hueInterpol(start.hue(), end.hue(), t));
    return Color.fromHSV({
        h: _mod(hueInterpol(start.hue(), end.hue(), t), 360),
        s: lerp(start.saturationv(), end.saturationv(), t),
        v: lerp(start.value(), end.value(), t),
    });
}

function getColors(time: number) {
    let previous = findNearestBefore(time);
    let next = findNearestAfter(time);
    let t = reverseTimeInterp(previous.time, next.time, time);
    let bottom = hsvInterp(previous.bottom, next.bottom, t);
    let top = hsvInterp(previous.top, next.top, t);

    return {
        bgGradient: `linear-gradient(0deg, ${bottom.string()} 0%, ${top.string()} 100%)`,
        textColor: hsvInterp(previous.textColor, next.textColor, t).string(),
    };
}

export default class DayNight extends Theme {
    animInterval: number | null = null;
    _n = 0;
    constructor() {
        super({stylesheet: "css/theme_daynight.css"});
    }

    onLoad() {
        // register animation loop
        this.animInterval = window.setInterval(()=>{
            this.updateColors();
        }, 1000);

        this.updateColors();
    }

    updateColors() {
        let now = new Date();
        let timeValue = timeMark(now.getHours(), now.getMinutes());
        let colorScheme = getColors(timeValue);

        document.body.style.background = colorScheme.bgGradient;
        let clock = document.getElementsByClassName("row")[0] as HTMLElement;
        if (clock) {
            clock.style.color = colorScheme.textColor;
        }
    }

    onUnload() {
        // stop animation loop
        window.clearInterval(this.animInterval!);
    }
}
