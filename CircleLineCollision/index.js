"use strict";

Math.TAU = Math.PI * 2;

/** @type {HTMLCanvasElement} */
const C = document.getElementById("c");
/** @type {CanvasRenderingContext2D} */
const X = C.getContext("2d");

function createCircle(x, y, r) {
    return {
        x: x,
        y: y,
        r: r
    };
}

function createRay(x1, y1, x2, y2) {
    return {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
    };
}

function drawCircle(circle) {
    X.beginPath();
    X.arc(circle.x, circle.y, circle.r, 0, Math.TAU, false);
    X.stroke();

    X.fillRect(circle.x - 2, circle.y - 2, 4, 4);
}

function drawRay(ray) {
    let [m, b] = mxbLine(ray);

    let x = Math.max(C.width, C.height);
    let y = m * x + b;

    X.beginPath();
    X.moveTo(ray.x1, ray.y1);
    X.lineTo(ray.x2, ray.y2);
    X.lineTo(x, y);
    X.stroke();

    X.fillRect(ray.x1 - 2, ray.y1 - 2, 4, 4);
    X.fillRect(ray.x2 - 2, ray.y2 - 2, 4, 4);
}

function mxbLine(line) {
    const slope = (line.y2 - line.y1) / (line.x2 - line.x1);
    const yint = -slope * line.x1 + line.y1;
    return [slope, yint];
}

function mybLine(line) {
    const slope = (line.x2 - line.x1) / (line.y2 - line.y1);
    const yint = -slope * line.x1 + line.y1;
    return [slope, yint];
}

function checkCollide(circle, ray) {
    // line: y = m * x + b
    // convert x1, y1, x2, y2 to mx+b
    const _tSlope = (ray.y2 - ray.y1) / (ray.x2 - ray.x1);

    // invert axis, because math
    let cx = -circle.x;
    let cy = -circle.y;
    
    // circle: x * x + y * y = r * r
    // derived formula
    
    // if (_tSlope < 0.5) {

    const [m, b] = mxbLine(ray); // m can be Infinity and b be NaN

    const _temp1 = cx + cy * m + b * m;
    const _temp2 = m * m + 1;
    const _temp3 = _temp1 * _temp1 - _temp2 * (cx * cx + b * b + cy * cy + 2 * b * cy - circle.r * circle.r);

    if (_temp3 < 0) {
        console.log("no collisions");
        return;
    }
    
    const plusMinus = Math.sqrt(_temp3);

    const x1 = -(_temp1 + plusMinus) / _temp2;
    const x2 = -(_temp1 - plusMinus) / _temp2;

    X.fillRect(x1, 0, 1, C.height);
    X.fillRect(x2, 0, 1, C.height);

    const y1 = m * x1 + b;
    const y2 = m * x2 + b;

    X.fillRect(0, y1, C.width, 1);
    X.fillRect(0, y2, C.width, 1);

    console.log("collision");

    // } else {
    //     let [m, b] = mybLine(ray);
        
    //     if (m === 0) {
            
            
    //     } else {

    //     }

    //     let y1 = (
    //         -(-2 * b) / (m * m)
    //         + 2 * (1 / m) * cx 
    //         + 2 * cy 
    //         + Math.sqrt(
    //             (-2 * b / (m * m) + 2 * (1 / m) * cx + 2 * cy) ** 2 
    //             - 4 * (1 / m * m + 1) * (
    //                 -circle.r * circle.r 
    //                 + b * b / m * m 
    //                 + cx * cx 
    //                 - 2 * b * cx / m + cy * cy
    //             )
    //         )
    //     )
    //     /
    //     (
    //         2 * (
    //             1 / m * m 
    //             + 1
    //         )
    //     );

    //     X.fillRect(x1, 0, 1, C.height);
    //     X.fillRect(x2, 0, 1, C.height);

    //     debugger;
    //     console.log(y1);
        
    //     X.fillRect(0, y1, C.width, 1);
    //     X.fillRect(0, y2, C.width, 1);

    //     console.log(y1, y2);

    //     console.log("collision");
    // }
}

function main() {
    C.width = 1280;
    C.height = 720;

    X.lineWidth = 2;

    X.fillStyle = "#f00";
    X.strokeStyle = "#000";

    const circle = createCircle(120, 120, 60);
    const ray = createRay(200, 50, 205, 200);

    drawCircle(circle);
    drawRay(ray);
    checkCollide(circle, ray);

    addEventListener("mousemove", function(e) {
        circle.x = e.clientX - 8;
        circle.y = e.clientY - 8;

        X.clearRect(0, 0, C.width, C.height);
        drawCircle(circle);
        drawRay(ray);
        checkCollide(circle, ray);
    });
}

main();