const CVS = document.createElement("canvas"),
    X = CVS.getContext("2d"),
    OBS = [],
    SQ = [1];

Math.TAU = Math.PI * 2;

CVS.width = 1920;
CVS.height = 1080;

SQ.max = 1;
SQ.current = 1;

SQ.next = function () {
    var x = ++this.current;
    this.push(this.max = x * x);
};

function drawNodes(e) {
    X.clearRect(0, 0, CVS.width, CVS.height);

    X.fillStyle = "#FF0000";
    X.strokeStyle = "#000000";
    X.lineWidth = 2;

    for (let i of OBS) {
        X.beginPath();
        X.arc(i.x, i.y, 28, 0, Math.TAU);
        X.fill();
        X.stroke();
    }

    X.lineWidth = 2;
    X.strokeStyle = e ? "#8888ff10" : "#8888FF";

    for (let i of OBS) {
        for (let j of i.links) {
            X.beginPath();
            X.moveTo(i.x, i.y);
            X.lineTo(j.x, j.y);
            X.stroke();
        }
    }

    if(e) {
        X.lineWidth = 4;

        let el = e.length,
            h = 0;

        for(let i = 0; i < el; i++) {
            X.beginPath();
            X.moveTo(e[i].x, e[i].y);
            if(e[i + 1]) {
                X.lineTo(e[i + 1].x, e[i + 1].y);

                h += 360 / el;
                X.strokeStyle = `hsl(${h}, 100%, 50%`;
            }
            X.stroke();
        }
    }

    X.save();
    X.fillStyle = "#FFFFFF";
    X.shadowBlur = 4;
    X.shadowColor = "#000000";
    X.font = "32px monospace";

    for (let i of OBS) {
        X.fillText(
            i.value,
            i.x - X.measureText(i.value).width / 2,
            i.y + 8
        );
    }
    X.restore();

    if(e) {
        let t = "",
            m = [],
            lines,
            perline = 95,
            lineSpace = 2;
        
        X.font = "32px monospace";            
        
        for(let i of e) {
            m.push(i.value);
        }
        t = m.join(", ");

        lines = Math.ceil(t.length / perline);

        for(let i = 0; i < lines; i++) {
            X.fillText(
                (i ? "      " : "Path: ") + t.substr(i * perline, perline),
                8,
                CVS.height - lines * (32 + lineSpace) + i * (32 + lineSpace)
            );
        }
    }
}

class Node {
    constructor(N) {
        this.value = N;
        this.links = this.getLinks();
        this.visitedNodes = [];

        this.marg = 0.15;

        var pos = N * this.marg;

        this._x = pos % 1;
        this._y = Math.floor(pos / 1) * this.marg;

        OBS.push(this);
    }
    get x() {
        return (this._x + 0.015) * CVS.width;
    }
    set x(e) {
        this._x = e / CVS.width;
    }

    get y() {
        return (this._y + this.marg) * CVS.height;
    }
    set y(e) {
        this._y = e / CVS.height;
    }

    getLinks() {
        var links = [];
        for (let i of OBS) {
            let tv = this.value + i.value;

            if (tv >= SQ.max) SQ.next();
            if (SQ.includes(tv)) {
                links.push(i);
                i.links.push(this);
            }
        }

        return links;
    }
}

for (let i = 1; i <= 32; i++) {
    new Node(i);
}

function findPath() {
    for(let firstNode of OBS) {

        let backtrack = [firstNode],
            currentNode = firstNode;
        
        while(backtrack.length < OBS.length) {
            let newNode = null;

            for(let i of currentNode.links) {
                if(currentNode.visitedNodes.includes(i) || backtrack.includes(i)) {
                    continue;
                } else {
                    newNode = i;
                    break;
                }
            }

            if(newNode) {
                currentNode.visitedNodes.push(newNode);
                backtrack.push(newNode);
                currentNode = newNode;
            } else {
                if(backtrack.length > 1) {
                    backtrack.pop().visitedNodes.length = 0;
                    currentNode = backtrack[backtrack.length - 1];
                } else {
                    break;
                }
            }

        }

        for(let i of OBS) {
            i.visitedNodes.length = 0;
        }

        if (backtrack.length == OBS.length) {
            return backtrack;
        } else {
            continue;
        }
    }
    return false;
}

drawNodes(findPath());

function resize() {
    if (innerWidth > innerHeight * (CVS.width / CVS.height)) {
        CVS.classList.add('h');
        CVS.classList.remove('w');
    } else {
        CVS.classList.remove('h');
        CVS.classList.add('w');
    }
}
resize();
addEventListener("resize", resize);

document.body.appendChild(CVS);