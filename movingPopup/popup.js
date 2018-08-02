const timeout = 1; // for some reason this works

let ready = true,
    ontimeout = null,
    timingout = false,
    windowX = 0,
    windowY = 0;

function que(func) {
    if (ready) {
        func();
        ready = false;
    } else {
        ontimeout = func;

        if (!timingout) {
            timingout = true;
            setTimeout(function() {
                ready = true;
                timingout = false;
            }, timeout);
        }
    }
}

function move(rx, ry) {
    let width = innerWidth, 
        height = innerHeight,
        asp = height / width,
        x = rx * asp, // scale x
        y = ry;

    if (x > y) {
        if (x > height - y) {
            // console.log("right");
            windowX += rx - width;
        } else {
            // console.log("top");
            windowY += ry;
        }
    } else {
        if (x > height - y) {
            // console.log("bottom");
            windowY += ry - height;
        } else {
            // console.log("left");
            windowX += rx;
        }
    }

    let availTop = screen.availTop || 0,
        availLeft = screen.availLeft || 0,
        availHeight = screen.availHeight,
        availWidth = screen.availWidth;

    if (windowX < availLeft) {
        // too left
        windowX = availLeft + outerWidth;
    } else if (windowX + outerWidth > availWidth) {
        // too right
        windowX = availWidth - outerWidth * 2;
    }
    
    if (windowY < availTop) {
        // too high (not weed)
        windowY = availTop + outerHeight;
    } else if (windowY + outerHeight > availHeight) {
        // too low
        windowY = availHeight - outerHeight * 2;
    }

    window.moveTo(windowX, windowY);
}

window.addEventListener("mousemove", function (e) {
    windowX = screenX;
    windowY = screenY;

    que(() => move(e.clientX, e.clientY));
});

window.addEventListener("mousedown", function(e) {
    if (e.path[0].tagName !== "BUTTON") {
        window.opener.log("You touched the window. Not close enough.");
    }
});

document.getElementById("t").addEventListener("mousedown", function() {
    window.opener.log("Wow you touched it!");
});

document.getElementById("t").addEventListener("click", function () {
    window.opener.log("Wow you clicked it! A full mousedown and mouseup on the button!");
});

window.addEventListener("beforeunload", function() {
    window.opener.log("You giver-uper! You just killed a child (window)! (unless you reloaded)");
});