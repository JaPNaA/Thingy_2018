class Complex {
    constructor(r, i) {
        this.real = r;
        this.imaginary = i;
    }

    static add(a, b) {
        return new Complex(a.real + b.real, a.imaginary + b.imaginary);
    }

    static mutliply(a, b) {
        return new Complex(
            a.real * b.real - a.imaginary * b.imaginary,
            a.real * b.imaginary + a.imaginary * b.real
        );
    }
}

function mbrot(z, c) {
    return Complex.add(Complex.mutliply(z, z), c);
}

function iterateMbrot(at, times) {
    let z = new Complex(0, 0);

    for (let i = 0; i < times; i++) {
        z = mbrot(z, at);
    }

    return z;
}

function pointAlphaInMandelbrot(complex, timesToIterate, infinityThreshold) {
    let final = iterateMbrot(complex, timesToIterate);
    return 1 - (final.real + final.imaginary / infinityThreshold);
}

// ----------------------------------------------------------------------------------------

class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.X = canvas.getContext("2d");

        this.timesToIterate = 100;
        this.infinityThreshold = 100;

        this.scaleX = 100;
        this.scaleY = 100;
        this.translateX = -2;
        this.translateY = -1;

        /** @type {ImageData} */
        this.imageData = null;
    }

    scale(mag) {
        this.scaleX *= mag;
        this.scaleY *= mag;
    }

    translate(x, y) {
        this.translateX += x / this.scaleX;
        this.translateY += y / this.scaleY;
    }

    render() {
        this.getImageData();

        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                this.putPixelIfInSet(x, y);
            }
        }

        this.setImageData();
    }

    getImageData() {
        this.imageData = this.X.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    setImageData() {
        this.X.putImageData(this.imageData, 0, 0);
    }

    putPixelIfInSet(x, y) {
        let point = new Complex(
            x / this.scaleX + this.translateX,
            y / this.scaleY + this.translateY
        );

        this.putPixelAtPoint(x, y, 0, 0, 0, pointAlphaInMandelbrot(point, this.timesToIterate, this.infinityThreshold) * 255);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     */
    putPixelAtPoint(x, y, pr, pg, pb, pa) {
        const i = (x + y * this.imageData.width) * 4;

        const r = i;
        const g = i + 1;
        const b = i + 2;
        const a = i + 3;

        const data = this.imageData.data;

        data[r] = pr;
        data[g] = pg;
        data[b] = pb;
        data[a] = pa;
    }
}

// ----------------------------------------------------------------------------------------

/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("canvas");

const zoomSpeed = 1.25;

let renderer = new Renderer(canvas);
let down = false;

function resize() {
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
}

addEventListener("mousedown", () => down = true);
addEventListener("mouseup", () => down = false);

addEventListener("mousemove", function(e) {
    if (!down) return;
    e.preventDefault();

    renderer.translate(
        -e.movementX / innerWidth * canvas.width, 
        -e.movementY / innerHeight * canvas.height
    );
    renderer.render();
});
addEventListener("wheel", function(e) {
    e.preventDefault();

    if (e.deltaY < 0) {
        renderer.scale(zoomSpeed);
    } else {
        renderer.scale(1 / zoomSpeed);
    }
    renderer.render();
});

addEventListener("resize", resize);

renderer.render();
resize();