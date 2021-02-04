# myhud

A webapp for spicing up your second monitor or device.
Basically a really cool looking digital clock.

### Features
- Spotify integration shows what song you're listening to
- Displays live headlines from the Washington Post so you can watch the world burn in real time!
- Customizable interface with a wide variety of themes

### Screenshots

![Screenshot](https://github.com/iahuang/myhud/raw/main/readme_assets/screenshot.png)
*Animated Blossom Theme*

![Screenshot](https://github.com/iahuang/myhud/raw/main/readme_assets/cycle_day.png)
*Dynamic Day/Night Theme (morning)*

![Screenshot](https://github.com/iahuang/myhud/raw/main/readme_assets/cycle_evening.png)
*Dynamic Day/Night Theme (very late at night)*

## Static Demo

This webapp requires a locally-hosted server for full functionality, but there's a static version here: **[Live Demo](https://iahuang.github.io/myhud)**

Notes:
- Internally, the static version of the webapp uses an object that pretends to be a connection to the server. Any features that would normally use the server will be non-functional and potentially buggy.
- To force the webapp to use a "headless" connection, set `window.MYHUD_STATIC=true` before loading the bundle.

## Getting Started

### Install dependencies
```
npm install
```

### Compile Server
```
tsc
```

### Compile Client
```
cd client
tsc
```
### Spotify
This webapp has Spotify integration! To use it you will need to sign up for a [Spotify API Key](https://developer.spotify.com/dashboard/login) (it's free)

### First-time Setup
```
npm run start
```
The server will create a configuration file for you to fill out. Open `config.json` and put in your Spotify API keys, and run `start` again.

### Application Redirect

Depending on where you're hosting from, (i.e. `localhost:3000`, `192.168.x.y`, etc.), you will need to register these addresses with Spotify in order for authentication to work. Navigate to your Spotify Developer dashboard, and under your app's settings, add the necessary redirect URIs. Here is an example (make sure these match the host address exactly, including protocol, trailing slashes, etc.)

Make sure you put `/callback` at the end, as this is where the server will look for the response from Spotify's authentication servers.

![Screenshot](https://github.com/iahuang/myhud/raw/main/readme_assets/spotify_reg_guide.png)
*Example from my Spotify Application*

### All Set
```
npm run start
```
To run the server; navigate to `localhost:3000` (or a different port if specified) in a browser to see the webapp.

## Compatibility

This app has been tested on Chromium based browsers, (Google Chrome, Opera, Edge, etc.), and Firefox. For best results, use the latest version of your web browser. Just for fun, I tested this app on IE11 (it didn't load)