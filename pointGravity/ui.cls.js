function Ui() {
    this.contextmenu = {
        open: true,
        aniF: 0,
        aniT: 250,
        bgCol: "#FFF"
    };

    this.children = [];
    this.setup();

    this.minWidth = 360;
    this.maxWidth = 720;

    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;

    this.then = performance.now();
}

Ui.prototype.draw = function (X) {
    var now = performance.now(),
        tt = now - this.then;
    this.then = now;

    {
        let c = this.contextmenu,
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
            X.translate(-this.width * (1 - e), 0);
            X.fillStyle = c.bgCol;

            X.shadowBlur = 8 * e;
            X.shadowColor = "#00000040";
            X.shadowOffsetX = 4 * e;
            X.shadowOffsetY = 0;

            X.fillRect(0, 0, this.width, this.height);

            X.shadowBlur = 0;
            X.shadowColor = "#00000000";
            X.shadowOffsetX = 0;
            X.shadowOffsetY = 0;

            this.drawContent(X);

            X.restore();
        }
    }
};

Ui.prototype.setup = function () {
    this.children.push(new UiText(
        "Menu",
        "Consolas", 32, "#000000",
        48, 64));

    {
        let a = new UiSlider(48, 116, 256, 24, "#FF0000"),
            b = new UiText(world.default.point.radius, "Arial", 16, "#888888", 52, 154),
            c = new UiText("Radius", "Consolas", 24, "#222222", 48, 104);

        a.addEventListener("change", function () {
            let v = Math.pow(2, (100 * a.value) / 15);
            b.text = v.toPrecision(5);
            world.default.point.radius = v;
        });
        a.value = (15 * Math.log2(world.default.point.radius)) / 100;
        this.children.push(a, b, c);
    }

    {
        let a = new UiSlider(48, 212, 256, 24, "#FF0000"),
            b = new UiText(world.default.point.mass, "Arial", 16, "#888888", 52, 250),
            c = new UiText("Mass", "Consolas", 24, "#222222", 48, 200);

        a.addEventListener("change", function () {
            let v = Math.pow(2, (200 * a.value) / 15) / 10000;
            b.text = v.toPrecision(5);
            world.default.point.mass = v;
        });
        a.value = (15 * (Math.log(10000 * world.default.point.mass) / Math.log(2))) / 200;
        this.children.push(a, b, c);
    }

    {
        let a = new UiColorPicker(48, 308, 256, 24), 
            b = new UiText(world.default.point.color, "Arial", 16, "#888888", 52, 350),
            c = new UiText("Color", "Consolas", 24, "#222222", 48, 296),
            as = 10;

        a.addEventListener("change", function () {
            b.text = world.default.point.color = a.value;
        });
        a.value = world.default.point.color;
        this.children.push(a , b, c);
    }
};

Ui.prototype.drawContent = function (X) {
    for (let i of this.children) {
        i.draw(X);
    }
};

Ui.prototype.resize = function () {
    this.width = Math.min(Math.max(innerWidth * 0.3, this.minWidth), this.maxWidth);
    this.height = innerHeight;
};

Ui.prototype.event = function (t, e) {
    switch (t) {
        case "resize":
            this.resize(e);
            break;
    }

    for (let i of this.children) {
        i.event(t, e);
    }
};

Ui.prototype.isInside = function (x, y) {
    return isInsideRect(x, y, this.x, this.y, this.width, this.height);
};

Ui.prototype.shouldCapture = function (x, y) {
    return this.contextmenu.open && this.isInside(x, y);
}

Ui.prototype.openContextmenu = function () {
    this.contextmenu.open ^= true;
};