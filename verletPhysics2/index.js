/**
 * Canvas element
 * @type {HTMLCanvasElement}
 */
const C = document.getElementById("c");

/**
 * Drawing context
 * @type {CanvasRenderingContext2D}
 */
const X = C.getContext("2d");

const CONF = {
    /**
     * Gravity in the world
     * @type {Number}
     */
    gravity: 0.001,

    /**
     * Width of world
     * @type {Number}
     */
    width: C.width,

    /**
     * Height for world
     * @type {Number}
     */
    height: C.height
};

let then = 0;

/**
 * list of bodies to draw
 * @type {Form[]}
 */
let bodies = [];

// Tau > Pi
Math.TAU = Math.PI * 2;

/**
 * Pytha function
 * @param {Number} x input number 1
 * @param {Number} y input number 2
 * @returns {Number} The result of the operation
 */
function pytha(x, y) {
    return Math.sqrt(x * x + y * y);
}

/**
 * Point class, represents a point in space operating in verlet physics
 * @class Point
 */
class Point {
    /**
     * Point contructor
     * @param {Number} x position
     * @param {Number} y position
     * @param {Boolean} invisible can be drawn
     */
    constructor(x, y, invisible) {
        /**
         * Can be drawn?
         * @type {Boolean}
         */
        this.invisible = Boolean(invisible);

        /**
         * X position of point
         * @type {Number}
         */
        this.x = x;

        /**
         * Y position of point
         * @type {Number}
         */
        this.y = y;

        /**
         * last X position of point
         * @type {Number}
         */
        this.lx = x;

        /**
         * last Y position of point
         * @type {Number}
         */
        this.ly = y;

        /**
         * X acceleration of point
         * @type {Number}
         */
        this.ax = 0;

        /**
         * Y acceleration of point
         * @type {Number}
         */
        this.ay = 0;

        /**
         * last delta time
         * @type {Number}
         */
        this.dt = 0;
    }

    /**
     * Does physics with point
     * @param {Number} dt delta time
     */
    tick(dt) {
        // Calculate physics
        // -----------------------------------------------------------------------------
        // do repeated calculations
        /**
         * dt * dt
         * @type {Number}
         */
        let dt2 = dt * dt;

        /**
         * dt / lastDeltaTime
         * @type {Number}
         */
        let dtd;

        if (this.dt === 0) { // catch, because if dt is 0, the point's coords become NaN
            dtd = 1;
        } else {
            dtd = dt / this.dt;
        }

        // calculate deltas
        /**
         * deltaX
         * @type {Number}
         */
        let dx = this.x - this.lx;

        /**
         * deltaY
         * @type {Number}
         */
        let dy = this.y - this.ly;

        // Calculate the acceleration
        /**
         * acceleration x
         * @type {Number}
         */
        let ax = 0;

        /**
         * acceleration y
         * @type {Number}
         */
        let ay = CONF.gravity;

        /**
         * Calculate the 
         */
        
        // set lastX and lastY
        this.lx = this.x;
        this.ly = this.y;

        // calculate new x and y
        // formula: https://en.wikipedia.org/wiki/Verlet_integration#Non-constant_time_differences
        this.x = this.x + dx * dtd + ax * dt2;
        this.y = this.y + dy * dtd + ay * dt2;

        // set last delta time
        this.dt = dt;

        // keep around world border
        // -----------------------------------------------------------------------------
        if (this.y > CONF.height) {
            this.ly = this.y + dy;
        }
    }

    /**
     * Draw the point on the canvas
     * @param {CanvasRenderingContext2D} X Context to draw on
     */
    draw(X) {
        if (this.invisible) return;

        X.fillStyle = "#000000";
        X.beginPath();
        X.arc(this.x, this.y, 1, 0, Math.TAU);
        X.fill();
    }
}

/**
 * Stick class, keeps two points an equal distance from eachother
 */
