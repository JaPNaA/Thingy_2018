window.onerror = alert;

class G {
    constructor(texts) {
        var that = this;

        this.texts = texts;
        this.cheatCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
        this.lastKeys = [];

        this.container = document.createElement("div"); // contains entire game
        this.container.classList.add("typeracerclone");

        this.ttm = "Loading..."; // text-to-match
        this._inp = ""; // current input

        this.charWidth = 0;
        this.charHeight = 0;

        this.currentText = 0;
        this.randTextSeq = 0;
        this.cheatMode = false;

        this._caseSensitive = true;

        this.touchKeyboard = false;

        this.elapsedTime = 0;
        this.then = 0;
        this.chars = 0;
        this.started = false;
        this.next = true;

        this.stopAnimationFrame = false;

        this._makeDOM(); // make elements
        this._appendBody(); // append to body
        this.nextText(); // set text, and update

        // listen for key presses
        addEventListener("keydown", function (e) {
            if (!e.altKey && !e.ctrlKey && !that.touchKeyboard) e.preventDefault();
            that.keydown(e);

            // cheatcode
            {
                that.lastKeys.push(e.keyCode);

                let cl = that.cheatCode.length,
                    s = true;

                while (that.lastKeys.length > 10) {
                    that.lastKeys.shift();
                }

                for (let i = 0; i < cl; i++) {
                    if (that.lastKeys[i] != that.cheatCode[i]) {
                        s = false;
                        break;
                    }
                }

                that.cheatMode ^= s;
                if (s) {
                    that.cursor.classList.add("hax");
                }
                that.upd();
            }
        });
        addEventListener("message", function (e) {
            var a = e.data;
            switch (a[0]) {
                case "KEY":
                    that.keydown({
                        key: a[1],
                        ctrlKey: a[2],
                        altKey: a[3]
                    });
                    break;
                case "CASESENSITIVE":
                    that.caseSensitive = a[1];
                    break;
            }
        });
        this.container.addEventListener("touchstart", () => this.touchstart());

        this.reqanf();
    }
    get inp() {
        return this._inp;
    }
    set inp(e) {
        if (e === false) {
            this._inp = "";
        } else {
            this._inp = e;
            if (!this.started) {
                this.then = Date.now();
                this.started = true;
            }
            this.upd();
        }
    }
    get done() {
        return false;
    }
    set done(e) {
        if (e) {
            if (this.touchKeyboard) {
                this.inpElm.value = "";
            }

            var now = Date.now();

            this.elapsedTime += now - this.then;
            this.started = false;
            this.chars += this.inp.length;

            this.nextText();
        }
    }
    get wpm() {
        return (
                (this.chars + this.inp.length) / 5) /
            ((this.elapsedTime + (this.started ? Date.now() - this.then : 0)) / 6e4) || 0;

        // 5 chars per word, 60000 = 1 minute in milliseconds
    }
    get caseSensitive() {
        return this._caseSensitive;
    }
    set caseSensitive(e) {
        this._caseSensitive = e;
        this.upd(1);
    }

    newRandSeq() {
        return Math.floor(Math.random() * this.texts.length);
    }

    reqanf() {
        requestAnimationFrame(() => this.reqanf());

        if (!this.started) return;

        var elapsedTime = ((this.elapsedTime + (this.started ? Date.now() - this.then : 0)) / 1e3),
            wpm = this.wpm;

        if (innerWidth > 564) {
            let a = wpm.toString().split(".");
            if (a[1]) {
                a[1] = a[1].padEnd(13, '0').slice(0, 13);
            } else {
                a[1] = "0".repeat(13);
            }
            wpm = a[0] + "." + a[1];
        } else {
            wpm = Math.round(wpm);
        }

        {
            let a = elapsedTime.toString().split(".");
            if (a[1]) {
                a[1] = a[1].padEnd(3, '0').slice(0, 13);
            } else {
                a[1] = "0".repeat(3);
            }
            elapsedTime = a[0] + "." + a[1];
        }

        this.wpmElm.innerHTML = wpm;
        this.wordsElm.innerHTML = this.chars + this.inp.length;
        this.elapsedTimeElm.innerHTML = elapsedTime;
    }

