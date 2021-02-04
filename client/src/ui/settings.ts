import Application from "src/index";
import svg from "./htmless_svg";

const icon = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-settings" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
<circle cx="12" cy="12" r="3" />
</svg>`;

interface ThemeOption {
    name: string;
    themeObjectType: any;
    description: string;
    background?: string;
}

class ThemeSelector extends Component {
    app: Application;
    tooltip: Tooltip;

    constructor(app: Application, tooltip: Tooltip) {
        super();
        this.app = app;
        this.tooltip = tooltip;
    }

    get currentlySelected() {
        return this.app.themeManager.currentThemeName;
    }

    listItem(theme: ThemeOption) {
        let el = div(theme.name).class("st-theme-item");
        if (theme.name === this.currentlySelected) {
            el.class("st-theme-selected");
        }

        el.onClick(() => {
            this.app.themeManager.setToTheme(theme.name);
            this.rerender();
        })
            .onEvent("mouseover", () => {
                this.tooltip.setText(theme.description);
                this.tooltip.show();
            })
            .onEvent("mouseleave", () => {
                this.tooltip.hide();
            });

        return el;
    }

    body() {
        return div(
            ...this.app.themeManager.themes.map((t) => this.listItem(t))
        );
    }
}

type ToggleCallback = (state: boolean) => void;

class ToggleSwitch extends Component {
    state: boolean;
    onStateChange: ToggleCallback;
    constructor(onStateChange: ToggleCallback, initialState: boolean = false) {
        super();
        this.onStateChange = onStateChange;
        this.state = initialState;
    }

    private _setState(to: boolean) {
        if (this.state === to) {
            return;
        }
        this.state = to;
        this.onStateChange(to);
        this.rerender();
    }

    on() {
        this._setState(true);
    }

    off() {
        this._setState(false);
    }

    toggle() {
        this._setState(!this.state);
    }

    body() {
        return div(
            div()
                .class("st-toggle-sw")
                .style({
                    left: this.state ? "18pt" : "0pt",
                })
        )
            .class("st-toggle")
            .onClick(() => {
                this.toggle();
            });
    }
}

class Tooltip {
    /* A class for creating tooltips */
    private _element: HTMLElement;

    constructor() {
        this._element = this._createElement();
        this._element.style.position = "absolute";
        this._element.style.pointerEvents = "none";
        document.body.appendChild(this._element);
        window.addEventListener("mousemove", (ev) => {
            let mouseEvent = ev as MouseEvent;
            this._element.style.transform = `translate(${ev.pageX}px, ${ev.pageY}px)`;
        });
    }

    setText(text: string) {
        this._element.innerText = text;
    }

    hide() {
        this._element.style.display = "none";
    }

    show() {
        this._element.style.display = "initial";
    }

    private _createElement() {
        return div().id("st-tooltip").render();
    }
}

export default class SettingsWidget extends Component {
    menuOpen = false;
    app: Application;
    tooltip: Tooltip;

    constructor(app: Application) {
        super();
        this.app = app;
        this.tooltip = new Tooltip();
        this.tooltip.hide();
        this.tooltip.setText("tooltip");
    }

    renderButton() {
        return div(svg(icon).class("settings-icon")).onClick(() => {
            this.openMenu();
        });
    }

    menuHeader(text: string) {
        return div(span(text).class("st-header"), hr);
    }

    themeSelection() {}

    renderMenu() {
        let clock = this.app.clock;

        return div(
            this.menuHeader("Theme"),
            new ThemeSelector(this.app, this.tooltip),
            this.menuHeader("Clock"),
            span(
                inlineComponent(()=>{
                    return div(clock.twelveHour ? "12 Hour" : "24 Hour")
                }).id("st-cl-mode"),
                new ToggleSwitch((to) => {
                    clock.setTwelveHour(!to);
                    htmless.rerender("st-cl-mode");
                }, !clock.twelveHour)
            ).class("st-row")
        )
            .class("st-menu")
            .onEvent("click", (ev) => {
                ev.stopPropagation();
            });
    }

    openMenu() {
        this.menuOpen = true;
        this.rerender();
    }

    closeMenu() {
        this.menuOpen = false;
        this.rerender();
    }

    body() {
        if (this.menuOpen) {
            return div(this.renderMenu())
                .class("st-close-overlay")
                .onEvent("click", () => {
                    this.closeMenu();
                });
        }
        return div(this.renderButton());
    }
}
