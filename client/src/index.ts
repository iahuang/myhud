/* 
    This webapp uses a homemade HTML library called htmless, which you can find here: https://github.com/iahuang/htmless
*/

import HeadlessServerInterface from "./headless_server_interface";
import ServerInterface from "./server_interface";
import ClockWidget from "./ui/clock";
import NewsWidget from "./ui/news";
import SettingsWidget from "./ui/settings";
import SongWidget from "./ui/spotify_widget";

import SiteThemeManager from "./ui/theme_manager";

// ASSETS

const GIT_LOGO = `<svg class="octocat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.58 31.77"><defs><style>.cls-1{fill-rule:evenodd;}</style></defs><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"/></g></g></svg>`;

// MAIN

declare global {
    interface Window {
        MYHUD_STATIC?: boolean;
    }
}

export default class Application {
    serverInterface: ServerInterface;
    themeManager: SiteThemeManager;
    clock: ClockWidget;
    isStatic: boolean;

    constructor() {
        /*
            If you want to run the webapp without self-hosting a server you can.
            There is a version of the server communications object (server_interface.ServerInterface)
            that pretends to talk to the server, while not actually querying anything behind
            the scenes.

            For more information, see the README.md
        */
        if (window.MYHUD_STATIC) {
            this.serverInterface = (new HeadlessServerInterface() as unknown) as ServerInterface;
            this.isStatic = true;
        } else {
            this.serverInterface = new ServerInterface();
            this.isStatic = false;
        }
        
        this.themeManager = new SiteThemeManager("Default");
        this.clock = new ClockWidget();
    }

    async main() {
        if (!(await this.serverInterface.amILoggedIn())) {
            document.body.appendChild(
                div(
                    image("Spotify_Icon_RGB_Green.png").width(64).height(64),
                    hyperlink("Login with Spotify").href(
                        `/login?origin=${encodeURIComponent(
                            window.location.href
                        )}`
                    )
                )
                    .class("spotify-login")
                    .render()
            );
            return;
        }

        // attempt to keep device awake using experimental wakeLock api
        // have yet to test whether this actually works

        if ("wakeLock" in navigator) {
            try {
                let wakeLock = await (navigator as any).wakeLock.request(
                    "screen"
                );
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        }

        document.body.appendChild(
            div(
                div(
                    span(
                        this.clock,
                        new SongWidget(this.serverInterface)
                    ).class("row")
                ).class("v-center"),
                div(
                    hyperlink(inlineHTML(GIT_LOGO)).href(
                        "https://github.com/iahuang/myhud"
                    ),
                    new SettingsWidget(this),
                    new NewsWidget(this.serverInterface)
                ).class("overlay")
            ).render()
        );
    }
}

let app = new Application();
(window as any).app = app;
app.main();