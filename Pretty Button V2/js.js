(function () {
    const TAU = 2 * Math.PI;

    class P {
        constructor(btn) {
            this.style = getComputedStyle(btn);

            this.value = btn.innerHTML;

            this.font = this.style.font;
            this.fontSize = parseFloat(this.style.fontSize.replace(/[A-Z][a-z]/g, ""));
            this.color = this.style.color;

            this.cvs = document.createElement("canvas");
            this.X = this.cvs.getContext("2d");

            this.w = btn.clientWidth;
            this.h = btn.clientHeight;
            this.padW = 32;
            this.padH = 16;

            var w = this.w + this.padW,
                h = this.h + this.padH;

            this.dpr = devicePixelRatio || 1;
            this.cvs.width = w * this.dpr;
            this.cvs.height = h * this.dpr;

            this.o = [];

            btn.style.width = w + "px";
            btn.style.height = h + "px";

            btn.innerHTML = "";
            btn.appendChild(this.cvs);

            btn.addEventListener("mousedown", e => this.mousedown(e));
            btn.addEventListener("touchstart", e => this.mousedown(e));
            btn.addEventListener("mouseup", e => this.mouseup(e));
            btn.addEventListener("touchend", e => this.mouseup(e));

            this.holding = false;

            this._si = null;
            this._sleep = true;

            this.aniSpeed = 850;
            this.bgani = 0;

            this.drawTxt();
        }

        get sleep() {
            return this._sleep;
        }
        set sleep(e) {
            if (e ^ this._sleep) {
                if (e) {
                    cancelAnimationFrame(this._si);
                } else {
                    this.reqanf();
                }
            }
            this._sleep = e;
        }

        mousedown(e) {
            e.preventDefault();
            if(e.type.startsWith("touch")) {
                let a = e.changedTouches[0],
                    b = this.cvs.getBoundingClientRect();
                this.o.push([a.clientX - b.x, a.clientY - b.y, Date.now()]);
            } else {
                this.o.push([e.layerX, e.layerY, Date.now()]);
            }
            this.sleep = false;
            this.holding = true;
        }
        mouseup() {
            this.holding = false;
            this.sleep = false;
        }

        clear() {
            this.X.clearRect(0, 0, this.cvs.width, this.cvs.height);
        }
        drawTxt() {
            var X = this.X;
            X.save();

            if(this.dpr != 1) {
                X.scale(this.dpr, this.dpr);
            }

            X.font = this.font;
            X.fillStyle = this.color;

            var tm = X.measureText(this.value),
                w = this.w + this.padW;

            X.fillText(
                this.value,
                (w - tm.width) / 2,
                this.fontSize + this.padH / 2,
                w
            );

            X.restore();
        }
        reqanf() {
            var now = Date.now(),
                bganiT = 0;

            this._sleep = false;

            this.clear();
            this.drawTxt();

            var X = this.X;

            for (let i of this.o) {
                if (now - i[2] > this.aniSpeed) {
                    this.o.splice(this.o.indexOf(i), 1);
                }
            }

            if (!this.o.length && !this.bgani) {
                this.sleep = true;
                return;
            }

            X.save();

            if (this.dpr != 1) {
                X.scale(this.dpr, this.dpr);
            }

            if(this.holding) {
                bganiT = 1;
            } else {
                this.bgani -= 0.01;
            }
            this.bgani += (bganiT - this.bgani) / 5;
            if(this.bgani > 1 || this.bgani < 0) this.bgani = 0;

            X.fillStyle = this.color;
            X.globalAlpha = this.bgani * 0.35;
            X.fillRect(0, 0, this.cvs.width, this.cvs.height);

            X.fillStyle = this.color;
            for (let i of this.o) {
                X.beginPath();
                X.globalAlpha = (1 - ((now - i[2]) / this.aniSpeed) ** 2) * 0.5;
                X.arc(
                    i[0], i[1],
                    this.ani(now - i[2]),
                    0, TAU
                );
                X.fill();
            }

            X.restore();

            this._si = requestAnimationFrame(() => this.reqanf());
        }
        ani(e) {
            var a = e / this.aniSpeed;
            return (a < .5 ? 2 * a * a : -1 + (4 - 2 * a) * a) * (this.w + this.padW) * 1.2;
        }
    }

    function createButton(btn) {
        btn.pr = new P(btn);

        if (btn.pr.underline) {
            console.warn(btn, "has attribute underline, which is ugly");
        }
    }

    var a = document.querySelectorAll("button[pretty]");
    for (let i of a) {
        createButton(i);
    }

}());