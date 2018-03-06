Math.TAU = Math.PI * 2;

function pytha(x, y) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function randInt(e) {
    return Math.floor(Math.random() * e);
}

function loadImage(e, f) {
    var i = new Image();
    i.src = e;

    if (f) {
        f.requiredDependencies++;
        i.addEventListener("load", function () {
            f.loadedDependencies++;
        });
    }

    return i;
}

class Ob {
    constructor(g, l) {
        this.parent = g;
        this.rem = false;
        this.layer = l || 1;
    }

    tick() {}
    draw() {}
    remove() {
        if (this.rem) {
            let o = this.parent.obs[this.layer];
            o.splice(o.indexOf(this), 1);
        }
    }
    event() {}
}

class Data {
    constructor(p) {
        this.parent = p;

        this.timeElapsed = 0;
        this._gridOffset = 0;
        this.difficulty = 0;
        this.speed = 1;
        this.bulletPow = 1;

        this.cooldown = {
            block: {
                time: 1000,
                min: 250,
                now: 0,
                e: 0
            },
            bullet: {
                time: 1000,
                min: 32,
                now: 0,
                e: 0
            },
            diffUp: {
                time: 10000,
                now: 0,
                e: 0
            },
            spdUp: {
                time: 1000,
                drpd: 1,
                now: 0,
                e: 0
            },
            blockUp: {
                time: 5000,
                drpd: 1,
                now: 0,
                e: 0
            }
        };

        this._blockSpeed = 1;
        this._bulletSpeed = 1;
    }
    get blockSpeed() {
        return this._blockSpeed * this.speed;
    }
    set blockSpeed(e) {}

    get bulletSpeed() {
        return this._bulletSpeed * this.speed;
    }
    set bulletSpeed(e) {}

    get gridOffset() {
        return this._gridOffset;
    }
    set gridOffset(e) {
        this._gridOffset = e % Block.size;
    }

    warmup(tt) {
        let pd = this.parent.player.lives <= 0;

        for (let i in this.cooldown) {
            let o = this.cooldown[i];

            if (o.drpd && pd) continue;

            o.now -= tt;

            while (o.now < 0) {
                if (o.min && o.time < o.min) {
                    o.time = o.min;
                }
                o.now += o.time;
                o.e++;
            }
        }
    }

    tick(tt) {
        this.timeElapsed += tt;
        this.gridOffset += Block.vy * tt * this.speed;
        this.warmup(tt * this.speed);

        if (this.bulletPow > 10) {
            this.bulletPow = 10;
        }
    }
}

class PersistentData {
    constructor() {
        // get localstorage persistent data
        // stores highscores, time played, total score, etc
    }
}

class Background extends Ob {
    constructor(g) {
        super(g);

        this.bgcolor = "#000000";

        this.layer = 0;
        this.parent.obs[this.layer].push(this);
    }
    draw() {
        this.parent.X.fillStyle = this.bgcolor;
        this.parent.X.fillRect(0, 0, this.parent.width, this.parent.height);
    }
}

class Thing extends Ob {
    constructor(g, l) {
        super(g, l);

        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.width = 0;
        this.height = 0;

        this.parent.obs[this.layer].push(this);
    }
}

class Overlay extends Ob {
    constructor(g) {
        super(g);

        this.x = 0;
        this.y = 0;
    }
}

class Block extends Thing {
    constructor(p, x, yo, c) {
        super(p, 1);

        this.width = Block.size;
        this.height = Block.size;
        this.margin = 8;

        this.x = x * this.width + this.margin / 2 - 1;
        this.y = -this.height * 2 + yo;
        this.vy = Block.vy;

        this.value = 1 * this.parent.data.difficulty;
        this.lvalue = this.value;

        this.special = false;
        this.reallySpecial = false;

        this.playerDestroyed = false;
        this.destroyed = false;
        this.destroyedAniTime = 350;
        this.destroyedAniStep = this.destroyedAniTime;

        let tx = Math.floor(this.x),
            ty = Math.floor(this.y);

        for (let i of this.parent.obs[this.layer]) {
            if (i !== this && tx == Math.floor(i.x) && ty == Math.floor(i.y)) {
                this.rem = true;
                i.value += this.value;
                if (i.special) {
                    i.reallySpecial = true;
                } else {
                    i.special = true;
                }
            }
        }
    }
    static get vy() { // store static vars
        return 0.1;
    }
    static get size() {
        return 154;
    }
    static get lanes() {
        return 7;
    }

