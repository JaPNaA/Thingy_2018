/**
 * Thing abstract class
 */
class Thing {
    /**
     * Thing constructor
     * @param {Game} game parent game object
     * @param {Number} x coordinate
     * @param {Number} y coordinate
     * @param {Number} width dimension
     * @param {Number} height dimension
     */
    constructor(game, x, y, width, height) {
        this.game = game;
        this.game.things.push(this);

        this.x = x;
        this.y = y;

        this.lastX = x;
        this.lastY = y;

        this.lastDeltaTime = 0;

        this.width = width;
        this.height = height;
    }

    /**
     * @returns {Number} vx
     */
    get vx() {
        return this.x - this.lastX;
    }

    set vx(e) {
        this.lastX = this.x - e;
    }

    /**
     * @returns {Number} vy
     */
    get vy() {
        return this.y - this.lastY;
    }

    set vy(e) {
        this.lastY = this.y - e;
    }

    draw() { }
    drawTop() { }
    tick() { }
    remove() { }
    event() { }
    cursor() { }

    physics(dt) {
        // Other physics
        // -----------------------------------------------------------------------------
        // drag
        this.vy *= this.game.drag;
        this.vx *= this.game.drag;

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

        if (this.lastDeltaTime === 0) { // catch, because if dt is 0, the point's coords become NaN
            dtd = 1;
        } else {
            dtd = dt / this.lastDeltaTime;
        }

        // calculate deltas
        /**
         * deltaX
         * @type {Number}
         */
        let dx = this.x - this.lastX;

        /**
         * deltaY
         * @type {Number}
         */
        let dy = this.y - this.lastY;

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
        let ay = this.game.gravity;

        /**
         * Calculate the 
         */

        // set lastX and lastY
        this.lastX = this.x;
        this.lastY = this.y;

        // calculate new x and y
        // formula: https://en.wikipedia.org/wiki/Verlet_integration#Non-constant_time_differences
        this.x = this.x + dx * dtd + ax * dt2;
        this.y = this.y + dy * dtd + ay * dt2;

        // set last delta time
        this.lastDeltaTime = dt;
    }
}

/**
 * Letter class, visuals
 */
class Letter extends Thing {
    constructor(game, x, y, letter) {
        super(game, x, y, 32, 32);

        this.letter = letter;

        this.freeFall = false;
        this.active = false;
        this.destroyed = false;

        this.tx = x;
        this.ty = y;
        this.opacity = 1;
    }

    draw() {
        const X = this.game.X;
        
        X.save();
        X.globalAlpha = this.opacity;
        X.font = "36px monospace";
        X.fillStyle = this.active ? "#ffffff" : "#000000";
        X.textBaseline = "middle";
        X.textAlign = "center";
        X.fillText(this.letter, this.x, this.y);
        X.restore();
    }

    drop() {
        this.freeFall = true;
        this.active = false;
        this.lastX = this.x;
        this.lastY = this.y + -1 * this.lastDeltaTime;
    }

    tick(dt) {
        this.lastDeltaTime = dt;

        if (this.freeFall) {
            this.physics(dt);
        } else {
            if (this.game.started) {
                this.x += (this.tx - this.x) / (20 / dt);
                this.y += (this.ty - this.y) / (20 / dt);
            } else {
                this.x = this.tx;
                this.y = this.ty;
            }
        }
    }

    remove() {
        return this.destroyed || this.freeFall && this.y > this.game.scaledHeight;
    }
}

/**
 * Wall class, obstacle
 */
class Wall extends Thing {
    /**
     * Wall constructor
     * @param {Game} game parent game object
     * @param {Number} x position
     */
    constructor(game, x) {
        super(game, x, 0, 108, game.scaledHeight);

        this.playerInside = false;
        this.lastPlayerInside = false;

        this.gapHeight = 316;
        this.gapY = Math.random() * (game.scaledHeight - this.gapHeight);
    }

    tick(dt) {
        if (this.playerInside) {
            this.lastPlayerInside = true;
        }
        if (this.lastPlayerInside && !this.playerInside) {
            this.game.score++;
            this.lastPlayerInside = false;
        }
        this.x -= Wall.speed * dt;
    }

    remove() {
        return this.x < -this.width;
    }

    draw() {
        const X = this.game.X;

        X.fillStyle = "#00aa00";
        X.fillRect(this.x, this.y, this.width, this.gapY + this.y);
        X.fillRect(
            this.x, 
            this.y + this.gapY + this.gapHeight, 
            this.width, 
            this.game.scaledHeight - (this.y + this.gapY + this.gapHeight)
        );
    }
}

