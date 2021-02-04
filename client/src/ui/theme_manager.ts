import { Theme } from "./base_theme";
import Blossom from "./theme/blossom";
import DayNight from "./theme/daynight";
import DefaultTheme from "./theme/default";
import Pink from "./theme/pink";

export interface ThemeOption {
    name: string;
    themeObjectType: any;
    description: string;
    background?: string;
}

export default class SiteThemeManager {
    private _themeInstance: Theme;
    themes: ThemeOption[];
    currentThemeName: string;

    constructor(initialTheme: string) {
        this.themes = [
            {
                name: "Default",
                themeObjectType: DefaultTheme,
                description: "The default theme",
            },
            {
                name: "Quartz",
                themeObjectType: Pink,
                description: "A light pink theme",
            },
            {
                name: "Blossom",
                themeObjectType: Blossom,
                description: "An animated theme inspired by the Wallpaper Engine wallpaper \"Life and Death\"",
            },
            {
                name: "Day/Night Cycle",
                themeObjectType: DayNight,
                description: "A theme that changes colors over the course of the day",
            },
        ];
        this._themeInstance = this.instantiateTheme(initialTheme);
        this._applyTheme(this._themeInstance);
        this.currentThemeName = initialTheme;
    }

    instantiateTheme(withName: string) {
        console.log(`Loading theme "${withName}"...`);
        return new (this.getThemeInfo(withName).themeObjectType)();
    }

    getThemeInfo(name: string) {
        for (let t of this.themes) {
            if (t.name === name) {
                return t;
            }
        }
        throw new Error(`Could not find theme with name "${name}"`);
    }

    setToTheme(name: string) {
        let t = this.instantiateTheme(this.getThemeInfo(name).name);
        this._loadTheme(t);
        this.currentThemeName = name;
    }

    private _applyTheme(theme: Theme) {
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

    private _loadTheme(theme: Theme) {
        this._themeInstance.onUnload(); // unload previous theme
        let oldCSS = document.getElementById("theme-css");
        if (oldCSS) {
            oldCSS.parentElement?.removeChild(oldCSS);
        }

        this._applyTheme(theme);
        this._themeInstance = theme;
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