class Stick {
    /**
     * Stick contructor
     * @param {Point} p0 point
     * @param {Point} p1 point
     * @param {Number} [strength] strength of stick
     * @param {Number} [length] length of stick
     */
    constructor(p0, p1, strength, length) {
        /**
         * point 0
         * @type {Point}
         */
        this.p0 = p0;

        /**
         * point 1
         * @type {Point}
         */
        this.p1 = p1;

        /**
         * length of stick
         * @type {Number}
         */
        this.length = length;

        /**
         * strength of stick
         * @type {Number}
         */
        this.strength = strength || 0.5;

        /**
         * can be drawn?
         * @type {Boolean}
         */
        this.invisible = this.p0.invisible || this.p1.invisible;

        // if no length specified, use current distance
        if (!length) {
            let dx = this.p1.x - this.p0.x,
                dy = this.p1.y - this.p0.y;

            this.length = pytha(dx, dy);
        }
    }

    /**
     * Moves points so stick stays the same length
     */
    tick() {
        let dx = this.p1.x - this.p0.x,
            dy = this.p1.y - this.p0.y,
            distance = pytha(dx, dy),
            diff = this.length - distance,
            ratio = diff / distance / 2,
            dxr = dx * (ratio * this.strength),
            dyr = dy * (ratio * this.strength);

        this.p0.x -= dxr;
        this.p0.y -= dyr;
        this.p1.x += dxr;
        this.p1.y += dyr;
    }

    /**
     * draws the stick
     * @param {CanvasRenderingContext2D} X context to draw in
     */
    draw(X) {
        if (this.invisible) return;

        X.strokeStyle = "#000000";
        X.lineWidth = 1;

        X.beginPath();
        X.moveTo(this.p0.x, this.p0.y);
        X.lineTo(this.p1.x, this.p1.y);
        X.stroke();
    }
}

class Form {
    constructor() {
        /**
         * List of sticks used in form
         * @type {Stick[]}
         */
        this.sticks = [];

        /**
         * List of points used in form
         * @type {Point[]}
         */
        this.points = [];
    }

    /**
     * Draw the form
     * @param {CanvasRenderingContext2D} X context to draw on
     */
    draw(X) {
        for (let point of this.points) {
            point.draw(X);
        }
        for (let stick of this.sticks) {
            stick.draw(X);
        }
    }

    /**
     * Ticks all the points and sticks in the form
     * @param {Number} dt delta time
     */
    tick(dt) {
        for (let point of this.points) {
            point.tick(dt);
        }
        for (let stick of this.sticks) {
            stick.tick(dt);
        }
    }
}

class Blobby extends Form {
    /**
     * Blobby constructor
     * @param {Number} x position
     * @param {Number} y position
     * @param {Number} r radius of blobby
     */
    constructor(x, y, r) {
        super();
        
        this.r = r;

        let points = r * Math.TAU / 16;

        // Creates a circle, and builds the sticks
        // -----------------------------------------------------------------------------
        // initalize lastPoint
        let lastPoint = new Point(r + x, y);
        let centerPoint = new Point(x, y, false);
        this.points.push(lastPoint);

        // loop through to make a circle
        for (let i = 1; i < points; i++) {
            let theta = i / points * Math.TAU,
                px = Math.cos(theta) * r + x,
                py = Math.sin(theta) * r + y,
                point = new Point(px, py);

            // push every point
            this.points.push(point);

            // connect lastPoint and current point together with stick
            this.sticks.push(new Stick(lastPoint, point));

            // update lastpoint
            lastPoint = point;
        }

        // connect point with every other point
        for (let i = 0; i < points; i++) {
            for (let j = 0; j < points; j++) {
                if (i === j) continue;
                this.sticks.push(new Stick(this.points[j], this.points[i], 0.1));
            }
        }

        // connect last and first stick
        this.sticks.push(new Stick(this.points[0], lastPoint));
        // add center point
        this.points.push(centerPoint);
    }
}

bodies.push(new Blobby(128, 512, 32));

/**
 * Ticks through all the bodies
 * @param {Number} dt delta time
 */
function tick(dt) {
    for (let body of bodies) {
        body.tick(dt);
    }
}

/**
 * Draw all thte bodies
 */
function draw() {
    X.clearRect(0, 0, C.width, C.height);

    for (let body of bodies) {
        body.draw(X);
    }
}

/**
 * RequestAnimationFrame handler
 * @param {Number} now performance.now()
 */
function reqanf(now) {
    var dt = now - then;
    then = now;
    
    tick(dt);
    draw();

    requestAnimationFrame(reqanf);
}

requestAnimationFrame(reqanf);