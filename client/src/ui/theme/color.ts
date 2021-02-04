interface HSV {
    h: number;
    s: number;
    v: number;
}

function componentToHex(c: number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function HSVtoRGB(h: number, s: number, v: number) {
    h = h/360;
    s = s/100;
    v = v/100;


    var r: number, g: number, b: number, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            (r = v), (g = t), (b = p);
            break;
        case 1:
            (r = q), (g = v), (b = p);
            break;
        case 2:
            (r = p), (g = v), (b = t);
            break;
        case 3:
            (r = p), (g = q), (b = v);
            break;
        case 4:
            (r = t), (g = p), (b = v);
            break;
        case 5:
            (r = v), (g = p), (b = q);
            break;
    }
    return {
        r: Math.round(r! * 255),
        g: Math.round(g! * 255),
        b: Math.round(b! * 255),
    };
}

function hexToRgb(hex: string) {
    hex = hex.toLowerCase();
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

function rgb2hsv(r: number, g: number, b: number) {
    let rabs,
        gabs,
        babs,
        rr,
        gg,
        bb,
        h: any,
        s,
        v: number,
        diff: any,
        diffc: any,
        percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    (v = Math.max(rabs, gabs, babs)), (diff = v - Math.min(rabs, gabs, babs));
    diffc = (c: number) => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = (num: number) => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = 1 / 3 + rr - bb;
        } else if (babs === v) {
            h = 2 / 3 + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100),
    };
}

export class Color {
    hsv: HSV;
    constructor(hex: string) {
        let rgb = hexToRgb(hex)!;
        this.hsv = rgb2hsv(rgb.r, rgb.g, rgb.b);
    }

    hue() {
        return this.hsv.h;
    }

    saturationv() {
        return this.hsv.s;
    }

    value() {
        return this.hsv.v;
    }

    static fromHSV(hsv: HSV) {
        let c = new Color("#FFFFFF");
        c.hsv = hsv;
        return c;
    }

    string() {
        let rgb = HSVtoRGB(this.hsv.h, this.hsv.s, this.hsv.v);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
    }
}
