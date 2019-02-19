var main = document.getElementById("main"),
    mainWin = main.contentWindow,
    cs = document.getElementById("cs"),
    title = document.getElementById("title"),
    notes = document.getElementById("notes");

main.focus();

main.addEventListener("blur", () => main.focus());
addEventListener("message", function (e) {
    var dt = e.data;
    switch (dt[0]) {
        case "setMeta":
            document.title = dt[1] + " - Typeracer Clone";
            title.innerHTML = dt[1];
            notes.innerHTML =
                (dt[2] || "Typeracer Clone, created by JaPNaA") +
                ", " + dt[3] + " characters long";
            break;
    }
});

addEventListener("keydown", function (e) {
    if (!e.altKey && !e.ctrlKey) e.preventDefault();
    mainWin.postMessage(["KEY", e.key, e.ctrlKey, e.altKey], "*");
});
cs.addEventListener("change", function () {
    mainWin.postMessage(["CASESENSITIVE", this.checked], "*");
});