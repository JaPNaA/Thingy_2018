class DOM {
    constructor() {
        this.main = document.createElement("div");
        this.main.classList.add("main");

        /** @type {HTMLDivElement} */
        this.memoryContainer = null;
        /** @type {HTMLDivElement} */
        this.inputContainer = null;
        /** @type {HTMLDivElement} */
        this.buttonsContainer = null;
        /** @type {HTMLDivElement} */
        this.consoleContainer = null;

        /** @type {HTMLDivElement} */
        this.memory = null;
        /** @type {HTMLDivElement} */
        this.input = null;
        /** @type {HTMLDivElement} */
        this.buttons = null;
        /** @type {HTMLDivElement} */
        this.console = null;

        this.create();
    }

    create() {
        {
            let title = document.createElement("h1");
            title.classList.add("pageTitle");
            title.innerText = document.title;
            this.main.appendChild(title);
        }
        {
            let memoryCC = document.createElement("div");
            memoryCC.classList.add("memoryCC");

            {
                let heading = document.createElement("h2");
                heading.classList.add("heading");
                heading.innerText = "Memory";
                memoryCC.appendChild(heading);
            } {
                let memoryContainer = document.createElement("div");
                memoryContainer.classList.add("memoryContainer");
                this.memoryContainer = memoryContainer;
                memoryCC.appendChild(memoryContainer);
            }

            this.main.appendChild(memoryCC);
        } {
            let consoleCC = document.createElement("div");
            consoleCC.classList.add("consoleCC");

            {
                let heading = document.createElement("h2");
                heading.classList.add("heading");
                heading.innerText = "Console";
                consoleCC.appendChild(heading);
            } {
                let consoleContainer = document.createElement("div");
                consoleContainer.classList.add("consoleContainer");
                this.consoleContainer = consoleContainer;
                consoleCC.appendChild(consoleContainer);
            }

            this.main.appendChild(consoleCC);
        } {
            let codeCC = document.createElement("div");
            codeCC.classList.add("codeCC");

            {
                let heading = document.createElement("h2");
                heading.classList.add("heading");
                heading.innerText = "Code";
                codeCC.appendChild(heading);
            } {
                let codeContainer = document.createElement("div");
                codeContainer.classList.add("inputContainer");
                this.inputContainer = codeContainer;
                codeCC.appendChild(codeContainer);
            }

            this.main.appendChild(codeCC);
        } {
            let execButtonCC = document.createElement("div");
            execButtonCC.classList.add("execButtonCC");

            {
                let execButtonContainer = document.createElement("div");
                execButtonContainer.classList.add("execButtonContainer");
                this.buttonsContainer = execButtonContainer;
                execButtonCC.appendChild(execButtonContainer);
            }

            this.main.appendChild(execButtonCC);
        }

        document.body.appendChild(this.main);
    }

    /**
     * @param {Memory} memory 
     */
    attachMemory(memory) {
        this.memory = memory.element;
        this.clearElement(this.memoryContainer);
        this.memoryContainer.appendChild(this.memory);
    }

    /**
     * @param {CodeInput} input
     */
    attachInput(input) {
        this.input = input.element;
        this.clearElement(this.inputContainer);
        this.inputContainer.appendChild(this.input);
    }

    /**
     * @param {Interpreter} interpreter 
     */
    attachButtons(interpreter) {
        this.buttons = interpreter.element;
        this.clearElement(this.buttonsContainer);
        this.buttonsContainer.appendChild(this.buttons);
    }

    /**
     * @param {BufferConsole} bconsole 
     */
    attachConsole(bconsole) {
        this.console = bconsole.element;
        this.clearElement(this.consoleContainer);
        this.consoleContainer.appendChild(this.console);
    }

    /**
     * @param {Element} element
     */
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}