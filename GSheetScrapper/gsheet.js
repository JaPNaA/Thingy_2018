/**
 * @class
 */
function GSheetData() {
    this.title = "";
    this.sheets = {};
    this.keys = [];
    this.nameKeys = [];
}

/**
 * @class
 */
function GSheet() {
    this.width = 0;
    this.height = 0;
    this.elm = 0;
    this.data = [];
    this.name = "";
    this.id = "";
}

/**
 * gets gsheetdata from document
 * @param {Document} doc input document
 * @returns {GSheet} GSheet returned
 */
function getContent(doc) {
    const data = new GSheetData();

    data.title = doc.getElementById("doc-title").children[0].childNodes[0].nodeValue;

    const sheetsElm = doc.getElementById("sheets-viewport"),
        header = doc.getElementById("sheet-menu");

    if (header) {
        for (const i of header.children) {
            if (i.tagName === "SCRIPT") continue;

            data.nameKeys.push(i.children[0].childNodes[0].nodeValue);
        }
    }

    for (const i of sheetsElm.children) {
        data.keys.push(i.id);
    }

    for (let i = 0; i < data.keys.length; i++) {
        const key = data.keys[i],
            name = data.nameKeys[i],
            sheet = new GSheet(),
            elm = doc.getElementById(key),
            tbody = elm.children[0].children[0].children[1];

        sheet.name = name;
        sheet.id = key;
        sheet.elm = tbody;
        sheet.height = tbody.children.length;
        sheet.width = tbody.children[0].children.length - 1; // gsheets has 1 column for row number

        for (const row of tbody.children) {
            const arr = [];

            for (let x = 1; x < row.childElementCount; x++) {
                if (row.children[x].childNodes.length) {
                    arr.push(row.children[x].innerText);
                } else {
                    arr.push("");
                }
            }

            sheet.data.push(arr);
        }

        data.sheets[key] = sheet;
        data.sheets[name] = sheet;
    }

    return data;
}

function loadSheet(url, cb, fb) {
    const x = new XMLHttpRequest();
    const parser = new DOMParser();

    x.open("GET", "https://docs.google.com/spreadsheets/d/e/" + url + "/pubhtml");
    x.responseType = "text";
    x.addEventListener("load", function () {
        cb(getContent(parser.parseFromString(x.response, "text/html")));
    });

    if (fb) {
        x.addEventListener("error", function(e) {
            fb(e, x);
        });
    }

    x.send();
}