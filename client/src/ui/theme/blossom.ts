/*
    A theme designed after the Life/Death Wallpaper Engine Theme
*/

import { Theme } from "../base_theme";

function randomNumber(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    expand(): [number, number] {
        return [this.x, this.y];
    }
    static get zero() {
        return new Vector(0, 0);
    }
}

class FlowerPetal {
    position: Vector;
    z: number;
    velocity: Vector;
    rollVel: number;
    pitchVel: number;
    roll: number;
    pitch: number;

    constructor() {
        const twopi = Math.PI * 2;
        this.position = Vector.zero;
        this.velocity = Vector.zero;
        this.roll = Math.random() * twopi;
        this.pitch = Math.random() * twopi;
        this.rollVel = randomNumber(-10, 10);
        this.pitchVel = randomNumber(-10, 10);
        this.z = randomNumber(0.8, 1.5);
    }

    place(canvasWidth: number) {
        this.position.x = Math.random() * canvasWidth;
        this.position.y = -10;
    }
}

export default class Blossom extends Theme {
    petals: FlowerPetal[];

    // Base framerate setting
    framerate = 36;
    get interDelayMs() {
        /* Interval setting for setInterval() */
        return 1000 / this.framerate;
    }
    get deltaTime() {
        /* Time elapsed between frames */
        return 1 / this.framerate;
    }

    // spawn rates
    petalSpawnRate = 10;

    animInterval: number | null = null;

    treeImage: HTMLImageElement;

    initCanvas(front: boolean) {
        let canvas = document.createElement("canvas");
        canvas.className = "bw-canv";
        if (front) {
            canvas.classList.add("front");
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        return canvas;
    }

    deinitCanvas(canvas: HTMLCanvasElement) {
        canvas.parentElement?.removeChild(canvas);
    }

    frontCanvas: HTMLCanvasElement;
    backCanvas: HTMLCanvasElement;

    currentLayer: string;

    get canvas() {
        if (this.currentLayer === "front") {
            return this.frontCanvas;
        }
        return this.backCanvas;
    }

    get ctx() {
        return this.canvas.getContext("2d")!;
    }

    swapLayers() {
        this.currentLayer = this.currentLayer === "front" ? "back" : "front";
    }

    constructor() {
        super({ stylesheet: "css/theme_bw.css" });

        this.currentLayer = "front";

        this.frontCanvas = this.initCanvas(true);
        this.backCanvas = this.initCanvas(false);

        if (this.ctx === null) {
            console.error("Canvas not supported");
        }

        this.petals = [];

        this.treeImage = new Image();
        this.treeImage.src = "bw_blossom.png";
    }

    onLoad() {
        document.body.appendChild(this.frontCanvas);
        document.body.appendChild(this.backCanvas);
        this.frame();

        this.animInterval = window.setInterval(() => {
            this.frame();
        }, this.interDelayMs);
    }

    addPetal() {
        let p = new FlowerPetal();
        p.place(this.canvas.width);
        p.velocity.x -= 100;

        this.petals.push(p);
        return p;
    }

    frame() {
        const twopi = Math.PI * 2;
        const dragcoeff = 20;
        const accel = 100;
        const termvel = 200;

        this.swapLayers();

        // draw background
        const offsetScale = 0.2;
        
        let b = this.canvas.height*offsetScale;
        
        this.ctx.fillStyle = "#e2e6ec";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#1e2029";
        this.drawPolygon([
            new Vector(0, this.canvas.height-b),
            new Vector(0, this.canvas.height),
            new Vector(this.canvas.width, this.canvas.height),
            new Vector(this.canvas.width+b, 0),
        ]);

        let p = this.deltaTime * this.petalSpawnRate;
        while (Math.random() < p) {
            this.addPetal();
            p -= 1;
        }

        // draw tree
        this.ctx.globalAlpha = 0.7;
        this.ctx.drawImage(
            this.treeImage,
            this.canvas.width - this.treeImage.width,
            this.canvas.height - this.treeImage.height
        );
        this.ctx.globalAlpha = 1;

        this.swapLayers();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw petals
        for (let petal of this.petals) {
            this.ctx.fillStyle = "white";
            this.ctx.beginPath();
            this.ctx.translate(...petal.position.expand());
            this.ctx.rotate(petal.roll);
            this.ctx.scale(1, 0.7 * Math.sin(petal.pitch));
            this.ctx.scale(1 / petal.z, 1 / petal.z);
            this.ctx.arc(0, 0, 6, 0, twopi);
            this.ctx.resetTransform();
            this.ctx.fill();

            /* 
                    Petal Physics

                    literally some math i came up with off the top of my head.
                    not based at all in reality
                */

            // apply gravity
            petal.velocity.y += accel * this.deltaTime;

            // apply drag
            let dragAmt = dragcoeff * Math.sin(petal.pitch) * this.deltaTime;
            petal.velocity.y -= dragAmt;
            petal.velocity.x -=
                dragcoeff * Math.sin(petal.roll) * 0.25 * Math.cos(petal.pitch);

            // terminal velocity
            petal.velocity.y = Math.min(petal.velocity.y, termvel);

            // move
            petal.position.x += (petal.velocity.x * this.deltaTime) / petal.z; // lessen petal x velocity to give parallax effect
            petal.position.y += petal.velocity.y * this.deltaTime;
            petal.roll += petal.rollVel * this.deltaTime;
            petal.pitch += petal.pitchVel * this.deltaTime;
        }

        // remove offscreen petals
        this.petals = this.petals.filter(
            (p) => p.position.y <= this.canvas.height
        );
    }

    drawPolygon(points: Vector[]) {
        this.ctx.beginPath();
        this.ctx.moveTo(...points[0].expand());
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(...points[i].expand());
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    onUnload() {
        // remove canvas
        this.canvas.parentElement?.removeChild(this.backCanvas);
        this.canvas.parentElement?.removeChild(this.frontCanvas);
        window.clearInterval(this.animInterval!);
    }
}
