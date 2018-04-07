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
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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

        this.blocksDestroyed = 0;

        this.afterMath = {
            hitScore: 0,
            breakScore: 0,
            expScore: 0,
            done: false
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
                min: 8,
                now: 0,
                e: 0
            },
            powUp: {
                time: 9000,
                now: 30000,
                drpd: 1,
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

        this.powUpTypes = [{
            color: "#FFEA0F",
            payload: () => {
                this.parent.player.powUp.bullet += 3000;
                this.parent.player.maxBullets += randInt(2);
            }
        }, {
            color: "#3633f1",
            payload: () => {
                this.parent.player.powUp.invincibility += 12500;
            }
        }, {
            color: "#d81c1c",
            payload: () => {
                for (let i of this.parent.obs[1]) {
                    if (i instanceof Block)
                        i.value = 0;
                }
            }
        }, {
            color: "#33ff00",
            payload: () => {
                this.parent.player.lives += 1;
            }
        }];

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

        if (this.playerAlive) {
            this.timeAlive = this.timeElapsed;
        } else {
            if (!this.afterMath.done) {
                let f = false;
                for (let i of this.parent.obs) {
                    if (i.find(e => e instanceof Bullet)) {
                        f = true;
                        break;
                    }
                }
                if (!f) {
                    this.afterMath.done = true;
                    this.parent.deathPrompt.afterMathDone();
                }
            }
        }

        this.gridOffset += Block.vy * tt * this.speed;
        this.warmup(tt * this.speed);
    }

    hitScoreAdd(e) {
        if (this.playerAlive) {
            this.hitScore += e;
        } else if (!this.afterMath.done) {
            this.afterMath.hitScore += e;
        }
    }
    expScoreAdd(e) {
        if (this.playerAlive) {
            this.expScore += e;
        } else if (!this.afterMath.done) {
            this.afterMath.expScore += e;
        }
    }
    breakScoreAdd(e) {
        if (this.playerAlive) {
            this.breakScore += e;
        } else if (!this.afterMath.done) {
            this.afterMath.breakScore += e;
        }
    }
    blocksDestroyedAdd(e) {
        if (this.playerAlive) {
            this.blocksDestroyed += e;
        }
    }
}

class PersistentData {
    constructor() {
        this.lskey = "blockInvasionData";

        this._highscore = 0;
        this._highAftermathScore = 0;
        this.timePlayed = 0;
        this.totalScore = 0;
        this.totalAftermathScore = 0;
        this.totalBlocksDestroyed = 0;
        this.totalBulletExplodes = 0;
        this.totalBlocksHit = 0;
        this.gamesPlayed = 0;

        try {
            if (localStorage[this.lskey]) {
                let {
                    highscore,
                    highAftermathScore,
                    timePlayed,
                    totalScore,
                    totalAftermathScore,
                    totalBlocksDestroyed,
                    totalBulletExplodes,
                    totalBlocksHit,
                    gamesPlayed
                } = JSON.parse(localStorage[this.lskey]);
                this._highscore = highscore || this._highscore;
                this._highAftermathScore = highAftermathScore || this._highAftermathScore;
                this.timePlayed = timePlayed || this.timePlayed;
                this.totalScore = totalScore || this.totalScore;
                this.totalAftermathScore = totalAftermathScore || this.totalAftermathScore;
                this.totalBlocksDestroyed = totalBlocksDestroyed || this.totalBlocksDestroyed;
                this.totalBulletExplodes = totalBulletExplodes || this.totalBulletExplodes;
                this.totalBlocksHit = totalBlocksHit || this.totalBlocksHit;
                this.gamesPlayed = gamesPlayed || this.gamesPlayed;
            }
        } catch (e) {
            console.warn("localStorage persistantData corrupt");
        }

        this.upd();
    }
    get highscore() {
        return this._highscore;
    }
    set highscore(e) {
        if (e > this._highscore) {
            this._highscore = e;
        }
    }

    get highAftermathScore() {
        return this._highAftermathScore;
    }
    set highAftermathScore(e) {
        if (e > this._highAftermathScore) {
            this._highAftermathScore = e;
        }
    }

