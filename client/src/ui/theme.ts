interface ThemeInit {
    stylesheet?: string;
}

export abstract class Theme {
    stylesheet?: string;

    constructor(params: ThemeInit) {
        this.stylesheet = params.stylesheet;
    }

    onLoad() {
        // to be called when this theme is selected
    }

    onUnload() {
        // to be called when a different theme is selected after this one was already
        // active
    }
}

export class SiteThemeManager {
    private _theme: Theme;
    constructor(initialTheme: Theme) {
        this._theme = initialTheme;
        this.loadTheme(this._theme);
    }

    loadTheme(theme: Theme) {
        this._theme.onUnload(); // unload previous theme
        let oldCSS = document.getElementById("theme-css");
        if (oldCSS) {
            oldCSS.parentElement?.removeChild(oldCSS);
        }

        // inject stylesheet
        if (theme.stylesheet) {
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = theme.stylesheet;
            link.id = "theme-css";
            document.head.appendChild(link);
        }

        theme.onLoad();
    }

    // setPalette(palette: Palette) {
    //     for (let n of Object.keys(palette)) {
    //         this.setColorVar(n, palette[n]);
    //     }
    // }

    // setColorVar(name: string, color: string) {
    //     let root = document.documentElement;
    //     root.style.setProperty("--" + name, color);
    // }
}

class DefaultTheme extends Theme {
    constructor() {
        super({ stylesheet: "css/theme_dark.css" });
    }
}

class Theme_Pink extends Theme {
    constructor() {
        super({ stylesheet: "css/theme_pink.css" });
    }
}
