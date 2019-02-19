class Runner {
    /**
     * @param {Interpreter} interpreter 
     */
    constructor(interpreter) {
        this.interpreter = interpreter;

        this.config = {
            intervalSpeed: 16
        };

        /** @type {HTMLDivElement} */
        this.element = document.createElement("div");
        this.element.classList.add("execButton");

        this.startStopButton = null;
        this.pauseResumeButton = null;

        /** @type {AsyncIterableIterator} */
        this.instance = null;
        this.waiting = false;

        /** @type {number} */
        this.intervalId = null;

        this.running = false;
        this.paused = true;
    }

    start() {
        if (this.running) { return; }
        this.clean();
        this.instance = this.interpreter.exec();
        this.resume();
        this.running = true;
    }

    clean() {
        this.interpreter.memory.clear();
        this.interpreter.console.clear();
        this.interpreter.input.close();
    }

    resume() {
        if (!this.paused) { return; }
        this.intervalStep();
        this.intervalId = setInterval(this.intervalStep.bind(this), this.config.intervalSpeed);
        this.paused = false;
    }

    async intervalStep() {
        if (this.waiting) return;

        this.waiting = true;
        await this.instance.next();
        this.waiting = false;
    }

    stop() {
        if (!this.running) { return; }
        this.instance = null;
        this.pause();
        this.running = false;
    }

    pause() {
        if (this.paused) { return; }
        clearInterval(this.intervalId);
        this.paused = true;
    }

    createButtons() {
        {
            const button = document.createElement("button");
            button.classList.add("startStop");
            this.startStopButton = button;
            button.addEventListener("click", this.onStartStopButtonClick.bind(this));
            this.element.appendChild(button);
        } {
            const button = document.createElement("button");
            button.classList.add("pauseResume");
            this.pauseResumeButton = button;
            button.addEventListener("click", this.onPauseResumeButtonClick.bind(this));
            this.element.appendChild(button);
        }

        this.updateButtonStates();

        return this.element;
    }

    updateButtonStates() {
        this.updateStartStopButtonState();
        this.updatePauseResumeButtonState();
    }

    updateStartStopButtonState() {
        if (this.running) {
            this.startStopButton.innerText = "Stop";
        } else {
            this.startStopButton.innerText = "Start";
        }
    }

    updatePauseResumeButtonState() {
        if (!this.running) {
            this.pauseResumeButton.classList.add("hidden");
            return;
        } else {
            this.pauseResumeButton.classList.remove("hidden");
        }

        if (this.paused) {
            this.pauseResumeButton.innerText = "Resume";
        } else {
            this.pauseResumeButton.innerText = "Pause";
        }
    }

    onStartStopButtonClick() {
        if (this.running) {
            this.stop();
        } else {
            this.start();
        }
        this.updateButtonStates();
    }

    onPauseResumeButtonClick() {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
        this.updateButtonStates();
    }
}