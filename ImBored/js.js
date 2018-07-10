(function () { // random input
    var elms = document.querySelectorAll("[rand]>*");
    for (let i of elms) {
        i.addEventListener("keydown", function () {
            elms[Math.floor(elms.length * Math.random())].focus();
        });
    }
}());

(function () { // random position
    var e = document.querySelector("input[randpos]");
    e.addEventListener("keydown", function () {
        var p = Math.floor(Math.random() * (this.value.length + 1));
        this.setSelectionRange(p, p);
    });
}());

(function () { // random capitalization
    var e = document.querySelector("input[randcap]");
    e.addEventListener("keyup", function () {
        var v = this.value,
            vl = v.length,
            l = v[vl - 1];
        if (!v) return;

        if (Math.random() < 0.5) {
            l = l.toLowerCase();
        } else {
            l = l.toUpperCase();
        }
        this.value = v.slice(0, vl - 1) + l;
    });
}());

(function () { // bad typer
    var e = document.querySelector("textarea[badtyper]"),
        amount = 1;
    e.addEventListener("keyup", function (e) {
        if (e.key.length !== 1 || e.ctrlKey || e.altKey) return;

        var v = this.value,
            vl = v.length,
            l = v[vl - 1];
        if (!v) return;

        this.setSelectionRange(vl, vl);

        if (Math.random() < 0.015 * amount) {
            this.setSelectionRange(vl - 1, vl);
        }
        if (Math.random() < 0.015 * amount) {
            this.setSelectionRange(vl - 1, vl - 1);
        }
        if (Math.random() < 0.075 * amount) {
            this.setSelectionRange(vl - 2, vl - 2);
        }

        if (Math.random() < 0.075 * amount) {
            let c = String.fromCharCode((Math.floor(Math.random() * 26)) + 65);
            if (l === l.toUpperCase()) {
                l = c.toUpperCase();
            } else {
                l = c.toLowerCase();
            }
        }


        if (Math.random() < 0.075 * amount) {
            if (l == l.toUpperCase()) {
                l = l.toLowerCase();
            } else {
                l = l.toUpperCase();
            }
        }

        this.value = v.slice(0, vl - 1) + l;

        if (Math.random() < 0.05 * amount) {
            this.value += l;
        }

        if (Math.random() < 0.025 * amount) {
            this.value += " ";
        }
    });
}());

(function() { // still readable
    var textarea = document.querySelector("textarea[stillreadable]");

    textarea.addEventListener("keydown", function(e) {
        if (e.keyCode === 32) { // space
            /**
             * @type {number}
             */
            let lastWordIx = textarea.value.lastIndexOf(" ") + 1;
            console.log(lastWordIx);

            /**
             * @type {string}
             */
            let lastWord = textarea.value.slice(lastWordIx);

            if (lastWord.length > 3) {
                let firstLetter = lastWord[0],
                    lastLetter = lastWord[lastWord.length - 1],
                    middleChars = lastWord.substring(1, lastWord.length - 1).split(""),
                    final = firstLetter;

                while (middleChars[0]) {
                    final += middleChars.splice(Math.floor(Math.random() * middleChars.length), 1);
                }
                final += lastLetter;

                textarea.value = textarea.value.substring(0, lastWordIx) + final;
            }
        }

    });
}());