// global constants
// -----------------------------------------------------------------------------

const C = document.getElementById("c"),
    X = C.getContext("2d");

// utils
// -----------------------------------------------------------------------------
/**
 * Pythagorean theorem
 * @param {number} x delta x
 * @param {number} y delta y
 * @returns {number} result
 */
function pytha(x, y) {
    return Math.sqrt(x * x + y * y);
}

// abstract object classes
// -----------------------------------------------------------------------------
/**
 * class Point - a point in space
 */
class _Point {
    /**
     * Point constructor
     * @param {number} x x position
     * @param {number} y y position
     * @param {World} world world point is in
     * @param {object} options other options
     * @param {boolean} options.pin can point move
     */
    constructor(x, y, world, options) {
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;

        this.world = world;

        if (options) {
            this.pinned = Boolean(options.pin);
        } else {
            this.pinned = false;
        }
    }

    /**
     * moves point ahead in time
     * @param {number} tt time elapsed (milliseconds)
     */
    tick(tt) {
        const dx = this.x - this.lastX,
            dy = this.y - this.lastY;

        this.lastX = this.x;
        this.lastY = this.y;
        this.x += dx;
        this.y += dy;

        // bouce world
        // -----------------------------------------------------------------------------
        if (this.y > this.world.height) {
            this.y = this.world.height;
            this.lastY = this.y + dy;
        }
    }

    setVelocity(x, y) {
        this.lastX = this.x - x;
        this.lastY = this.y - y;
    }
}

/**
 * class Stick - constrains points to be in a distance of each other
 */
class _Stick {
    /**
     * Stick constructor
     * @param {_Point} p0 point 1
     * @param {_Point} p1 point 2
     * @param {number} length how far the two points should be from each other
     */
    constructor(p0, p1, length) {
        this.p0 = p0;
        this.p1 = p1;
        this.length = length;
    }

    /**
     * constrains points
     * @param {number} tt time elapsed (milliseconds)
     */
    tick(tt) {
        const dx = this.p1.x - this.p0.x,
            dy = this.p1.y - this.p0.y,
            distance = pytha(dx, dy),
            diff = this.length - distance,
            ratio = diff / distance / 2;
        
        this.p0.x -= dx * ratio;
        this.p0.y -= dy * ratio;
        this.p1.x += dx * ratio;
        this.p1.y += dy * ratio;
    }
}

/**
 * class Form - can be rendered, sticks connected to each other
 */
class _Form {
    /**
     * Form constructor
     * @param {_Stick[]} sticks sticks to be connected
     * @param {_Point[]} points points used in form
     * @param {World} world world form is in
     * @param {object} [options] options for form
     * @param {string} [options.color] color of the form
     */
    constructor(sticks, points, world, options) {
        this.sticks = sticks;
        this.points = points;
        this.world = world;

        this.color = "#000";

        if (options) {
            this.color = options.color || this.color;
        }
        
        this.world.add(this);
    }

    /**
     * renders self
     * @param {CanvasRenderingContext2D} X context to render in
     */
    render(X) {
        const length = this.sticks.length;

        // creats path around sticks according to p0
        X.beginPath();
        X.moveTo(this.sticks[0].p0.x, this.sticks[0].p0.y);
        for (let i = 1; i < length; i++) {
            const point = this.sticks[i].p0;
            X.lineTo(point.x, point.y);
        }
        X.closePath();

        X.fillStyle = this.color;
        X.fill();
    }

    tick(tt) {
        for (const stick of this.sticks) {
            stick.tick(tt);
        }
        for (const point of this.points) {
            point.tick(tt);
        }
        for (const stick of this.sticks) {
            stick.tick(tt);
        }
    }
}

// object classes
// -----------------------------------------------------------------------------
/**
 * class Rectangle : Form - creates a form in the shape of a rectange
 */
class Rectangle extends _Form {
    /**
     * Rectangle constructor
     * @param {number} x x position
     * @param {number} y y position
     * @param {number} width width of rectangle
     * @param {number} height height of rectangle
     * @param {World} world world form is in
     * @param {object} options see Form.options
     */
    constructor(x, y, width, height, world, options) {
        var diagonalDistance = pytha(width, height),
            points = [
                new _Point(x, y, world),                  // top left
                new _Point(x + width, y, world),          // top right
                new _Point(x + width, y + height, world), // bottom right
                new _Point(x, y + height, world)          // bottom left
            ],
            sticks = [
                new _Stick(points[0], points[1], width),            // top side
                new _Stick(points[1], points[2], height),           // right side
                new _Stick(points[2], points[3], width),            // bottom side
                new _Stick(points[3], points[0], height),           // left side
                new _Stick(points[0], points[2], diagonalDistance), // diagonal supports
                new _Stick(points[1], points[3], diagonalDistance)
            ];

        super(sticks, points, world, options);
        this.width = width;
        this.height = height;
    }
}

// worker classes
// -----------------------------------------------------------------------------
/**
 * class Renderer - renders objects
 */
class _Renderer {
    /**
     * Renderer constructor
     * @param {World} world world to attach to
     */
    constructor(world) {
        this.world = world;
    }

    /**
     * renders objects added onto context
     * @param {CanvasRenderingContext2D} context context to render in
     */
    render(context) {
        if (!context) throw new TypeError("context is undefined");

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        for (const obj of this.world.objs) {
            obj.render(context);
        }
    }
}

/**
 * class Physicer - applies physics to world
 */
class _Physicer {
    /**
     * Physicer constructor
     * @param {World} world world to attach to
     */
    constructor(world) {
        this.world = world;
    }

    /**
     * moves object in world some time
     * @param {number} tt time elasped (milliseconds)
     */
    tick(tt) {
        for (const obj of this.world.objs) {
            // force: gravity
            for (let pt of obj.points) {
                pt.y += 1;
            }
            
            obj.tick(tt);
        }
    }
}

/**
 * class Timer - keeps track of time
 */
class _Timer {
    constructor() {
        this.then = performance.now();
    }

    /**
     * calculates amount of time passing between each call
     * @returns {number} time elapsed (minniseconds)
     */
    elapsed() {
        const now = performance.now(),
            tt = now - this.then;
        this.then = now;
        return tt;
    }
}

// envrioment classes
// -----------------------------------------------------------------------------
/**
 * World class - holds every objects, and it's workers
 */
class World {
    constructor(width, height) {
        /**
         * @type _Form[]
         */
        this.objs = [];

        this.width = width;
        this.height = height;

        this.autoing = false;
        this.context = null;

        this.renderer = new _Renderer(this);
        this.physicer = new _Physicer(this);
        this.timer = new _Timer();
    }

    /**
     * adds a form object to the world
     * @param {_Form} obj renderable Form object
     */
    add(obj) {
        this.objs.push(obj);
    }

    /**
     * automatically draws and tick
     * @param {CanvasRenderingContext2D} context context to draw in
     */
    auto(context) {
        this.autoing = true;
        this.context = context;
        this.timer.elapsed(); // resets timer

        this._loop();
    }

    /**
     * draws, physics, and loops
     * @returns {number} requestAnimationFrame counter
     */
    _loop() {
        this.renderer.render(this.context);
        this.physicer.tick(this.timer.elapsed());

        return requestAnimationFrame(() => this._loop());
    }
}


/**
 * main function
 */
function main() {
    C.width = 1280;
    C.height = 720;

    let world = new World(C.width, C.height);
    new Rectangle(84, 64, 32, 32, world, {color: "#00f"});
    new Rectangle(84, 8, 32, 32, world, {color: "#f00"});

    world.auto(X);
}

main();