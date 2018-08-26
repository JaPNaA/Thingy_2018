"use strict";

const D = {
    /** @type {HTMLDivElement} */
    startScreen: null,

    /** @type {HTMLDivElement} */
    header: null,

    /** @type {HTMLDivElement} */
    title: null,
    /** @type {HTMLButtonElement} */
    addButton: null,
    /** @type {HTMLAnchorElement} */
    addLink: null,

    /** @type {HTMLDivElement} */
    body: null,

    /** @type {HTMLDivElement} */
    content: null,

    /** @type {GSheet} */
    sheet: null,

    allowedTags: [
        "h3", "h4", "h5", "h6", "blockquote", "p", "a", "ul", "ol",
        "nl", "li", "b", "i", "strong", "em", "strike", "code", "hr", "br", "div",
        "table", "thead", "caption", "tbody", "tr", "th", "td", "pre"
    ], 
    allowedTagsMap: {}
};

for (let i of D.allowedTags) {
    D.allowedTagsMap[i] = true;
}

function sanitize(str) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(str, "text/html");
    const elements = parsed.body.getElementsByTagName("*");
    const docfrag = document.createDocumentFragment();

    for (let i = elements.length - 1; i >= 0; i--) {
        let elm = elements[i];
        if (
            !D.allowedTagsMap[elm.tagName.toLowerCase()] ||
            elm.attributes.length
        ) {
            elm.parentElement.removeChild(elm);
        }
    }

    while (parsed.body.firstChild) {
        docfrag.appendChild(parsed.body.firstChild);
    }

    return docfrag;
}

function closeStartScreen(e) {
    D.startScreen.classList.add("close");

    e.preventDefault();

    unregisterEventListeners();
}

function registerEventListeners() {
    addEventListener("wheel", closeStartScreen);
    addEventListener("click", closeStartScreen);
}

function unregisterEventListeners() {
    removeEventListener("wheel", closeStartScreen);
    removeEventListener("click", closeStartScreen);
}

function startScreenAnimation() {
    const startScreenBlock = document.createElement("div");
    startScreenBlock.classList.add("block");


    const title = document.createElement("div");
    title.classList.add("title");

    const titleYour = document.createElement("span");
    titleYour.classList.add("your");
    titleYour.innerHTML = "Your";
    title.appendChild(titleYour);

    const titleAsterisk = document.createElement("span");
    titleAsterisk.classList.add("asterisk");
    titleAsterisk.innerHTML = "*";
    title.appendChild(titleAsterisk);

    const titleSite = document.createElement("span");
    titleSite.classList.add("site");
    titleSite.innerHTML = " Site";
    title.appendChild(titleSite);

    const titleTM = document.createElement("span");
    titleTM.classList.add("tm");
    titleTM.innerHTML = "\u2122";
    title.appendChild(titleTM);


    const desc = document.createElement("div");
    desc.classList.add("desc");

    const descAsterisk = document.createElement("div");
    descAsterisk.classList.add("asterisk");
    descAsterisk.innerHTML = "* This is MY site, not yours.";
    desc.appendChild(descAsterisk);

    const descTM = document.createElement("div");
    descTM.classList.add("tm");
    descTM.innerHTML = "Your* Site is an unregistrated trademark.";
    desc.appendChild(descTM);

    const descTMCont = document.createElement("div");
    descTMCont.classList.add("tmcont");
    descTMCont.innerHTML = "There is no reason there should be a trademark.";
    desc.appendChild(descTMCont);


    const cont = document.createElement("div");
    cont.classList.add("cont");
    cont.innerHTML = "Scroll down or click...";


    startScreenBlock.appendChild(title);
    startScreenBlock.appendChild(desc);
    startScreenBlock.appendChild(cont);

    D.startScreen.appendChild(startScreenBlock);

    registerEventListeners();
}

