import { Theme } from "../base_theme";

export default class DefaultTheme extends Theme {
    constructor() {
        super({ stylesheet: "css/theme_dark.css" });
    }
}