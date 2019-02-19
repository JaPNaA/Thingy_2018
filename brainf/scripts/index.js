class Main {
    constructor() {
        this.dom = new DOM();
        
        this.memory = new Memory();
        
        this.inBuff = new Buffer();
        this.outBuff = new Buffer();

        this.console = new BufferConsole(this.inBuff, this.outBuff);

        this.codeInput = new CodeInput();
        this.interpreter = new Interpreter(this.memory, this.codeInput, this.outBuff, this.inBuff, this.console);

        this.dom.attachMemory(this.memory);
        this.dom.attachInput(this.codeInput);
        this.dom.attachButtons(this.interpreter);
        this.dom.attachConsole(this.console);
    }
}

const main = new Main();
console.log(main);