    nextText() {
        var ct, nt;

        if (this.next) {
            this.currentText = 0;
            this.randTextSeq = this.newRandSeq();

            ct = this.texts[this.randTextSeq];
            nt = ct.text[this.currentText++];

            let c = 0;

            for(let i of ct.text) {
                if (nt) {
                    c += i.length;
                }
            }

            parent.postMessage(["setMeta", ct.title, ct.notes, c], "*");

            this.next = false;
        } else {
            ct = this.texts[this.randTextSeq];
            nt = ct.text[this.currentText++];
        }
        
        this.started = false;
        this.inp = false;
        if (nt) {
            this.ttm = nt;
            this.mainElm.classList.remove("done");
        } else {
            this.ttm = "Next sequence ";
            this.mainElm.classList.add("done");
            this.next = true;
        }
        this.upd(1);
    }

    keydown(e) {
        var timp = this.inp;
        if (!e.ctrlKey && !e.altKey) {
            if (e.key.length == 1) {
                this.inp = timp + e.key;
                return;
            }
        }
        switch (e.key.toLowerCase()) {
            case "backspace": // on backspace
                timp = timp.slice(0, timp.length - 1); // remove 1st char
                if (e.ctrlKey) { // if ctrl
                    timp = timp.slice(0, timp.lastIndexOf(' ') + 1); // remove to last space
                }
                this.inp = timp; // set
                break;
        }
    }

    touchstart() {
        this.touchKeyboard = true;

        this.container.appendChild(this.inpElm);
        this.inpElm.focus();

        this.inpElm.style.top = this.cursor.y + "px";
        this.inpElm.style.left = this.cursor.x + "px";
    }

