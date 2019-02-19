const C = document.getElementById("c"),
    X = C.getContext('2d');

C.width = 1280;
C.height = 720;

var world = new World(),
    ui = new Ui(),
    mouse = {
        x: 0,
        y: 0,
        down: false,
        inside: true
    },
    focused = true,
    ignmouse = false,
    key = {};

function resize() {
    var dpr = window.devicePixelRatio || 1,
        w = innerWidth * dpr,
        h = innerHeight * dpr;

    focused = false;
    setTimeout(() => focused = true, 50);
    world.scale((w / C.width) * (h / C.height));
    ui.event("resize");

    C.width = w;
    C.height = h;
}

function mousedown(e) {
    if (!focused) {
        focused = true;
        ignmouse = true;
        return;
    }

    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (ui.shouldCapture(mouse.x, mouse.y)) {
        ui.event("mousedown", e);
    } else {
        if (e.button == 0) {
            world.setGuideStart(mouse.x, mouse.y);
        } else if (e.button == 1) {
            // middle click
        } else if (e.button == 2) {
            // right click
        }
        mouse.down = true;
    }
}

function mouseup(e) {
    if (!focused || ignmouse) {
        focused = true;
        ignmouse = false;
        return;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    if (!ui.shouldCapture(mouse.x, mouse.y) && mouse.down) {
        mouse.down = false;
        if (e.button == 0) {
            world.setGuideEnd(mouse.x, mouse.y);
            world.newPointGuide();
            world.hideGuide();
        } else if (e.button == 1) {
            world.scaleReset();
        } else if (e.button == 2) {
            // right click
        }
    }
    
    ui.event("mouseup", e);
}

function mousemove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (ui.shouldCapture(mouse.x, mouse.y)) {
        ui.event("mousemove", e);
        if (key[32]) {
            world.cameraMove(e.movementX, e.movementY);
        }
    } else {
        if (key[32]) {
            world.cameraMove(e.movementX, e.movementY);
        }
        world.setGuideEnd(mouse.x, mouse.y);
    }
}

function mouseout(e) {
    mouse.inside = false;

    ui.event("mouseout", e);
    if (key[32]) {
        C.requestPointerLock();
    }
}

function mouseover(e) {
    mouse.inside = true;
}

function keydown(e) {
    if (!focused) {
        focused = true;
        return;
    }

    if (ui.shouldCapture(mouse.x, mouse.y)) {
        ui.event("keydown", e);
    } else {
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

}

function keyup(e) {
    if (!focused) {
        focused = true;
        return;
    }
    if (ui.shouldCapture(mouse.x, mouse.y)) {
        ui.event("keyup", e);
    } else {
        if (e.keyCode == 32) {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            C.style.cursor = "default";
        }
    }

    key[e.keyCode] = false;
}

function wheel(e) {
    e.preventDefault();

    if (ui.shouldCapture(mouse.x, mouse.y)) {
        ui.event("wheel", e);
    } else {
        if (e.deltaY < 0) {
            world.scale(true, mouse.x, mouse.y);
        } else {
            world.scale(false, mouse.x, mouse.y);
        }
    }
}

function contextmenu(e) {
    e.preventDefault();
    ui.openContextmenu();
}

function blur() {
    key = {};
    focused = false;
}

function focus() {
    // focused = true;
}

function reqanf() {
    world.upd();
    world.draw(X);
    ui.draw(X);

    requestAnimationFrame(reqanf);
}

{
    world.camera.tx = C.width / 2;
    world.camera.ty = C.height / 2;
    for (let y = -5; y < 5; y++) {
        for (let x = -5; x < 5; x++) {
            world.append(new Point(x * 32, y * 32));
        }
    }
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

addEventListener("contextmenu", contextmenu);
addEventListener("wheel", wheel);

addEventListener("blur", blur);
addEventListener("focus", focus);
reqanf();