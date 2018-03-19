/* jslint browser: true */
/* global window */
/* global console */

'use strict';

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

// https://gist.github.com/gre/1650294
function easeInOutQuad(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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
    cursor() {}
}

class Data {
    constructor(p, isSim) {
        this.parent = p;
        this.sim = isSim;

        this.timeElapsed = 0;
        this._gridOffset = 0;
        this.difficulty = 0;
        this.speed = isSim ? 1.2 : 1;
        this.bulletPow = 1;
        
        this.timeAlive = 0;
        this.hitScore = 0;
        this.breakScore = 0;
        this.expScore = 0;

        this.afterMath = {
            hitScore: 0,
            breakScore: 0,
            expScore: 0
        };

        this._playerAlive = true;

        this.cooldown = {
            block: {
                time: isSim ? 500 : 1000,
                min: 175,
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
                time: 12000,
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

    get score() {
        return Math.floor(this.timeAlive * 0.01 + this.hitScore + this.expScore * 12 + this.breakScore * 16);
    }
    get afterMathScore() {
        return this.afterMath.hitScore + this.afterMath.expScore * 12 + this.afterMath.breakScore * 16;
    }

    get playerAlive() {
        return this._playerAlive;
    }
    set playerAlive(e) {
        if (!e && e != this._playerAlive) {
            this.parent.death();
        }
        this._playerAlive = e;
    }

    warmup(tt) {
        let pd;
        if (this.sim) {
            pd = true;
        } else {
            pd = !this.playerAlive;
        }

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
        if (!this.parent.focused) return;

        this.timeElapsed += tt;

        if(this.playerAlive) {
            this.timeAlive = this.timeElapsed;
        }

        this.gridOffset += Block.vy * tt * this.speed;
        this.warmup(tt * this.speed);
    }

    hitScoreAdd(e) {
        if (this.playerAlive) {
            this.hitScore += e;
        } else {
            this.afterMath.hitScore += e;
        }
    }
    expScoreAdd(e) {
        if (this.playerAlive) {
            this.expScore += e;
        } else {
            this.afterMath.expScore += e;
        }
    }
    breakScoreAdd(e) {
        if (this.playerAlive) {
            this.breakScore += e;
        } else {
            this.afterMath.breakScore += e;
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
        super(g, 3);
        
        this.parent.obs[this.layer].push(this);

        this.x = 0;
        this.y = 0;
        this.width = g.width;
        this.height = g.height;
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

        this.rewarded = false;

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

            if (this.playerDestroyed && !this.rewarded) {
                if (this.reallySpecial) {
                    this.parent.data.bulletPow += 0.5;
                    this.parent.data.breakScoreAdd(4);
                } else if (this.special) {
                    this.parent.data.cooldown.bullet.time *= 0.95;
                    this.parent.data.breakScoreAdd(16);
                } else {
                    this.parent.data.breakScoreAdd(1);
                }
                this.rewarded = true;
            }

            if (this.destroyedAniStep < 0) {
                this.rem = true;
            }
            return;
        }

        if (this.parent.data.playerAlive && this.y + this.height - this.margin > this.parent.height - this.parent.player.baseHeight) {
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
                this.lvalue += diff / (500 / tt);
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

        X.textBaseline = "middle";
        X.fillText(tv, -tw / 2, -2);
        X.restore();
    }
    remove() {
        if (this.rem) {
            let o = this.parent.obs[this.layer];
            o.splice(o.indexOf(this), 1);
        }
    }
}

class Bullet extends Thing {
    constructor(p, x, y, a, d, s) {
        super(p, 1);

        this.ang = a;
        this.x = x;
        this.y = y;
        this.spd = d;

        this.isSub = !!s;
        this.ttl = 2018 * this.speed; // It's actually 2016... as of March 6, 2018

        this.radius = 12;

        // *INTENTIONAL: Bullets not affected by speed
        this.vx = Math.cos(this.ang) * d;
        this.vy = Math.sin(this.ang) * d;

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
            this.parent.data.playerAlive > 0 &&
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
                    for (let i = 0; i < 4; i++) {
                        new Bullet(this.parent, this.x, this.y, this.ang + Math.TAU * i * 0.25, this.spd, true);
                        this.parent.data.expScoreAdd(1);
                    }
                }

                i.value -= this.parent.data.bulletPow;
                this.parent.data.hitScoreAdd(1);
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

        this.width = 112;
        this.height = 88;

        this.hbwidth = 84;
        this.hbheight = 84;
        this.hbxofs = 12;
        this.hbyofs = -4;

        this.x = (this.parent.width - this.width) / 2;
        this.y = (this.parent.height - this.height) / 4 * 3;
        this.speed = 0.005;
        this.color = this.parent.img.player[0];

        this.baseHeight = 256;
        this.baseReach = this.parent.width / 3;
        this.baseColor = this.parent.img.base;

        this.reachOrigin = {
            x: this.parent.width / 2,
            y: this.parent.height - this.baseHeight
        };
        this.reachWidth = 16;
        this.reachColor = "#FFFFFF";

        this.maxBullets = 7;
        this.bullets = 0;
        this._lives = 3;

        this.aniframe = 0;
    }

    get lives() {
        return this._lives;
    }
    set lives(e) {
        if (e < this._lives) {
            // add animation of player malfunctioning electric
        } else {
            // add animation of healing
        }

        this._lives = e;
    }

    draw() {
        if (!this.parent.data.playerAlive) return;
        var X = this.parent.X;
        this.drawReach(X);
        this.drawBase(X);
        this.drawPlayer(X);
    }
    drawBase(X) {
        let img = this.baseColor[this.lives - 1],
            af = Math.floor(this.aniframe) + 1,
            tr = this.aniframe % 1;
        
        if (!img) return;
        let imgf = img[af % img.length],
            imgl = img[(af - 1) % img.length];

        if (!imgf) return;

        X.save();

        X.imageSmoothingEnabled = false;
        
        X.drawImage(
            imgl, 
            0, 0, imgl.width, imgl.height,
            0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight
        );

        X.globalAlpha = easeInOutQuad(tr);
        X.drawImage(
            imgf,
            0, 0, imgf.width, imgf.height,
            0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight
        );

        X.restore();
    }
    drawPlayer(X) {
        X.imageSmoothingEnabled = true;
        
        var ofx = (this.x + this.width / 2) - this.reachOrigin.x,
            ofy = (this.y + this.height / 2) - this.reachOrigin.y;
        X.save();
        X.translate(this.x + this.width / 2, this.y + this.height / 2);
        X.rotate(Math.atan2(ofy, ofx));
        X.drawImage(this.color, 0, 0, this.color.width, this.color.height, -this.width / 2, -this.height / 2, this.width, this.height);
        X.restore();
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

    collide() {
        var x1 = this.x + this.hbxofs,
            y1 = this.y + this.hbyofs,
            w1 = this.hbwidth,
            h1 = this.hbheight;

        for (let i of this.parent.obs[1]) {
            if (!(i instanceof Block) || i.destroyed) continue;

            if (
                x1 < i.x + i.width &&
                x1 + w1 > i.x &&
                y1 < i.y + i.height &&
                y1 + h1 > i.y
            ) {
                i.value = 0;
                this.lives--;
                // at position of hit, add electric ball animation
            }
        }
    }

    spawnBullet() {
        var ofx = (this.x + this.width / 2) - this.reachOrigin.x,
            ofy = (this.y + this.height / 2) - this.reachOrigin.y,
            dist = Math.sqrt(ofx * ofx + ofy * ofy);

        new Bullet(
            this.parent,
            this.x + this.width / 2,
            this.y + this.height / 2,
            Math.atan2(ofy, ofx),
            dist / this.baseReach * 0.55 + 0.8
        );
        this.bullets++;

        // add vfx of recoil
    }

    tick(tt) {
        if (this.lives <= 0) {
            this.parent.data.playerAlive = false;
            return;
        }

        this.aniframe += tt / 250;

        var ax = 0,
            ay = 0,
            s = this.speed;

        if (this.parent.usingMouse) {
            let k = this.parent.mouse,
                x = this.x + this.width / 2,
                y = this.y + this.height / 2;

            if (x > k.x + this.width / 4) {
                ax -= 1;
            } else if (x < k.x - this.width / 4) {
                ax += 1;
            }
            if (y > k.y + this.height / 4) {
                ay -= 1;
            } else if (y < k.y - this.height / 4) {
                ay += 1;
            }
        } else {
            let k = this.parent.key;
            if (k[65] || k[37])
                ax -= 1;
            if (k[87] || k[38])
                ay -= 1;
            if (k[68] || k[39])
                ax += 1;
            if (k[83] || k[40])
                ay += 1;
        }

        if (ax && ay) {
            ax *= Math.SQRT1_2;
            ay *= Math.SQRT1_2;
        }

        this.vx += ax * s * tt;
        this.vy += ay * s * tt;

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
        this.collide();
    }
}

class ScoreDisplay extends Overlay {
    constructor(p) {
        super(p);
        
        this.data = this.parent.data;
    }
    draw() {
        var X = this.parent.X;

        X.save();

        X.font = "bold 52px Arial";
        X.fillStyle = "#FFFFFF";

        X.shadowBlur = 4;
        X.shadowColor = "#000000";
        X.shadowOffsetX = 2;
        X.shadowOffsetY = 2;

        X.fillText(this.data.score, 16, 1896);
        if (!this.parent.data.playerAlive) {
            X.fillText(this.data.afterMathScore, 16, 1836);
        }
        
        X.restore();
    }
}

class DeathPrompt extends Overlay{
    constructor(p) {
        super(p);
    }
    draw() {
        var X = this.parent.X;

        X.font = 'bold 64px Arial';
        X.fillStyle = '#888888';
        X.fillText("You died", 64, 940);
    }
}

class UIElement {
    constructor(p, x, y, w, h) {
        this.parent = p;
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.then = performance.now();

        this.eventListeners = {
            click: []
        };
    }

    checkInside(x, y) {
        if (
            this.x < x &&
            this.y < y &&
            this.x + this.width > x &&
            this.y + this.height > y
        ) {
            return true;
        } else {
            return false;
        }
    }

    draw() {}
    event() {}
    addEventListener(t, e) {
        var x = this.eventListeners[t];
        if (!x) return false;

        x.push(e);
    }
    _dispatchEvent(e) {
        var x = this.eventListeners[e];
        if (!x) return false;

        for (let i of x) {
            i();
        }
    }
}

class Button extends UIElement {
    constructor(p, x, y, w, h, bg, f, c, t) {
        super(p, x, y, w, h);

        this.bgcolor = bg;
        this.caption = t;
        this.color = c;
        this.font = f;

        this.border = 0;

        this.ani = {
            lightness: 0,
            lightnessT: 250,
            scale: 0,
            scaleT: 150
        };

        this.active = false;
        this.hover = false;
    }

    tick(tt) {
        if (this.hover) {
            this.ani.lightness += tt * (1000 / this.ani.lightnessT) / 1000;
        } else {
            this.ani.lightness -= tt * (1000 / this.ani.lightnessT) / 1000;
        }

        if (this.active) {
            this.ani.scale += tt * (1000 / this.ani.scaleT) / 1000;
        } else {
            this.ani.scale -= tt * (1000 / this.ani.scaleT) / 1000;
        }

        // clamping
        if (this.ani.lightness < 0) {
            this.ani.lightness = 0;
        } else if (this.ani.lightness > 1) {
            this.ani.lightness = 1;
        }
        if (this.ani.scale < 0) {
            this.ani.scale = 0;
        } else if (this.ani.scale > 1) {
            this.ani.scale = 1;
        }

        this.bgcolor += tt / 250;
    }

    draw() {
        var now = performance.now(),
            tt = now - this.then,
            X = this.parent.X,
            x = -this.width / 2,
            y = -this.height / 2,
            s = 1 - easeInOutQuad(this.ani.scale) * 0.035,
            w = 0;
        this.then = now;
        
        this.tick(tt);

        X.save();

        X.translate(this.x - x, this.y - y);
        X.scale(s, s);

        X.shadowBlur = 16;
        X.shadowColor = "#000000";
        X.shadowOffsetX = 4;
        X.shadowOffsetY = 4;

        X.fillStyle = "#000000";
        X.fillRect(x - this.border, y - this.border, this.width + this.border * 2, this.height + this.border * 2);

        X.shadowBlur = 0;
        X.shadowColor = "#rgba(0, 0, 0, 0)";
        X.shadowOffsetX = 0;
        X.shadowOffsetY = 0;

        X.fillStyle = `hsl(${this.bgcolor}, 100%, ${40 + (1 - easeInOutQuad(this.ani.lightness)) * 10}%)`;
        X.fillRect(x, y, this.width, this.height);

        X.shadowBlur = 4;
        X.shadowColor = "#000000";
        X.shadowOffsetX = 2;
        X.shadowOffsetY = 2;

        X.font = this.font;
        X.fillStyle = this.color;
        X.textBaseline = "middle";

        w = X.measureText(this.caption).width;
        X.fillText(this.caption, -w / 2, -2);

        X.restore();
    }

    mousedown(e) {
        if (this.checkInside(this.parent.mouse.x, this.parent.mouse.y)) {
            this.active = true;
        }
    }

    mouseup(e) {
        if (this.checkInside(this.parent.mouse.x, this.parent.mouse.y)) {
            this._dispatchEvent("click");
        }
        this.active = false;
    }

    mousemove(e) {
        this.hover = this.checkInside(this.parent.mouse.x, this.parent.mouse.y);
    }

    cursor() {
        if (this.hover) {
            return "pointer";
        }
    }

    event(t, e) {
        switch (t) {
            case "mousedown":
                this.mousedown(e);
                break;
            case "mousemove":
                this.mousemove(e);
                break;
            case "mouseup":
                this.mouseup(e);
                break;
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
        this.scaleX = 1;
        this.scaleY = 1;

        this.key = [];

        this.usingMouse = false;
        this.mouse = {
            x: 0,
            y: 0
        };

        this.focused = true;

        this.lastSize = {
            w: 0,
            h: 0
        };
        this.resizing = false;
        this.then = 0;

        this.requiredDependencies = 0;
        this._loadedDependencies = 0;
        this.ready = false;

        this.started = false;
        this.autoStart = false;
    }

    get loadedDependencies() {
        return this._loadedDependencies;
    }

    set loadedDependencies(e) {
        if (e >= this.requiredDependencies) {
            this.ready = true;
            if (this.autoStart) {
                this.start();
            }
            return;
        }

        this._loadedDependencies = e;
    }

    reqanf() {
        requestAnimationFrame(() => this.draw());
    }

    start() {}
    stop() {}
    resize() {
        if (this.resizing) return;
        var dpr = window.devicePixelRatio || 1,
            w = window.innerWidth,
            h = window.innerHeight;

        if (w == this.lastSize.w && h == this.lastSize.h) {
            this.resizeLoop();
            this.resizing = true;
            return;
        }

        if (h * this.ratio < w) {
            this.canvas.classList.add("h");
            document.body.classList.add("h");

            this.canvas.width = h * this.ratio * dpr;
            this.canvas.height = h * dpr;

            this.offsetX = (w - this.canvas.width / dpr) / 2;
            this.canvas.style.left = this.offsetX + "px";

            this.offsetY = 0;
            this.canvas.style.top = 0;
        } else {
            this.canvas.classList.remove("h");
            document.body.classList.remove("h");

            this.canvas.width = w * dpr;
            this.canvas.height = w / this.ratio * dpr;

            this.offsetX = 0;
            this.canvas.style.left = 0;

            this.offsetY = (h - this.canvas.height / dpr) / 2;
            this.canvas.style.top = this.offsetY + "px";
        }

        this.scaleX = this.canvas.width / this.width;
        this.scaleY = this.canvas.height / this.height;
        this.X.scale(this.scaleX, this.scaleY);
    }
    resizeLoop() { // because ios is bad
        var w = window.innerWidth,
            h = window.innerHeight;
        if (w == this.lastSize.w && h == this.lastSize.h) {
            requestAnimationFrame(() => this.resizeLoop());
        } else {
            this.resizing = false;
            this.resize();
        }
    }

    event(t, e) {
        this.eachObs(j => j.event(t, e));
    }

    mousemove(e) {
        if (!this.started) return;
        e.preventDefault();

        var dpr = window.devicePixelRatio || 1,
            cur = "default";

        this.mouse.x = (e.clientX - this.offsetX) / this.scaleX * dpr;
        this.mouse.y = (e.clientY - this.offsetY) / this.scaleY * dpr;

        this.usingMouse = true;

        
        this.eachObs(e => {
            cur = e.cursor() || cur;
        });
        this.canvas.style.cursor = cur;

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

        var dpr = window.devicePixelRatio || 1,
            f = e.changedTouches[0];

        this.mouse.x = (f.clientX - this.offsetX) / this.scaleX * dpr;
        this.mouse.y = (f.clientY - this.offsetY) / this.scaleY * dpr;

        this.event("touchmove", e);
    }
    touchstart(e) {
        if (!this.started) return;
        e.preventDefault();

        var dpr = window.devicePixelRatio || 1,
            f = e.changedTouches[0];

        this.mouse.x = (f.clientX - this.offsetX) / this.scaleX * dpr;
        this.mouse.y = (f.clientY - this.offsetY) / this.scaleY * dpr;
        this.usingMouse = true;

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
        this.usingMouse = false;

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
        this.focused = false;
        this.then = performance.now();
    }
    focus(e) {
        this.focused = true;
        this.prevframefoc = false;
    }
}

class StartScreen extends Screen {
    constructor(e) {
        super(e);

        this.fadeOut = null;
        this.fadeOutTime = 150;
        this.fading = false;

        this.sim = new GameScreen(this, true);
        this.sim.start();

        this.color = "#FFFFFF";

        this.autoStart = true;

        this.mouse = {
            x: 0,
            y: 0
        };

        this.obs = [];

        this.setup();
    }

    setup() {
        this.listenerFuncs = {
            resize: e => this.resize(e),
            mouseup: e => this.mouseup(e),
            mousedown: e => this.mousedown(e),
            mousemove: e => this.mousemove(e)
        };

        if (!document.fonts.check("1em 'Parua One'") || !document.fonts.check("1em 'Russo One'")) {
            this.requiredDependencies++;
            document.fonts.ready.then(() => this.loadedDependencies++);
        }

        addEventListener("resize", this.listenerFuncs.resize);

        addEventListener("mouseup", this.listenerFuncs.mouseup);
        addEventListener("touchend", this.listenerFuncs.mouseup);

        addEventListener("mousedown", this.listenerFuncs.mousedown);
        addEventListener("touchstart", this.listenerFuncs.mousedown);

        addEventListener("mousemove", this.listenerFuncs.mousemove);
        addEventListener("touchmove", this.listenerFuncs.mousemove);

        {
            let a = new Button(this, 300, 956, 480, 64, 120, "48px 'Bree Serif'", "#FFFFFF", "Play");
            a.addEventListener("click", () => this.play());
            this.obs.push(a);
        }
        {
            let a = new Button(this, 300, 1030, 480, 64, 75, "48px 'Bree Serif'", "#FFFFFF", "Instructions");
            a.addEventListener("click", () => alert("To play the game, press the play button. :)"));
            this.obs.push(a);
        }

        this.resize();
        this.draw();
    }
    start() {
        if (this.started) return;
        if (!this.ready) return;
        this.started = true;
        this.draw();
    }
    stop() {
        this.fadeOut = this.fadeOutTime;
        this.fading = true;

        removeEventListener("resize", this.listenerFuncs.resize);
        removeEventListener("mouseup", this.listenerFuncs.mouseup);
        removeEventListener("touchend", this.listenerFuncs.mouseup);
    }

    eachObs(e) {
        for (let i of this.obs) {
            e(i);
        }
    }

    draw(e) {
        var X = this.X;
        if (!this.ready) {
            X.fillRect(0, 0, this.width, this.height);
            X.font = "bold 124px 'Courier New'";
            X.fillStyle = "#FFF";
            X.fillText("Loading...", 168, 830);
            return;
        }
        if (!this.started) return;
        if (!this.started && !e) return;
        var now = performance.now(),
            tt = now - this.then;
        this.then = now;

        X.save();
        if (this.fading) {
            this.fadeOut -= tt;
            if (this.fadeOut < 0) {
                this.fading = false;
                this.sim.stop();
                this.started = false;
                return;
            }

            X.globalAlpha = this.fadeOut / this.fadeOutTime;
        }

        this.sim.draw();
        this.eachObs(e => e.draw());

        // Draw text
        var txw;
        X.shadowBlur = 16;
        X.shadowColor = "#000000";
        X.shadowOffsetX = 4;
        X.shadowOffsetY = 4;
        X.fillStyle = this.color; 
        
        {
            X.font = "124px 'Russo One'";
            let txt = "Block Invasion",
                w = X.measureText(txt).width,
                x = (this.width - w) / 2,
                y = 830;
            txw = x + w;

            X.fillText(txt, x, y);
        } {
            X.font = "64px 'Patua One'";
            let txt = "Created By JaPNaA",
                w = X.measureText(txt).width,
                x = txw - w,
                y = 900;

            X.fillText(txt, x, y);
        }

        X.restore();

        this.reqanf();
    }
    play() {
        this.parent.next();
    }
}

class GameScreen extends Screen {
    constructor(e, isSim) {
        super(e);

        this.sim = !!isSim;

        this.obs = [
            [],
            [],
            [],
            []
        ];

        this.prevframefoc = true;

        this._usingMouse = false;

        this.data = null;
        this.persistentData = new PersistentData();

        this.loads = {
            img: {
                player: ["imgs/player0.png"],
                base: [
                    ["imgs/base0_0.png", "imgs/base0_1.png", "imgs/base0_2.png", "imgs/base0_3.png", "imgs/base0_4.png", "imgs/base0_5.png"],
                    ["imgs/base1_0.png", "imgs/base1_1.png", "imgs/base1_2.png", "imgs/base1_3.png", "imgs/base1_4.png", "imgs/base1_5.png"], 
                    ["imgs/base2.png"]
                ]
            }
        };
        this.img = {};

        this.setup();
    }

    get usingMouse() {
        return this._usingMouse;
    }
    set usingMouse(e) {
        this.canvas.style.cursor = e ? "default" : "none";

        this._usingMouse = e;
    }

    preload() {
        if (this.sim) {
            this.requiredDependencies = 0;
            this.loadedDependencies = 0;
            this.ready = true;
        }

        // very ugly, fix soon

        for (let ip in this.loads) {
            let i = this.loads[ip];

            for (let jp in i) {
                let j = i[jp];

                if (typeof j == "string") {
                    this[ip][jp] = loadImage(j, this);
                } else if (j instanceof Array) {
                    let a = [];
                    for (let x of j) {
                        if (typeof x == "string") {
                            a.push(loadImage(x, this));
                        } else {
                            let b = [];
                            for (let y of x) {
                                b.push(loadImage(y, this));
                            }
                            a.push(b);
                        }
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

        if (!this.sim) {
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
                focus: e => this.focus(e),
                deviceorientation: e => this.deviceorientation(e),
                scroll: function (e) {
                    e.preventDefault();
                    document.body.scrollTop = document.body.scrollLeft = 0;
                },
                contextmenu: e => e.preventDefault()
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
            addEventListener("focus", listenerFuncs.focus, passiveFalse);

            addEventListener("contextmenu", listenerFuncs.contextmenu);

            // TEMP! Uncomment
            // addEventListener("deviceorientation", listenerFuncs.deviceorientation, {
            //     passive: true
            // });

            addEventListener("scroll", listenerFuncs.scroll, true);

            this.listenerFuncs = listenerFuncs;
        }

        this.X.imageSmoothingEnabled = false;
    }

    reset() {
        this.data = null;
        this.player = null;
        this.then = performance.now();
        for (let i of this.obs) {
            i.length = 0;
        }

        this.data = new Data(this, this.sim);
        new Background(this);
        
        if (this.sim) {
            this.player = {
                lives: 0
            };
        } else {
            this.player = new Player(this);
            new ScoreDisplay(this);
        }
    }

    start() {
        if (!this.ready) {
            this.autoStart = true;
            return true;
        }
        if (this.started) return;
        this.started = true;

        this.reset();

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

    drawPaused() {
        var X = this.X;

        X.fillStyle = "#00000038";
        X.fillRect(0, 0, this.width, this.height);

        {
            X.font = "bold 72px Arial";

            let txt = "Paused",
                txtw = X.measureText(txt).width;

            X.fillStyle = "#FFFFFF";
            X.fillText(txt, (this.width - txtw) / 2, 956);
        }
    }

    draw() {
        if (!this.started) return;

        if (!this.prevframefoc && this.focused) {
            this.then = performance.now();
            console.log("rtf");
        }

        this.prevframefoc = this.focused;

        if (!this.focused) {
            this.drawPaused();
            this.reqanf();
            return;
        }
        var now = performance.now(),
            tt = now - this.then;
        this.then = now;

        this.tick(tt);

        this.eachObs(j => j.draw(tt));

        if (this.parent.lastScreen && this.parent.lastScreen.fading) {
            this.parent.lastScreen.draw(true);
        }

        if (this.sim) return;
        this.reqanf();
    }

    death() {
        new DeathPrompt(this);
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
        if (!this._screen) {
            this.lastScreen = this.screen;
            this._screen = e;
        } else
        if (!this.screen.started) {
            if (this.screen.start()) {
                this.swsc(e);
            }
        } else {
            this.swsc(e);
        }
    }
    swsc(e) {
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
        if (this.screen != this.nextScreen) return;
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