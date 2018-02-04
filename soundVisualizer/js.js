window.onerror = function (e) {
    alert("Error: " + JSON.stringify(e));
};

function loadImage(e) {
    var a = document.createElement("img");
    a.src = e;
    return a;
}

function loadAudio(e) {
    var a = document.createElement("audio");
    a.src = e;
    a.crossOrigin = "anonymous";

    a.context = new AudioContext();
    a.mediaElementSource = a.context.createMediaElementSource(a);
    a.analyser = a.context.createAnalyser();
    a.analyser.smoothingTimeConstant = 0.9;
    a.analyser.fftSize = 512;
    a.mediaElementSource.connect(a.analyser);
    a.analyser.connect(a.context.destination);

    return a;
}

const CVS = document.getElementById("c"),
    X = CVS.getContext("2d"),
    OBS = [],
    C = {
        bgColor: "#000",
        fgColor: "#FFF",
        glow: 8,
        dotSpawnRate: 5,
        hideCursorTimeout: 5000,
        _volume: 1,
        set volume(e) {
            this._volume = parseFloat(e);
            AUD.volume = this._volume;
        },
        get volume() {
            return this._volume;
        }
    },
    IMG = loadImage("circle-filled.png"),
    AUD = loadAudio("bgaudio.mp3");

var then = Date.now(),
    vol = .05,
    newDT = 0,
    sI = null;

Math.TAU = Math.PI * 2;

function rand(e, f) {
    return Math.random() * (f - e) + e;
}

function fromAngle(a) {
    return {
        x: Math.cos(a),
        y: Math.sin(a)
    };
}

function Dot() {
    this.x = 0;
    this.y = 0;
    this.radius = rand(2, 3.5);
    this.v = rand(0.9, 1.1);
    this.ang = rand(0, Math.TAU);

    var {
        x,
        y
    } = fromAngle(this.ang);
    this.vx = x;
    this.vy = y;
}

function drawImg() {
    var ar = new Uint8Array(AUD.analyser.fftSize),
        b = 0;
    AUD.analyser.getByteTimeDomainData(ar);

    for (let i of ar) {
        let j = Math.abs(i - 128);
        if (b < j) {
            b = j;
        }
    }

    vol = b / 128;

    X.drawImage(
        IMG, 0, 0, IMG.width, IMG.width, -128 - (vol * 32), -128 - (vol * 32),
        256 + (vol * 64), 256 + (vol * 64)
    );
}

function moveDot(d, i) {
    d.x += d.vx * i;
    d.y += d.vy * i;
}

function drawDot(d) {
    X.beginPath();
    X.arc(d.x, d.y, d.radius, 0, Math.TAU);
    X.fill();
}

function removeDot(d, w, h) {
    os = d.radius + C.glow;

    if (Math.abs(d.x) > w + os || Math.abs(d.y) > h + os) {
        OBS.splice(OBS.indexOf(d), 1);
    }
}

function draw(w, h) {
    var now = Date.now(),
        tt = (now - then) * vol;
    then = now;
    newDT += tt;

    for (let i of OBS) {
        moveDot(i, tt);
    }
    for (let i of OBS) {
        drawDot(i);
    }
    for (let i of OBS) {
        removeDot(i, w, h);
    }
}

function clear(hw, hh, w, h) {
    X.fillStyle = C.bgColor;
    X.fillRect(-hw, -hh, w, h);
}

function reqanf() {
    var w = CVS.width,
        h = CVS.height,
        hw = w / 2,
        hh = h / 2;

    X.save();
    X.translate(hw, hh);

    clear(hw, hh, w, h)

    X.fillStyle = C.fgColor;
    X.shadowBlur = C.glow;
    X.shadowColor = C.fgColor;
    draw(hw, hh);

    drawImg();

    X.restore();

    newDot();

    requestAnimationFrame(reqanf);
}

function newDot() {
    while (newDT > C.dotSpawnRate) {
        newDT -= C.dotSpawnRate;
        OBS.push(new Dot());
    }
}

function openMenu(x, y) {
    var e = document.createElement("div");
    e.classList.add("menu");
    e.style.left = x + "px";
    e.style.top = y + "px";

    {
        let b = document.createElement("div");
        b.classList.add("item");

        {
            let c = document.createTextNode("Volume");
            b.appendChild(c);
        } {
            let c = document.createElement("input");
            c.type = "range";
            c.min = 0;
            c.max = 1;
            c.step = 0.01;
            c.value = C.volume;

            c.addEventListener("mousemove", function (e) {
                C.volume = this.value;
            });

            b.appendChild(c);
        }

        e.appendChild(b);
    } {
        let b = document.createElement("div");
        b.classList.add("item");

        {
            let c = document.createTextNode("Source");
            b.appendChild(c);
        } {
            let c = document.createElement("input");
            c.type = "text";
            c.value = AUD.src;
            
            c.addEventListener("change", function(){
                AUD.src = this.value;
                AUD.currentTime = 0;
                AUD.play();
            });

            b.appendChild(c);
        }

        e.appendChild(b);
    } {
        let b = document.createElement("div");
        b.classList.add("item");

        {
            let c = document.createElement("button");
            c.innerHTML = "Restart from Beginning";

            c.addEventListener("click", function () {
                AUD.pause();
                AUD.currentTime = 0;
                AUD.play();
            });

            b.appendChild(c);
        }

        e.appendChild(b);
    }

    document.body.appendChild(e);
}

function resize() {
    CVS.width = innerWidth;
    CVS.height = innerHeight;
}

function mousemove() {
    document.body.style.cursor = "default";
    clearInterval(sI);
    sI = setInterval(function () {
        document.body.style.cursor = "none";
    }, C.hideCursorTimeout);
}

function click() {
    if(!removeContextMenus()) {
        togglePlay();
    }
}

function keydown(e) {
    if(e.ctrlKey) return;
    e.preventDefault();

    if(e.keyCode == 32) {
        togglePlay();
    } else if (e.keyCode == 27) {
        removeContextMenus();
    }
}

function togglePlay() {
    if (AUD.paused) {
        AUD.play();
    } else {
        AUD.pause();
    }
}

function contextmenu(e) {
    e.preventDefault();
    removeContextMenus();
    openMenu(e.clientX, e.clientY);
}

function removeContextMenus() {
    var i, r = false;
    while ((i = document.getElementsByClassName("menu")).length) {
        i[0].parentElement.removeChild(i[0]);
        r = true;
    }
    return r;
}

function Main() {
    addEventListener("resize", resize);
    addEventListener("keydown", keydown);
    addEventListener("mousemove", mousemove);
    CVS.addEventListener("click", click);
    CVS.addEventListener("contextmenu", contextmenu);

    resize();

    reqanf();

    AUD.play();
}

Main();