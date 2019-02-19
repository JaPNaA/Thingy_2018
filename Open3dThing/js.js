class AmbientLight {
    constructor(parent, c) {
        this.obj = new THREE.AmbientLight(c);
        this.parent = parent;

        parent.scene.add(this.obj);
    }
}

class Obj {
    constructor(parent, np) {
        this._vx = 0;
        this._vy = 0;
        this._vz = 0;
        this.collision = false;
        this.endingBlock = false;

        this.parent = parent;

        if (!np)
            parent.obs.push(this);
    }
    moveVel(tt) {
        var ang = Math.atan2(this.vy, this.vx),
            spd = Math.max(Math.abs(this.vx), Math.abs(this.vy)) * tt;

        this.x += Math.cos(ang) * spd;
        this.y += Math.sin(ang) * spd;

        this.z += this.vz * tt;

        this.vx *= Math.pow(0.995, tt);
        this.vy *= Math.pow(0.995, tt);
        this.vz *= Math.pow(0.995, tt);
    }
    moveGravity(tt) {
        this.vz -= this.parent.gravity * tt;
    }
    moveBoundary(tt) {
        if (this.z <= 0) {
            this.z = 0;
            this.grounded = true;
        }
    }
    moveCollision() {
        if (!this.collision) return;

        var w1 = this.width,
            h1 = this.height,
            l1 = this.length,
            x1 = this.x - w1 / 2,
            y1 = this.y - h1 / 2,
            z1 = this.z - l1 / 2,
            hasCollided = false;

        for (let i of this.parent.obs) {
            if (!i.collision || i == this) continue;

            let w2 = i.width,
                h2 = i.height,
                l2 = i.length,
                x2 = i.x - w2 / 2,
                y2 = i.y - h2 / 2,
                z2 = i.z - l2 / 2,

                dx = (x1 + w1 / 2) - (x2 + w2 / 2),
                dy = (y1 + h1 / 2) - (y2 + h2 / 2),
                dz = (z1 + l1 / 2) - (z2 + l2 / 2),

                dw = (w1 + w2) / 2,
                dh = (h1 + h2) / 2,
                dl = (l1 + l2) / 2;

            if (Math.abs(dx) <= dw && Math.abs(dy) <= dh && Math.abs(dz) <= dl) {
                let dcw = dw * dy,
                    dch = dh * dx,
                    dcl = dl * dz;

                if (dcl > 0) { // top
                    this.z = z2 + l2 + l1 / 2;
                    this.grounded = true;
                    if(i.endingBlock) {
                        this.parent.state = 3;
                    }
                    if (this.vz < 0) {
                        this.vz = 0;
                    }
                } else if (dcl < 0) { // bottom
                    this.z = z2 - l1 / 2;
                    this.grounded = true; // this is intentional.
                    if (this.vz > 0) {
                        this.vz = 0;
                    }
                } else if (dcw > dch) {
                    if (dcw > -dch) { // behind
                        this.y = y2 + h2 + h1 / 2;
                        if (this.vy < 0) {
                            this.vy = 0;
                        }
                    } else { // left
                        this.x = x2 - w1 / 2;
                        if (this.vx > 0) {
                            this.vx = 0;
                        }
                    }
                } else {
                    if (dcw > -dch) { // right
                        this.x = x2 + w2 + w1 / 2;
                        if (this.vx < 0) {
                            this.vx = 0;
                        }
                    } else { // front
                        this.y = y2 - h1 / 2;
                        if (this.vy > 0) {
                            this.vy = 0;
                        }
                    }
                }
            }
        }
    }

    get x() {
        return this.obj.position.x || 0;
    }
    set x(e) {
        this.obj.position.x = e;
    }
    get y() {
        return this.obj.position.y || 0;
    }
    set y(e) {
        this.obj.position.y = e;
    }
    get z() {
        return this.obj.position.z || 0;
    }
    set z(e) {
        this.obj.position.z = e;
    }

    get width() {
        return this.geo.parameters.width || 0;
    }
    get height() {
        return this.geo.parameters.height || 0;
    }
    get length() {
        return this.geo.parameters.depth || 0;
    }

    get vx() {
        return this._vx || 0;
    }
    set vx(e) {
        this._vx = e;
    }
    get vy() {
        return this._vy || 0;
    }
    set vy(e) {
        this._vy = e;
    }
    get vz() {
        return this._vz || 0;
    }
    set vz(e) {
        this._vz = e;
    }

    get alpha() {
        return this.obj.rotation.y || 0;
    }
    set alpha(e) {
        this.obj.rotation.y = e;
    }
    get beta() {
        return this.obj.rotation.x || 0;
    }
    set beta(e) {
        this.obj.rotation.x = e;
    }
    get gamma() {
        return this.obj.rotation.z || 0;
    }
    set gamma(e) {
        this.obj.rotation.z = e;
    }

