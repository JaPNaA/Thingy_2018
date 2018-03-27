function World() {
    this.obs = [];
    this.camera = {
        x: 0,
        y: 0
    };

    this.showGuide = false;
    this.guide = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
    };

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
    // static
    X.save();
    X.fillStyle = '#FFFFFF';
    X.globalAlpha = 1 - this.trailStrength;
    X.fillRect(0, 0, X.canvas.width, X.canvas.height);
    X.restore();

    if (this.devm) {
        X.fillStyle = "#FF0000";
        X.font = "16px Arial";
        X.fillText(Math.round(this.fps), 8, 24);
    }

    X.translate(this.camera.x, this.camera.y);
    // dynamic

    this.drawGrid();
    this.drawGuide();

    for (let i of this.obs) {
        i.draw(X);
    }

    X.resetTransform();
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

    X.lineWidth = 2;
    X.strokeStyle = X.fillStyle = "#000000";

    X.beginPath();
    X.moveTo(this.guide.x1, this.guide.y1);
    X.lineTo(this.guide.x2, this.guide.y2);
    X.stroke();

    X.beginPath();
    X.arc(this.guide.x2, this.guide.y2, 3, 0, Math.TAU);
    X.fill();
};

World.prototype.drawGrid = function () {
    X.fillStyle = "#F00";
    X.fillRect(0, 0, 10, 10);
};

World.prototype.newPointGuide = function () {
    var p = new Point(this.guide.x2, this.guide.y2),
        x = this.guide.x1 - this.guide.x2,
        y = this.guide.y1 - this.guide.y2;

    p.vx = x * 0.005;
    p.vy = y * 0.005;

    this.append(p);
};