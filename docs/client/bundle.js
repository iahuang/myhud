var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/* A version of ServerInterface designed to run the webapp as static-only (i.e.) no hosting server */
define("headless_server_interface", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function asyncConstant(value) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                resolve(value);
            });
        });
    }
    class HeadlessServerInterface {
        amILoggedIn() {
            return __awaiter(this, void 0, void 0, function* () {
                return asyncConstant(true);
            });
        }
        nowPlaying() {
            return __awaiter(this, void 0, void 0, function* () {
                return asyncConstant(null);
            });
        }
        nextHeadline() {
            return __awaiter(this, void 0, void 0, function* () {
                return asyncConstant("...");
            });
        }
    }
    exports.default = HeadlessServerInterface;
});
/*
    A simple interface for communicating with the hosting server
*/
define("server_interface", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ServerInterface {
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
        addWsListener(messageType, cb) {
            this.wsListeners.push({
                messageType: messageType,
                callback: cb,
            });
        }
        serverGet(endpoint, params) {
            return __awaiter(this, void 0, void 0, function* () {
                let resp = yield fetch("http://" +
                    window.location.host +
                    "/" +
                    endpoint +
                    new URLSearchParams(params).toString());
                return yield resp.json();
            });
        }
        amILoggedIn() {
            return __awaiter(this, void 0, void 0, function* () {
                return (yield this.serverGet("logged-in")).logged_in;
            });
        }
        nowPlaying() {
            return __awaiter(this, void 0, void 0, function* () {
                let resp = yield this.serverGet("now-playing");
                if (!Object.keys(resp).length) {
                    return null;
                }
                return resp;
            });
        }
        nextHeadline() {
            return __awaiter(this, void 0, void 0, function* () {
                let resp = yield this.serverGet("news");
                if (!resp) {
                    return null;
                }
                return resp;
            });
        }
    }
    exports.default = ServerInterface;
});
define("ui/clock", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            let zeroPad = (n) => (n < 10 ? "0" + n : n.toString());
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
            let dateString = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
            let hh = h % 12;
            if (hh == 0) {
                hh = 12;
            }
            return div(span(span(hh + ":" + m).class("cl-hm"), span(h >= 12 ? "PM" : "AM").class("cl-ampm")).class("cl-time"), span(dateString).class("cl-date")).class("clock");
        }
    }
    exports.default = ClockWidget;
});
define("ui/news", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NewsWidget extends Component {
        constructor(si) {
            super();
            this.refreshTime = 20000; // ms
            this.currentHeadline = null;
            this.serverInterface = si;
            // initial fetch
            this.serverInterface.nextHeadline().then((resp) => {
                this.currentHeadline = resp;
                htmless.rerender("nw-headline");
            });
            // periodic news fetches
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                this.currentHeadline = yield this.serverInterface.nextHeadline();
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
                let cb = document.getElementById("politics-cb");
                let skipPolitical = cb.checked;
                while (skipPolitical) {
                    if (this.currentHeadline === null) {
                        break;
                    }
                    let category = this.getCategoryFromUrl(this.currentHeadline.url);
                    let check = false;
                    for (let kw of politicalKw) {
                        if (this.currentHeadline.headline.toLowerCase().includes(kw)) {
                            check = true;
                        }
                    }
                    if (!check && !political.includes(category)) {
                        break;
                    }
                    // console.log("skipping",this.currentHeadline);
                    this.currentHeadline = yield this.serverInterface.nextHeadline();
                }
                htmless.rerender("nw-headline");
            }), this.refreshTime);
        }
        getCategoryFromUrl(url) {
            let path = new URL(url).pathname.split("/").slice(1);
            let category;
            if (path[0] == "local") {
                category = path[1];
            }
            else {
                category = path[0];
            }
            return category;
        }
        renderHeadline() {
            let newsHeadline;
            if (!this.currentHeadline) {
                newsHeadline = span("Loading...").class("nw-headline");
            }
            else {
                newsHeadline = hyperlink(this.currentHeadline.headline)
                    .href(this.currentHeadline.url)
                    .class("nw-headline");
            }
            return newsHeadline;
        }
        body() {
            return div(span(headers.h1("Current News").class("nw-header"), span("Hide politics"), input.checkbox().id("politics-cb")).class("nw-top"), htmless
                .inlineComponent(() => this.renderHeadline())
                .id("nw-headline")).class("news-widget");
        }
    }
    exports.default = NewsWidget;
});
/* An extension for htmless that adds svg support */
define("ui/htmless_svg", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HLVectorElement extends HLElement {
        constructor(data) {
            super("svg");
            this.svgData = data;
        }
        render() {
            /* Slightly modified version of HLElement.render() */
            if (this.flexboxStyle) {
                this.appendStyleRule(this.flexboxStyle.getStylesheetObject());
            }
            let tmp = document.createElement('div');
            tmp.innerHTML = this.svgData;
            let htmlElement = tmp.firstChild;
            if (!htmlElement) {
                throw new Error("Invalid SVG data");
            }
            // Set element class(es)
            if (this.classes.length > 0) {
                htmlElement.classList.add(...this.classes);
            }
            // Set HTML attributes
            for (let [attr, e] of this.attrs.entries()) {
                htmlElement.setAttribute(attr, e);
            }
            // Set element style
            for (let [attr, value] of this.inlineStyle.entries()) {
                htmlElement.style[attr] = value;
            }
            // Add event listeners
            for (let listener of this.eventListeners) {
                htmlElement.addEventListener(listener.type, listener.callback, listener.capture);
            }
            return htmlElement;
        }
    }
    function svg(data) {
        return new HLVectorElement(data);
    }
    exports.default = svg;
});
define("ui/settings", ["require", "exports", "ui/htmless_svg"], function (require, exports, htmless_svg_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    htmless_svg_1 = __importDefault(htmless_svg_1);
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-settings" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
<circle cx="12" cy="12" r="3" />
</svg>`;
    class ThemeSelector extends Component {
        constructor(app, tooltip) {
            super();
            this.app = app;
            this.tooltip = tooltip;
        }
        get currentlySelected() {
            return this.app.themeManager.currentThemeName;
        }
        listItem(theme) {
            let el = div(theme.name).class("st-theme-item");
            if (theme.name === this.currentlySelected) {
                el.class("st-theme-selected");
            }
            el.onClick(() => {
                this.app.themeManager.setToTheme(theme.name);
                this.rerender();
            }).onEvent("mouseover", () => {
                this.tooltip.setText(theme.description);
                this.tooltip.show();
            }).onEvent("mouseleave", () => {
                this.tooltip.hide();
            });
            return el;
        }
        body() {
            return div(...this.app.themeManager.themes.map((t) => this.listItem(t)));
        }
    }
    class Tooltip {
        constructor() {
            this._element = this._createElement();
            this._element.style.position = "absolute";
            this._element.style.pointerEvents = "none";
            document.body.appendChild(this._element);
            window.addEventListener("mousemove", (ev) => {
                let mouseEvent = ev;
                this._element.style.transform = `translate(${ev.pageX}px, ${ev.pageY}px)`;
            });
        }
        setText(text) {
            this._element.innerText = text;
        }
        hide() {
            this._element.style.display = "none";
        }
        show() {
            this._element.style.display = "initial";
        }
        _createElement() {
            return div().id("st-tooltip").render();
        }
    }
    class SettingsWidget extends Component {
        constructor(app) {
            super();
            this.menuOpen = false;
            this.app = app;
            this.tooltip = new Tooltip();
            this.tooltip.hide();
            this.tooltip.setText("tooltip");
        }
        renderButton() {
            return div(htmless_svg_1.default(icon).class("settings-icon")).onClick(() => {
                this.openMenu();
            });
        }
        menuHeader(text) {
            return div(span(text).class("st-header"), hr);
        }
        themeSelection() { }
        renderMenu() {
            return div(this.menuHeader("Theme"), new ThemeSelector(this.app, this.tooltip))
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
    exports.default = SettingsWidget;
});
define("ui/spotify_widget", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SongWidget extends Component {
        constructor(si) {
            super();
            this.nowPlayingCache = null;
            this.songPositionCache = {
                progress: 0,
                duration: 0,
            };
            this.serverInterface = si;
            // initially set "now playing" data
            si.nowPlaying().then((resp) => {
                this.nowPlayingCache = resp;
                this.rerender();
            });
            setInterval(() => {
                /* Increment song progress client-side */
                var _a;
                if ((_a = this.nowPlayingCache) === null || _a === void 0 ? void 0 : _a.is_playing) {
                    this.songPositionCache.progress += 500;
                }
                // prevent song bar from going past the end of the song;
                if (this.songPositionCache.progress >
                    this.songPositionCache.duration) {
                    this.songPositionCache.progress = this.songPositionCache.duration;
                }
                htmless.rerender("time");
            }, 500);
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                /* Periodically refresh "now-playing" widget */
                this.nowPlayingCache = yield this.serverInterface.nowPlaying();
                this.rerender();
                document.title = this.makePageTitle((_a = this.nowPlayingCache) === null || _a === void 0 ? void 0 : _a.item);
            }), 3000);
        }
        progressBar(timePlayed, songLength) {
            return span(this.timeString(timePlayed), div(div()
                .class("np-time-progress")
                .style({ width: (timePlayed / songLength) * 100 + "%" })).class("np-time-bar")).class("np-time-span");
        }
        truncateSongName(name, maxLength = 32) {
            if (name.length + 3 > maxLength) {
                return name.substring(0, maxLength - 3) + "...";
            }
            return name;
        }
        makePageTitle(song) {
            if (!song) {
                return "MyHUD";
            }
            return song.artists[0].name + " - " + song.name + " (MyHUD)";
        }
        makeSongNameElement(song) {
            let children = [];
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
                children.push(span(hyperlink(artist.name).href(artist.external_urls.spotify)));
            }
            if (song.artists.length > 2) {
                children.push(", et. al.");
            }
            children.push(" − ");
            let name = this.truncateSongName(song.name);
            children.push(hyperlink(name).href(song.external_urls.spotify).class("np-link"));
            return div(...children);
        }
        timeString(ms) {
            let zeroPad = (n) => (n < 10 ? "0" + n : n.toString());
            let s = Math.floor(ms / 1000);
            let secs = s % 60;
            let mins = Math.floor(s / 60);
            return zeroPad(mins) + ":" + zeroPad(secs);
        }
        body() {
            if (this.nowPlayingCache === null) {
                return div(image("no_song.png").class("np-album"), div(span("Now playing ♪").class("np-label"), inlineHTML('<div class="np-song no-song">afsdlkjfasdkfsdadsfjafsljdadfjs</div>'), htmless
                    .inlineComponent(() => this.progressBar(0, 10))
                    .id("time"))).class("np-widget");
            }
            let song = this.nowPlayingCache.item;
            this.songPositionCache = {
                progress: this.nowPlayingCache.progress_ms || 0,
                duration: song.duration_ms,
            };
            return div(image(song.album.images[0].url).class("np-album"), div(span("Now playing ♪").class("np-label"), this.makeSongNameElement(song).class("np-song"), htmless
                .inlineComponent(() => this.progressBar(this.songPositionCache.progress, this.songPositionCache.duration))
                .id("time"))).class("np-widget");
        }
    }
    exports.default = SongWidget;
});
define("ui/base_theme", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Theme {
        constructor(params) {
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
    exports.Theme = Theme;
});
/*
    A theme designed after the Life/Death Wallpaper Engine Theme
*/
define("ui/theme/blossom", ["require", "exports", "ui/base_theme"], function (require, exports, base_theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function randomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        expand() {
            return [this.x, this.y];
        }
        static get zero() {
            return new Vector(0, 0);
        }
    }
    class FlowerPetal {
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
        place(canvasWidth) {
            this.position.x = Math.random() * canvasWidth;
            this.position.y = -10;
        }
    }
    class Blossom extends base_theme_1.Theme {
        constructor() {
            super({ stylesheet: "css/theme_bw.css" });
            // Base framerate setting
            this.framerate = 36;
            // spawn rates
            this.petalSpawnRate = 10;
            this.animInterval = null;
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
        get interDelayMs() {
            /* Interval setting for setInterval() */
            return 1000 / this.framerate;
        }
        get deltaTime() {
            /* Time elapsed between frames */
            return 1 / this.framerate;
        }
        initCanvas(front) {
            let canvas = document.createElement("canvas");
            canvas.className = "bw-canv";
            if (front) {
                canvas.classList.add("front");
            }
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.addEventListener("resize", () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
            return canvas;
        }
        deinitCanvas(canvas) {
            var _a;
            (_a = canvas.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(canvas);
        }
        get canvas() {
            if (this.currentLayer === "front") {
                return this.frontCanvas;
            }
            return this.backCanvas;
        }
        get ctx() {
            return this.canvas.getContext("2d");
        }
        swapLayers() {
            this.currentLayer = this.currentLayer === "front" ? "back" : "front";
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
                p -= 1;
            }
            // draw tree
            this.ctx.globalAlpha = 0.7;
            this.ctx.drawImage(this.treeImage, this.canvas.width - this.treeImage.width, this.canvas.height - this.treeImage.height);
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
                this.ctx.scale(1 / petal.z, 1 / petal.z);
                this.ctx.arc(0, 0, 6, 0, twopi);
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
                petal.velocity.x -=
                    dragcoeff * Math.sin(petal.roll) * 0.25 * Math.cos(petal.pitch);
                // terminal velocity
                petal.velocity.y = Math.min(petal.velocity.y, termvel);
                // move
                petal.position.x += (petal.velocity.x * this.deltaTime) / petal.z; // lessen petal x velocity to give parallax effect
                petal.position.y += petal.velocity.y * this.deltaTime;
                petal.roll += petal.rollVel * this.deltaTime;
                petal.pitch += petal.pitchVel * this.deltaTime;
            }
            // remove offscreen petals
            this.petals = this.petals.filter((p) => p.position.y <= this.canvas.height);
        }
        drawPolygon(points) {
            this.ctx.beginPath();
            this.ctx.moveTo(...points[0].expand());
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(...points[i].expand());
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
        onUnload() {
            var _a, _b;
            // remove canvas
            (_a = this.canvas.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this.backCanvas);
            (_b = this.canvas.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(this.frontCanvas);
            window.clearInterval(this.animInterval);
        }
    }
    exports.default = Blossom;
});
define("ui/theme/color", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    function HSVtoRGB(h, s, v) {
        h = h / 360;
        s = s / 100;
        v = v / 100;
        var r, g, b, i, f, p, q, t;
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
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
        };
    }
    function hexToRgb(hex) {
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
    function rgb2hsv(r, g, b) {
        let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
        rabs = r / 255;
        gabs = g / 255;
        babs = b / 255;
        (v = Math.max(rabs, gabs, babs)), (diff = v - Math.min(rabs, gabs, babs));
        diffc = (c) => (v - c) / 6 / diff + 1 / 2;
        percentRoundFn = (num) => Math.round(num * 100) / 100;
        if (diff == 0) {
            h = s = 0;
        }
        else {
            s = diff / v;
            rr = diffc(rabs);
            gg = diffc(gabs);
            bb = diffc(babs);
            if (rabs === v) {
                h = bb - gg;
            }
            else if (gabs === v) {
                h = 1 / 3 + rr - bb;
            }
            else if (babs === v) {
                h = 2 / 3 + gg - rr;
            }
            if (h < 0) {
                h += 1;
            }
            else if (h > 1) {
                h -= 1;
            }
        }
        return {
            h: Math.round(h * 360),
            s: percentRoundFn(s * 100),
            v: percentRoundFn(v * 100),
        };
    }
    class Color {
        constructor(hex) {
            let rgb = hexToRgb(hex);
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
        static fromHSV(hsv) {
            let c = new Color("#FFFFFF");
            c.hsv = hsv;
            return c;
        }
        string() {
            let rgb = HSVtoRGB(this.hsv.h, this.hsv.s, this.hsv.v);
            return rgbToHex(rgb.r, rgb.g, rgb.b);
        }
    }
    exports.Color = Color;
});
/*
    Dynamic day/night cycle theme for myhud.
    Imported from a previous project of mine called "clockbook"
*/
define("ui/theme/daynight", ["require", "exports", "ui/base_theme", "ui/theme/color"], function (require, exports, base_theme_2, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function timeMark(hour, min) {
        // 24 hour time converted to a number between 0 and 1, 1 being 11:59 pm
        return hour / 24 + min / 24 / 60;
    }
    class ColorScheme {
        constructor(at, bottom, top, textColor) {
            this.time = at;
            this.bottom = bottom;
            this.top = top;
            this.textColor = textColor;
        }
    }
    const colorSchemes = [];
    colorSchemes.push(new ColorScheme(timeMark(0, 0), new color_1.Color("#131420"), new color_1.Color("#0F131B"), new color_1.Color("#688C85"))); // midnight
    colorSchemes.push(new ColorScheme(timeMark(3, 0), new color_1.Color("#131420"), new color_1.Color("#0F131B"), new color_1.Color("#688C85"))); // 3am
    colorSchemes.push(new ColorScheme(timeMark(8, 0), new color_1.Color("#D89EBC"), new color_1.Color("#DEAE87"), new color_1.Color("#FFE8E8"))); // morning
    colorSchemes.push(new ColorScheme(timeMark(12, 0), new color_1.Color("#D8BD9E"), new color_1.Color("#87B0DE"), new color_1.Color("#FFFBEB"))); // noon
    colorSchemes.push(new ColorScheme(timeMark(15, 0), new color_1.Color("#AC7989"), new color_1.Color("#FF9292"), new color_1.Color("#FFDFD4"))); // afternoon
    colorSchemes.push(new ColorScheme(timeMark(19, 0), new color_1.Color("#595D87"), new color_1.Color("#EFBCE8"), new color_1.Color("#DAEFFA"))); // evening
    colorSchemes.push(new ColorScheme(timeMark(22, 0), new color_1.Color("#0A0B17"), new color_1.Color("#35253E"), new color_1.Color("#5C566F"))); // night
    function findNearestBefore(time) {
        for (let i = 0; i < colorSchemes.length; i++) {
            let bg = colorSchemes[i];
            if (time < bg.time) {
                return colorSchemes[i - 1];
            }
        }
        return colorSchemes[colorSchemes.length - 1];
    }
    function findNearestAfter(time) {
        for (let i = 0; i < colorSchemes.length; i++) {
            let bg = colorSchemes[i];
            if (time < bg.time) {
                return colorSchemes[i];
            }
        }
        return colorSchemes[0];
    }
    function _mod(a, b) {
        // modulo operator but with slightly modified behaviour for negative numbers
        if (a >= 0) {
            return a % b;
        }
        return b - (-a % b);
    }
    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
    function hueInterpol(start, end, t) {
        // linear interpolate forward between start and end, assuming ability to wrap from 360 back to 0
        if (start > end) {
            return hueInterpol(end, start, 1 - t);
        }
        if (end - start < 360 - end + start) {
            return start + (end - start) * t;
        }
        else {
            return start - (360 - end + start) * t;
        }
    }
    function reverseTimeInterp(start, end, time) {
        if (start > end) {
            return _mod(time - start, 1) / (1 - start + end);
        }
        else {
            return (time - start) / (end - start);
        }
    }
    function hsvInterp(start, end, t) {
        // console.log("se", start.hue(), end.hue(), t);
        // console.log("hi", hueInterpol(start.hue(), end.hue(), t));
        return color_1.Color.fromHSV({
            h: _mod(hueInterpol(start.hue(), end.hue(), t), 360),
            s: lerp(start.saturationv(), end.saturationv(), t),
            v: lerp(start.value(), end.value(), t),
        });
    }
    function getColors(time) {
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
    class DayNight extends base_theme_2.Theme {
        constructor() {
            super({ stylesheet: "css/theme_daynight.css" });
            this.animInterval = null;
            this._n = 0;
        }
        onLoad() {
            // register animation loop
            this.animInterval = window.setInterval(() => {
                this.updateColors();
            }, 1000);
            this.updateColors();
        }
        updateColors() {
            let now = new Date();
            let timeValue = timeMark(now.getHours(), now.getMinutes());
            let colorScheme = getColors(timeValue);
            document.body.style.background = colorScheme.bgGradient;
            let clock = document.getElementsByClassName("row")[0];
            if (clock) {
                clock.style.color = colorScheme.textColor;
            }
        }
        onUnload() {
            // stop animation loop
            window.clearInterval(this.animInterval);
            document.body.style.background = "";
            let clock = document.getElementsByClassName("row")[0];
            if (clock) {
                clock.style.color = "";
            }
        }
    }
    exports.default = DayNight;
});
define("ui/theme/default", ["require", "exports", "ui/base_theme"], function (require, exports, base_theme_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DefaultTheme extends base_theme_3.Theme {
        constructor() {
            super({ stylesheet: "css/theme_dark.css" });
        }
    }
    exports.default = DefaultTheme;
});
define("ui/theme/pink", ["require", "exports", "ui/base_theme"], function (require, exports, base_theme_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Pink extends base_theme_4.Theme {
        constructor() {
            super({ stylesheet: "css/theme_pink.css" });
        }
    }
    exports.default = Pink;
});
define("ui/theme_manager", ["require", "exports", "ui/theme/blossom", "ui/theme/daynight", "ui/theme/default", "ui/theme/pink"], function (require, exports, blossom_1, daynight_1, default_1, pink_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    blossom_1 = __importDefault(blossom_1);
    daynight_1 = __importDefault(daynight_1);
    default_1 = __importDefault(default_1);
    pink_1 = __importDefault(pink_1);
    class SiteThemeManager {
        constructor(initialTheme) {
            this.themes = [
                {
                    name: "Default",
                    themeObjectType: default_1.default,
                    description: "The default theme",
                },
                {
                    name: "Quartz",
                    themeObjectType: pink_1.default,
                    description: "A light pink theme",
                },
                {
                    name: "Blossom",
                    themeObjectType: blossom_1.default,
                    description: "An animated theme inspired by the Wallpaper Engine wallpaper \"Life and Death\"",
                },
                {
                    name: "Day/Night Cycle",
                    themeObjectType: daynight_1.default,
                    description: "A theme that slowly changes colors over the course of the day",
                },
            ];
            this._themeInstance = this.instantiateTheme(initialTheme);
            this._applyTheme(this._themeInstance);
            this.currentThemeName = initialTheme;
        }
        instantiateTheme(withName) {
            console.log(`Loading theme "${withName}"...`);
            return new (this.getThemeInfo(withName).themeObjectType)();
        }
        getThemeInfo(name) {
            for (let t of this.themes) {
                if (t.name === name) {
                    return t;
                }
            }
            throw new Error(`Could not find theme with name "${name}"`);
        }
        setToTheme(name) {
            let t = this.instantiateTheme(this.getThemeInfo(name).name);
            this._loadTheme(t);
            this.currentThemeName = name;
        }
        _applyTheme(theme) {
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
        _loadTheme(theme) {
            var _a;
            this._themeInstance.onUnload(); // unload previous theme
            let oldCSS = document.getElementById("theme-css");
            if (oldCSS) {
                (_a = oldCSS.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(oldCSS);
            }
            this._applyTheme(theme);
            this._themeInstance = theme;
        }
    }
    exports.default = SiteThemeManager;
});
/*
    This webapp uses a homemade HTML library called htmless, which you can find here: https://github.com/iahuang/htmless
*/
define("index", ["require", "exports", "headless_server_interface", "server_interface", "ui/clock", "ui/news", "ui/settings", "ui/spotify_widget", "ui/theme_manager"], function (require, exports, headless_server_interface_1, server_interface_1, clock_1, news_1, settings_1, spotify_widget_1, theme_manager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    headless_server_interface_1 = __importDefault(headless_server_interface_1);
    server_interface_1 = __importDefault(server_interface_1);
    clock_1 = __importDefault(clock_1);
    news_1 = __importDefault(news_1);
    settings_1 = __importDefault(settings_1);
    spotify_widget_1 = __importDefault(spotify_widget_1);
    theme_manager_1 = __importDefault(theme_manager_1);
    // ASSETS
    const GIT_LOGO = `<svg class="octocat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.58 31.77"><defs><style>.cls-1{fill-rule:evenodd;}</style></defs><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"/></g></g></svg>`;
    class Application {
        constructor() {
            if (window.MYHUD_STATIC) {
                this.serverInterface = new headless_server_interface_1.default();
            }
            else {
                this.serverInterface = new server_interface_1.default();
            }
            this.themeManager = new theme_manager_1.default("Default");
        }
        main() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!(yield this.serverInterface.amILoggedIn())) {
                    document.body.appendChild(div(image("Spotify_Icon_RGB_Green.png").width(64).height(64), hyperlink("Login with Spotify").href(`/login?origin=${encodeURIComponent(window.location.href)}`))
                        .class("spotify-login")
                        .render());
                    return;
                }
                // attempt to keep device awake using experimental wakeLock api
                // have yet to test whether this actually works
                if ("wakeLock" in navigator) {
                    try {
                        let wakeLock = yield navigator.wakeLock.request("screen");
                    }
                    catch (err) {
                        console.error(`${err.name}, ${err.message}`);
                    }
                }
                document.body.appendChild(div(div(span(new clock_1.default(), new spotify_widget_1.default(this.serverInterface)).class("row")).class("v-center"), div(hyperlink(inlineHTML(GIT_LOGO)).href("https://github.com/iahuang/myhud"), new settings_1.default(this), new news_1.default(this.serverInterface)).class("overlay")).render());
            });
        }
    }
    exports.default = Application;
    let app = new Application();
    window.app = app;
    app.main();
});
/* A mini-library that assists in the creation of MyHUD themes */
define("ui/theme/themelib", ["require", "exports", "ui/base_theme"], function (require, exports, base_theme_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        expand() {
            return [this.x, this.y];
        }
        get magnitude() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        get normalized() {
            return this.times(1 / this.magnitude);
        }
        plus(other) {
            return new Vector(this.x + other.x, this.y + other.y);
        }
        minus(other) {
            return new Vector(this.x - other.x, this.y - other.y);
        }
        times(other) {
            if (typeof other === 'number') {
                return new Vector(this.x * other, this.y * other);
            }
            return new Vector(this.x * other.x, this.y * other.y);
        }
        static get zero() {
            return new Vector(0, 0);
        }
    }
    exports.Vector = Vector;
    class HUDCanvas {
        constructor(foreground = false) {
            this._canvas = document.createElement('canvas');
            this._canvas.style.position = 'absolute';
            this._canvas.style.top = '0';
            this._canvas.style.left = '0';
            window.addEventListener("resize", () => {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
            });
            if (foreground) {
                this._canvas.style.pointerEvents = 'none';
            }
            else {
                this._canvas.style.zIndex = '-100';
            }
        }
        place() {
            document.body.appendChild(this._canvas);
        }
        remove() {
            var _a;
            (_a = this._canvas.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this._canvas);
        }
        get width() {
            return this._canvas.width;
        }
        get height() {
            return this._canvas.height;
        }
        clear() {
            /* Shorthand for ctx.clearRect(0, 0, w, h); */
            this.context2D.clearRect(0, 0, this.width, this.height);
        }
        get context2D() {
            return this._canvas.getContext('2d');
        }
        getCanvasElement() {
            /* Returns the underlying HTMLCanvasElement object */
            return this._canvas;
        }
    }
    exports.HUDCanvas = HUDCanvas;
    class LayeredGraphicalTheme extends base_theme_5.Theme {
        constructor(stylesheet, targetFPS = 36) {
            super({ stylesheet: stylesheet });
            this._animInterval = null;
            this.background = new HUDCanvas(true);
            this.foreground = new HUDCanvas();
            this._targetFPS = targetFPS;
        }
        onLoad() {
            this.foreground.place();
            this.background.place();
            this._animInterval = window.setInterval(() => {
                this._renderLoop();
            }, 1000 / this._targetFPS);
        }
        onUnload() {
            this.foreground.remove();
            this.background.remove();
            if (this.isRunning) {
                window.clearInterval(this._animInterval);
            }
        }
        get isRunning() {
            return this._animInterval !== null;
        }
        _renderLoop() {
            this.onUpdate();
        }
        onUpdate() {
            /* To be overridden by subclasses */
        }
    }
    exports.LayeredGraphicalTheme = LayeredGraphicalTheme;
});