    get color() {
        var a = this.mat.color,
            f = [];

        for (let i of [a.r, a.g, a.b])
            f.push(Math.floor(i * 255).toString(16).padStart(2, '0'));

        return '#' + f.join("");
    }
    set color(e) {
        var a = e.replace("#", ""),
            b = [a.substr(0, 2), a.substr(2, 2), a.substr(4, 2)];

        for (let i = 0; i < 3; i++) {
            b[i] = parseInt(b[i], 16);
        }

        this.mat.color.r = b[0] / 255;
        this.mat.color.g = b[1] / 255;
        this.mat.color.b = b[2] / 255;
    }
}

class Light extends Obj {
    constructor(parent, c, i) {
        super(parent);

        this.obj = new THREE.DirectionalLight(c, i);
        this.obj.y = 3;
        this.obj.x = 0;
        parent.scene.add(this.obj);
    }
}

class Camera extends Obj {
    constructor(parent, fov, renDist) {
        super(parent);

        this.obj = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, renDist);
    }
}

class Rect extends Obj {
    constructor(parent, width, height, length, color, dimensions, nopush) {
        super(parent, nopush);

        this.geo = new THREE.BoxGeometry(width, height, length);

        if (dimensions == 3) {
            this.mat = new THREE.MeshPhongMaterial({
                color: color
            });
        } else {
            this.mat = new THREE.MeshBasicMaterial({
                color: color
            });
        }

        this.obj = new THREE.Mesh(this.geo, this.mat);

        this.collision = true;
        parent.scene.add(this.obj);
    }
}

class Ent extends Obj {
    constructor(parent) {
        super(parent);
        this.collision = true;
        this.grounded = false;
    }
    naturalMovement(tt) {
        this.moveVel(tt);
        this.moveGravity(tt);
        this.moveBoundary(tt);
        this.moveCollision(tt);
    }
    get x() {
        return this.obj.x;
    }
    set x(e) {
        this.obj.x = e;
    }
    get y() {
        return this.obj.y;
    }
    set y(e) {
        this.obj.y = e;
    }
    get z() {
        return this.obj.z;
    }
    set z(e) {
        this.obj.z = e;
    }

    get width() {
        return this.obj.width;
    }
    get height() {
        return this.obj.height;
    }
    get length() {
        return this.obj.length;
    }

    get alpha() {
        return this.obj.alpha;
    }
    set alpha(e) {
        this.obj.alpha = e;
    }
    get beta() {
        return this.obj.beta;
    }
    set beta(e) {
        this.obj.beta = e;
    }
    get gamma() {
        return this.obj.gamma;
    }
    set gamma(e) {
        this.obj.gamma = e;
    }

    get color() {
        return this.obj.color;
    }
    set color(e) {
        this.obj.color = e;
    }
}

class Player extends Ent {
    constructor(parent) {
        super(parent);

        this.obj = new Rect(parent, 0.1, 0.1, 0.1, 0xFF0000, 3, 1);

        this.spd = 0.000005;
        this.jumpPower = 0.005;
    }
    tick(tt) {
        var k = this.parent.key,
            s = this.spd * tt;
        if (k[65] || k[37])
            this.vx -= s;
        if (k[87] || k[38])
            this.vy += s;
        if (k[68] || k[39])
            this.vx += s;
        if (k[83] || k[40])
            this.vy -= s;
        if (k[32] && this.grounded) {
            this.vz += this.jumpPower;
            this.grounded = false;
        }

        this.naturalMovement(tt);
    }
}