    upd() {
        localStorage[this.lskey] = JSON.stringify({
            highscore: this._highscore,
            highAftermathScore: this._highAftermathScore,
            timePlayed: this.timePlayed,
            totalScore: this.totalScore,
            totalAftermathScore: this.totalAftermathScore,
            totalBlocksDestroyed: this.totalBlocksDestroyed,
            totalBulletExplodes: this.totalBulletExplodes,
            totalBlocksHit: this.totalBlocksHit,
            gamesPlayed: this.gamesPlayed
        });
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
    constructor(p, x, yo) {
        super(p, 1);

        this.width = Block.size;
        this.height = Block.size;
        this.margin = 8;

        this.x = x * this.width + this.margin / 2 - 1;
        this.y = -this.height * 2 + yo;
        this.vy = Block.vy;

        this.value = 1 * this.parent.data.difficulty;
        this.lvalue = this.value;

        this.payloaded = false;

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

            if (!this.payloaded) {
                if (this.playerDestroyed) {
                    if (this.reallySpecial) {
                        this.parent.data.bulletPow += 1;
                        this.parent.data.breakScoreAdd(4);
                    } else if (this.special) {
                        this.parent.data.cooldown.bullet.time *= 0.925;
                        this.parent.data.breakScoreAdd(16);
                    } else {
                        this.parent.data.breakScoreAdd(1);
                    }
                    this.payloaded = true;
                } else {
                    if (this.parent.player.powUp.invincibility <= 0 && this.parent.player.lives > 0) {
                        this.parent.data.breakScoreAdd(Math.min(this.value, -1) * 100);
                    }
                }
                this.parent.data.blocksDestroyedAdd(1);
                this.payloaded = true;
            }

            if (this.destroyedAniStep < 0) {
                this.rem = true;
            }
            return;
        }

        if (
            this.parent.data.playerAlive &&
            this.y + this.height - this.margin > this.parent.height - this.parent.player.baseHeight
        ) {
            let x = this.x + this.width / 2,
                y = this.y + this.height / 2,
                j = this.parent.sprsht.fireexp.e;
            this.destroyed = true;
            this.parent.player.lives--;
            new Effects(this.parent, j, x, y, 224, 224);
        }

        if (this.y > this.parent.height) {
            this.rem = true;
        }

        if (this.value <= 0) { // remove if 0 or outside screen
            this.destroyed = true;
            this.playerDestroyed = true;
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
}

class PowUp extends Thing {
    constructor(p) {
        super(p, 1);

        this.type = this.parent.data.powUpTypes[randInt(this.parent.data.powUpTypes.length)];

        this.radius = Block.size / 2;
        this.margin = Block.size / 4;

        this.x = this.radius + Math.random() * (this.parent.width - this.radius * 2);
        this.y = -this.radius * 2;
        this.vy = Block.vy;

        this.payloaded = false;

        this.destroyed = false;
        this.destroyedAniTime = 350;
        this.destroyedAniStep = 1;

        this.color = this.type.color;

        let tx = Math.floor(this.x),
            ty = Math.floor(this.y);

        for (let i of this.parent.obs[this.layer]) {
            if (i !== this && tx == Math.floor(i.x) && ty == Math.floor(i.y)) {
                i.rem = true;
            }
        }
    }

    get speed() {
        return this.parent.data.blockSpeed;
    }

    tick(tt) {
        this.y += this.vy * this.speed * tt;
        if (this.destroyed) {
            this.destroyedAniStep -= tt / this.destroyedAniTime;

            if (!this.payloaded) {
                this.type.payload();
                this.payloaded = true;
            }

            if (this.destroyedAniStep < 0) {
                this.rem = true;
            }
            return;
        }

        if (this.y > this.parent.height) {
            this.rem = true;
        }
    }
    draw() {
        var X = this.parent.X,
            tr = this.destroyedAniStep * this.destroyedAniStep * this.destroyedAniStep,
            sc = 2 - tr;
        X.save();
        X.translate(this.x, this.y);
        X.scale(sc, sc);
        X.globalAlpha = tr;

        X.shadowBlur = 24;
        X.shadowColor = "#FFFFFF80";
        X.shadowOffsetX = 0;
        X.shadowOffsetY = 0;

        X.beginPath();
        X.fillStyle = this.color;
        X.arc(0, 0, this.radius - this.margin, 0, Math.TAU);
        X.fill();

        X.restore();
    }
}

class Bullet extends Thing {
    constructor(p, x, y, a, d, s, pw) {
        super(p, 1);

        this.ang = a;
        this.x = x;
        this.y = y;
        this.spd = d;

        this.sub = s;
        this.powerful = !!pw;
        this.ttl = 2018 * (Math.log2(this.speed) + 1); // It's actually 2016... as of March 6, 2018

        if (this.sub) {
            this.ttl *= this.sub;
        }

        // *INTENTIONAL: Bullets not affected by speed
        this.vx = Math.cos(this.ang) * d;
        this.vy = Math.sin(this.ang) * d;

        if (this.powerful) {
            this.color = "#FFEA0F";
            this.radius = 16;
        } else {
            this.color = "#00BEF3";
            this.radius = 12;
        }
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
            if (i instanceof Block && !i.destroyed) {
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
                        this.explode(4);
                    }

                    if (this.powerful) {
                        i.value -= i.value;
                    } else {
                        i.value -= this.parent.data.bulletPow;
                    }
                    this.parent.data.hitScoreAdd(1);
                    if (i.value <= 0) i.playerDestroyed = true;
                }
            } else if (i instanceof PowUp && !i.destroyed) {
                let ofx = this.x - i.x,
                    ofy = this.y - i.y,
                    dist = Math.sqrt(ofx * ofx + ofy * ofy);

                if (i.radius + this.radius > dist) {
                    i.destroyed = true;
                    this.explode(7, true);
                }
            }
        }
    }
    explode(e, pw) {
        let f = 1 / e;
        this.rem = true;
        if (this.powerful) {
            for (let i of this.parent.obs[1]) {
                if (i instanceof Block) {
                    i.value = 0;
                    i.playerDestroyed = true;
                }
            }
        }
        for (let i = 0; i < e; i++) {
            new Bullet(this.parent, this.x, this.y, this.ang + Math.TAU * i * f, this.spd, (this.sub * 0.85) || 1, pw || this.powerful);
            this.parent.data.expScoreAdd(1);
        }
    }

    tick(tt) {
        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.boundaries();
        this.collide();

        if (this.sub) {
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
            if (!this.sub)
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
        this.drawLives = 3;

        this.powUp = {
            bullet: 0,
            invincibility: 0
        };

        this.aniframe = 0;
        this.aniInvinFrame = 0;
        this.aniInvinTime = 250;
        this.changeDrawLives = 0;
    }

    get lives() {
        return this._lives;
    }
    set lives(e) {
        if (this.powUp.invincibility > 0) return;
        let L = e < this._lives;
        if (L) {
            new Effects(this.parent, this.parent.sprsht.baseexp.e, 0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight);
        } else {
            new Effects(this.parent, this.parent.sprsht.baseheal.e, 0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight);
        }
        this.changeDrawLives = L ? this.parent.sprsht.baseexp.len / 2 : this.parent.sprsht.baseheal.len / 2;
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
        let af = Math.floor(this.aniframe) + 1,
            tr = this.aniframe % 1,
            img;

        if (this.lives > 3) {
            img = this.baseColor[this.baseColor.length - 1];
        } else {
            img = this.baseColor[this.drawLives - 1];
        }

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

        X.globalAlpha = 1;

        X.restore();
        if (this.powUp.invincibility > 0) {
            this.drawInvincibility(X);
        }
    }
    drawInvincibility(X) {
        let fr = this.aniframe * 0.3782,
            img = this.parent.img.pow,
            af = Math.floor(fr) + 1,
            tr = fr % 1;

        if (!img) return;
        let imgf = img[af % img.length],
            imgl = img[(af - 1) % img.length],
            tre = easeInOutQuad(tr);

        if (!imgf) return;

        X.save();

        X.imageSmoothingEnabled = false;

        X.globalAlpha = (1 - tre) * this.aniInvinFrame;
        X.drawImage(
            imgl,
            0, 0, imgl.width, imgl.height,
            0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight
        );

        X.globalAlpha = tre * this.aniInvinFrame;
        X.drawImage(
            imgf,
            0, 0, imgf.width, imgf.height,
            0, this.parent.height - this.baseHeight, this.parent.width, this.baseHeight
        );

        X.globalAlpha = 1;

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
                i.rem = true;
                this.lives--; {
                    let x = (x1 + w1 / 2 + i.x + i.width / 2) / 2,
                        y = (y1 + h1 / 2 + i.y + i.height / 2) / 2,
                        j = this.parent.sprsht.elctexp.e;
                    new Effects(this.parent, j, x, y, 192, 192);
                }
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
            dist / this.baseReach * 0.55 + 0.8,
            false,
            this.powUp.bullet > 0
        );
        this.bullets++;
    }

    tick(tt) {
        if (this.lives <= 0) {
            this.parent.data.playerAlive = false;
            return;
        }

        this.aniframe += tt / 250;
        if (this.powUp.invincibility > 5000) {
            this.aniInvinFrame += tt / this.aniInvinTime;
            if (this.aniInvinFrame > 1) {
                this.aniInvinFrame = 1;
            }
        } else {
            this.aniInvinFrame = this.powUp.invincibility / 5000;
        }
        if (this.changeDrawLives > 0) {
            this.changeDrawLives -= tt;
        } else {
            this.changeDrawLives = 0;
            this.drawLives = this.lives;
        }

        for (let i in this.powUp) {
            if (this.powUp[i] > 0) {
                this.powUp[i] -= tt * this.parent.data.speed;
            } else {
                this.powUp[i] = 0;
            }
        }

        var ax = 0,
            ay = 0,
            s = this.speed;

        if (this.parent.usingMouse) {
            let mx = this.parent.mouse.x,
                my = this.parent.mouse.y,
                mofx = mx - this.reachOrigin.x,
                mofy = my - this.reachOrigin.y,
                mang = Math.atan2(mofy, mofx),
                mdist = Math.min(this.baseReach,
                    Math.sqrt(mofx * mofx + mofy * mofy)
                ),
                tx = Math.cos(mang) * mdist + this.reachOrigin.x,
                ty = Math.sin(mang) * mdist + this.reachOrigin.y,
                x = this.x + this.width / 2,
                y = this.y + this.height / 2;

            if (x + this.width / 5 < tx) {
                ax += 1;
            } else if (x - this.width / 5 > tx) {
                ax -= 1;
            }
            if (y + this.height / 5 < ty) {
                ay += 1;
            } else if (y - this.height / 5 > ty) {
                ay -= 1;
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
        if (this.parent.data.cooldown.bullet.e > 3)
            this.parent.data.cooldown.bullet.e = 3;
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
        if (!this.parent.data.playerAlive) return;
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

class DeathPrompt extends Overlay {
    constructor(p) {
        super(p);

        this.x = 0;
        this.y = 0;
        this.width = 1080;
        this.height = 1080;

        this.obs = [];

        this.aniFrame = 0;
        this.aniTime = 750;

        this.aniPlusFrame = 0;
        this.aniPlusTime = 2000;

        this.aftmd = false;

        this.bgcolor = "#434343EB";
        this.color = "#FFFFFF";

        this.option = 0;
        this.stopping = false;
        this.done = false;

        this.buttonOfy = 860;

        this.payloaded = false;

        {
            let PD = this.parent.persistentData,
                D = this.parent.data;
            this.prevHighscore = PD.highscore;
            PD.highscore = D.score;
            PD.totalScore += D.score;
            PD.timePlayed += D.timeElapsed;
            PD.totalBlocksDestroyed += D.blocksDestroyed;
            PD.totalBulletExplodes += D.expScore;
            PD.totalBlocksHit += D.hitScore;
            PD.gamesPlayed += 1;
            PD.upd();
        }

        {
            let a = new Button(this, 84, 1700, 424, 64, 120, "48px 'Bree Serif'", "#FFFFFF", "Play agian"),
                b = new Button(this, 572, 1700, 424, 64, 0, "48px 'Bree Serif'", "#FFFFFF", "Title Screen");
            a.addEventListener("click", () => this.playAgain());
            b.addEventListener("click", () => this.titleScreen());
            a.parent = this.parent;
            b.parent = this.parent;
        }
    }

    close() {
        this.stopping = true;
        this.parent.closing = true;
    }

    playAgain() {
        this.close();
        this.option = 1;
    }
    titleScreen() {
        this.close();
        this.option = 2;
    }

    tick(tt) {
        if (this.done) {
            this.rem = true;
            switch (this.option) {
                case 1:
                    this.parent.reset();
                    break;
                case 2:
                    this.parent.parent.startScreen();
                    break;
                default:
                    throw new Error("Unknown option");
            }
        }

        if (this.stopping) {
            if (this.aniFrame > 0) {
                this.aniFrame -= tt / this.aniTime;
            } else {
                this.aniFrame = 0;
                this.done = true;
            }
        } else {
            if (this.aniFrame < 1) {
                this.aniFrame += tt / this.aniTime;
            } else {
                this.aniFrame = 1;
            }
        }

        if (this.aniPlusFrame < 1) {
            this.aniPlusFrame += tt / this.aniPlusTime;
        } else {
            if (this.parent.data.afterMath.done) {
                this.aniPlusFrame = 1;
            } else {
                this.aniPlusFrame = 0;
            }
        }

        this.y = this.parent.height - easeInOutQuad(this.aniFrame) * this.height;
        for (let i of this.obs) {
            i.y = this.y + this.buttonOfy;
        }

        this.parent.persistentData.highAftermathScore = this.parent.data.afterMathScore;
        if (this.parent.data.afterMath.done && !this.payloaded) {
            this.parent.persistentData.totalAftermathScore += this.parent.data.afterMathScore;
            this.payloaded = true;
            this.parent.persistentData.upd();
        }
    }

    draw() {
        var X = this.parent.X,
            D = this.parent.data,
            PD = this.parent.persistentData;

        X.save();
        X.translate(this.x, this.y);

        X.fillStyle = this.bgcolor;
        X.fillRect(0, 0, this.width, this.height);

        X.fillStyle = this.color;
        X.font = "128px 'Russo One'";
        X.fillText("You died", 84, 168);

        X.font = "52px 'Bree Serif'";
        X.fillText("You survived for " + Math.floor(D.timeAlive) / 1000 + " seconds", 84, 256);
        X.fillText("You destroyed " + D.blocksDestroyed + " blocks", 84, 320);
        X.fillText("You hit blocks " + D.hitScore + " times", 84, 384);
        X.fillText("Your bullets exploded " + D.expScore + " times", 84, 448);

        X.font = "64px 'Bree Serif'";
        X.fillText("You scored " + D.score + " points!", 84, 536); {
            let txt = "Aftermath score: " + D.afterMathScore,
                w = X.measureText(txt).width,
                pa = X.globalAlpha;
            X.fillText(txt, 84, 608);

            if (this.aniPlusFrame < 0.5) {
                X.globalAlpha = easeInOutQuad(this.aniPlusFrame / 0.5);
            } else {
                X.globalAlpha = easeInOutQuad(1 - (this.aniPlusFrame - 0.5) / 0.5);
            }

            X.fillText("+", 84 + w, 608);

            X.globalAlpha = pa;
        }


        if (this.prevHighscore < D.score) {
            X.font = "48px 'Bree Serif'";
            X.fillText("YOU BEAT YOUR HIGHSCORE! ", 84, 696);
            X.fillText("You scored " + (D.score - this.prevHighscore) + " more points than", 84, 748);
            X.fillText("your highscore, " + this.prevHighscore, 84, 800);
        } else if (this.prevHighscore == D.score) {
            X.font = "48px 'Bree Serif'";
            X.fillText("YOU BEAT YOur... oh wait ", 84, 696);
            X.fillText("You scored your highscore, " + this.prevHighscore, 84, 748);
            X.fillText("No new highscore for you.", 84, 800);
        } else {
            X.font = "48px 'Bree Serif'";
            X.fillText("Your only " + (this.prevHighscore - D.score) + " points from", 84, 696);
            X.fillText("your highscore, " + this.prevHighscore, 84, 748);
        }

        X.restore();

        for (let i of this.obs) {
            i.draw();
        }
    }
    event(t, e) {
        for (let i of this.obs) {
            i.event(t, e);
        }
    }
    cursor() {
        let r = "default";

        for (let i of this.obs) {
            r = i.cursor() || r;
        }

        return r;
    }
    afterMathDone() {
        this.aftmd = true;
    }
}

class SprSht {
    constructor(img, sg, len) {
        this.width = img.width / sg;
        this.height = img.height;
        this.length = len;
        this.imagesLength = sg;
        this.img = img;
    }
}

class Effects extends Overlay {
    constructor(p, t, x, y, w, h) {
        super(p);

        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.aniframe = 0;
        this.anitime = t.length;

        this.imgLength = t.imagesLength;
        this.sprsht = t;
    }
    tick(tt) {
        if (this.aniframe < 1) {
            this.aniframe += tt / this.anitime;
        } else {
            this.rem = true;
        }
    }
    draw() {
        var X = this.parent.X,
            x = Math.floor(this.aniframe * this.sprsht.imagesLength);
        X.imageSmoothingEnabled = false;
        X.drawImage(
            this.sprsht.img,
            x * this.sprsht.width, 0, this.sprsht.width, this.sprsht.height,
            this.x, this.y, this.width, this.height
        );
    }
}

class UIElement {
    constructor(p, x, y, w, h) {
        this.parent = p;
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.rem = false;

        this.then = performance.now();

        this.eventListeners = {
            click: []
        };

        this.parent.obs.push(this);
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
    cursor() {}
    remove() {
        if (this.rem) {
            let o = this.parent.obs;
            o.splice(o.indexOf(this), 1);
        }
    }
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
    /**
     * Creates a new button on Screen 
     * @param {!Screen} p parent element
     * @param {!Number} x X coordinate
     * @param {!Number} y Y coordinate
     * @param {!Number} w width
     * @param {!Number} h height
     * @param {!Number} bg background color hue
     * @param {!String} f font
     * @param {!String} c color
     * @param {!String} t text
     */
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
        if (this.checkInside(this.parent.mouse.x, this.parent.mouse.y) && this.active) {
            this._dispatchEvent("click");
        }
        this.active = false;
    }
    mousemove(e) {
        this.hover = this.checkInside(this.parent.mouse.x, this.parent.mouse.y);
    }

    touchstart(e) {
        this.mousemove();
        this.mousedown();
    }
    touchmove(e) {
        this.mousemove();
    }
    touchend(e) {
        this.mousemove();
        this.mouseup();
        this.hover = false;
    }

    cursor() {
        if (this.checkInside(this.parent.mouse.x, this.parent.mouse.y) && !this.parent.pannelOpen) {
            return "pointer";
        }
    }

    event(t, e) {
        if (this.parent.pannelOpen) {
            this.active = false;
            this.hover = false;
            return;
        }
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
            case "touchstart":
                this.touchstart(e);
                break;
            case "touchmove":
                this.touchmove(e);
                break;
            case "touchend":
                this.touchend(e);
                break;
        }
    }
}
class Pannel extends UIElement {
    constructor(p, bg) {
        super(p, 0, p.height, p.width, p.height - 360);

        this.targetY = p.height - this.height;
        this.startY = this.y;

        this.bgColor = bg;
        this.backArrow = new Path2D(); {
            let x = this.backArrow;
            x.moveTo(36, 0);
            x.lineTo(0, 32);
            x.lineTo(36, 64);
        }

        this.aniFrame = 0;
        this.aniTime = 750;
        this.closing = false;

        this.ani = {
            back: {
                frame: 0,
                time: 150
            }
        };

        this.hover = false;
        this.active = false;

        this.backX = 48;
        this.backHeight = 104;

        this.parent.pannelOpen = true;
    }
    aniTick(tt) {
        if (this.closing) {
            if (this.aniFrame > 0) {
                this.aniFrame -= tt / this.aniTime;
            } else {
                this.aniFrame = 0;
                this.rem = true;
            }
        } else {
            if (this.aniFrame < 1) {
                this.aniFrame += tt / this.aniTime;
            } else {
                this.aniFrame = 1;
            }
        }

        {
            let an = this.ani.back;
            if (this.hover) {
                if (an.frame < 1) {
                    an.frame += tt / an.time;
                } else {
                    an.frame = 1;
                }
            } else {
                if (an.frame > 0) {
                    an.frame -= tt / an.time;
                } else {
                    an.frame = 0;
                }
            }
        }

        this.y = easeInOutQuad(this.aniFrame) * (this.targetY - this.startY) + this.startY;
    }
    tick(tt) {
        this.aniTick(tt);
    }
    drawContent() {}
    draw() {
        var X = this.parent.X,
            now = performance.now(),
            tt = now - this.then,
            aniframee, anibackframee;
        this.then = now;

        this.tick(tt);

        aniframee = easeInOutQuad(this.aniFrame);
        anibackframee = easeInOutQuad(this.ani.back.frame);

        X.save();
        X.translate(this.x, this.y);
        X.globalAlpha = aniframee;
        X.fillStyle = this.bgColor;

        X.fillRect(0, 0, this.width, this.height);

        X.fillStyle = "#FFFFFF"; {
            let t = 0.2,
                s = 0.05;
            X.globalAlpha *= anibackframee * (t - s) + s;
        }

        X.fillRect(0, this.backX, this.width, this.backHeight);

        {
            let t = 48,
                s = 64,
                x = anibackframee * (t - s) + s;
            X.translate(x, 68);
        }

        X.globalAlpha = aniframee;
        X.strokeStyle = "#D8D8D8";
        X.lineCap = 'round';
        X.lineWidth = 8;

        X.stroke(this.backArrow);

        X.fillStyle = "#FFFFFF"; {
            let t = 0.5,
                s = 0;
            X.globalAlpha *= anibackframee * (t - s) + s;
        }
        X.font = "32px 'Bree Serif'";
        X.fillStyle = "#D8D8D8";
        X.textBaseline = "middle";
        X.fillText("Back", 52, 32);

        X.restore();
        X.save();
        X.translate(this.x, this.y);
        X.globalAlpha = aniframee;

        this.drawContent(X);
        X.restore();

    }

    checkInsideGoBack(x, y) {
        let tx = this.x,
            ty = this.y + this.backX,
            tw = this.width,
            th = this.backHeight;

        if (
            tx < x &&
            tx + tw > x &&
            ty < y &&
            ty + th > y
        ) {
            return true;
        } else {
            return false;
        }
    }

    mousemove(e) {
        this.hover = this.checkInsideGoBack(this.parent.mouse.x, this.parent.mouse.y);
    }
    mousedown(e) {
        if (this.hover) {
            this.active = true;
        }
    }
    mouseup(e) {
        if (this.active && this.hover) {
            this.closing = true;
            this.parent.pannelOpen = false;
        }
    }

    touchstart() {
        this.mousemove();
        this.mousedown();
    }
    touchmove() {
        this.mousemove();
    }
    touchend() {
        this.mousemove();
        this.mouseup();
        this.hover = false;
    }

    cursor() {
        if (this.checkInsideGoBack(this.parent.mouse.x, this.parent.mouse.y)) {
            return "pointer";
        }
    }

    event(t, e) {
        switch (t) {
            case "mousemove":
                this.mousemove(e);
                break;
            case "mousedown":
                this.mousedown(e);
                break;
            case "mouseup":
                this.mouseup(e);
                break;
            case "touchstart":
                this.touchstart();
                break;
            case "touchend":
                this.touchend();
                break;
            case "touchmove":
                this.touchmove();
                break;
        }
    }
}
class InstructionsPannel extends Pannel {
    constructor(p) {
        super(p, "#434343EB");

        this.content = `\
Use your mouse, touch, WASD or Arrow keys to move the player.

Try to aim at the blocks, everytime a blue bullet hits a block, the blocks loses value.
Once the block gets to 0 value, it breaks. 

When bullets hit 5 blocks in a row, they explode into 4 more bullets. 
When yellow bullets hit 5 blocks in a row, they explode into 4 more bullets, and destroys all blocks on screen.

In this game, there are 4 powerups you can collect by shooting at them, 
  - Red: destroys all blocks on screen
  - Yellow: gives you yellow 1-shot bullets
  - Green: Gives you 1 life
  - Blue: Makes you invincible 
All powerups explode into 7 yellow 1-shot bullets\
`;
        this.prerender = document.createElement("canvas"); {
            this.prerender.width = this.width;
            this.prerender.height = this.height;
            let x = this.prerender.getContext('2d');
            x.fillStyle = "#FFFFFF";
            x.font = "48px 'Bree Serif'";
            this.writeLongTxt(x, this.content, 84, 256, this.parent.width - 84, 56);
        }
    }

    writeLongTxt(X, txt, x, y, maxX, lineSpacing) {
        var text = txt.split(/(\n|\s)/),
            line = 0,
            cx = x,
            cy = y,
            ttt = "";

        for (let rt of text) {
            let t = rt,
                w = X.measureText(t).width,
                nx = cx + w;

            if (t == "\n") {
                cx = x;
                nx = cx;
                cy += lineSpacing;
            } else if (nx > maxX) {
                cx = x;
                nx = cx + w;
                cy += lineSpacing;
            }
            X.fillText(t, cx, cy);
            cx = nx;
        }
    }

    drawContent(X) {
        X.drawImage(
            this.prerender,
            0, 0, this.prerender.width, this.prerender.height,
            0, 0, this.width, this.height
        );
    }
}
class StatPannel extends Pannel {
    constructor(p) {
        super(p, "#434343EB");
    }

    drawContent(X) {
        X.fillStyle = "#FFFFFF";
        X.font = "48px 'Bree Serif'";
        X.fillText("your not very good", 84, 256);
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
            h: 0,
            has: false
        };
        this.resizing = false;
        this.then = 0;

        this.requiredDependencies = 0;
        this._loadedDependencies = 0;
        this.ready = false;

        this.started = false;
        this.autoStart = false;

        this.pannelOpen = false;
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
            this.afterLoadSetup();
            return;
        }

        this._loadedDependencies = e;
    }

    reqanf() {
        requestAnimationFrame(() => this.draw());
    }

    start() {}
    stop() {}
    afterLoadSetup() {}
    resize() {
        if (this.resizing || !this.started && this.lastSize.has) return;
        var dpr = window.devicePixelRatio || 1,
            w = window.innerWidth,
            h = window.innerHeight;

        if (w == this.lastSize.w && h == this.lastSize.h && this.lastSize.has) {
            this.resizing = true;
            this.resizeLoop();
            return;
        }

        if (h * this.ratio < w) {
            this.canvas.classList.remove("h");
            document.body.classList.remove("h");

            this.canvas.width = h * this.ratio * dpr;
            this.canvas.height = h * dpr;

            this.offsetX = (w - this.canvas.width / dpr) / 2;
            this.canvas.style.left = this.offsetX + "px";

            this.offsetY = 0;
            this.canvas.style.top = 0;
        } else {
            this.canvas.classList.add("h");
            document.body.classList.add("h");

            this.canvas.width = w * dpr;
            this.canvas.height = w / this.ratio * dpr;

            this.offsetX = 0;
            this.canvas.style.left = 0;

            this.offsetY = (h - this.canvas.height / dpr) / 2;
            this.canvas.style.top = this.offsetY + "px";
        }

        this.lastSize.w = window.innerWidth;
        this.lastSize.h = window.innerHeight;
        this.lastSize.has = true;

        this.X.resetTransform();
        this.scaleX = this.canvas.width / this.width;
        this.scaleY = this.canvas.height / this.height;
        this.X.scale(this.scaleX, this.scaleY);
    }
    resizeLoop() { // because ios is bad
        if (window.innerWidth == this.lastSize.w && window.innerHeight == this.lastSize.h) {
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
    visibilitychange(e) {
        if (document.hidden || document.webkitHidden) {
            this.blur();
        } else {
            this.focus();
        }
    }
}

class StartScreen extends Screen {
    constructor(e) {
        super(e);

        this.fadeOut = null;
        this.fadeOutTime = 150;
        this.fading = false;

        this.aniFrame = 0;
        this.aniTime = 650;

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
        var passiveFalse = {
            passive: false
        };

        this.listenerFuncs = {
            resize: e => this.resize(e),
            mouseup: e => this.mouseup(e),
            mousedown: e => this.mousedown(e),
            mousemove: e => this.mousemove(e),
            touchend: e => this.touchend(e),
            touchstart: e => this.touchstart(e),
            touchmove: e => this.touchmove(e)
        };

        if (!document.fonts.check("1em 'Parua One'") || !document.fonts.check("1em 'Russo One'")) {
            this.requiredDependencies++;
            document.fonts.ready.then(() => this.loadedDependencies++);
        } else {
            this.loadedDependencies = this.loadedDependencies;
        }

        addEventListener("resize", this.listenerFuncs.resize, passiveFalse);

        addEventListener("mouseup", this.listenerFuncs.mouseup, passiveFalse);
        addEventListener("mousedown", this.listenerFuncs.mousedown, passiveFalse);
        addEventListener("mousemove", this.listenerFuncs.mousemove, passiveFalse);

        addEventListener("touchend", this.listenerFuncs.touchend, passiveFalse);
        addEventListener("touchstart", this.listenerFuncs.touchstart, passiveFalse);
        addEventListener("touchmove", this.listenerFuncs.touchmove, passiveFalse);



        new Button(this, 300, 892, 480, 64, 120, "48px 'Bree Serif'", "#FFFFFF", "Play")
            .addEventListener("click", () => this.play());

        new Button(this, 300, 966, 480, 64, 75, "48px 'Bree Serif'", "#FFFFFF", "Instructions")
            .addEventListener("click", () => new InstructionsPannel(this));

        new Button(this, 300, 1040, 480, 64, 60, "48px 'Bree Serif'", "#FFFFFF", "Stats")
            .addEventListener("click", () => new StatPannel(this));

        new Button(this, 300, 1114, 480, 64, 45, "48px 'Bree Serif'", "#FFFFFF", "GitHub")
            .addEventListener("click", () => open("https://github.com/JaPNaA/Thingy_2018/tree/master/blockInvasion", "_blank"));


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
            tt = now - this.then,
            ga = 1,
            aniframee;
        this.then = now;

        if (this.pannelOpen) {
            if (this.aniFrame < 1) {
                this.aniFrame += tt / this.aniTime;
            } else {
                this.aniFrame = 1;
            }
        } else {
            if (this.aniFrame > 0) {
                this.aniFrame -= tt / this.aniTime;
            } else {
                this.aniFrame = 0;
            }
        }

        aniframee = easeInOutQuad(this.aniFrame);

        X.save();
        if (this.fading) {
            this.fadeOut -= tt;
            if (this.fadeOut < 0) {
                this.fading = false;
                this.sim.stop();
                this.started = false;
                return;
            }

            X.globalAlpha = ga = this.fadeOut / this.fadeOutTime;
        }

        this.sim.draw();
        X.globalAlpha *= 1 - aniframee; // make buttons transparent
        this.eachObs(e => {
            if (e instanceof Button) {
                e.draw();
            }
        });
        X.globalAlpha = ga; // restore, draw everything else
        this.eachObs(e => {
            if (!(e instanceof Button)) {
                e.draw();
            }
        });

        // Draw text
        var txw;
        X.shadowBlur = 16;
        X.shadowColor = "#000000";
        X.shadowOffsetX = 4;
        X.shadowOffsetY = 4;
        X.fillStyle = this.color;

        X.translate(0, aniframee * -568);

        {
            X.font = "124px 'Russo One'";
            let txt = "Block Invasion",
                w = X.measureText(txt).width,
                x = (this.width - w) / 2,
                y = 766;
            txw = x + w;

            X.fillText(txt, x, y);
        } {
            X.font = "64px 'Patua One'";
            let txt = "Created By JaPNaA",
                w = X.measureText(txt).width,
                x = txw - w,
                y = 836;

            X.fillText(txt, x, y);
        }

        X.restore();

        this.eachObs(e => e.remove());

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
                    ["imgs/base2.png"],
                    ["imgs/base3_0.png", "imgs/base3_1.png", "imgs/base3_2.png", "imgs/base3_3.png"]
                ],
                pow: ["imgs/pow_0.png", "imgs/pow_1.png", "imgs/pow_2.png", "imgs/pow_3.png"]
            },
            sprshtimgs: {
                elctexp: "imgs/elctexp.png",
                fireexp: "imgs/fireexp.png",
                baseexp: "imgs/baseexp.png",
                baseheal: "imgs/baseheal.png"
            }
        };
        this.img = {};
        this.sprshtimgs = {};
        this.sprsht = {
            elctexp: {
                len: 650,
                sg: 7,
                e: null
            },
            fireexp: {
                len: 450,
                sg: 7,
                e: null
            },
            baseexp: {
                len: 750,
                sg: 7,
                e: null
            },
            baseheal: {
                len: 1200,
                sg: 7,
                e: null
            }
        };

        this.aniFrame = 0;
        this.aniTime = 350;
        this.closing = false;

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

        //* very ugly, fix soon

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
                visibilitychange: e => this.visibilitychange(e),
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

            addEventListener("deviceorientation", listenerFuncs.deviceorientation, {
                passive: true
            });

            addEventListener("scroll", listenerFuncs.scroll, true);

            this.listenerFuncs = listenerFuncs;
            this.resize();
        }

        this.X.imageSmoothingEnabled = false;
    }

    afterLoadSetup() {
        for (let i in this.sprshtimgs) {
            let j = this.sprsht[i];
            j.e = new SprSht(this.sprshtimgs[i], j.sg, j.len);
        }
    }

    reset() {
        this.data = null;
        this.player = null;
        this.deathPrompt = null;
        this.aniFrame = 0;
        this.closing = false;

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

        if (this.closing) {
            if (this.aniFrame > 0) {
                this.aniFrame -= tt / this.aniTime;
            } else {
                this.aniFrame = 0;
            }
        } else {
            if (this.aniFrame < 1) {
                this.aniFrame += tt / this.aniTime;
            } else {
                this.aniFrame = 1;
            }
        }

        this.eachObs(j => j.tick(tt));

        for (let i of this.obs) {
            for (let j = i.length - 1; j >= 0; j--) {
                i[j].remove();
            }
        }

        this.data.tick(tt);

        while (this.data.cooldown.block.e > 0) {
            new Block(this, randInt(Block.lanes), this.data.gridOffset);
            this.data.cooldown.block.e--;
        }
        while (this.data.cooldown.blockUp.e > 0) {
            this.data.cooldown.block.time *= 0.985;
            this.data.cooldown.blockUp.e--;
        }
        while (this.data.cooldown.powUp.e > 0) {
            new PowUp(this);
            this.data.cooldown.powUp.time *= 1.05;
            this.data.cooldown.powUp.e--;
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
        var X = this.X;

        if (!this.prevframefoc && this.focused) {
            this.then = performance.now();
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

        if (this.aniFrame != 1) {
            X.save();
            X.fillStyle = "#000000";
            X.globalAlpha = 1 - easeInOutQuad(this.aniFrame);
            X.fillRect(0, 0, this.width, this.height);
            X.restore();
        }

        if (this.sim) return;
        this.reqanf();
    }

    death() {
        this.deathPrompt = new DeathPrompt(this);
    }
}

class P {
    constructor() {
        this._screen = null;
        this.lastScreen = null;
        this.nextScreen = null;
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
        this.nextScreen = new GameScreen(this);
    }
    gameScreen() {
        this.screen = new GameScreen(this);
    }
}

const p = new P(); // remove const p to hide access