function buildSite() {
    // startScreen
    // -----------------------------------------------------------------------------
    D.startScreen = document.createElement("div");
    D.startScreen.classList.add("startScreen");
    startScreenAnimation();

    // header
    // -----------------------------------------------------------------------------
    D.header = document.createElement("div");
    D.header.classList.add("head", "md-whiteframe-4dp");
    {
        D.title = document.createElement("div");
        D.title.classList.add("title");
        D.title.innerHTML = "Your<s>*</s> Site<s>\u2122</s>";
        D.header.appendChild(D.title);
    } {
        D.addButton = document.createElement("button");

        {
            const icon = document.createElement("img");
            icon.alt = "+";
            icon.src = "baseline-add_circle_outline-24px.svg";
            icon.width = icon.height = 24;
            D.addButton.appendChild(icon);
        }

        D.addButton.addEventListener("click", function() {
            D.addLink.click();
        });
        D.addButton.appendChild(document.createTextNode("Add"));
        D.addButton.classList.add("addbutton", "md-whiteframe-2dp");

        D.header.appendChild(D.addButton);
    }

    D.addLink = document.createElement("a");
    D.addLink.href = "https://docs.google.com/forms/d/e/1FAIpQLSe3SS71ky1UeLUMFFcEQTjz8Tr4eKkVXeB75HzCNeuqTiKT-w/viewform?usp=sf_link";
    D.addLink.rel = "noopener";
    D.addLink.target = "_blank";

    // body
    // -----------------------------------------------------------------------------
    D.body = document.createElement("div");
    D.body.classList.add("body");
    {
        D.content = document.createElement("div");
        D.content.classList.add("content");

        let card = _createCard();
        card.innerHTML = "Loading content...";
        D.content.appendChild(card);

        D.body.appendChild(D.content);
    }

    document.body.appendChild(D.body);
    document.body.appendChild(D.header);
    document.body.appendChild(D.startScreen);
}

function clearContent() {
    while (D.content.firstChild) {
        D.content.removeChild(D.content.firstChild);
    }
}

function _createCard() {
    const card = document.createElement("div");
    card.classList.add("card", "md-whiteframe-1dp");
    return card;
}

function createCard(timestamp, name, title, body, color, backgroundcolor, customcss) {
    const card = _createCard();
    card.style.cssText = customcss;
    card.style.color = color;
    card.style.backgroundColor = backgroundcolor;

    
    const $title = document.createElement("div");
    $title.classList.add("card_title");
    $title.appendChild(document.createTextNode(title));
    card.appendChild($title);
    
    const $meta = document.createElement("div");
    $meta.classList.add("card_meta");
    $meta.innerText = "by " + (name || "anonymous") + ", at " + timestamp;
    $title.appendChild($meta);

    const $body = document.createElement("div");
    $body.classList.add("card_body");
    $body.appendChild(sanitize(body.replace("\n", "<br>")));
    card.appendChild($body);

    
    D.content.appendChild(card);
}

/**
 * callback when sheet loaded
 * @param {GSheetData} sheet google sheet
 */
function loaded(sheet) {
    const key = sheet.keys[0];
    D.sheet = sheet.sheets[key];

    clearContent();

    for (let i = D.sheet.data.length - 1; i >= 2; i--) { // ignore first 2 lines
        let row = D.sheet.data[i];
        createCard(
            row[0],
            row[1],
            row[2],
            row[3],
            row[4],
            row[5],
            row[6]
        );
    }
}

function failed(e, x) {
    const card = _createCard();
    clearContent();
    console.error(e, x);
    card.innerHTML = "Failed to load content. <br> <code>" + JSON.stringify([x.status, e, x]) + "</code>";
    D.content.appendChild(card);
}

function main() {
    buildSite();

    loadSheet("2PACX-1vQfLrVvnyYlum41LE6w3ok4Z6ospvPN3gB-eCnbZUo_U8RaTpakPiLXwXxkQYRV5k8HqtlPvJeCWiDA", loaded, failed);
}

main();