class G {
    constructor() {
        this.scene = new THREE.Scene();

        this.obs = [];

        this.camera = new Camera(this, 45, 10);
        this.camera.z = 2;

        this.ambientLight = new AmbientLight(this, 0x9A9A9A);
        this.light = new Light(this, 0xFFFFFF, 0.5);
        this.light.z = 2;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.cvs3d = this.renderer.domElement;
        this.cvs3d.classList.add("threed");

        this.cvs2d = document.createElement("canvas");
        this.cvs2d.classList.add("twod");

        this.X = this.cvs2d.getContext("2d");

        this.elm = document.createElement("div");

        {
            let a = this.elm;
            a.appendChild(this.cvs3d);
            a.appendChild(this.cvs2d);
        }

        this.then = 0;
        this.pointerLocked = false;
        this.key = [];


        this.offsetX = 0.05;
        this.offsetY = 0.4;
        this.offsetZ = -2;

        this.camera.alpha = -0.025;
        this.camera.beta = 0.2;

        this.gravity = 0.00001;
        this.showFpsCounter = false;

        this.state = 0;
        this.started = false;

        this.cameraFollow = null;

        this.resize();
        this.appendTo(document.body);

        addEventListener("resize", () => this.resize());

        // pointer
        this.elm.addEventListener("mousedown", e => {
            if (!this.pointerLocked)
                this.elm.requestPointerLock();
            else
                document.exitPointerLock();
        });
        document.addEventListener("pointerlockchange", e => {
            this.pointerLocked = document.pointerLockElement == this.elm;
        });
        this.elm.addEventListener("mousemove", e => {
            if (!this.pointerLocked) return;

            if (Math.abs(e.movementX) < 100 && Math.abs(e.movementY) < 100) {
                this.camera.alpha -= e.movementX / 500;
                this.camera.beta -= e.movementY / 500;
            }
        });
        addEventListener("keydown", e => {
            if(this.state == 1) {
                this.state = 2;
            }
            this.key[e.keyCode] = true;
        });
        addEventListener("keyup", e => {
            this.key[e.keyCode] = false;
        });
        addEventListener("blur", e => {
            this.key.length = 0;
        });
        addEventListener("wheel", e => {
            if (e.deltaY > 0) {
                this.camera.obj.fov++;
            } else {
                this.camera.obj.fov--;
            }
            this.camera.obj.updateProjectionMatrix();
        });

        this.start();
    }
    appendTo(e) {
        e.appendChild(this.elm);
    }
    resize() {
        var dpr = devicePixelRatio || 1,
            w = innerWidth * dpr,
            h = innerHeight * dpr;

        this.renderer.setSize(w, h);

        this.camera.obj.aspect = w / h;
        this.camera.obj.updateProjectionMatrix();

        this.cvs2d.width = w;
        this.cvs2d.height = h;
    }

    tick(tt) {
        // let everything tick
        for (let i of this.obs) {
            if (i.tick) {
                i.tick(tt);
            }
        }

        if (this.cameraFollow) {
            let tx = this.camera.x + this.offsetX, // targets
                ty = this.camera.y + this.offsetY,
                tz = this.camera.z + this.offsetZ;

            this.camera.x += (this.cameraFollow.x - tx) / (100 / tt);
            this.camera.y += (this.cameraFollow.y - ty) / (100 / tt);
            this.camera.z += (this.cameraFollow.z - tz) / (250 / tt);
        }
    }

    draw2d(tt) {
        var X = this.X,
            CVS = this.cvs2d,
            fps = Math.round(1000 / tt);

        X.clearRect(0, 0, innerWidth, innerHeight);

        switch (this.state) {
            case 0:
                X.font = (innerHeight / 10) + "px Arial";

                let t = "Loading...",
                    tw = X.measureText(t).width;

                X.fillStyle = "#000000";
                X.fillRect(0, 0, CVS.width, CVS.height);

                X.fillStyle = "#FFFFFF";
                X.fillText(t, (CVS.width - tw) / 2, CVS.height / 2);
                break;
            case 1:
                X.fillStyle = "#FFFFFF";
                X.font = (innerHeight / 50) + "px Arial";
                X.fillText("WASD keys to move, click to look around. Get to the end!", 8, innerHeight / 50 + 8);
                break;
            case 3:
                X.fillStyle = "#FFFFFF";
                X.font = (innerHeight / 50) + "px Arial";
                X.fillText("You've finished this map!", 8, innerHeight / 50 + 8);
        }

        if (this.showFpsCounter) {
            X.fillStyle = `hsl(${fps * 2}, 100%, 50%)`;
            X.fillRect(0, 0, 48, 24);

            X.fillStyle = "#000000";
            X.font = "12px Arial";
            X.fillText(fps + " fps", 8, 18);
        }
    }
    render(tt) {
        this.renderer.render(this.scene, this.camera.obj);
        this.draw2d(tt);
    }
    reqanf(e) {
        // this.a++; // for debugging
        // this.a %= 1;
        // if (!this.a) {
        var tt = e - this.then;
        this.then = e;

        this.tick(tt);

        this.render(tt);
        // }
        requestAnimationFrame(e => this.reqanf(e));
    }
    start(m) {
        if (this.started) {
            for (let i of m) {
                let a = new Rect(this, i.width, i.height, i.length || 0.1, parseInt(i.color, 16), 3);
                a.x = i.x;
                a.y = i.y;
                a.z = i.z;
                if (i.special == "end") {
                    a.endingBlock = true;
                }
            }
            this.state = 1;
        } else {
            this.player = new Player(this);
            this.cameraFollow = this.player;
            this.started = true;
            this.reqanf(0);
        }
    }
}

try {
    (async function () {
        var g = new G(r);

        var r = await new Promise(function (ac, re) {
            var a = new XMLHttpRequest();
            a.responseType = "json";
            a.open("GET", "map.json");
            a.addEventListener("load", function () {
                var r = a.response;
                if (typeof r == "object") {
                    ac(r);
                } else {
                    ac(JSON.parse(r));
                }
            });
            a.addEventListener("error", e => re(e));
            a.send();
        });

        g.start(r);
    }());
} catch (e) {
    alert("An error occured");
}