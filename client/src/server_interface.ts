/*
    A simple interface for communicating with the hosting server
*/

/// <reference types="../../node_modules/@types/spotify-api" />

type WsListenerCallback = (data: any) => void;

interface WSListener {
    messageType: string;
    callback: WsListenerCallback;
}

interface NewsResponse {
    url: string;
    headline: string;
}

export default class ServerInterface {
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

    private async serverGet(endpoint: string, params?: any) {
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
