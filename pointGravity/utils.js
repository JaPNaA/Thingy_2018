Math.TAU = Math.PI * 2;

Number.prototype.floorTo = function(e) {
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