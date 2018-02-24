class Ob {
    constructor(g) {
        this.parent = g;
    }

    tick() {}
    draw() {}
}

class Background extends Ob {
    constructor(g) {
        super(g);

        this.parent.obs[0].push(this);
    }
}

class Thing extends Ob {
    constructor(g) {
        super(g);

        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;

        this.parent.obs[1].push(this);
    }
}

class Overlay extends Ob {
    constructor(g) {
        super(g);

        this.x = 0;
        this.y = 0;
    }
}

class Player extends Thing {
    constructor(p) {
        super(p);
    }
}

class G {
    constructor() {
        this.canvas = document.getElementById("c");
        this.X = this.canvas.getContext("2d");

        this.ready = false;
        this.started = false;

        this.obs = [
            [],
            [],
            []
        ];

        this.then = 0;
        this.player = null;

        this._loadedDependencies = 0;
        this.requiredDependencies = 0;

        this.setup();
    }

    get loadedDependencies() {
        return this._loadedDependencies;
    }
    set loadedDependencies(e) {
        if (this.loadedDependencies >= this.requiredDependencies) {
            this.ready = true;
            this.start();
            return;
        }

        this._loadedDependencies = e;
    }

    setup() {
        this.then = Date.now();
        this.player = new Player(this);
        this.draw();
        this.resize();

        addEventListener("resize", e => this.resize(e));

        addEventListener("mousemove", e => this.mousemove(e));
        addEventListener("mousedown", e => this.mousedown(e));
        addEventListener("mouseup", e => this.mouseup(e));

        addEventListener("touchmove", e => this.touchmove(e));
        addEventListener("touchstart", e => this.touchstart(e));
        addEventListener("touchend", e => this.touchend(e));

        addEventListener("keydown", e => this.keydown(e));
        addEventListener("keyup", e => this.keyup(e));

        addEventListener("deviceorientation", e => this.deviceorientation(e), {
            passive: true
        });
        
        addEventListener("scroll", function(e) {
            e.preventDefault();
            document.body.scrollTop = document.body.scrollLeft = 0;
        }, true);
    }

    start() {
        if (this.started) return;
        this.started = true;

        //
    }

    tick(tt) {
        for (let i of this.obs) {
            for (let j of i) {
                j.tick(tt);
            }
        }
    }

    draw() {
        var now = Date.now(),
            tt = now - this.then;
        this.then = now;

        this.tick(tt);

        for (let i of this.obs) {
            for (let j of i) {
                j.draw(tt);
            }
        }

        requestAnimationFrame(() => this.draw());
    }

    resize() {
        var dpr = window.devicePixelRatio || 1;

        this.canvas.width = innerWidth * dpr;
        this.canvas.height = innerHeight * dpr;
    }

    mousemove(e) {
        if (!this.started) return;
        e.preventDefault();
    }
    mousedown(e) {
        if (!this.started) return;
        e.preventDefault();
    }
    mouseup(e) {
        if (!this.started) return;
        e.preventDefault();
    }

    touchmove(e) {
        e.preventDefault();
        if (!this.started) return;
    }
    touchstart(e) {
        if (!this.started) return;
        e.preventDefault();
    }
    touchend(e) {
        if (!this.started) return;
        e.preventDefault();
    }

    deviceorientation(e) {
        //
    }

    keydown(e) {
        if (!this.started) return;
        if (!e.ctrlKey && !e.altKey) {
            e.preventDefault();
        }
    }
    keyup(e) {
        if (!this.started) return;
        if (!e.ctrlKey && !e.altKey) {
            e.preventDefault();
        }
    }
}

const g = new G();