const C = document.getElementById("c"),
    X = C.getContext('2d');

C.width = 1280;
C.height = 720;

var world = new World(),
    mouse = {
        x: 0,
        y: 0,
        down: false,
        inside: true
    },
    key = {};

world.camera.tx = innerWidth / 2;
world.camera.ty = innerHeight / 2;

{
    for (let y = -10; y < 10; y++) {
        for (let x = -10; x < 10; x++) {
            world.append(new Point(x * 32, y * 32));
        }
    }
}

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

function mouseout(e) {
    mouse.inside = false;
    if (key[32]) {
        C.requestPointerLock();
    }
}

function mouseover(e) {
    mouse.inside = true;
}

function keydown(e) {
    if (e.keyCode == 48 || e.keyCode == 96) {
        world.scaleReset();
    }
    if (e.keyCode == 32) {
        if (!mouse.inside) {
            C.requestPointerLock();
        }
        C.style.cursor = "move";
    }
    key[e.keyCode] = true;
}

function keyup(e) {
    if (e.keyCode == 32) {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        C.style.cursor = "default";
    }
    key[e.keyCode] = false;
}

function wheel(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        world.scale(true, mouse.x, mouse.y);
    } else {
        world.scale(false, mouse.x, mouse.y);
    }
}

function contextmenu(e) {
    e.preventDefault();
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
addEventListener("mouseover", mouseover);
addEventListener("mouseout", mouseout);

addEventListener("keydown", keydown);
addEventListener("keyup", keyup);

addEventListener("wheel", wheel);

addEventListener("contextmenu", contextmenu);
reqanf();