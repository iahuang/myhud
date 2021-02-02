import express from "express";
import expressWs from "express-ws";
import SpotifyWebApi from "spotify-web-api-node";
import fs from "fs";
import ServerSettings from "./setting_definitions";
import { networkInterfaces } from "os";

namespace Network {
    /* Utility functions */
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
    spotify: SpotifyWebApi;
    config: ServerSettings;

    constructor() {
        this.app = expressWs(express()).app;
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

    initRoutes() {
        // init static
        this.app.use(express.static("public"));
        // make client js scripts accessible
        this.app.use("/client", express.static("build/client"));

        // init websocket endpoint
        this.app.ws("/", function (ws, req) {
            ws.on("message", function (msg) {
                console.log(msg);
            });
            console.log("socket", req);
        });
    }

    start() {
        console.log("Network interfaces: (for hosting on LAN)");
        console.log(Network.networkInfo());
        console.log(`Listening on port ${this.config.port}...`);
        this.app.listen(this.config.port);
    }
}
