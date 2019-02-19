var C = document.createElement("canvas");
var D = document.createElement("canvas");
var X = C.getContext("2d");
var Y = D.getContext("2d");
D.style.position = "absolute";
D.style.top = "8px";
D.style.left = "8px";
var width = 50;
var height = 50;
D.width = C.width = width * 72 + 64;
D.height = C.height = height * 72 + 64;
document.body.appendChild(C);
document.body.appendChild(D);
var Curve = /** @class */ (function () {
    function Curve(x, y, radius, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.progress = 0;
        this.lastX = Math.cos(this.progress) * this.radius + this.x;
        this.lastY = Math.sin(this.progress) * this.radius + this.y;
    }
    Curve.prototype.draw = function () {
        if (this.progress > Math.PI * 2) {
            return;
        }
        var iterations = Math.max(this.speedX, this.speedY);
        this.progress += 0.1 / iterations;
        var x = Math.cos(this.progress * this.speedX) * this.radius + this.x;
        var y = Math.sin(this.progress * this.speedY) * this.radius + this.y;
        X.strokeStyle = this.color;
        X.beginPath();
        X.moveTo(this.lastX, this.lastY);
        X.lineTo(x, y);
        X.stroke();
        this.lastX = x;
        this.lastY = y;
    };
    return Curve;
}());
var World = /** @class */ (function () {
    function World(width, height) {
        this.padding = 8;
        this.radius = 32;
        this.startX = 64;
        this.startY = 64;
        this.width = width;
        this.height = height;
        this.curves = [];
        var spacing = this.radius * 2 + this.padding;
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                this.curves.push(new Curve(this.startX + x * spacing, this.startX + y * spacing, this.radius, x, y, "#000000"));
            }
        }
    }
    World.prototype.draw = function () {
        Y.clearRect(0, 0, D.width, D.height);
        for (var _i = 0, _a = this.curves; _i < _a.length; _i++) {
            var curve = _a[_i];
            curve.draw();
        }
    };
    return World;
}());
var world = new World(width, height);
function reqanf() {
    world.draw();
    requestAnimationFrame(reqanf);
}
reqanf();
