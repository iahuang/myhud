/* 
    This webapp uses a homemade HTML library called htmless, which you can find here: https://github.com/iahuang/htmless

    Ideally this file wouldn't be so long, but due to the current
    project architecture, it isn't really feasible to split the
    client code into multiple files. The way I originally envisioned
    this project, this wouldn't have been a problem.
*/

/// <reference types="../../node_modules/@types/spotify-api" />

// ASSETS

const GIT_LOGO = `<svg class="octocat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.58 31.77"><defs><style>.cls-1{fill-rule:evenodd;}</style></defs><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"/></g></g></svg>`;

// UTIL

type WsListenerCallback = (data: any) => void;

interface WSListener {
    messageType: string;
    callback: WsListenerCallback;
}
interface NewsResponse {
    url: string;
    headline: string;
}
class ServerInterface {
    /* Class for interacting with the HUD server */
    socket: WebSocket;
    wsListeners: WSListener[];
    constructor() {
        this.socket = new WebSocket("ws://" + window.location.host);
        this.wsListeners = [];
        this.socket.addEventListener("open", (event) => {
            this.socket.send("Hello Server!");
        });

        // websocket message handler
        // all websocket messages are assumed to be JSON strings of format {type: string, data: any}
        this.socket.addEventListener("message", (ev) => {
            // deserialize ws message
            let msg = JSON.parse(ev.data);
            let type = msg.type;
            let payload = JSON.parse(msg.data);

            // notify listeners
            for (let listener of this.wsListeners) {
                if (listener.messageType === type) {
                    listener.callback(payload);
                }
            }
        });
    }

    addWsListener(messageType: string, cb: WsListenerCallback) {
        this.wsListeners.push({
            messageType: messageType,
            callback: cb,
        });
    }

    async serverGet(endpoint: string, params?: any) {
        let resp = await fetch(
            "http://" +
                window.location.host +
                "/" +
                endpoint +
                new URLSearchParams(params).toString()
        );

        return await resp.json();
    }

    async amILoggedIn() {
        return (await this.serverGet("logged-in")).logged_in;
    }

    async nowPlaying() {
        let resp = await this.serverGet("now-playing");
        if (!Object.keys(resp).length) {
            return null;
        }
        return resp as SpotifyApi.CurrentlyPlayingResponse;
    }
    async nextHeadline() {
        let resp = await this.serverGet("news");

        if (!resp) {
            return null;
        }

        return resp as NewsResponse;
    }
}

// UI DEFINITIONS

class SongWidget extends Component {
    nowPlayingCache: SpotifyApi.CurrentlyPlayingResponse | null = null;
    songPositionCache = {
        progress: 0,
        duration: 0,
    };

    serverInterface: ServerInterface;

    constructor(si: ServerInterface) {
        super();

        this.serverInterface = si;

        // initially set "now playing" data
        si.nowPlaying().then((resp) => {
            this.nowPlayingCache = resp;
            this.rerender();
        });

        setInterval(() => {
            /* Increment song progress client-side */

            if (this.nowPlayingCache?.is_playing) {
                this.songPositionCache.progress += 500;
            }

            // prevent song bar from going past the end of the song;
            if (
                this.songPositionCache.progress >
                this.songPositionCache.duration
            ) {
                this.songPositionCache.progress = this.songPositionCache.duration;
            }
            htmless.rerender("time");
        }, 500);

        setInterval(async () => {
            /* Periodically refresh "now-playing" widget */
            this.nowPlayingCache = await this.serverInterface.nowPlaying();
            htmless.rerender(this);
        }, 3000);
    }

    progressBar(timePlayed: number, songLength: number) {
        return span(
            this.timeString(timePlayed),
            div(
                div()
                    .class("np-time-progress")
                    .style({ width: (timePlayed / songLength) * 100 + "%" })
            ).class("np-time-bar")
        ).class("np-time-span");
    }

    truncateSongName(name: string, maxLength = 32) {
        if (name.length + 3 > maxLength) {
            return name.substring(0, maxLength - 3) + "...";
        }
        return name;
    }

