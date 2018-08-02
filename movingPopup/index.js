var $new = document.getElementById("new"),
    $log = document.getElementById("log"),
    $kill = document.getElementById("kill"),
    popups = [];

/**
 * @class
 */
class Popup {
    constructor() {
        this.window = open("popup.html", "_blank", "top=0, left=0, width=260, height=100");
    }
    close() {
        if (!this.window.closed) {
            this.window.close();
        }
    }
}

$new.addEventListener("click", function() {
    popups.push(new Popup());
});

$kill.addEventListener("click", function() {
    while(popups.length) {
        let i = popups.pop();
        i.close();
    }
});

window.log = function(e) {
    let txt = document.createTextNode(e),
        div = document.createElement("div");
    
    div.appendChild(txt);
    $log.insertBefore(div, $log.firstChild);
};