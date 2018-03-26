const C = document.getElementById("c"),
      X = C.getContext('2d');

C.width = 1280;
C.height = 720;

var world = new World(),
    startMouse = {};

// {
//     let a = new Point(256, 256);
//     a.gravStrength = 0;
//     world.append(a);
// }

function mousedown(e) {
    startMouse.x = e.clientX;
    startMouse.y = e.clientY;
}

function mouseup(e) {
    let x = e.clientX,
        y = e.clientY,
        g = new Point(x, y),
        ofx = startMouse.x - x,
        ofy = startMouse.y - y;
    
    g.vx = ofx * 0.1;
    g.vy = ofy * 0.1;

    g.gravStrength = 0.001;
    
    world.append(g);
}

function reqanf() {
    world.upd();
    world.draw(X);
    requestAnimationFrame(reqanf);
}

addEventListener("mousedown", mousedown);
addEventListener("mouseup", mouseup);
addEventListener("contextmenu", e => e.preventDefault());
reqanf();