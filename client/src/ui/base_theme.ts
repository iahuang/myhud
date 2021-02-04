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
