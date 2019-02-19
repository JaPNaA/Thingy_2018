/** @type {HTMLCanvasElement} */
// @ts-ignore
const CANVAS = document.getElementById("c");

/** @type {HTMLCanvasElement} */
// @ts-ignore
const CANVAS2 = document.getElementById("c2");

/** @type {CanvasRenderingContext2D} */
const X = CANVAS.getContext("2d");

/** @type {CanvasRenderingContext2D} */
const X2 = CANVAS2.getContext("2d");

let scale = 0.4;

CANVAS.width = innerWidth * scale;
CANVAS.height = innerHeight * scale;

CANVAS2.width = innerWidth * scale;
CANVAS2.height = innerHeight * scale;

// CONFIG
// ----------------------------------------------------------------------------------------
let maxDist = 8;
let jumpDist = 4;


let isMouseDown = false;

/** @type {Number} */
let firstPointX;

/** @type {Number} */
let firstPointY;

function insertPoint(x, y) {
    X.fillStyle = "#000000";
    X.fillRect(x - 2, y - 2, 4, 4);
}

function sumFunc(x, y) {
    return x + y;
}

function drawLine(firstX, firstY) {
    let imageData = X.getImageData(0, 0, CANVAS.width, CANVAS.height);
    
    X2.clearRect(0, 0, CANVAS2.width, CANVAS2.height);
    X2.beginPath();
    X2.moveTo(firstX, firstPointY);

    let x = firstX;
    let y = firstY;
    
    while (!isNaN(x)) {
        let nextAng = calcNext(x, y, imageData);

        if (nextAng === null) {
            break;
        }

        x += Math.cos(nextAng) * jumpDist;
        y += Math.sin(nextAng) * jumpDist;

        X2.lineTo(x, y);
    }

    X2.strokeStyle = "#ff0000";
    X2.lineWidth = 2;
    X2.stroke();
}

function calcNext(x, y, imageData) {
    let minX = Math.floor(x - maxDist);
    let maxX = Math.ceil(x + maxDist);
    let minY = Math.floor(y - maxDist);
    let maxY = Math.ceil(y + maxDist);

    let xs = [];
    let ys = [];

    for (let y = minY; y < maxY; y++) {
        let yw = y * imageData.width;

        for (let x = minX; x < maxX; x++) {
            let i = (yw + x) * 4;

            if (imageData.data[i + 3] > 128) { // checks alpha (> 0.5)
                xs.push(x);
                ys.push(y);

                imageData.data[i + 3] = 64;
            }
        }
    }

    let avgX;
    if (xs.length === 0) {
        avgX = x;
    } else {
        avgX = xs.reduce(sumFunc, 0) / xs.length;
    }

    let avgY;
    if (ys.length === 0) {
        avgY = y;
    } else {
        avgY = ys.reduce(sumFunc, 0) / ys.length;
    }

    let dx = avgX - x;
    let dy = avgY - y;

    if (dx === 0 && dy === 0) {
        return null;
    }

    return Math.atan2(dy, dx);
}


addEventListener("mousedown", function(e) {
    isMouseDown = true;

    if (firstPointX === undefined) {
        firstPointX = e.clientX * scale;
        firstPointY = e.clientY * scale;
    }

    insertPoint(e.clientX * scale, e.clientY * scale);
});

addEventListener("mouseup", function() {
    isMouseDown = false;
    drawLine(firstPointX, firstPointY);
});

addEventListener("mousemove", function(e) {
    if (isMouseDown) {
        insertPoint(e.clientX * scale, e.clientY * scale);
        drawLine(firstPointX, firstPointY);
    }
});

addEventListener("keydown", function(e) {
    if (e.ctrlKey || e.altKey) return;

    if (!window.confirm("Clear?")) return;

    let newJumpDist = parseFloat(window.prompt("Set jump distance"));
    jumpDist = newJumpDist || jumpDist;

    let newMaxDist = parseFloat(window.prompt("Set max distance"));
    maxDist = newMaxDist || maxDist;

    let newScale = parseFloat(window.prompt("Set scale"));
    scale = newScale || scale;

    drawLine(firstPointX, firstPointY);

    firstPointX = undefined;
    firstPointY = undefined;

    CANVAS.width = innerWidth * scale;
    CANVAS.height = innerHeight * scale;
    CANVAS2.width = innerWidth * scale;
    CANVAS2.height = innerHeight * scale;

    X.clearRect(0, 0, CANVAS.width, CANVAS.height);
    X2.clearRect(0, 0, CANVAS.width, CANVAS.height);
});