    makeSongNameElement(song: SpotifyApi.TrackObjectFull) {
        let children: any[] = [];

        // add artist links
        let first = true;
        for (let artist of song.artists.slice(0, 2)) {
            // only add commas between artists
            if (!first) {
                children.push(", ");
            }
            if (first) {
                first = false;
            }

            children.push(
                span(hyperlink(artist.name).href(artist.external_urls.spotify))
            );
        }

        if (song.artists.length > 2) {
            children.push(", et. al.");
        }

        children.push(" − ");
        let name = this.truncateSongName(song.name);
        children.push(
            hyperlink(name).href(song.external_urls.spotify).class("np-link")
        );

        return div(...children);
    }

    timeString(ms: number) {
        let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());
        let s = Math.floor(ms / 1000);
        let secs = s % 60;
        let mins = Math.floor(s / 60);
        return zeroPad(mins) + ":" + zeroPad(secs);
    }

    body() {
        if (this.nowPlayingCache === null) {
            return div(
                image("no_song.png").class("np-album"),
                div(
                    span("Now playing ♪").class("np-label"),
                    inlineHTML(
                        '<div class="np-song no-song">afsdlkjfasdkfsdadsfjafsljdadfjs</div>'
                    ),
                    htmless
                        .inlineComponent(() => this.progressBar(0, 10))
                        .id("time")
                )
            ).class("np-widget");
        }
        let song = this.nowPlayingCache.item!;
        this.songPositionCache = {
            progress: this.nowPlayingCache.progress_ms || 0,
            duration: song.duration_ms,
        };
        return div(
            image(song.album.images[0].url).class("np-album"),
            div(
                span("Now playing ♪").class("np-label"),
                this.makeSongNameElement(song).class("np-song"),
                htmless
                    .inlineComponent(() =>
                        this.progressBar(
                            this.songPositionCache.progress,
                            this.songPositionCache.duration
                        )
                    )
                    .id("time")
            )
        ).class("np-widget");
    }
}

class ClockWidget extends Component {
    constructor() {
        super();
        // update the clock every second
        setInterval(() => {
            this.rerender();
        }, 1000);
    }
    body() {
        let date = new Date();
        let h = date.getHours();
        let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());
        let m = zeroPad(date.getMinutes());
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        let dateString = `${days[date.getDay()]}, ${
            months[date.getMonth()]
        } ${date.getDate()}`;
        let hh = h % 12;
        if (hh == 0) {
            hh = 12;
        }
        return div(
            span(
                span(hh + ":" + m).class("cl-hm"),
                span(h >= 12 ? "PM" : "AM").class("cl-ampm")
            ).class("cl-time"),
            span(dateString).class("cl-date")
        ).class("clock");
    }
}

class NewsWidget extends Component {
    refreshTime = 20000; // ms
    currentHeadline: NewsResponse | null = null;

    serverInterface: ServerInterface;

    constructor(si: ServerInterface) {
        super();

        this.serverInterface = si;

        // initial fetch
        this.serverInterface.nextHeadline().then((resp) => {
            this.currentHeadline = resp;
            htmless.rerender("nw-headline");
        });

        // periodic news fetches
        setInterval(async () => {
            this.currentHeadline = await this.serverInterface.nextHeadline();
            const political = ["politics", "legal-issues"];
            const politicalKw = [
                "trump",
                "aoc",
                "mcconnell",
                "biden",
                "obama",
                "ocasio",
                "giuliani",
                "sanders",
                "senate",
                "democrat",
                "republican",
                "gop",
            ];

            let cb = document.getElementById("politics-cb") as HTMLInputElement;
            let skipPolitical = cb.checked;

            while (skipPolitical) {
                if (this.currentHeadline === null) {
                    break;
                }
                let category = this.getCategoryFromUrl(
                    this.currentHeadline.url
                );

                let check = false;
                for (let kw of politicalKw) {
                    if (
                        this.currentHeadline.headline.toLowerCase().includes(kw)
                    ) {
                        check = true;
                    }
                }

                if (!check && !political.includes(category)) {
                    break;
                }

                // console.log("skipping",this.currentHeadline);

                this.currentHeadline = await this.serverInterface.nextHeadline();
            }

            htmless.rerender("nw-headline");
        }, this.refreshTime);
    }

