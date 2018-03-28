const C = document.getElementById("c"),
    X = C.getContext('2d');

C.width = 1280;
C.height = 720;

var world = new World(),
    mouse = {
        x: 0,
        y: 0,
        down: false
    },
    key = {};

function resize() {
    C.width = innerWidth;
    C.height = innerHeight;
}

function mousedown(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = true;
    world.setGuideStart(mouse.x, mouse.y);
}

function mouseup(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = false;

    world.setGuideEnd(mouse.x, mouse.y);
    world.newPointGuide();
    world.hideGuide();
}

function mousemove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (key[32]) {
        world.cameraMove(e.movementX, e.movementY);
    }
    world.setGuideEnd(mouse.x, mouse.y);
}

function keydown(e) {
    key[e.keyCode] = true;
}

function keyup(e) {
    key[e.keyCode] = false;
}

function wheel(e) {
    if (e.deltaY < 0) {
        world.scale(true, mouse.x, mouse.y);
    } else {
        world.scale(false, mouse.x, mouse.y);
    }
}

function reqanf() {
    world.upd();
    world.draw(X);

    requestAnimationFrame(reqanf);
}

addEventListener("resize", resize);
resize();

addEventListener("mousedown", mousedown);
addEventListener("mouseup", mouseup);
addEventListener("mousemove", mousemove);

addEventListener("keydown", keydown);
addEventListener("keyup", keyup);

addEventListener("wheel", wheel);

addEventListener("contextmenu", e => e.preventDefault());
reqanf();