    get color() {
        return `hsl(${(this.lvalue - 1) * 9.101441186718159}, 100%, 50%)`;
    }
    get cColor() {
        return `hsl(${(this.lvalue - 1) * 9.101441186718159 + 180}, 100%, 50%)`;
    }

    get speed() {
        return this.parent.data.blockSpeed;
    }

    tick(tt) {
        this.y += this.vy * this.speed * tt;
        if (this.destroyed) {
            this.destroyedAniStep -= tt;

            if (this.destroyedAniStep < 0) {
                this.rem = true;
            }
            return;
        }

        if (this.parent.player.lives > 0 && this.y + this.height - this.margin > this.parent.height - this.parent.player.baseHeight) {
            this.destroyed = true;
            this.parent.player.lives--;
        }

        if (this.y > this.parent.height) {
            this.rem = true;
        }

        if (this.value <= 0) { // remove if 0 or outside screen
            this.destroyed = true;
        }

        if (this.value > 0) {
            let diff = (this.value - this.lvalue);
            if (diff <= 16) {
                this.lvalue += diff / tt;
            } else {
                this.lvalue = this.value - 16;
            }
        }
    }
    draw() {
        // if (this.value <= 0) return;
        var X = this.parent.X,
            cdif = this.lvalue - this.value,
            tw,
            tv = Math.ceil(this.value);

        if (tv < 1) {
            tv = 1;
        }

        X.save();
        X.fillStyle = this.color;
        X.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (cdif < 16) {
            let s = 1 - cdif / 16;

            if (s > 1.25) {
                s = 1.25;
            }

            X.scale(s, s);
        } else {
            X.globalAlpha = 0.1;
        }

        if (this.destroyed) {
            let s = this.destroyedAniStep / this.destroyedAniTime;
            s *= s * s;
            X.scale(s, s);
            X.globalAlpha = s;
        }

        X.fillRect(-this.width / 2 + this.margin, -this.height / 2 + this.margin,
            this.width - this.margin * 2,
            this.height - this.margin * 2
        );

        X.fillStyle = this.cColor;
        X.font = "64px Arial";

        tw = X.measureText(tv.toString()).width;

        X.fillText(tv, -tw / 2, 16);
        X.restore();
    }
    remove() {
        if (this.rem) {
            if (this.playerDestroyed && this.special) {
                if (this.reallySpecial) {
                    this.parent.data.bulletPow += 0.2;
                } else {
                    this.parent.data.cooldown.bullet.time *= 0.95;
                }
            }

            let o = this.parent.obs[this.layer];
            o.splice(o.indexOf(this), 1);
        }
    }
}

class Bullet extends Thing {
    constructor(p, x, y, a, s) {
        super(p, 1);

        this.ang = a;
        this.x = x;
        this.y = y;

        this.isSub = !!s;
        this.ttl = 2018; // It's actually 2016... as of March 6, 2018

        this.radius = 8;

        this.vx = Math.cos(this.ang) * this.speed;
        this.vy = Math.sin(this.ang) * this.speed;

        this.color = "#00BEF3";
        this.blocksHit = 0;
    }

    get speed() {
        return this.parent.data.bulletSpeed;
    }

    draw() {
        var X = this.parent.X;
        X.fillStyle = this.color;
        X.beginPath();
        X.arc(this.x, this.y, this.radius, 0, Math.TAU);
        X.fill();
    }