    getCategoryFromUrl(url: string) {
        let path = new URL(url).pathname.split("/").slice(1);
        let category;

        if (path[0] == "local") {
            category = path[1];
        } else {
            category = path[0];
        }

        return category;
    }

    renderHeadline() {
        let newsHeadline;

        if (!this.currentHeadline) {
            newsHeadline = span("Loading...").class("nw-headline");
        } else {
            newsHeadline = hyperlink(this.currentHeadline.headline)
                .href(this.currentHeadline.url)
                .class("nw-headline");
        }
        return newsHeadline;
    }

    body() {
        return div(
            span(
                headers.h1("Current News").class("nw-header"),
                span("Hide politics"),
                input.checkbox().id("politics-cb")
            ).class("nw-top"),
            htmless
                .inlineComponent(() => this.renderHeadline())
                .id("nw-headline")
        ).class("news-widget");
    }
}

// THEMES

interface ThemeInit {
    stylesheet?: string;
}

abstract class Theme {
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

class DefaultTheme extends Theme {
    constructor() {
        super({ stylesheet: "theme_dark.css" });
    }
}

class Theme_Pink extends Theme {
    constructor() {
        super({ stylesheet: "theme_pink.css" });
    }
}

namespace BWTheme {
    /*
        A theme designed after the Life/Death Wallpaper Engine Theme
    */