Wall.speed = 0.2;

/**
 * Player class, player
 */
class Player extends Thing {
    /**
     * Player constructor
     * @param {Game} game parent game object
     */
    constructor(game) {
        super(game, 128, 450, 52, 52);

        this.dead = false;

        switch (game.difficulty) {
        case 0: // easy
            this.game.startSpeed = 0.5;
            /** fallthrough */
        case 1: // default
            this.possibleKeys = "abcdefghijklmnopqrstuvwxyz";
            break;
        case 3: // not impossible
            this.bufferDisabled = true;
            /** fallthrough */
        case 2: // hard
            this.possibleKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-=!@#$%^&*()_+";
            break;
        }
        this.possibility = this.possibleKeys.length;
        /** @type {Letter} */
        this.key = null;

        this.bufferDisabled = this.bufferDisabled || false;
        /** @type {Letter[]} */
        this.keybuffer = [];
        this.bufferLength = 10;

        this.texture = {
            idle: loadImage("img/player.png"),
            dead: loadImage("img/player_dead.png")
        };
        
        this.setup();
    }

    randkey() {
        return new Letter(this.game, this.x, this.y, this.possibleKeys[Math.floor(Math.random() * this.possibility)]);
    }

    newKey() {
        if (this.key) {
            this.key.drop();
        }

        if (this.bufferDisabled) {
            this.key = this.randkey();
        } else {
            while (this.keybuffer.length <= this.bufferLength) {
                this.keybuffer.push(this.randkey());
            }
            this.key = this.keybuffer.shift();
        }
    }

    setup() {
        this.newKey();
    }

    /**
     * draws player
     */
    draw() {
        const X = this.game.X,
            halfWidth = this.width / 2,
            halfHeight = this.height / 2;

        // draw player
        X.save();

        X.translate(this.x + halfWidth, this.y + halfHeight);
        X.rotate(this.vy / 50);

        if (this.dead) {
            if (this.texture.dead.complete) {
                X.drawImage(this.texture.dead,
                    0, 0, this.texture.dead.width, this.texture.dead.height,
                    -halfWidth, -halfHeight, this.width, this.height
                );
            } else {
                X.fillStyle = "#ff0000";
                X.fillRect(-halfWidth, -halfHeight, this.width, this.height);
            }
        } else {
            if (this.texture.idle.complete) {
                X.drawImage(this.texture.idle,
                    0, 0, this.texture.idle.width, this.texture.idle.height,
                    -halfWidth, -halfHeight, this.width, this.height
                );
            } else {
                X.fillStyle = "#0000ff";
                X.fillRect(-halfWidth, -halfHeight, this.width, this.height);
            }
        }

        X.restore();
        X.save();

        // draw key
        this.key.tx = this.x + halfWidth;
        this.key.ty = this.y + halfHeight;
        this.key.active = true;

        if (!this.bufferDisabled) {
            // draw key buffer
            X.fillStyle = "#000000";
            for (let i = 0; i < this.bufferLength; i++) {
                const key = this.keybuffer[i];
                key.tx = this.x + this.width * 1.5 + i * 32;
                key.ty = this.y + halfHeight;
                key.opacity = 1 - i * (1 / this.bufferLength);
            }
        }

        X.restore();
    }

    /**
     * Checks for collisions between walls and the player
     */
    collide() {
        for (let wall of this.game.things) {
            if (!(wall instanceof Wall)) continue;
            
            if (
                this.x + this.width > wall.x &&
                this.x < wall.x + wall.width
            ) {
                if (!(
                    this.y > wall.gapY &&
                    this.y + this.height < wall.gapY + wall.gapHeight
                )) {
                    if (!this.dead) {
                        this.onDead();
                    }
                    this.dead = true;
                } else {
                    wall.playerInside = true;
                }
            } else {
                wall.playerInside = false;
            }
        }
    }

    onDead() {
        this.vy += -1 * this.lastDeltaTime;
    }

    /**
     * Does dead animation before ending the game
     */
    deadAnimation() {
        this.game.end();
    }

    /**
     * removes all children letters
     */
    removeChildren() {
        for (const key of this.keybuffer) {
            key.destroyed = true;
        }
        this.key.destroyed = true;
    }

    /**
     * moves player ahead in time
     * @param {Number} dt deltaTime
     */
    tick(dt) {
        this.physics(dt);
        if (this.dead) {
            this.deadAnimation();
        } else {
            this.collide();
        }
    }

