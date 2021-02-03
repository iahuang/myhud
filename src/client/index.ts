/* 
    This webapp uses a homemade HTML library called htmless, which you can find here: https://github.com/iahuang/htmless
*/

/// <reference types="../../node_modules/@types/spotify-api" />

type WsListenerCallback = (data: any) => void;

interface WSListener {
    messageType: string;
    callback: WsListenerCallback;
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
}

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
            this.songPositionCache.progress += 500;

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
            if (!first) {
                children.push(", ");
            }
            if (first) {
                // only add commas between artists
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
        setInterval(()=>{this.rerender()}, 1000);
    }
    body() {
        let date = new Date();
        let h = date.getHours();
        let m = date.getMinutes();
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
        return div(
            span(
                span((h % 12) + ":" + m).class("cl-hm"),
                span(h > 12 ? "PM" : "AM").class("cl-ampm")
            ).class("cl-time"),
            span(dateString).class("cl-date")
        ).class("clock");
    }
}

const si = new ServerInterface();

async function main() {
    if (!(await si.amILoggedIn())) {
        document.body.appendChild(
            div(
                image("Spotify_Icon_RGB_Green.png").width(64).height(64),
                hyperlink("Login with Spotify").href("/login")
            )
                .class("spotify-login")
                .render()
        );
        return;
    }

    let songWidget = new SongWidget(si);
    let clockWidget = new ClockWidget();
    document.body.appendChild(
        div(
            div(span(clockWidget, songWidget).class("row")).class("v-center"),
            div(
                hyperlink(image("github_icon.png").class("octocat")).href("https://github.com/iahuang/myhud")
            ).class("overlay")
        ).render()
    );
}

main();
