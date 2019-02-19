Array.prototype.rand = function() {
    return this[Math.floor(Math.random() * this.length)];
};

function getJSON(e) {
    return new Promise(function (res, rej) {
        var x = new XMLHttpRequest();
        x.open("GET", e);
        x.responseType = "json";
        x.addEventListener("load", function() {
            var m = x.response;
            if(typeof m == "string") {
                res(JSON.parse(m));
            } else {
                res(m);
            }
        });
        x.send();
    });
}

function translateTo(e, d){
    var r = [];
    for(let i of e) {
        let j = i.toUpperCase();
        if(d[j]) {
            r.push(d[j].rand());
        } else {
            r.push("." + i);
        }
    }
    return r.join("");
}

function translateFrom(e, d) {
    var str = e,
        pos = 0,
        r = [],
        strl = str.length;
    
    while(pos < strl) {
        let f = false;

        for(let i in d) {
            if(str.startsWith('.', pos)) {
                r.push(str[pos + 1]);
                pos += 2;
                f = true;
                break;
            }
            if(str.startsWith(i, pos)) {
                r.push(d[i]);
                f = true;
                pos += i.length;
                break;
            }
        }

        if(!f) {
            pos += 1;
        }
    }

    return r.join("");
}

function upd(e, inp, out, dict, useSafe, useCaps) {
    var scroll = false;

    if(document.activeElement == inp) {
        if(out.scrollTop + out.clientHeight + 4 >= out.scrollHeight) {
            scroll = true;
        }

        out.value = translateTo(inp.value, useSafe ? dict.s : dict.n);

        if(scroll) {
            out.scrollTop = out.scrollHeight - out.clientHeight;
        } 
    } else if(document.activeElement == out) {
        if (!useSafe && e && (e.ctrlKey || e.altKey || e.type == "keyup")) return;

        if (inp.scrollTop + inp.clientHeight + 4 >= inp.scrollHeight) {
            scroll = true;
        }

        let r = translateFrom(out.value, dict.t);
        
        if(!useCaps) {
            r = r.toLowerCase();
        }

        inp.value = r;

        if (scroll) {
            inp.scrollTop = inp.scrollHeight - inp.clientHeight;
        } 
    }
}

function resize() {
    if (innerWidth * 3 / 4 < innerHeight) {
        document.body.classList.add("w");
    } else {
        document.body.classList.remove("w");
    }
}

function mousemove(e, s) {
    var x = e.clientX,
        y = e.clientY,
        w = innerWidth,
        h = innerHeight;

    if(e.path.includes(s)) {
        s.classList.add("s");
        return;
    }

    if (document.body.classList.contains("w")) {
        if (y < h / 2 + 4 && y > h / 2 - 4) {
            s.classList.add("s");
        } else {
            s.classList.remove("s");
        }
    } else {
        if(x < w / 2 + 4 && x > w / 2 - 4) {
            s.classList.add("s");
        } else {
            s.classList.remove("s");
        }
    }
}
function mouseout(e, s) {
    s.classList.remove("s");
}

function fSelect() {
    this.select();
}

function createBackwardsTrans(e) {
    e.t = {};

    for (let i in e.s) {
        for (let j of e.s[i]) {
            e.t[j] = i;
        }
    }
}

async function main() {
    const inp = document.getElementById("inp"),
        out = document.getElementById("out"),
        set = document.getElementById("settings"),
        usesafe = document.getElementById("usesafe"),
        usecaps = document.getElementById("caps"),
        dict = await getJSON("dict.json");

    createBackwardsTrans(dict);

    // true: cannot translate back automatically, more cryptic
    // false: can translate back, less randomness
    var useSafe = true,
        useCaps = true,
        u = e => upd(e, inp, out, dict, useSafe, useCaps),
        op = {
            passive: true
        };

    addEventListener("keyup", u, op);
    addEventListener("keydown", u, op);
    addEventListener("change", u, op);

    addEventListener("resize", resize);

    addEventListener("mousemove", e => mousemove(e, set), op);
    addEventListener("mouseout", e => mouseout(e, set), op);

    usesafe.addEventListener("change", () => { 
        useSafe = usesafe.checked;
        inp.focus();
        u();
    });
    usecaps.addEventListener("change", () => {
        useCaps = usecaps.checked;
        out.focus();
        u();
    });
    
    inp.addEventListener("focus", fSelect);
    out.addEventListener("focus", fSelect);

    resize();

    return 0;
}

main();