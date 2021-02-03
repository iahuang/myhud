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
            callback: cb
        });
    }
}

const si = new ServerInterface();
