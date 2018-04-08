function World() {
    this.obs = [];

    this.camera = {
        tx: 0,
        ty: 0,
        tscale: 1,
        x: 0,
        y: 0,
        scale: 1
    };
    this.scaleStep = 1.15;

    this.transSpeed = 50;

    this.showGuide = false;
    this.guide = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
    };
    this.guideColor = "#333333";

    this.gridSize = 48;
    this.gridColor = "#aaaaaa";

    this.airResistance = 0.9999;
    this.speed = 1;
    this.trailStrength = 0.35;

    this.default = {
        point: {
            mass: 0.001,
            radius: 2,
            color: "#000000"
        }
    };

    this.devm = true;
    this.fps = 0;

    this.then = performance.now();
}

World.prototype.append = function (e) {
    this.obs.push(e);

    e.world = this;
};

World.prototype.upd = function () {
    var now = performance.now(),
        t = now - this.then,
        tt = t * this.speed,
        obsl = this.obs.length;
    this.then = now;

    if (t) {
        this.fps *= 0.9;
        this.fps += (1000 / t) * 0.1;
    }

    for (let i = 0; i < obsl; i++) {
        this.obs[i].upd(tt);
        for (let j = i + 1; j < obsl; j++) {
            this.obs[i].collide(this.obs[j]);
        }
    }

    this.camera.x += (this.camera.tx - this.camera.x) / (this.transSpeed / t);
    this.camera.y += (this.camera.ty - this.camera.y) / (this.transSpeed / t);
    this.camera.scale += (this.camera.tscale - this.camera.scale) / (this.transSpeed / t);
};

World.prototype.draw = function (X) {
    // clear
    X.save();
    X.fillStyle = '#FFFFFF';
    X.globalAlpha = 1 - this.trailStrength;
    X.fillRect(0, 0, X.canvas.width, X.canvas.height);
    X.restore();

    X.translate(this.camera.x, this.camera.y);
    X.scale(this.camera.scale, this.camera.scale);
    // dynamic

    this.drawGrid(X);
    this.drawGuide(X);

    for (let i of this.obs) {
        i.draw(X);
    }

    X.resetTransform();

    // static
    if (this.devm) {
        X.fillStyle = "#FF0000";
        X.font = "bold " + (16 * (window.devicePixelRatio || 1)) + "px Consolas";
        X.fillText([
            "fps: " + Math.round(this.fps),
            "x: " + Math.floor(this.camera.x),
            "y: " + Math.floor(this.camera.y),
            "scale: " + this.camera.scale.toPrecision(3),
            "obslen: " + this.obs.length
        ].join(', '), 8, X.canvas.height - 8);
    }
};

World.prototype.cameraMove = function (x, y) {
    let dpr = window.devicePixelRatio || 1;
    this.camera.tx += x * dpr;
    this.camera.ty += y * dpr;
};

World.prototype.setGuideStart = function (x, y) {
    let dpr = window.devicePixelRatio || 1;
    
    this.showGuide = true;
    this.guide.x2 = this.guide.x1 = x * dpr - this.camera.x;
    this.guide.y2 = this.guide.y1 = y * dpr - this.camera.y;
};

World.prototype.setGuideEnd = function (x, y) {
    let dpr = window.devicePixelRatio || 1;
    this.guide.x2 = x * dpr - this.camera.x;
    this.guide.y2 = y * dpr - this.camera.y;
};

World.prototype.hideGuide = function () {
    this.showGuide = false;
};

World.prototype.drawGuide = function () {
    if (!this.showGuide) return;

    var x2sc = this.guide.x2 / this.camera.scale,
        y2sc = this.guide.y2 / this.camera.scale;

    X.lineWidth = 2;
    X.strokeStyle = X.fillStyle = this.guideColor;

    X.beginPath();
    X.moveTo(this.guide.x1 / this.camera.scale, this.guide.y1 / this.camera.scale);
    X.lineTo(x2sc, y2sc);
    X.stroke();

    X.beginPath();
    X.fillStyle = this.default.point.color;
    X.arc(x2sc, y2sc, this.default.point.radius, 0, Math.TAU);
    X.fill();
};

World.prototype.drawGrid = function (X) {
    X.fillStyle = X.strokeStyle = this.gridColor;
    X.lineWidth = Math.min(this.camera.scale, 1);

    var gscl = this.gridSize * this.camera.scale,
        w = X.canvas.width / this.camera.scale,
        h = X.canvas.height / this.camera.scale,
        ox = this.camera.x.floorTo(gscl) / this.camera.scale,
        oy = this.camera.y.floorTo(gscl) / this.camera.scale;

    for (let i = 0; i < w; i += this.gridSize) {
        let oxi = i - ox;

        X.beginPath();
        X.moveTo(oxi, -oy - this.gridSize);
        X.lineTo(oxi, h - oy);
        X.stroke();
    }
    for (let i = 0; i < h; i += this.gridSize) {
        let oyi = i - oy;

        X.beginPath();
        X.moveTo(-ox - this.gridSize, oyi);
        X.lineTo(w - ox, oyi);
        X.stroke();
    }
};

World.prototype.newPointGuide = function () {
    var p = new Point(this.guide.x2 / this.camera.scale, this.guide.y2 / this.camera.scale),
        x = (this.guide.x1 - this.guide.x2) / this.camera.scale,
        y = (this.guide.y1 - this.guide.y2) / this.camera.scale;

    if (x && y) {
        p.vx = x * 0.005;
        p.vy = y * 0.005;
    }

    p.mass = this.default.point.mass;
    p.radius = this.default.point.radius;
    p.color = this.default.point.color;

    this.append(p);
};

World.prototype.scale = function (e, mx, my) {
    var os = this.camera.tscale,
        dpr = window.devicePixelRatio || 1,
        x = (mx * dpr - this.camera.tx) / this.camera.tscale,
        y = (my * dpr - this.camera.ty) / this.camera.tscale,
        ds;

    if (typeof e == "number") {
        this.camera.tscale *= e;
    } else {
        if (e) {
            this.camera.tscale *= this.scaleStep;
        } else {
            this.camera.tscale /= this.scaleStep;
        }
    }

    if (this.camera.tscale < 0.1) {
        this.camera.tscale = 0.1;
    } else if (this.camera.tscale > 20) {
        this.camera.tscale = 20;
    }

    if (mx && my) {
        ds = this.camera.tscale - os;

        this.camera.tx -= x * ds;
        this.camera.ty -= y * ds;
    }
};

World.prototype.scaleReset = function () {
    var os = this.camera.tscale,
        dpr = window.devicePixelRatio,
        w = innerWidth * dpr,
        h = innerHeight * dpr;

    this.camera.tscale = 1;

    ds = this.camera.tscale - os;

    this.camera.tx -= ((w / 2 - this.camera.tx) / os) * ds;
    this.camera.ty -= ((h / 2 - this.camera.ty) / os) * ds;
};