Math.TAU = Math.PI * 2;

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