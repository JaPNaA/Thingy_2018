(function () {
    var elms = document.querySelectorAll("[rand]>*");
    for (let i of elms) {
        i.addEventListener("keydown", function () {
            elms[Math.floor(elms.length * Math.random())].focus();
        });
    }
}());

(function () {
    var e = document.querySelector("input[randpos]");
    e.addEventListener("keydown", function () {
        var p = Math.floor(Math.random() * (this.value.length + 1));
        this.setSelectionRange(p, p);
    });
}());

(function () {
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

(function () {
    var e = document.querySelector("textarea[badtyper]");
    e.addEventListener("keyup", function(e) {
        if(e.key.length != 1 || e.ctrlKey || e.altKey) return;

        var v = this.value,
            vl = v.length,
            l = v[vl - 1];
        if (!v) return;

        this.setSelectionRange(vl, vl);

        if (Math.random() < 0.015) {
            this.setSelectionRange(vl - 1, vl);
        } 
        if (Math.random() < 0.015) {
            this.setSelectionRange(vl - 1, vl - 1);
        } 
        if (Math.random() < 0.075) {
            this.setSelectionRange(vl - 2, vl - 2);
        }

        if (Math.random() < 0.075) {
            let c = String.fromCharCode((Math.floor(Math.random() * 26)) + 65)
            if (l == l.toUpperCase()) {
                l = c.toUpperCase();
            } else {
                l = c.toLowerCase();
            }
        }
        
        
        if (Math.random() < 0.075) {
            if (l == l.toUpperCase()) {
                l = l.toLowerCase();
            } else {
                l = l.toUpperCase();
            }
        }
        
        this.value = v.slice(0, vl - 1) + l;

        if (Math.random() < 0.05) {
            this.value += l;
        }

        if (Math.random() < 0.025) {
            this.value += " ";
        }
    });
}());