    function randomNumber(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    class Vector {
        x: number;
        y: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
        expand(): [number, number] {
            return [this.x, this.y];
        }
        static get zero() {
            return new Vector(0, 0);
        }
    }

    class FlowerPetal {
        position: Vector;
        z: number;
        velocity: Vector;
        rollVel: number;
        pitchVel: number;
        roll: number;
        pitch: number;

        constructor() {
            const twopi = Math.PI * 2;
            this.position = Vector.zero;
            this.velocity = Vector.zero;
            this.roll = Math.random() * twopi;
            this.pitch = Math.random() * twopi;
            this.rollVel = randomNumber(-10, 10);
            this.pitchVel = randomNumber(-10, 10);
            this.z = randomNumber(0.8, 1.5);
        }

        place(canvasWidth: number) {
            this.position.x = Math.random() * canvasWidth;
            this.position.y = -10;
        }
    }

    export class Theme_BW extends Theme {
        petals: FlowerPetal[];

        // Base framerate setting
        framerate = 36;
        get interDelayMs() {
            /* Interval setting for setInterval() */
            return 1000 / this.framerate;
        }
        get deltaTime() {
            /* Time elapsed between frames */
            return 1 / this.framerate;
        }

        // spawn rates
        petalSpawnRate = 10;

        animInterval: number | null = null;

        treeImage: HTMLImageElement;

        initCanvas(front: boolean) {
            let canvas = document.createElement("canvas");
            canvas.className = "bw-canv";
            if (front) {
                canvas.classList.add("front");
            }
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            window.addEventListener('resize', ()=>{
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            })

            return canvas;
        }

        deinitCanvas(canvas: HTMLCanvasElement) {
            canvas.parentElement?.removeChild(canvas);
        }

        frontCanvas: HTMLCanvasElement;
        backCanvas: HTMLCanvasElement;

        currentLayer: string;

        get canvas() {
            if (this.currentLayer === "front") {
                return this.frontCanvas;
            }
            return this.backCanvas;
        }

        get ctx() {
            return this.canvas.getContext("2d")!;
        }

        swapLayers() {
            this.currentLayer = this.currentLayer === "front" ? "back" : "front";
        }

        constructor() {
            super({ stylesheet: "theme_bw.css" });

            this.currentLayer = "front";

            this.frontCanvas = this.initCanvas(true);
            this.backCanvas = this.initCanvas(false);

            if (this.ctx === null) {
                console.error("Canvas not supported");
            }

            this.petals = [];

            this.treeImage = new Image();
            this.treeImage.src = "bw_blossom.png";

        }

        onLoad() {
            document.body.appendChild(this.frontCanvas);
            document.body.appendChild(this.backCanvas);
            this.frame();

            this.animInterval = window.setInterval(() => {
                this.frame();
            }, this.interDelayMs);
        }

        addPetal() {
            let p = new FlowerPetal();
            p.place(this.canvas.width);
            p.velocity.x -= 100;

            this.petals.push(p);
            return p;

        }

        frame() {
            const twopi = Math.PI * 2;
            const dragcoeff = 20;
            const accel = 100;
            const termvel = 200;

            this.swapLayers();

            // draw background
            this.ctx.fillStyle = "#e2e6ec";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#1e2029";
            this.drawPolygon([
                new Vector(0, this.canvas.height),
                new Vector(this.canvas.width, this.canvas.height),
                new Vector(this.canvas.width, 0),
            ]);

            let p = this.deltaTime * this.petalSpawnRate;
            while (Math.random() < p) {
                this.addPetal();
                p-=1;
            }

            // draw tree
            this.ctx.globalAlpha = 0.7;
            this.ctx.drawImage(
                this.treeImage,
                this.canvas.width - this.treeImage.width,
                this.canvas.height - this.treeImage.height
            );
            this.ctx.globalAlpha = 1;

            this.swapLayers();

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // draw petals
            for (let petal of this.petals) {
                this.ctx.fillStyle = "white";
                this.ctx.beginPath();
                this.ctx.translate(...petal.position.expand());
                this.ctx.rotate(petal.roll);
                this.ctx.scale(1, 0.7 * Math.sin(petal.pitch));
                this.ctx.scale(1/petal.z, 1/petal.z)
                this.ctx.arc(0, 0, 10, 0, twopi);
                this.ctx.resetTransform();
                this.ctx.fill();

                /* 
                    Petal Physics

                    literally some math i came up with off the top of my head.
                    not based at all in reality
                */

                // apply gravity
                petal.velocity.y += accel * this.deltaTime;

                // apply drag
                let dragAmt = dragcoeff * Math.sin(petal.pitch) * this.deltaTime;
                petal.velocity.y -= dragAmt;
                petal.velocity.x -= dragcoeff * Math.sin(petal.roll) * 0.25 * Math.cos(petal.pitch);

                // terminal velocity
                petal.velocity.y = Math.min(petal.velocity.y, termvel);

                // move
                petal.position.x += petal.velocity.x * this.deltaTime / petal.z; // lessen petal x velocity to give parallax effect
                petal.position.y += petal.velocity.y * this.deltaTime;
                petal.roll += petal.rollVel * this.deltaTime;
                petal.pitch += petal.pitchVel * this.deltaTime;
            }

            // remove offscreen petals
            this.petals = this.petals.filter(
                (p) => p.position.y <= this.canvas.height
            );
        }

        drawPolygon(points: Vector[]) {
            this.ctx.beginPath();
            this.ctx.moveTo(...points[0].expand());
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(...points[i].expand());
            }
            this.ctx.closePath();
            this.ctx.fill();
        }

        onUnload() {
            // remove canvas
            this.canvas.parentElement?.removeChild(this.backCanvas);
            this.canvas.parentElement?.removeChild(this.frontCanvas);
            window.clearInterval(this.animInterval!);
        }
    }
}

class SiteThemeManager {
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

// MAIN

async function main() {
    const si = new ServerInterface();
    const site = new SiteThemeManager(new BWTheme.Theme_BW());

    // DEBUG: link si and site instances to window
    (window as any).si = si;
    (window as any).site = site;

    if (!(await si.amILoggedIn())) {
        document.body.appendChild(
            div(
                image("Spotify_Icon_RGB_Green.png").width(64).height(64),
                hyperlink("Login with Spotify").href(
                    `/login?origin=${encodeURIComponent(window.location.href)}`
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
            let wakeLock = await (navigator as any).wakeLock.request("screen");
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }

    let songWidget = new SongWidget(si);
    let clockWidget = new ClockWidget();
    let newsWidget = new NewsWidget(si);
    document.body.appendChild(
        div(
            div(span(clockWidget, songWidget).class("row")).class("v-center"),
            div(
                hyperlink(inlineHTML(GIT_LOGO)).href(
                    "https://github.com/iahuang/myhud"
                ),
                newsWidget
            ).class("overlay")
        ).render()
    );
}

main();
