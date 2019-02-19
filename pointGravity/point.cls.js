function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
    this.vx = 0;
    this.vy = 0;

    this.color = "#000000";

    this.radius = 2;
    this.mass = 0.001;
}

Point.prototype.draw = function (X) {
    X.fillStyle = this.color;
    X.beginPath();
    X.arc(this.x, this.y, this.radius, 0, Math.TAU);
    X.fill();
};

Point.prototype.upd = function (tt) {
    var ar = Math.pow(this.world.airResistance, tt);

    this.x += this.vx * tt;
    this.y += this.vy * tt;

    this.vx *= Math.pow(ar, this.radius * this.mass);
    this.vy *= Math.pow(ar, this.radius * this.mass);

    {
        let infx = 0,
            infy = 0;

        for (let i of this.world.obs) {
            if (i == this) continue;

            let ofx = i.x - this.x,
                ofy = i.y - this.y,
                d = getGravPow(ofx, ofy),
                s = d * i.mass,
                {
                    x,
                    y
                } = getXY(getAng(ofx, ofy));

            infx += x * s;
            infy += y * s;
        }

        this.vx += infx * tt;
        this.vy += infy * tt;
    }
};

Point.prototype.collide = function (e) {
    let d = getDist(this.x - e.x, this.y - e.y),
        tr = e.radius + this.radius;

    if (d <= tr) {
        elCollisionReact(this, e);
    }
};

function elCollisionReact(e, f) {
    var nvx1, nvy1, nvx2, nvy2, fvx1, fvx2, cosa, sina,
        ang = getAng(e.x - f.x, e.y - f.y),
        cosaa = Math.cos(ang + Math.TAU * 0.25),
        sinaa = Math.sin(ang + Math.TAU * 0.25),
        tm = e.mass + f.mass,
        m1 = getDist(e.vx, e.vy),
        m2 = getDist(f.vx, f.vy);

    {
        let {
            x,
            y
        } = getXY(ang);
        cosa = x;
        sina = y;
    } {
        let {
            x,
            y
        } = getXY(getAng(e.vx, e.vy) - ang);
        nvx1 = m1 * x;
        nvy1 = m1 * y;
    } {
        let {
            x,
            y
        } = getXY(getAng(f.vx, f.vy) - ang);
        nvx2 = m2 * x;
        nvy2 = m2 * y;
    }

    fvx1 =
        (
            (e.mass - f.mass) * nvx1 +
            (f.mass + f.mass) * nvx2
        ) / tm;
    fvx2 =
        (
            (e.mass + e.mass) * nvx1 +
            (f.mass - e.mass) * nvx2
        ) / tm;

    e.vx = cosa * fvx1 + cosaa * nvy1;
    e.vy = sina * fvx1 + sinaa * nvy1;

    f.vx = cosa * fvx2 + cosaa * nvy2;
    f.vy = sina * fvx2 + sinaa * nvy2;
}