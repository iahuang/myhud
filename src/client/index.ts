class ServerInterface {
    /* Class for interacting with the HUD server */
    socket: WebSocket;
    constructor() {
        this.socket = new WebSocket("ws://"+window.location.host);
        this.socket.addEventListener('open', (event)=> {
            this.socket.send('Hello Server!');
        });
    }
}

const si = new ServerInterface();