    boundaries() {
        if (this.x < this.radius) {
            this.vx = Math.abs(this.vx);
            this.x = this.radius * 2 - this.x;
        } else if (this.x > this.parent.width - this.radius) {
            this.vx = -Math.abs(this.vx);
            this.x = (this.parent.width - this.radius) * 2 - this.x;
        }

        if (this.y < this.radius) {
            this.vy = Math.abs(this.vy);
            this.y = this.radius * 2 - this.y;
        } else if (this.y > this.parent.height - this.radius) {
            this.rem = true;
        }

        if (
            this.parent.player.lives > 0 &&
            this.y > this.parent.height - this.parent.player.baseHeight + this.radius * 2
        ) {
            this.rem = true;
        }
    }
    collide() {
        var x = this.x - this.radius / 2,
            y = this.y - this.radius / 2,
            r = this.radius;

        for (let i of this.parent.obs[this.layer]) {
            if (!(i instanceof Block) || i.destroyed) continue;
            let dx = (x + r) - (i.x + i.width / 2),
                dy = (y + r) - (i.y + i.height / 2),
                w = r + i.width / 2,
                h = r + i.height / 2,
                cw = w * dy,
                ch = h * dx;

            if (Math.abs(dx) <= w && Math.abs(dy) <= h) {
                if (cw > ch) {
                    if (cw > -ch) {
                        // bottom
                        this.vy = Math.abs(this.vy);
                        this.y = i.y + i.height + r * 2;
                    } else {
                        // left
                        this.vx = -Math.abs(this.vx);
                        this.x = i.x - r * 2;
                    }
                } else {
                    if (cw > -ch) {
                        // right
                        this.vx = Math.abs(this.vx);
                        this.x = i.x + i.width + r * 2;
                    } else {
                        // top
                        this.vy = -Math.abs(this.vy);
                        this.y = i.y - r * 2;
                    }
                }
                this.blocksHit++;

                if (this.blocksHit > 5) {
                    this.rem = true;
                    new Bullet(this.parent, this.x, this.y, this.ang + Math.TAU * 0.25, true);
                    new Bullet(this.parent, this.x, this.y, this.ang + Math.TAU * 0.5, true);
                    new Bullet(this.parent, this.x, this.y, this.ang + Math.TAU * 0.75, true);
                    new Bullet(this.parent, this.x, this.y, this.ang, true);
                }

                i.value -= this.parent.data.bulletPow;
                if (i.value <= 0) i.playerDestroyed = true;
            }
        }
    }

    tick(tt) {
        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.boundaries();
        this.collide();

        if (this.isSub) {
            this.ttl -= tt;
            if (this.ttl < 0) {
                this.rem = true;
            }
        }
    }
    remove() {
        if (this.rem) {
            let o = this.parent.obs[this.layer];
            o.splice(o.indexOf(this), 1);
            if (!this.isSub)
                this.parent.player.bullets--;
        }
    }
}

class Player extends Thing {
    constructor(p) {
        super(p, 2);

        this.width = 128;
        this.height = 128;
        this.x = (this.parent.width - this.width) / 2;
        this.y = (this.parent.height - this.height) / 4 * 3;
        this.speed = 0.005;
        this.color = this.parent.img.player[0];

        this.baseHeight = 256;
        this.baseReach = this.parent.width / 3;
        this.baseColor = ["#660000", "#666600", "#006600"];

        this.reachOrigin = {
            x: this.parent.width / 2,
            y: this.parent.height - this.baseHeight
        };
        this.reachWidth = 16;
        this.reachColor = "#FFFFFF";

        this.maxBullets = 5;
        this.bullets = 0;
        this.lives = 3;
    }
    draw() {
        if (this.lives <= 0) return;
        var X = this.parent.X;
        this.drawReach(X);
        this.drawBase(X);
        this.drawPlayer(X);
    }
    drawBase(X) {
        X.fillStyle = this.baseColor[this.lives - 1];
        X.fillRect(0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight);
    }
    drawPlayer(X) {
        if (typeof this.color == "string") {
            X.fillStyle = this.color;
            X.fillRect(this.x, this.y, this.width, this.height);
        } else {
            var ofx = (this.x + this.width / 2) - this.reachOrigin.x,
                ofy = (this.y + this.height / 2) - this.reachOrigin.y;
            X.save();
            X.translate(this.x + this.width / 2, this.y + this.height / 2);
            X.rotate(Math.atan2(ofy, ofx));
            X.drawImage(this.color, 0, 0, this.color.width, this.color.height, -this.width / 2, -this.height / 2, this.width, this.height);
            X.restore();
        }
    }
    drawReach(X) {
        var ang = Math.atan2(
            (this.x + this.width / 2) - this.reachOrigin.x,
            this.reachOrigin.y - (this.y + this.height / 2)
        );

        X.save();

        X.translate(this.x + this.width / 2, this.y + this.height / 2);
        X.rotate(ang);
        X.fillStyle = this.reachColor;
        X.fillRect(-this.reachWidth / 2, 0, this.reachWidth, this.baseReach + this.reachWidth);

        X.restore();
    }