    /**
     * respond to user event
     * @param {String} type event type
     * @param {Event} e event information
     */
    event(type, e) {
        if (this.dead) return;

        switch (type) {
        case "keydown":
            if (e.key === this.key.letter) {
                if (!this.game.started) {
                    this.game.start();
                    this.vy += -1.3 * 8;
                } else {
                    this.vy += -1.3 * this.lastDeltaTime;
                }
                
                this.newKey();
            }
            break;
        }
    }
}

class CooldownItem {
    /**
     * CooldownItem constructor
     * @param {Number} time how long the cooldown is
     * @param {Number} heat how long until cooldown expires
     * @param {Function} callback what to do when cooldown expires
     */
    constructor(time, heat, callback) {
        this.time = time;
        this.heat = heat;
        this.callback = callback;
    }
}

/**
 * StartDisplay class, shown when player starts game
 */
class StartDisplay extends Thing {
    /**
     * StartDisplay constructor
     * @param {Game} game parent game object
     */
    constructor(game) {
        super(game, 0, 0, game.scaledWidth, game.scaledHeight);
        this.game = game;
        this.aniframe = 0;
        this.anitime = 1000;
        
        this.closing = false;
        this.readyRemove = false;

        this.difficultyNameMap = [
            "easy",
            "normal",
            "hard",
            "not impossible"
        ];
    }

    
    tick(dt) {
        if (this.closing) {
            this.aniframe += dt / this.anitime;
            if (this.aniframe > 1) {
                this.aniframe = 1;
                this.readyRemove = true;
            }
        }
    }
    
    draw() {
        const X = this.game.X;
        
        X.save();
        X.globalAlpha = easeInOutQuad(1 - this.aniframe);

        X.font = "64px sans-serif";
        X.fillStyle = "#000000";
        X.textAlign = "left";
        X.textBaseline = "top";
        
        X.fillText("FlappyType", this.game.player.x, 156);
        
        X.textBaseline = "bottom";
        X.font = "32px sans-serif";

        X.fillText("Difficulty: " + this.difficultyNameMap[this.game.difficulty], this.game.player.x, 720);
        
        X.fillStyle = "#444444";
        X.font = "24px sans-serif";
        X.fillText("Use the up/down arrow keys to change difficulty", this.game.player.x, 720 + 24);

        X.fillStyle = "#000000";
        X.font = "32px sans-serif";
        X.fillText("Press the keys shown on the bird to go up!", this.game.player.x, this.game.player.y - 8);
        
        if (!this.game.player.bufferDisabled) {
            X.textBaseline = "top";
            X.font = "28px sans-serif";
            X.fillStyle = "#444444";
            X.fillText("These are the keys that come after", this.game.player.x + this.game.player.width + 8, this.game.player.y + this.game.player.height + 8);
        }

        X.fillStyle = "#000000";
        X.fillText("Be ready to jump through the walls!", this.game.player.x, this.game.player.y + this.game.player.height + 64);

        X.restore();
    }

    /**
     * event handler
     * @param {String} type event type
     * @param {Event} e event information
     */
    event(type, e) {
        switch(type) {
        case "keydown":
            if (e.keyCode === 38) {
                if (this.difficultyNameMap[this.game.difficulty + 1]) {
                    this.game.difficulty++;
                    this.game.parent.difficulty = this.game.difficulty;
                    this.game.resetPlayer();
                }
            } else if (e.keyCode === 40) {
                if (this.difficultyNameMap[this.game.difficulty - 1]) {
                    this.game.difficulty--;
                    this.game.parent.difficulty = this.game.difficulty;
                    this.game.resetPlayer();
                }
            }
            break;
        }
    }
    
    /**
     * check if this should be removed
     * @returns {Boolean} remove?
     */
    remove() {
        return this.readyRemove;
    }

    close() {
        this.closing = true;
    }
}

/**
 * DeathDisplay class, shown when player dies
 */
class DeathDisplay extends Thing {
    constructor(game) {
        let width = 260,
            height = 340;

        super(game, 
            (game.scaledWidth - width) / 2, 
            (game.scaledHeight - height) / 2, 
            width, height
        );

        this.aniframe = 0;
        this.anitime = 250;

        this.restartButton = {
            x: 0,
            y: 274,
            width: this.width,
            height: this.height - 274,

            down: false,
            aniframe: 0,
            anitime: 150
        };
    }

    tick(dt) {
        this.aniframe += dt / this.anitime;

        if (this.aniframe > 1) {
            this.aniframe = 1;
        }

        if (this.restartButton.down) {
            this.restartButton.aniframe += dt / this.restartButton.anitime;

            if (this.restartButton.aniframe > 1) {
                this.restartButton.aniframe = 1;
            }
        } else {
            this.restartButton.aniframe -= dt / this.restartButton.anitime;
            if (this.restartButton.aniframe < 0) {
                this.restartButton.aniframe = 0;
            }
        }
    }

