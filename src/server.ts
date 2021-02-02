import express from "express";
import expressWs from "express-ws";
import SpotifyWebApi from "spotify-web-api-node";
import fs from "fs";
import ServerSettings from "./setting_definitions";
import { networkInterfaces } from "os";

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

export default class HUDServer {
    /* Base class for the HUD Webserver */

    app: expressWs.Application;
    _expressWsInstance: expressWs.Instance;
    spotify: SpotifyWebApi;
    config: ServerSettings;

    constructor() {
        this._expressWsInstance = expressWs(express());
        this.app = this._expressWsInstance.app;
        this.spotify = new SpotifyWebApi();

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

    initRoutes() {
        /* Initialize server endpoints */

        // init static
        this.app.use(express.static("public"));
        // make client js scripts accessible
        this.app.use("/client", express.static("build/client"));

        // init websocket endpoint
        this.app.ws("/", (ws, req) => {
            ws.on("message", (msg) => {
                this.sendMessage(ws, "test", {a: 1});
            });
        });
    }

    start() {
        console.log("Network interfaces: (for hosting on LAN)");
        console.log(Network.networkInfo());
        console.log(`Listening on port ${this.config.port}...`);
        this.app.listen(this.config.port);
    }
}