    clamps() {
        var ofx = (this.x + this.width / 2) - this.reachOrigin.x,
            ofy = (this.y + this.height / 2) - this.reachOrigin.y;

        if (pytha(ofx, ofy) > this.baseReach) {
            let ang = Math.atan2(ofy, ofx);
            this.x = this.reachOrigin.x + Math.cos(ang) * this.baseReach - this.width / 2;
            this.y = this.reachOrigin.y + Math.sin(ang) * this.baseReach - this.height / 2;
        }

        if (this.y + this.height > this.parent.height - this.baseHeight) {
            this.y = this.parent.height - this.baseHeight - this.height;
        }
    }

    spawnBullet() {
        var ofx = (this.x + this.width / 2) - this.reachOrigin.x,
            ofy = (this.y + this.height / 2) - this.reachOrigin.y;
        new Bullet(this.parent, this.x + this.width / 2, this.y + this.height / 2, Math.atan2(ofy, ofx));
        this.bullets++;
    }

    tick(tt) {
        if (this.lives <= 0) return;

        var k = this.parent.key,
            ax = 0,
            ay = 0,
            s = this.speed;

        if (k[65] || k[37])
            ax -= s;
        if (k[87] || k[38])
            ay -= s;
        if (k[68] || k[39])
            ax += s;
        if (k[83] || k[40])
            ay += s;

        if (ax && ay) {
            ax *= Math.SQRT1_2;
            ay *= Math.SQRT1_2;
        }

        this.vx += ax * tt;
        this.vy += ay * tt;

        this.vx *= Math.pow(0.995, tt);
        this.vy *= Math.pow(0.995, tt);

        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.clamps();
        while (this.parent.data.cooldown.bullet.e > 0) {
            if (this.bullets >= this.maxBullets) break;
            this.spawnBullet();
            this.parent.data.cooldown.bullet.e--;
        }
    }
}

class Screen {
    constructor(e) {
        this.parent = e;

        this.canvas = document.getElementById("c");
        this.X = this.canvas.getContext("2d");

        this.width = 1080;
        this.height = 1920;
        this.ratio = this.width / this.height;

        this.lastSize = {
            w: 0,
            h: 0
        };
        this.resizing = false;
        this.then = 0;

        this.started = false;
    }
    start() {}
    stop() {}
    resize() {
        if (this.resizing) return;
        var dpr = window.devicePixelRatio || 1,
            w = innerWidth,
            h = innerHeight;

        if (w == this.lastSize.w && h == this.lastSize.h) {
            this.resizeLoop();
            this.resizing = true;
            return;
        }

        if (h * this.ratio < w) {
            this.canvas.classList.add("h");
            this.canvas.width = h * this.ratio * dpr;
            this.canvas.height = h * dpr;
            this.canvas.style.left = (w - this.canvas.width / dpr) / 2 + "px";
            this.canvas.style.top = 0;
        } else {
            this.canvas.classList.remove("h");
            this.canvas.width = w * dpr;
            this.canvas.height = w / this.ratio * dpr;
            this.canvas.style.left = 0;
            this.canvas.style.top = (h - this.canvas.height / dpr) / 2 + "px";
        }

        this.X.scale(this.canvas.width / this.width, this.canvas.height / this.height);
    }
    resizeLoop() { // because ios is bad
        if (w == this.lastSize.w && h == this.lastSize.h) {
            requestAnimationFrame(() => this.resizeLoop());
        } else {
            this.resizing = false;
            this.resize();
        }
    }
}

