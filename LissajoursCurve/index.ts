const C: HTMLCanvasElement = document.createElement("canvas");
const D: HTMLCanvasElement = document.createElement("canvas");
const X: CanvasRenderingContext2D = C.getContext("2d");
const Y: CanvasRenderingContext2D = D.getContext("2d");

D.style.position = "absolute";
D.style.top = "8px";
D.style.left = "8px";

const width: number = 50;
const height: number = 50;

D.width = C.width = width * 72 + 64;
D.height = C.height = height * 72 + 64;

document.body.appendChild(C);
document.body.appendChild(D);

class Curve {
    private x: number;
    private y: number;

    private radius: number;

    private speedX: number;
    private speedY: number;

    private lastX: number;
    private lastY: number;

    private color: string;

    private progress: number;

    constructor(x: number, y: number, radius: number, speedX: number, speedY: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;

        this.progress = 0;

        this.lastX = Math.cos(this.progress) * this.radius + this.x;
        this.lastY = Math.sin(this.progress) * this.radius + this.y;
    }

    public draw(): void {
        if (this.progress > Math.PI * 2) {
            return;
        }

        const iterations: number = Math.max(this.speedX, this.speedY);
        this.progress += 0.1 / iterations;

        const x: number = Math.cos(this.progress * this.speedX) * this.radius + this.x;
        const y: number = Math.sin(this.progress * this.speedY) * this.radius + this.y;

        X.strokeStyle = this.color;

        X.beginPath();
        X.moveTo(this.lastX, this.lastY);
        X.lineTo(x, y);
        X.stroke();

        this.lastX = x;
        this.lastY = y;
    }
}

class World {
    curves: Curve[];
    width: number;
    height: number;

    padding: number = 8;
    radius: number = 32;

    startX: number = 64;
    startY: number = 64;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.curves = [];

        const spacing: number = this.radius * 2 + this.padding;

        for (let x: number = 0; x < width; x++) {
            for (let y: number = 0; y < height; y++) {
                this.curves.push(new Curve(
                    this.startX + x * spacing, this.startX + y * spacing,
                    this.radius,
                    x, y, "#000000"
                ));
            }
        }
    }

    public draw(): void {
        Y.clearRect(0, 0, D.width, D.height);
        for (let curve of this.curves) {
            curve.draw();
        }
    }
}

const world: World = new World(width, height);

function reqanf(): void {
    world.draw();
    requestAnimationFrame(reqanf);
}

reqanf();