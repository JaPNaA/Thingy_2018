function Ui() {
    this.contextmenuOpen = false;
}

Ui.prototype.draw = function(X) {
    if (this.contextmenuOpen) {
        X.fillStyle = "#00F";
        X.fillRect(0, 0, 50, 50);
    }
};

Ui.prototype.contextmenu = function() {
    this.contextmenuOpen ^= true;
};