class StartScreen extends Screen {
    constructor(e) {
        super(e);

        this.bg = "#000000";
        this.fadeOut = null;
        this.fadeOutTime = 150;
        this.fading = false;
        this.setup();
    }
    setup() {
        this.listenerFuncs = {
            resize: e => this.resize(e),
            click: e => this.click(e)
        };

        addEventListener("resize", this.listenerFuncs.resize);

        addEventListener("mouseup", this.listenerFuncs.click);
        addEventListener("touchend", this.listenerFuncs.click);

        this.resize();
    }
    start() {
        this.started = true;
        this.draw();
    }
    stop() {
        this.fadeOut = this.fadeOutTime;
        this.fading = true;

        removeEventListener("resize", this.listenerFuncs.resize);
        removeEventListener("mouseup", this.listenerFuncs.click);
        removeEventListener("touchend", this.listenerFuncs.click);
    }
    draw(e) {
        if (!this.started && !e) return;
        var now = performance.now(),
            tt = now - this.then,
            X = this.X;
        this.then = now;

        X.save();
        if (this.fading) {
            this.fadeOut -= tt;
            if (this.fadeOut < 0) {
                this.fading = false;
                return;
            }

            X.globalAlpha = this.fadeOut / this.fadeOutTime;
        }

        X.fillStyle = this.bg;
        X.fillRect(0, 0, this.width, this.height);

        X.fillStyle = "#FFFFFF";
        X.font = "36px Arial";
        X.fillText("[insert title picture here]", 8, 720);

        X.restore();

        requestAnimationFrame(() => this.draw());
    }
    click() {
        this.parent.next();
    }
}

class GameScreen extends Screen {
    constructor(e) {
        super(e);

        this.ready = false;

        this.obs = [
            [],
            [],
            [],
            []
        ];

        this.key = [];
        this.mouse = {
            x: 0,
            y: 0
        };

        this._loadedDependencies = 0;
        this.requiredDependencies = 0;

        this.data = null;
        this.persistentData = new PersistentData();

        this.loads = {
            img: {
                player: ["imgs/player0.png"]
            }
        };
        this.img = {};

        this.setup();
    }

    get loadedDependencies() {
        return this._loadedDependencies;
    }
    set loadedDependencies(e) {
        if (e >= this.requiredDependencies) {
            this.ready = true;
            return;
        }

        this._loadedDependencies = e;
    }

    preload() {
        for (let ip in this.loads) {
            let i = this.loads[ip];

            for (let jp in i) {
                let j = i[jp];

                if (typeof j == "string") {
                    this[ip][jp] = loadImage(j, this);
                } else if (j instanceof Array) {
                    let a = [];
                    for (let x of j) {
                        a.push(loadImage(x, this));
                    }
                    this[ip][jp] = a;
                } else {
                    throw new Error("this." + ip + "." + jp + " is not a string or array");
                }
            }
        }
    }

    setup() {
        let passiveFalse = {
            passive: false
        };

        this.resize();
        this.preload();

        // registers all event listeners I may need
        var listenerFuncs = {
            resize: e => this.resize(e),
            mousemove: e => this.mousemove(e),
            mousedown: e => this.mousedown(e),
            mouseup: e => this.mouseup(e),
            touchmove: e => this.touchmove(e),
            touchstart: e => this.touchstart(e),
            touchend: e => this.touchend(e),
            keydown: e => this.keydown(e),
            keyup: e => this.keyup(e),
            blur: e => this.blur(e),
            deviceorientation: e => this.deviceorientation(e),
            scroll: function (e) {
                e.preventDefault();
                document.body.scrollTop = document.body.scrollLeft = 0;
            }
        };

        addEventListener("resize", listenerFuncs.resize);

        addEventListener("mousemove", listenerFuncs.mousemove, passiveFalse);
        addEventListener("mousedown", listenerFuncs.mousedown, passiveFalse);
        addEventListener("mouseup", listenerFuncs.mouseup, passiveFalse);

        addEventListener("touchmove", listenerFuncs.touchmove, passiveFalse);
        addEventListener("touchstart", listenerFuncs.touchstart, passiveFalse);
        addEventListener("touchend", listenerFuncs.touchend, passiveFalse);

        addEventListener("keydown", listenerFuncs.keydown, passiveFalse);
        addEventListener("keyup", listenerFuncs.keyup, passiveFalse);
        addEventListener("blur", listenerFuncs.blur, passiveFalse);

        addEventListener("deviceorientation", listenerFuncs.deviceorientation, {
            passive: true
        });

        addEventListener("scroll", listenerFuncs.scroll, true);

        this.listenerFuncs = listenerFuncs;

        this.X.imageSmoothingEnabled = false;
    }

