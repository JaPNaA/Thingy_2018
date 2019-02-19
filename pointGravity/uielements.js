function UiText(txt, font, fontsize, color, x, y) {
    this.text = txt;
    this.font = font;
    this.fontsize = fontsize;
    this.color = color;
    this.x = x;
    this.y = y;
}

UiText.prototype.draw = function (X) {
    X.font = this.fontsize + "px " + this.font;
    X.fillStyle = this.color;
    X.fillText(this.text, this.x, this.y);
};

UiText.prototype.event = function () {};

//* add 'reset' button

function UiSlider(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.color = c;

    this.active = false;
    this.hover = false;

    this.events = {
        change: []
    };

    this._value = 0;
    Object.defineProperty(this, "value", {
        get: function () {
            return this._value;
        },
        set: function (e) {
            if (e < 0) {
                this._value = 0;
            } else if (e > 1) {
                this._value = 1;
            } else {
                this._value = e;
            }
            for (let i of this.events.change) {
                i();
            }
        }
    });
}

UiSlider.prototype.draw = function (X) {
    {
        let w = this.width,
            h = this.height / 5,
            x = this.x,
            y = this.y + (this.height - h) / 2;

        X.fillStyle = this.color;
        X.globalAlpha = 0.5;
        X.fillRect(x, y, w, h);
    } {
        let r = this.height * 0.45,
            x = this.x + this.width * this.value,
            y = this.y + this.height / 2;

        X.fillStyle = this.color;
        X.globalAlpha = 1;
        X.beginPath();
        X.arc(x, y, r, 0, Math.TAU);
        X.fill();
    }
};

UiSlider.prototype.mousemove = function (e) {
    this.hover =
        isInsideRect(e.clientX, e.clientY, this.x, this.y, this.width, this.height) ||
        isInsideCircle(
            e.clientX, e.clientY,
            this.x + this.width * this.value,
            this.y + this.height / 2,
            this.height * 0.6
        );

    if (!this.active) return;
    this.value = (e.clientX - this.x) / this.width;
};

UiSlider.prototype.mousedown = function (e) {
    this.active = this.hover;

    this.mousemove(e);
};

UiSlider.prototype.mouseup = function (e) {
    this.mousemove(e);
    this.active = false;
};

UiSlider.prototype.wheel = function (e) {
    if (this.hover) {
        if (e.deltaY < 0) {
            this.value -= 0.001;
        } else {
            this.value += 0.001;
        }
    }
};

UiSlider.prototype.addEventListener = function (t, e) {
    this.events[t].push(e);
};

UiSlider.prototype.event = function (t, e) {
    switch (t) {
        case "mousemove":
            this.mousemove(e);
            break;
        case "mousedown":
            this.mousedown(e);
            break;
        case "mouseout":
        case "mouseup":
            this.mouseup(e);
            break;
        case "wheel":
            this.wheel(e);
            break;
    }
};


function UiColorPicker(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;

    this.events = {
        change: []
    };

    this.hover = false;
    this.active = false;

    Object.defineProperty(this, 'value', {
        get: function() {
            return this.elm.value;
        },
        set: function(e) {
            this.elm.value = e;
        }
    });

    this.elm = document.createElement("input");
    this.elm.type = "color";
    this.elm.addEventListener("change", () => {
        for (let i of this.events.change) {
            i();
        }
    });
}

UiColorPicker.prototype.draw = function(X) {
    X.fillStyle = this.value;
    X.strokeStyle = "#000000";
    X.lineWidth = 1;
    X.beginPath();
    X.rect(this.x, this.y, this.width, this.height);
    X.fill();
    X.stroke();
};

UiColorPicker.prototype.mousemove = function(e) {
    this.hover = isInsideRect(e.clientX, e.clientY, this.x, this.y, this.width, this.height);
};

UiColorPicker.prototype.mousedown = function(e) {
    this.active = this.hover;
};

UiColorPicker.prototype.mouseup = function(e) {
    if (this.active && this.hover) {
        this.activate();
    }
    this.active = false;
};

UiColorPicker.prototype.addEventListener = function (t, e) {
    this.events[t].push(e);
};

UiColorPicker.prototype.activate = function(e) {
    this.elm.click();
};

UiColorPicker.prototype.event = function(t, e) {
    switch(t) {
        case "mousedown":
            this.mousedown(e);
            break;
        case "mousemove":
            this.mousemove(e);
            break;
        case "mouseup":
            this.mouseup(e);
            break;
    }
};