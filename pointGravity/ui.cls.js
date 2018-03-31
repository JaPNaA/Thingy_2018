function Ui() {
    this.contextmenu = {
        open: false,
        aniF: 0,
        aniT: 250,
        bgCol: "#FFF"
    };

    this.then = performance.now();
}

Ui.prototype.draw = function (X) {
    var now = performance.now(),
        tt = now - this.then;
    this.then = now;

    {
        let w = X.canvas.width * 0.4,
            h = X.canvas.height,
            c = this.contextmenu,
            e = EASING.easeInOutCubic(c.aniF);
        if (c.open) {
            c.aniF += tt / c.aniT;
            if (c.aniF > 1) {
                c.aniF = 1;
            }
        } else {
            c.aniF -= tt / c.aniT;
            if (c.aniF < 0) {
                c.aniF = 0;
            }
        }

        if (c.aniF) {
            X.save();
            X.translate(-w * (1 - e), 0);
            X.fillStyle = c.bgCol;

            X.shadowBlur = 8 * e;
            X.shadowColor = "#00000040";
            X.shadowOffsetX = 4 * e;
            X.shadowOffsetY = 0;

            X.fillRect(0, 0, w, h);

            X.shadowBlur = 0;
            X.shadowColor = "#00000000";
            X.shadowOffsetX = 0;
            X.shadowOffsetY = 0;

            X.font = "32px Arial";
            X.fillStyle = "#000000";
            X.fillText("Work in progess...", 32, 64);

            X.restore();
        }
    }
};

Ui.prototype.openContextmenu = function () {
    this.contextmenu.open ^= true;
};