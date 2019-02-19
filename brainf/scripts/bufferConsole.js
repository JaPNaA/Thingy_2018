class BufferConsole {
    /**
     * @param {Buffer} inputBuffer
     * @param {Buffer} outputBuffer
     */
    constructor(inputBuffer, outputBuffer) {
        this.element = document.createElement("div");

        this.in = inputBuffer;
        this.out = outputBuffer;

        /** @type {HTMLDivElement} */
        this.$out = null;
        /** @type {HTMLInputElement} */
        this.$in = null;

        this.createElements();
        this.attachOutput();
    }

    createElements() {
        this.element.classList.add("console");
        this.element.addEventListener("click", () => this.$in.focus());
        {
            let output = document.createElement("div");
            output.classList.add("output");
            this.$out = output;
            this.element.appendChild(output);
        } {
            let input = document.createElement("input");
            input.classList.add("input");
            this.$in = input;
            input.addEventListener("keydown", this.onkeydown.bind(this));
            this.element.appendChild(input);
        }
    }

    onkeydown(event) {
        if (event.keyCode === 13) {
            let str = this.$in.value;
            this.$in.value = "";

            for (let char of str) {
                this.writeIn(char);
            }
            this.writeIn(10);
        }
    }

    async attachOutput() {
        while (true) {
            const val = await this.out.read();
            this.writeOut(String.fromCharCode(val));
        }
    }

    /**
     * @param {string} char 
     */
    writeOut(char) {
        let textNode = document.createTextNode(char);
        this.$out.appendChild(textNode);
        this.scroll();
    }

    /**
     * @param {string | number} charArg 
     */
    writeIn(charArg) {
        /** @type {string} */
        let char;

        if (typeof charArg === "number") {
            char = String.fromCharCode(charArg);
        } else {
            char = charArg;
        }

        let textNode = document.createTextNode(char);
        this.$out.appendChild(textNode);

        this.in.write(charArg);
        this.scroll();
    }

    scroll() {
        this.element.scrollTo(0, this.element.scrollHeight);
    }

    clear() {
        this.$in.value = "";

        while (this.$out.firstChild) {
            this.$out.removeChild(this.$out.firstChild);
        }
    }
}