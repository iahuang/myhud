/* A mini-library that assists in the creation of MyHUD themes */

import { Theme } from "../theme";

export class HUDCanvas {
    /*
        A canvas object that automatically resizes to fit the window.
    */

    private _canvas: HTMLCanvasElement;

    constructor(foreground=false) {
        this._canvas = document.createElement('canvas');
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';

        window.addEventListener("resize", ()=>{
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
        });

        if (foreground) {
            this._canvas.style.pointerEvents = 'none';
        } else {
            this._canvas.style.zIndex = '-100';
        }
    }

    place() {
        document.body.appendChild(this._canvas);
    }

    remove() {
        this._canvas.parentElement?.removeChild(this._canvas);
    }

    get width() {
        return this._canvas.width;
    }

    get height() {
        return this._canvas.height;
    }

    clear() {
        /* Shorthand for ctx.clearRect(0, 0, w, h); */
        this.context2D.clearRect(0, 0, this.width, this.height);
    }

    get context2D() {
        return this._canvas.getContext('2d')!;
    }

    getCanvasElement() {
        /* Returns the underlying HTMLCanvasElement object */
        return this._canvas;
    }
}

export class LayeredGraphicalTheme extends Theme {
    background: HUDCanvas;
    foreground: HUDCanvas;

    private _targetFPS: number;
    private _animInterval: number | null = null;

    constructor(stylesheet?: string, targetFPS = 36) {
        super({stylesheet: stylesheet});

        this.background = new HUDCanvas(true);
        this.foreground = new HUDCanvas();
        this._targetFPS = targetFPS;
    }

    onLoad() {
        this.foreground.place();
        this.background.place();

        this._animInterval = window.setInterval(()=>{
            this._renderLoop();
        }, 1000/this._targetFPS);
    }

    onUnload() {
        this.foreground.remove();
        this.background.remove();

        if (this.isRunning) {
            window.clearInterval(this._animInterval!);
        }
    }

    get isRunning() {
        return this._animInterval !== null;
    }

    private _renderLoop() {
        this.onUpdate();
    }

    onUpdate() {
        /* To be overridden by subclasses */
    }
}