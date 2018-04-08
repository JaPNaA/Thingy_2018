Math.TAU = Math.PI * 2;

Number.prototype.floorTo = function (e) {
    return Math.floor(this / e) * e;
};

function getAng(x, y) {
    return Math.atan2(y, x);
}

function getXY(ang) {
    return {
        x: Math.cos(ang),
        y: Math.sin(ang)
    };
}

function getDist(x, y) {
    return Math.sqrt(x * x + y * y);
}

function getGravPow(x, y) {
    let d = getDist(x, y);
    return 1 / (d * d);
}

function isInsideRect(cx, cy, x, y, w, h) {
    return (
        cx > x &&
        cx < x + w &&
        cy > y &&
        cy < y + h
    );
}

function isInsideCircle(cx, cy, x, y, r) {
    return (getDist(cx - x, cy - y) < r);
}

const EASING = {
    // no easing, no acceleration
    linear: function (t) {
        return t;
    },
    // accelerating from zero velocity
    easeInQuad: function (t) {
        return t * t;
    },
    // decelerating to zero velocity
    easeOutQuad: function (t) {
        return t * (2 - t);
    },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    // accelerating from zero velocity 
    easeInCubic: function (t) {
        return t * t * t;
    },
    // decelerating to zero velocity 
    easeOutCubic: function (t) {
        return (--t) * t * t + 1;
    },
    // acceleration until halfway, then deceleration 
    easeInOutCubic: function (t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    // accelerating from zero velocity 
    easeInQuart: function (t) {
        return t * t * t * t;
    },
    // decelerating to zero velocity 
    easeOutQuart: function (t) {
        return 1 - (--t) * t * t * t;
    },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    // accelerating from zero velocity
    easeInQuint: function (t) {
        return t * t * t * t * t;
    },
    // decelerating to zero velocity
    easeOutQuint: function (t) {
        return 1 + (--t) * t * t * t * t;
    },
    // acceleration until halfway, then deceleration 
    easeInOutQuint: function (t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
};