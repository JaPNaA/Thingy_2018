class State {
    constructor() {
        this.instructionPtr = 0;
        this.dataPtr = 0;
    }
}

class Interpreter {
    /**
     * @param {Memory} memory
     * @param {CodeInput} codeIn
     * @param {Buffer} output
     * @param {Buffer} input
     * @param {BufferConsole} bconsole
     */
    constructor(memory, codeIn, output, input, bconsole) {
        this.memory = memory;
        this.codeIn = codeIn;
        this.output = output;
        this.input = input;
        this.console = bconsole;

        this.runner = new Runner(this);

        this.element = this.createElement();
    }

    createElement() {
        return this.runner.createButtons();
    }

    async *exec() {
        const tokens = this.codeIn.getValue();
        const state = new State();

        while (true) {
            const token = tokens[state.instructionPtr];

            if (!token) break;

            await this.execToken(token, state);
            yield;
        }

        return;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    async execToken(token, state) {
        let func = null;

        switch (token.char) {
            case ">":
                func = this.execIncrementPointer;
                break;
            case "<":
                func = this.execDecrementPointer;
                break;
            case "+":
                func = this.execIncrement;
                break;
            case "-":
                func = this.execDecrement;
                break;
            case ".":
                func = this.execOutput;
                break;
            case ",":
                func = this.execInput;
                break;
            case "[":
                func = this.execJumpForwardIfZero;
                break;
            case "]":
                func = this.execJumpBackIfNonzero;
                break;
            case "~":
                func = this.execBreakpoint;
                break;
            default:
                throw new SyntaxError("What is a '" + token.char + "'?")
        }

        await func.bind(this)(token, state);
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execIncrementPointer(token, state) {
        state.dataPtr++;
        state.instructionPtr++;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execDecrementPointer(token, state) {
        state.dataPtr--;
        state.instructionPtr++;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execIncrement(token, state) {
        this.memory.incrementCell(state.dataPtr);
        state.instructionPtr++;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execDecrement(token, state) {
        this.memory.decrementCell(state.dataPtr);
        state.instructionPtr++;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execOutput(token, state) {
        this.output.write(this.memory.get(state.dataPtr));
        state.instructionPtr++;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    async execInput(token, state) {
        let input = await this.input.read();
        this.memory.set(state.dataPtr, input);
        state.instructionPtr++;
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execJumpForwardIfZero(token, state) {
        if (!this.memory.get(state.dataPtr)) {
            state.instructionPtr = token.match;
        } else {
            state.instructionPtr++;
        }
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execJumpBackIfNonzero(token, state) {
        if (this.memory.get(state.dataPtr)) {
            state.instructionPtr = token.match;
        } else {
            state.instructionPtr++;
        }
    }

    /**
     * @param {InputValue} token
     * @param {State} state
     */
    execBreakpoint(token, state) {
        debugger;
        state.instructionPtr++;
    }
}