    drawTop() {
        const X = this.game.X,
            halfWidth = this.width / 2,
            ani = easeInOutQuad(this.aniframe);
        
        // rectangles
        // -----------------------------------------------------------------------------
        X.save();
        X.translate(this.x, this.y);
        X.scale(1, ani);
        X.globalAlpha = ani;

        X.fillStyle = "rgba(255, 255, 255, 0.1)";
        X.strokeStyle = "#9d9d9d";

        X.shadowBlur = 6;
        X.shadowColor = "rgba(0, 0, 0, 0.6)";
        X.shadowOffsetX = 2;
        X.shadowOffsetY = 2;

        // You died with x points.
        X.beginPath();
        X.rect(0, 0, this.width, 266);
        X.stroke();
        X.fill();

        X.fillStyle = "rgba(0, 255, 0, 0.1)";
        X.strokeStyle = "#489d48";

        X.shadowColor = "rgba(0, 0, 0, " + 
            (
                0.6 + easeInOutQuad(this.restartButton.aniframe) * 0.4
            ) + ")";

        // Restart
        X.beginPath();
        X.rect(
            this.restartButton.x, this.restartButton.y,
            this.restartButton.width, this.restartButton.height
        ); 
        X.stroke();
        X.fill();

        X.restore();

        // Text
        // -----------------------------------------------------------------------------
        X.save();
        X.translate(this.x, this.y);
        X.scale(1, ani);
        X.globalAlpha = ani;

        X.textBaseline = "top";
        X.textAlign = "center";

        // You died with x points.
        X.font = "32px sans-serif";
        X.fillStyle = "#000000";
        X.fillText("You died with", halfWidth, 32);

        X.fillText("points.", halfWidth, 198);

        X.font = "128px sans-serif";
        X.fillStyle = "#000000";
        X.fillText(this.game.score.toString(), halfWidth, 64);

        // Restart
        X.font = "32px sans-serif";
        X.fillText("Restart", halfWidth, 290);

        X.restore();
    }

    event(type, e) {
        const x = this.game.cursorX,
            y = this.game.cursorY, 
            rbX = this.restartButton.x + this.x,
            rbY = this.restartButton.y + this.y;

        if (
            x > rbX &&
            y > rbY &&
            x < rbX + this.restartButton.width &&
            y < rbY + this.restartButton.height
        ) {
            switch (type) {
            case "mousedown":
                this.restartButton.down = true;
                break;
            case "mouseup":
                if (this.restartButton.down) {
                    this.game.restart();
                }
                this.restartButton.down = false;
                break;
            }
        }

        switch(type) {
        case "keydown":
            if (e.keyCode === 32 || e.keyCode === 82 || e.keyCode === 13) {
                this.game.restart();
            }
            break;
        }
    }

    cursor(x, y) {
        const rbX = this.restartButton.x + this.x,
            rbY = this.restartButton.y + this.y;
        if (
            x > rbX && 
            y > rbY &&
            x < rbX + this.restartButton.width &&
            y < rbY + this.restartButton.height
        ) {
            return "pointer";
        }
    }
}

/**
 * Game class
 */
class Game {
    /**
     * Game constructor
     * @param {Perm} parent parent object
     */
    constructor(parent) {
        this.parent = parent;

        // variables
        this.then = 0;

        /** @type {HTMLCanvasElement} */
        this.canvas = document.getElementById("c");

        /** @type {CanvasRenderingContext2D} */
        this.X = this.canvas.getContext("2d");

        /** @type {Player} */
        this.player = null;

        /** @type {StartDisplay} */
        this.startDisplay = null;

        /** @type {DeathDisplay} */
        this.deathDisplay = null;

        /** @type {Thing[]} */
        this.things = [];

        this.userEventHandler = e => this.event(e.type, e);

        // config
        // -----------------------------------------------------------------------------
        this.height = 1080;
        this.minWidth = 780;

        this.gravity = 0.0015;
        this.drag = 0.99;
        this.startSpeed = 1;
        this.difficulty = parent.difficulty; // 0: default, 1: hard, 2: not impossible

        this.catchEvents = ["mousemove", "mousedown", "mouseup", "keydown"];
        this.eventHandlers = {
            "mousemove": e => this.mousemove(e),
            "resize": () => this.resize()
        };

        // states
        // -----------------------------------------------------------------------------
        this.score = 0;
        this.speed = 0;

        this.scaledHeight = 1080;
        this.scaledWidth = 1920;
        this.scale = 1;

        this.cursorX = 0;
        this.cursorY = 0;
        
        this.started = false;
        this.ended = false;
        this.stop = false;

        this.cooldown = {
            Wall: new CooldownItem(3000, 0, 
                () => new Wall(this, this.scaledWidth)
            ),
            speedUp: new CooldownItem(9000, 6000, 
                () => this.speed += 0.01
            )
        };
        /** @type {String[]} */
        this.cooldownItems = Object.keys(this.cooldown);

        this.setup();
    }

