import express from "express";
import expressWs from "express-ws";
import SpotifyWebApi from "spotify-web-api-node";
import fs from "fs";
import ServerSettings from "./setting_definitions";
import { networkInterfaces } from "os";
import { APNews, NewsArticle, WashingtonPost } from "./news";

namespace Network {
    export function networkInfo() {
        const nets = networkInterfaces();
        const results: { [k: string]: any } = {};

        for (const name of Object.keys(nets)) {
            for (const net of nets[name]!) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (net.family === "IPv4" && !net.internal) {
                    if (!results[name]) {
                        results[name] = [];
                    }
                    results[name].push(net.address);
                }
            }
        }

        return results;
    }
}

class NewsFeed {
    /* Class for delivering news for the News widget */

    newsSource: WashingtonPost;
    feedCache: NewsArticle[];
    private _cacheIndex: number;

    // as to not process multiple refresh requests at once
    private _busy = false;

    constructor() {
        this.newsSource = new WashingtonPost();
        this.feedCache = [];
        this._cacheIndex = -1;
    }

    isEmpty() {
        return this.feedCache.length === 0;
    }

    isLoading() {
        return this._busy;
    }

    nextHeadline() {
        if (this.isEmpty()) {
            return null;
        }
        
        return this.feedCache.pop();
    }

    async refresh() {
        if (this._busy) {
            return;
        }
        if (!this._busy) {
            this._busy = true;
        }
        this.feedCache = await this.newsSource.getHeadlines();
        this._cacheIndex = -1;
        this._busy = false;
        console.log("...done")
    }
}

// we use all of them LOL
const SPOTIFY_SCOPES = [
    "ugc-image-upload",
    "user-read-recently-played",
    "user-top-read",
    "user-read-playback-position",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "app-remote-control",
    "streaming",
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-follow-modify",
    "user-follow-read",
    "user-library-modify",
    "user-library-read",
    "user-read-email",
    "user-read-private",
];

export default class HUDServer {
    /* Base class for the HUD Webserver */

    app: expressWs.Application;
    _expressWsInstance: expressWs.Instance;
    spotify: SpotifyWebApi;
    config: ServerSettings;
    news: NewsFeed;

    constructor() {
        this._expressWsInstance = expressWs(express());
        this.app = this._expressWsInstance.app;

        // create a template config.json if one does not already exist
        if (!fs.existsSync("config.json")) {
            console.warn(
                "config.json file does not exist! creating a template file..."
            );

            // ServerSettings class doubles as a type definition and as a set of default config values
            let configTemplate = new ServerSettings();

            fs.writeFileSync("config.json", JSON.stringify(configTemplate));
            process.exit();
        }

        // assuming config.json is present and correctly filled out
        let configContents = fs.readFileSync("config.json", "utf-8");
        this.config = JSON.parse(configContents);

        // init spotify
        this.spotify = new SpotifyWebApi({
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            redirectUri: "http://localhost:3000/callback",
        });

        // init news
        this.news = new NewsFeed();
        this.news.refresh();

        this.initRoutes();
    }

    sendMessage(ws: any, type: string, data: any) {
        /* All WebSocket messages should be JSON serialized packets containing a type string and enclosed data */
        ws.send(
            JSON.stringify({
                type: type,
                data: JSON.stringify(data),
            })
        );
    }

    getAllClients() {
        /* Returns an array of all connected WebSocket clients */
        return Array.from(this._expressWsInstance.getWss().clients);
    }

    async amILoggedIn() {
        /* Check if the current user is logged in with Spotify */
        try {
            await this.spotify.getUserPlaylists();
            return true;
        } catch (err) {
            return false;
        }
    }

    initRoutes() {
        /* Initialize server endpoints */

        // init static
        this.app.use(express.static("public"));
        // make client js scripts accessible
        this.app.use("/client", express.static("build/client"));

        // init websocket endpoint
        this.app.ws("/", (ws, req) => {
            ws.on("message", (msg) => {
                this.sendMessage(ws, "test", { a: 1 });
            });
        });

        // init spotify routes
        this.app.get("/login", (req, res) => {
            const page = this.spotify.createAuthorizeURL(SPOTIFY_SCOPES, "");
            res.redirect(page + "&show_dialog=true");
        });

        this.app.get("/callback", async (req, res) => {
            const { code } = req.query;

            try {
                var data = await this.spotify.authorizationCodeGrant(
                    code as string
                );
                const { access_token, refresh_token } = data.body;
                this.spotify.setAccessToken(access_token);
                this.spotify.setRefreshToken(refresh_token);

                res.redirect("http://localhost:3000");
            } catch (err) {
                res.send("oops there was an error lmao idk");
                console.log(err.toString());
            }
        });

        this.app.get("/now-playing", async (req, res) => {
            try {
                let result = await this.spotify.getMyCurrentPlayingTrack();
                res.status(200).send(result.body);
            } catch (err) {
                res.status(400).send(err);
            }
        });

        this.app.get("/logged-in", async (req, res) => {
            res.json({ logged_in: await this.amILoggedIn() });
        });

        this.app.get("/news", async (req, res) => {
            if (this.news.isEmpty()) {
                await this.news.refresh();
            }
            res.json(this.news.nextHeadline());
        })
    }

    start() {
        console.log("Network interfaces: (for hosting on LAN)");
        console.log(Network.networkInfo());
        console.log(`Listening on port ${this.config.port}...`);
        this.app.listen(this.config.port);
    }
}
