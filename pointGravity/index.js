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
    focused = true,
    ignmouse = false,
    key = {};
    
{
    world.camera.tx = innerWidth / 2;
    world.camera.ty = innerHeight / 2;
    for (let y = -10; y < 10; y++) {
        for (let x = -10; x < 10; x++) {
            world.append(new Point(x * 32, y * 32));
        }
    }
}

function resize() {
    focused = false;
    setTimeout(() => focused = true, 50);
    world.scale(innerWidth / C.width, innerHeight / C.height);

    C.width = innerWidth;
    C.height = innerHeight;
}

function mousedown(e) {
    if (!focused) {
        focused = true;
        ignmouse = true;
        return;
    }
    if (e.button == 0) {
        world.setGuideStart(mouse.x, mouse.y);
    } else if (e.button == 1) {
        // middle click
    } else if (e.button == 2) {
        // right click
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = true;
}

function mouseup(e) {
    if (!focused || ignmouse) {
        focused = true;
        ignmouse = false;
        return;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
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
    if (!focused) {
        focused = true;
        return;
    }
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
    if (!focused) {
        focused = true;
        return;
    }
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

addEventListener("contextmenu", contextmenu);
addEventListener("wheel", wheel);

addEventListener("blur", blur);
addEventListener("focus", focus);
reqanf();