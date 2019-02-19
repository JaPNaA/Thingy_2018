const C = document.getElementById("c"),
    X = C.getContext("2d");

function draw(w, h, p) {
    var stepx = w / p,
        stepy = h / p;
    
    X.fillStyle = "#FFFFFF";
    X.fillRect(0, 0, w, h);

    X.strokeStyle = "#888888";
    X.lineWidth = 1;
    
    for (let i = 0; i <= p; i++) {
        X.moveTo(stepx * i, h);
        X.lineTo(0, stepy * i);
        X.stroke();
    }

    X.fillStyle = "#212121";
    X.font = (w + h) / 20 + "px Calibri";
    X.textAlign = "center";
    X.textBaseline = "middle";
    X.fillText("whoa", w * 0.66, h * 0.33);
}

function resize() {
    let dpr = window.devicePixelRatio || 1;
    C.width = innerWidth * dpr;
    C.height = innerHeight * dpr;

    draw(C.width, C.height, (C.width + C.height) / 2 * 0.075);
}

addEventListener("resize", resize);
resize();
