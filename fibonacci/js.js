var w = new Worker("worker.js"),
    m = document.getElementById("main"),
    n = Date.now();

w.addEventListener("message", function (e) {
    var [cmd, dt] = e.data.split(":");
    console.log(cmd, dt);

    switch (cmd) {
        case "N":
            m.appendChild(
                document.createTextNode(dt + ", ")
            );
            break;
        case "PHI":
            {
                let x = document.createElement("b");
                x.innerHTML = `Approximation of phi: ${dt}, `;
                m.appendChild(x).scrollTo();
            } {
                m.appendChild(
                    document.createTextNode("How close? " + (dt - 1.6180339887498948482))
                );
            }
            break;
        case "runtime":
            m.appendChild(
                document.createTextNode(" Runtime: " + dt)
            );
            m.appendChild(
                document.createTextNode(", Runtime: " + (Date.now() - n))
            );
    }
    scrollTo(0, document.body.scrollHeight);
});