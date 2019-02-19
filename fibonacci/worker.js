var l1 = 0,
    l2 = 1,
    // sI,
    PHI = null;

while(true) {
    let i = l1 + l2,
        its = i.toString();
    postMessage("N:" + its);
    if (its == "Infinity") {
        PHI = l2 / l1;
        postMessage("PHI:" + PHI);
        break;
    }
    l1 = l2;
    l2 = i;
}

// sI = setInterval(function () {
//     var i = l1 + l2,
//         its = i.toString();
//     postMessage("N:" + its);
//     if(its == "Infinity") {
//         clearInterval(sI);
//         PHI = l2 / l1;
//         postMessage("PHI:" + PHI);
//     }
//     l1 = l2;
//     l2 = i;
// }, 1);