    _makeDOM() {
        this.mainElm = document.createElement("div"); // make main element
        this.dataElm = document.createElement("div"); // make data element
        this.mainElm.classList.add("main");
        this.dataElm.classList.add("data");

        {
            let a = document.createElement("div");
            a.classList.add("cursor");
            this.cursor = a;
            this._setupCursor(a);
            this.mainElm.appendChild(a);
        } {
            // text
            let a = document.createElement("div");
            a.classList.add("txt");
            this.txtElm = a;
            this.mainElm.appendChild(a);
        } {
            let a = document.createElement("div");
            a.classList.add("extra");
            this.extraTypeElm = a;
            this.mainElm.appendChild(a);
        }

        {
            let a = document.createElement("div");
            a.classList.add("time");
            this.elapsedTimeElm = a;
            this.dataElm.appendChild(a);
        } {
            let a = document.createElement("div");
            a.classList.add("words");
            this.wordsElm = a;
            this.dataElm.appendChild(a);
        } {
            let a = document.createElement("div");
            a.classList.add("wpm");
            this.wpmElm = a;
            this.dataElm.appendChild(a);
        }

        {
            let a = document.createElement("input");
            a.classList.add("inp");

            a.autocomplete = false;
            a.spellcheck = false;

            this.inpElm = a;
        }

        this.container.appendChild(this.mainElm); // add to container
        this.container.appendChild(this.dataElm); // ^
    }
    _setupCursor(e) {
        var that = this;

        Object.defineProperties(e, {
            x: {
                get: () => this._x || 0,
                set: function (e) {
                    var thatCursor = this;

                    var maxChars = Math.floor(that.mainElm.clientWidth / that.charWidth),
                        pos = Math.floor(e / that.charWidth);

                    this.y = Math.floor(pos / maxChars) * that.charHeight;

                    this._x = (pos % maxChars) * that.charWidth;
                    this.style.left = this._x + "px";

                    // make cursor visible, restart timeout to blink cursor
                    clearInterval(this.sI);
                    this.classList.remove("blink");
                    this.sI = setInterval(function () {
                        thatCursor.classList.toggle("blink");
                    }, 700);

                    // scroll to
                    this.scrollIntoViewIfNeeded();
                }
            },
            y: {
                get: () => this._y || 0,
                set: function (e) {
                    this._y = e;
                    this.style.top = e + "px";
                }
            },
            width: {
                get: () => this._width || 0,
                set: function (e) {
                    this._width = e;
                    this.style.width = e + "px";
                }
            },
            height: {
                get: () => this._height || 0,
                set: function (e) {
                    this._height = e;
                    this.style.height = e + "px";
                }
            }
        });
        e.sI = -1;
    }
    _appendBody() {
        document.body.appendChild(this.container);
    }
    clear() {
        while (this.txtElm.children.length) {
            this.txtElm.removeChild(this.txtElm.children[0]);
        }
    }
    addCorrectTyped(t) {
        var a = document.createElement("div");
        a.classList.add("correct");
        a.innerHTML = t;
        this.txtElm.appendChild(a);
    }
    addIncorrectTyped(t) {
        var a = document.createElement("div");
        a.classList.add("incorrect");
        a.innerHTML = t;
        this.txtElm.appendChild(a);
    }
    addUntyped(t) {
        var a = document.createElement("div");
        a.classList.add("untyped");
        a.innerHTML = t;
        this.txtElm.appendChild(a);
        if (!this.charWidth) {
            this.cursor.width = this.charWidth = a.clientWidth;
            this.cursor.height = this.charHeight = a.clientHeight;
        }
    }
    upd(e) { // update, when something changes
        var ipl = this.inp.length, // input length
            ttl = this.ttm.length, // text-to-type length
            all = Math.max(ipl, ttl),
            gsf = true;

        this.extraTypeElm.innerHTML = "";

        // write
        if (e) {
            this.clear();

            for (let i = 0; i < ipl; i++) {
                let inpi = this.inp[i],
                    ttmi = this.ttm[i];

                if (this.cheatMode) {
                    inpi = ttmi;
                }

                if (!this.caseSensitive) {
                    debugger;
                    inpi = inpi.toLowerCase();
                    if (ttmi) {
                        ttmi = ttmi.toLowerCase();
                    }
                }

                if (ttmi == inpi) {
                    this.addCorrectTyped(ttmi);
                } else {
                    this.addIncorrectTyped(ttmi);
                    gsf = false;
                }
            }

            for (let i = ipl; i < ttl; i++) {
                if (this.caseSensitive) {
                    this.addUntyped(this.ttm[i]);
                } else {
                    this.addUntyped(this.ttm[i].toLowerCase());
                }
            }
        } else {
            for (let i = 0; i < all; i++) {
                let inpi = this.inp[i],
                    ttmi = this.ttm[i],
                    txti = this.txtElm.children[i];

                if (ttmi) {
                    if (this.cheatMode && inpi) {
                        inpi = ttmi;
                    }

                    if (!this.caseSensitive) {
                        if (inpi) {
                            inpi = inpi.toLowerCase();
                        }
                        ttmi = ttmi.toLowerCase();
                    }

                    if (inpi) {
                        txti.innerHTML = ttmi;
                        txti.classList.remove("untyped");

                        if (ttmi == inpi) {
                            txti.classList.add("correct");
                            txti.classList.remove("incorrect");
                            txti.innerHTML = inpi;
                        } else {
                            txti.classList.add("incorrect");
                            txti.classList.remove("correct");
                            txti.innerHTML = inpi;
                            gsf = false;
                        }
                    } else {
                        txti.classList.remove("incorrect");
                        txti.classList.remove("correct");
                        txti.classList.add("untyped");

                        if (inpi != txti.innerHTML) {
                            txti.innerHTML = ttmi;
                        } else {
                            txti.innerHTML = inpi;
                        }
                    }
                } else {
                    let a = document.createElement("div");
                    a.innerHTML = inpi;
                    this.extraTypeElm.appendChild(a);
                }
            }
        }

        if (ipl == ttl && gsf) {
            this.done = true;
            return;
        }

        // set cursor
        this.cursor.x = ipl * this.charWidth;
    }
}

var g = null;

{
    let a = new XMLHttpRequest();
    a.responseType = "json";
    a.open("GET", "text.json");
    a.addEventListener("load", function () {
        g = new G(a.response);
    });
    a.send();
}