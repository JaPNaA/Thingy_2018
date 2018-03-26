function World() {
    this.obs = [];

    this.airResistance = 0.9999999;
    this.speed = 0.03;
    this.trailStrength = 0.35;

    this.devm = true;
    this.fps = 0;

    this.then = performance.now();
}

World.prototype.append = function(e) {
    this.obs.push(e);

    e.world = this;
};

World.prototype.upd = function() {
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

World.prototype.draw = function(X) {
    X.save();
    X.fillStyle = '#FFFFFF';
    X.globalAlpha = 1 - this.trailStrength;
    X.fillRect(0, 0, X.canvas.width, X.canvas.height);
    X.restore();

    for (let i of this.obs) {
        i.draw(X);
    }

    if (this.devm) {
        X.fillStyle = "#FF0000";
        X.font = "16px Arial";
        X.fillText(Math.round(this.fps), 8, 24);
    }
};