    reset() {
        this.data = null;
        this.player = null;
        this.then = performance.now();
        for (let i of this.obs) {
            i.length = 0;
        }
    }

    start() {
        if (!this.ready) {
            throw new Error("Attempted to start game before ready");
            return;
        }
        if (this.started) return;
        this.started = true;

        this.reset();

        this.data = new Data(this);
        this.player = new Player(this);
        new Background(this);

        this.draw();
    }

    stop() {
        this.started = false;

        for (let i in this.listenerFuncs) {
            removeEventListener(i, this.listenerFuncs[i]);
        }
    }

    eachObs(e) {
        for (let i of this.obs) {
            for (let j of i) {
                e(j);
            }
        }
    }

    tick(tt) {
        if (!this.started) return;
        this.eachObs(j => j.tick(tt));

        for (let i of this.obs) {
            for (let j = i.length - 1; j >= 0; j--) {
                i[j].remove();
            }
        }

        this.data.tick(tt);

        while (this.data.cooldown.block.e > 0) {
            new Block(this, randInt(Block.lanes), this.data.gridOffset, "#FF0000");
            this.data.cooldown.block.e--;
        }
        while (this.data.cooldown.blockUp.e > 0) {
            this.data.cooldown.block.time *= 0.975;
            this.data.cooldown.blockUp.e--;
        }
        if (this.data.cooldown.diffUp.e > 0) {
            this.data.difficulty += this.data.cooldown.diffUp.e;
            this.data.cooldown.diffUp.e = 0;
        }
        if (this.data.cooldown.spdUp.e > 0) {
            this.data.speed += this.data.cooldown.spdUp.e * 0.01;
            this.data.cooldown.spdUp.e = 0;
        }
    }

    draw() {
        if (!this.started) return;
        var now = performance.now(),
            tt = now - this.then;
        this.then = now;

        this.tick(tt);

        this.eachObs(j => j.draw(tt));

        if (this.parent.lastScreen && this.parent.lastScreen.fading) {
            this.parent.lastScreen.draw(true);
        }

        requestAnimationFrame(() => this.draw());
    }

    event(t, e) {
        this.eachObs(j => j.event(t, e));
    }

    mousemove(e) {
        if (!this.started) return;
        e.preventDefault();

        this.mouse.x = e.layerX;
        this.mouse.y = e.layerY;

        this.event("mousemove", e);
    }
    mousedown(e) {
        if (!this.started) return;
        e.preventDefault();

        this.event("mousedown", e);
    }
    mouseup(e) {
        if (!this.started) return;
        e.preventDefault();

        this.event("mouseup", e);
    }

    touchmove(e) {
        e.preventDefault();
        if (!this.started) return;

        this.event("touchmove", e);
    }
    touchstart(e) {
        if (!this.started) return;
        e.preventDefault();

        this.event("touchstart", e);
    }
    touchend(e) {
        if (!this.started) return;
        e.preventDefault();

        this.event("touchend", e);
    }

    deviceorientation(e) {
        this.event("deviceorientation", e);
    }

    keyprevdef(e) {
        if (!e.ctrlKey && !e.altKey && e.keyCode < 111) {
            e.preventDefault();
        }
    }

    keydown(e) {
        if (!this.started) return;
        this.keyprevdef(e);

        this.key[e.keyCode] = true;

        this.event("keydown", e);
    }
    keyup(e) {
        if (!this.started) return;
        this.keyprevdef(e);

        this.key[e.keyCode] = false;

        this.event("keyup", e);
    }
    blur(e) {
        this.key.length = 0;
    }
}

class P {
    constructor() {
        this._screen = null;
        this.lastScreen = null;
        this.nextScreen = new GameScreen(this);
        this.startScreen();
    }
    get screen() {
        return this._screen;
    }
    set screen(e) {
        if (this.screen) {
            this.screen.stop();
        }
        this.lastScreen = this.screen;
        this._screen = e;
        this.screen.start();
    }
    start() {
        this.screen.start();
    }
    stop() {
        this.screen.stop();
    }
    next() {
        this.screen = this.nextScreen;
        this.nextScreen = null;
    }
    startScreen() {
        this.screen = new StartScreen(this);
    }
    gameScreen() {
        this.screen = new GameScreen(this);
    }
}

const p = new P();