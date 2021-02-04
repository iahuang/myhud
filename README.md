# myhud

A webapp for spicing up your second monitor or device.
Basically a really cool looking digital clock.

![Screenshot](https://github.com/iahuang/myhud/raw/main/readme_assets/screenshot.png)
*Animated Blossom Theme*

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

![Screenshot](https://github.com/iahuang/myhud/raw/main/readme_assets/spotify_reg_guide.png)

### All Set
```
npm run start
```
To run the server; navigate to `localhost:3000` (or a different port if specified) in a browser to see the webapp.

## Compatibility

This app has been tested on Chromium based browsers, (Google Chrome, Opera, Edge, etc.), and Firefox. For best results, use the latest version of your web browser.