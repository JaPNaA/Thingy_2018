/** @type {HTMLCanvasElement} */
const C = document.getElementById("c");
/** @type {CanvasRenderingContext2D} */
const X = C.getContext("2d");

/** @type {HTMLCanvasElement} */
const bC = document.getElementById("bg");
/** @type {CanvasRenderingContext2D} */
const bX = bC.getContext("2d");

function pytha(x, y) {
    return Math.sqrt(x * x + y * y);
}

function reqanfLoop(func) {
    function exec(e) {
        func(e);
        requestAnimationFrame(exec);
    }

    requestAnimationFrame(exec);
}

class RopeNode {
    constructor(x, y) {
        this.lastX = this.x = x;
        this.lastY = this.y = y;

        this.dx = 0;
        this.dy = 0;
    }

    tick() {
        let dx = this.x - this.lastX,
            dy = this.y - this.lastY;

        this.lastX = this.x;
        this.lastY = this.y;

        this.dx = dx;
        this.dy = dy;

        this.x += dx * 0.987;
        this.y += dy * 0.987;
    }
}

class RopeConstraint {
    /**
     * Constrain betwwen 2 nodes on rope
     * @param {RopeNode} a node on rope
     * @param {RopeNode} b node on rope
     */
    constructor(a, b) {
        this.a = a;
        this.b = b;

        this.distance = pytha(this.a.x - this.b.x, this.a.y - this.b.y);
    }

    tick() {
        const dx = this.b.x - this.a.x,
            dy = this.b.y - this.a.y,
            dist = pytha(dx, dy),
            diff = this.distance - dist,
            ratio = diff / dist / 2;

        this.a.x -= dx * ratio;
        this.a.y -= dy * ratio;
        this.b.x += dx * ratio;
        this.b.y += dy * ratio;
    }
}

class Rope {
    constructor() {
        /** @type {RopeNode[]} */
        this.nodes = [];
        /** @type {RopeConstraint[]} */
        this.constraints = [];
        
        let prevNode = null;
        for (let i = 0; i < 500; i++) {
            let node = new RopeNode(16 + Math.sin(i / 5) * 10, i * 4);
            this.nodes.push(node);

            if (prevNode !== null) {
                let constraint = new RopeConstraint(node, prevNode);
                this.constraints.push(constraint);
            }

            prevNode = node;
        }


        this.lastNode = prevNode;
    }

    draw(dpr) {
        X.strokeStyle = "#000000";
        X.lineWidth = 2 * dpr;
        bX.strokeStyle = "#cc77cc";

        X.beginPath();
        
        for (let node of this.nodes) {
            X.lineTo(node.x * dpr, node.y * dpr);

            bX.globalAlpha = 1 / pytha(node.dx, node.dy);
            bX.beginPath();
            
            bX.moveTo(node.lastX * dpr, node.lastY * dpr);
            bX.lineTo(node.x * dpr, node.y * dpr);
            
            bX.stroke();
        }
        
        X.stroke();
    }

    tick() {
        // update
        for (let i of this.constraints) {
            i.tick();
        }
        for (let i of this.nodes) {
            i.tick();
        }
    }

    pull(x, y) {
        this.lastNode.x = x;
        this.lastNode.y = y;
    }
}

function main() {
    const dpr = devicePixelRatio;
    bC.width = C.width = innerWidth * dpr;
    bC.height = C.height = innerHeight * dpr;
    C.style.width = bC.style.width = innerWidth + "px";
    C.style.height = bC.style.height = innerHeight + "px";

    const rope = new Rope();

    // user input
    // -----------------------------------------------------------------------------
    let mouseX = 84, 
        mouseY = 360,
        mouseDown = false,
        smMode = false;

    function mousedown(e) {
        e.preventDefault();

        mouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function mouseup(e) {
        e.preventDefault();

        mouseDown = false;
    }

    function mousemove(e) {
        e.preventDefault();

        if (mouseDown) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    }

    function touchstart(e) {
        mouseX = e.changedTouches[0].clientX;
        mouseY = e.changedTouches[0].clientY;
    }
    function touchmove(e) {
        mouseX = e.changedTouches[0].clientX;
        mouseY = e.changedTouches[0].clientY;
    }
    function touchend(e) { }

    addEventListener("mousedown", mousedown);
    addEventListener("mouseup", mouseup);
    addEventListener("mousemove", mousemove);

    addEventListener("touchstart", touchstart, {passive: false});
    addEventListener("touchmove", touchmove, {passive: false});
    addEventListener("touchend", touchend, {passive: false});

    addEventListener("keydown", function() {
        smMode = !smMode;

        if (smMode) {
            C.style.display = "none";
        } else {
            C.style.display = "block";
        }
    });

    // render loop
    // -----------------------------------------------------------------------------
    reqanfLoop(function() {
        if (smMode) return;

        X.clearRect(0, 0, C.width, C.height);
        rope.pull(mouseX, mouseY);
        rope.tick();
        rope.draw(dpr);
    });
}

main();