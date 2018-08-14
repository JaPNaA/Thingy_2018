function easeInOutQuad(t) { 
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 
}

function loadImage(src) {
    var img = new Image();
    img.src = src;
    return img;
}

class Sound extends Audio {
    constructor(src) {
        super(src);
    }

    go() {
        this.pause();
        this.currentTime = 0;
        this.play();
    }
}

function loadSound(src, volume) {
    var sound = new Sound(src);
    sound.volume = volume;
    return sound;
}