    setup() {
        this.player = new Player(this);
        this.startDisplay = new StartDisplay(this);

        this.resize();
        this.reqanfl();

        // register event listeners

        for (const i in this.eventHandlers) {
            addEventListener(i, this.eventHandlers[i]);
        }

        for (const i of this.catchEvents) {
            addEventListener(i, this.userEventHandler);
        }
    }
    
    start() {
        this.startDisplay.close();
        this.speed = this.startSpeed;
        this.started = true;
    }

    end() {
        if (this.ended) return;
        this.ended = true;

        this.deathDisplay = new DeathDisplay(this);
        // this.speed = 0;
    }

    restart() {
        // unregister event listeners
        for (const i in this.eventHandlers) {
            removeEventListener(i, this.eventHandlers[i]);
        }

        for (const i of this.catchEvents) {
            removeEventListener(i, this.userEventHandler);
        }

        this.stop = true;

        // create new game
        this.parent.restart();
    }

    /**
     * reloads the player
     */
    resetPlayer() {
        this.things.splice(this.things.indexOf(this.player), 1);
        this.player.removeChildren();
        this.player = new Player(this);
    }

    /**
     * manages this.cooldown
     * @param {Number} dt deltaTime
     */
    cool(dt) {
        for (const i of this.cooldownItems) {
            /** @type {CooldownItem} */
            const item = this.cooldown[i];

            item.heat -= dt;

            if (item.heat < 0) {
                item.callback();
                item.heat += item.time;
            }
        }
    }

    /**
     * draws all things
     */
    draw() {
        // clear
        this.X.clearRect(0, 0, this.scaledWidth, this.scaledHeight);

        // draw
        for (const thing of this.things) {
            thing.draw();
        }
        // draw anything that's supposed to be on top of everything else
        for (const thing of this.things) {
            thing.drawTop();
        }
    }

    /**
     * moves everything ahead in time
     * @param {Number} dt deltaTime
     */
    tick(dt) {
        this.cool(dt);

        for (const thing of this.things) {
            thing.tick(dt);
        }

        for (let i = this.things.length - 1; i >= 0; i--) {
            const thing = this.things[i];
            
            if (thing.remove()) {
                this.things.splice(i, 1);
            }
        }
    }

    /**
     * checks everything for a cursor
     */
    cursor() {
        var cursor = "default";
        for (const thing of this.things) {
            cursor = thing.cursor(this.cursorX, this.cursorY) || cursor;
        }
        this.canvas.style.cursor = cursor;
    }

    // handlers
    // -----------------------------------------------------------------------------
    /**
     * requestAnimationFrame handler
     * @param {Number} now performance.now()
     */
    reqanf(now) {
        var dt = now - this.then;
        this.then = now;

        dt *= this.speed;

        this.tick(dt);
        this.draw();
        this.cursor();

        this.reqanfl();
    }

    /**
     * resize handler
     */
    resize() {
        if (this.started) return;

        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        let scale = this.canvas.height / this.height;

        if (this.canvas.width / scale < this.minWidth) {
            scale = this.canvas.width / this.minWidth;
        }

        this.X.scale(scale, scale);

        this.scaledWidth = this.canvas.width / scale;
        this.scaledHeight = this.canvas.height / scale;
        this.scale = scale;
    }

    /**
     * mousemove handler
     * @param {MouseEvent} e event information
     */
    mousemove(e) {
        this.cursorX = e.clientX / this.scale;
        this.cursorY = e.clientY / this.scale;
    }

    /**
     * handles user events, and sends events to game things
     * @param {String} type type of event
     * @param {Event} event event information
     */
    event(type, event) {
        for (const thing of this.things) {
            thing.event(type, event);
        }
    }

    /**
     * Small loop to prevent memory leaks
     */
    reqanfl() {
        if (this.stop) return;
        requestAnimationFrame(e => this.reqanf(e));
    }
}

/**
 * Permanant instance
 */
class Perm {
    constructor() {
        this.difficulty = 1;

        this.game = new Game(this);
    }

    restart() {
        this.game = new Game(this);
    }
}

const p = new Perm();