/** @type {HTMLCanvasElement} */
// @ts-ignore
const C = document.getElementById("c");
/** @type {CanvasRenderingContext2D} */
const X = C.getContext("2d");

C.width = innerWidth;
C.height = innerHeight;

const CONF = {
    padding: 1
};

const mouse = {
    x: 0, y: 0, down: false
};

function reqanfLoop(cb) {
    function reqanf(e) {
        cb(e);
        requestAnimationFrame(reqanf);
    }
    requestAnimationFrame(reqanf);
}

function drawSelfInside() {
    const ocanvas = document.createElement("canvas");
    const ocontext = ocanvas.getContext("2d");

    ocanvas.width = C.width;
    ocanvas.height = C.height;

    ocontext.drawImage(C, 0, 0);

    X.clearRect(0, 0, C.width, C.height);

    X.drawImage(ocanvas,
        0, 0, C.width, C.height,
        CONF.padding, CONF.padding, C.width - CONF.padding * 2, C.height - CONF.padding * 2
    );
}

function drawMouse() {
    if (mouse.down) {
        X.fillRect(mouse.x - 4, mouse.y - 4, 8, 8);
    }
}

function draw() {
    // X.clearRect(0, 0, C.width, C.height);
    drawSelfInside();
    drawMouse();
}

reqanfLoop(function() {
    draw();
});

addEventListener("mousemove", function(e) {
    mouse.x = e.layerX;
    mouse.y = e.layerY;
});

addEventListener("mousedown", function() {
    mouse.down = true;
});
addEventListener("mouseup", function () {
    mouse.down = false;
});
