const IN = document.getElementById("in"),
    OUT = document.getElementById("out"),

    INITTXT = "initalText.txt",

    CM = document.getElementById("cm"),
    IC = document.getElementById("ic"),
    AO = document.getElementById("ao"),

    SBM = document.getElementById("sm"),

    WKR = new Worker("main.wkr.js");

{
    let x = new XMLHttpRequest();
    x.open("GET", INITTXT);
    x.addEventListener("load", function() {
        IN.value = x.response;
    });
    x.send();
}

function update() {
    WKR.postMessage("P" + IN.value);
}

function sendConfig() {
    WKR.postMessage(
        "C" +
        (CM.checked ? '1' : '0') +
        (IC.checked ? '1' : '0') +
        (AO.checked ? '1' : '0')
    );
}

CM.addEventListener("change", sendConfig);
IC.addEventListener("change", sendConfig);
AO.addEventListener("change", sendConfig);

SBM.addEventListener("click", update);

OUT.addEventListener("click", function() {
    OUT.select();
});
addEventListener("keydown", function(e) {
    if (!e.ctrlKey || document.activeElement == IN) return;

    if(e.keyCode == 67) {
        OUT.focus();
        OUT.select();
        document.execCommand("copy");
    }
    if (e.keyCode == 65) {
        OUT.focus();
        OUT.select();
    }
});
addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if(confirm("Copy output text?")) {
        OUT.focus();
        OUT.select();
        document.execCommand("copy");
        IN.focus();
    }
});

sendConfig();

WKR.addEventListener("message", function(e) {
    OUT.value = e.data;
});