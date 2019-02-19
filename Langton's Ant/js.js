const C = document.getElementById("c"),
    D = document.getElementById("d"),
    X = C.getContext("2d"),
    Y = D.getContext("2d");

function resize() {
    var dpr = window.devicePixelRatio || 1;
    D.width = C.width = innerWidth * dpr;
    D.height = C.height = innerHeight * dpr;
    g.updateAll = true;
}

function wrap(e, f) {
    let a = e;
    a %= f;

    if (a < 0) {
        a += f;
    }

    return a;
}

class Ant {
    constructor(x, y, d, p) {
        this.x = x;
        this.y = y;
        this.d = d;
        this.parent = p;
    }
    move(e) {
        if (e) {
            this.d--;
        } else {
            this.d++;
        }
        this.d = wrap(this.d, 4);

        // 0: left, 1: up, 2: right, 3: down
        switch (this.d) {
            case 0:
                this.x--;
                break;
            case 1:
                this.y--;
                break;
            case 2:
                this.x++;
                break;
            case 3:
                this.y++;
        }
        this.x = wrap(this.x, this.parent.width);
        this.y = wrap(this.y, this.parent.height);
    }
}

class G {
    constructor() {
        this.width = Math.floor(innerWidth / 2);
        this.height = Math.floor(innerHeight / 2);
        
        this.scale = 2 * (window.devicePixelRatio || 1);

        this.antsCount = 5;
        this.ants = [];

        for(let i = 0; i < this.antsCount; i++) {
            this.ants.push(new Ant(
                Math.floor(this.width / 2),
                Math.floor(this.height / 2),
                Math.floor(Math.random() * 4),
                this
            ));
        }

        this.changes = [];
        this.map = new Uint8Array(this.width * this.height);
        this.then = 0;

        // for(let i = 0; i < 11000; i++) {
        //     this.tick();
        // }

        this.updateAll = true;

        this.draw();
    }

    tick() {
        for (let i of this.ants) {
            let p = i.x + i.y * this.width;
            i.move(this.map[p]);

            this.map[p] ^= 1;
            this.changes.push(p);
        }
    }

    drawChange() {
        if (this.updateAll || this.changes.length > this.width * this.height / 10) {
            this.updateAll = false;
            this.changes.length = 0;

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let p = x + y * this.width;
                    this.drawPx(p, this.map[p]);
                }
            }
            return;
        }

        while (this.changes.length > 0) {
            let p = this.changes.shift();
            this.drawPx(p, this.map[p]);
        }
    }

    drawPx(p, d) {
        let x = p % this.width,
            y = Math.floor(p / this.width);

        X.fillStyle = d ? "#000000" : "#FFFFFF";
        X.fillRect(
            x * this.scale,
            y * this.scale,
            this.scale,
            this.scale
        );
    }
    drawPy(x, y) {
        Y.fillStyle = "#FF0000";
        Y.fillRect(
            x * this.scale,
            y * this.scale,
            this.scale,
            this.scale
        );
    }

    draw(e) {
        this.tick();
        this.drawChange();
        
        Y.clearRect(0, 0, D.width, D.height);
        for(let i of this.ants) {
            this.drawPy(i.x, i.y);
        }

        if(e) {
            // console.log(1e3 / (e - this.then));
            this.then = e;
        }

        requestAnimationFrame(e => this.draw(e));
        // setTimeout(() => this.draw(), 500);
    }
}

const g = new G();

addEventListener("resize", resize);
resize();