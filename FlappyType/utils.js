function easeInOutQuad(t) { 
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 
}

function loadImage(src) {
    var img = new Image();
    img.src = src;
    return img;
}