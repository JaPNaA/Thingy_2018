function World() {
    this.obs = [];

    this.camera = {
        x: 0,
        y: 0,
        scale: 1
    };
    this.scaleStep = 1.1;

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

    this.airResistance = 0.99999;
    this.speed = 1;
    this.trailStrength = 0.35;

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

    this.drawGrid();
    this.drawGuide();

    for (let i of this.obs) {
        i.draw(X);
    }

    X.resetTransform();

    // static
    if (this.devm) {
        X.fillStyle = "#FF0000";
        X.font = "16px Arial";
        X.fillText(Math.round(this.fps), 8, 24);
    }
};

World.prototype.cameraMove = function (x, y) {
    this.camera.x += x;
    this.camera.y += y;
};

World.prototype.setGuideStart = function (x, y) {
    this.showGuide = true;
    this.guide.x1 = x - this.camera.x;
    this.guide.y1 = y - this.camera.y;
};

World.prototype.setGuideEnd = function (x, y) {
    this.guide.x2 = x - this.camera.x;
    this.guide.y2 = y - this.camera.y;
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
    X.arc(x2sc, y2sc, 3, 0, Math.TAU);
    X.fill();
};

World.prototype.drawGrid = function () {
    X.fillStyle = X.strokeStyle = this.gridColor;
    X.lineWidth = 1;

    var gscl = this.gridSize * this.camera.scale,
        w = innerWidth / this.camera.scale,
        h = innerHeight / this.camera.scale,
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
        x = this.guide.x1 - this.guide.x2,
        y = this.guide.y1 - this.guide.y2;

    p.vx = x * 0.005;
    p.vy = y * 0.005;

    this.append(p);
};

World.prototype.scale = function (e, mx, my) {
    var os = this.camera.scale,
        x = (mx - this.camera.x) / this.camera.scale,
        y = (my - this.camera.y) / this.camera.scale,
        ds;

    if (e) {
        this.camera.scale *= this.scaleStep;
    } else {
        this.camera.scale /= this.scaleStep;
    }

    if (this.camera.scale < 0.05) {
        this.camera.scale = 0.05;
    } else if (this.camera.scale > 100) {
        this.camera.scale = 100;
    }

    ds = this.camera.scale - os;

    this.camera.x -= x * ds;
    this.camera.y -= y * ds;
};

World.prototype.scaleReset = function () {
    this.camera.scale = 1;
};