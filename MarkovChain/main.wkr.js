var charmode = false,
    ignorecase = false,
    ignoreextra = false;

function ex(e, f, c) {
    if (!e[f]) {
        if (c == -1) {
            e[f] = {
                d: {},
                t: 0
            };
        } else {
            e[f] = c;
        }
    }
}

function getKeys(d) {
    var wds, wdsl,
        splitrx = / /g,
        extrarx = /[-‒–—~!@#$%^&*()_+-={}\[\];\\:\|,.\/<>\?“”‘’''""。`\n\s]+/gi,
        ip = d,
        occ = {};

    if (ignorecase) {
        ip = d.toLowerCase();
    }
    if (ignoreextra && charmode) {
        ip = ip.replace(extrarx, ' ');
        splitrx = "";
    } else if (ignoreextra) {
        splitrx = extrarx;
    } else if (charmode) {
        splitrx = "";
    }

    wds = ip.split(splitrx);
    wdsl = wds.length;

    for (let i = 0; i < wdsl; i++) {
        let j = wds[i],
            nj = wds[i + 1];

        if (!nj) {
            nj = '';
        }

        ex(occ, j, -1);
        ex(occ[j].d, nj, 0);
        occ[j].d[nj] += 1;
        occ[j].t += 1;
    }

    for (let i = 0; i < wdsl; i++) {
        let j = wds[i],
            nj = wds[i - 1];

        if (!nj) {
            nj = '';
        }

        ex(occ, nj, -1);
        ex(occ[nj].d, j, 0);
        occ[nj].d[j] += 1;
        occ[nj].t += 1;
    }

    console.log(occ);
    return {
        d: occ,
        l: wdsl
    };
}

function make(keys) {
    var curr = "",
        out = "",
        cl = 0,
        key = keys.d,
        len = keys.l;

    while (cl < len) {
        let i = key[curr];

        if (!i) {
            if (curr == "") {
                return out;
            } else {
                curr = "";
                continue;
            }
        }

        let r = Math.random() * i.t,
            t = 0,
            tr = " ";

        if (charmode) {
            tr = "";
        }

        for (let j in i.d) {
            let k = i.d[j];

            t += k;

            if (r < t) {
                out += j + tr;
                curr = j;
                cl++;
                break;
            }
        }
    }

    return out;
}

function update(d) {
    postMessage(make(getKeys(d)));
}

addEventListener("message", function (e) {
    switch (e.data[0]) {
        case "P":
            update(e.data.substring(1).trim());
            break;
        case "C":
            if (e.data[1] == "1") {
                charmode = true;
            } else {
                charmode = false;
            }

            if (e.data[2] == "1") {
                ignorecase = true;
            } else {
                ignorecase = false;
            }

            if (e.data[3] == "1") {
                ignoreextra = true;
            } else {
                ignoreextra = false;
            }
            break;
    }
});