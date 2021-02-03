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
        return resp as SpotifyApi.CurrentlyPlayingResponse;
    }
}

const si = new ServerInterface();

function makeSongNameElement(song: SpotifyApi.TrackObjectFull) {
    let children: any[] = [];

    // add artist links
    let first = true;
    for (let artist of song.artists) {
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

    children.push(" − ");

    children.push(
        hyperlink(song.name).href(song.external_urls.spotify).class("np-link")
    );

    return div(...children);
}

let songProgress = {
    progress: 0,
    duration: 0,
};

function nowPlayingWidget(nowPlaying: SpotifyApi.CurrentlyPlayingResponse) {
    let song = nowPlaying.item!;
    songProgress = {
        progress: nowPlaying.progress_ms || 0,
        duration: song.duration_ms,
    };
    return div(
        image(song.album.images[0].url).class("np-album"),
        div(
            span("Now playing ♪").class("np-label"),
            makeSongNameElement(song).class("np-song"),
            htmless.inlineComponent(() =>
                progressBar(songProgress.progress, songProgress.duration)
            ).id("time")
        )
    ).class("np-widget");
}

setInterval(()=>{
    /* Increment song progress client-side */
    songProgress.progress+=500;

    // prevent song bar from going past the end of the song;
    if (songProgress.progress > songProgress.duration) {
        songProgress.progress = songProgress.duration;
    }
    htmless.rerender("time");
}, 500)

function timeString(ms: number) {
    let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());
    let s = Math.floor(ms / 1000);
    let secs = s % 60;
    let mins = Math.floor(s / 60);
    return zeroPad(mins) + ":" + zeroPad(secs);
}

function progressBar(timePlayed: number, songLength: number) {
    return span(
        timeString(timePlayed),
        div(
            div()
                .class("np-time-progress")
                .style({ width: (timePlayed / songLength) * 100 + "%" })
        ).class("np-time-bar")
    ).class("np-time-span");
}

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

    let nowPlaying = await si.nowPlaying();
    document.body.appendChild(nowPlayingWidget(nowPlaying).render());
}

main();
