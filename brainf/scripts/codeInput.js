const sampleInput = `\
[ 
    Code from: https://en.wikipedia.org/wiki/Brainf***
    Modified by JaPNaA

    This program prints "Hello World!" and a newline to the screen, its
    length is 106 active command characters. [It is not the shortest.]

    This interpreter adds tilda (~), which acts lika a breakpoint, pausing
    execution.
]
++++++++               Set Cell #0 to 8
[
    >++++               Add 4 to Cell #1; this will always set Cell #1 to 4
    [                   as the cell will be cleared by the loop
        >++             Add 2 to Cell #2
        >+++            Add 3 to Cell #3
        >+++            Add 3 to Cell #4
        >+              Add 1 to Cell #5
        <<<<-           Decrement the loop counter in Cell #1
    ]                   Loop till Cell #1 is zero; number of iterations is 4
    >+                  Add 1 to Cell #2
    >+                  Add 1 to Cell #3
    >-                  Subtract 1 from Cell #4
    >>+                 Add 1 to Cell #6
    [<]                 Move back to the first zero cell you find; this will
                        be Cell #1 which was cleared by the previous loop
    <-                  Decrement the loop Counter in Cell #0
]                       Loop till Cell #0 is zero; number of iterations is 8

The result of this is:
Cell No :   0   1   2   3   4   5   6
Contents:   0   0  72 104  88  32   8
Pointer :   ^

>>.                     Cell #2 has value 72 which is 'H'
>---.                   Subtract 3 from Cell #3 to get 101 which is 'e'
+++++++..+++.           Likewise for 'llo' from Cell #3
>>.                     Cell #5 is 32 for the space
<-.                     Subtract 1 from Cell #4 for 87 to give a 'W'
<.                      Cell #3 was set to 'o' from the end of 'Hello'
+++.------.--------.    Cell #3 for 'rl' and 'd'
>>+.                    Add 1 to Cell #5 gives us an exclamation point
>++.                    And finally a newline from Cell #6`;

class InputValue {
    /**
     * @param {string} char
     * @param {number} x
     * @param {number} y
     * @param {number} index
     */
    constructor(char, x, y, index) {
        /** @type {string} */
        this.char = char;

        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
        /** @type {number} */
        this.index = index;

        /** @type {number | undefined} */
        this.match = undefined;
    }
}

class CodeInput {
    constructor() {
        this.element = this._createElement();
        /** @type {HTMLTextAreaElement} */
        this._textarea = null;
        this._createTextarea();

        this._accecptedChars = [">", "<", "+", "-", ".", ",", "[", "]", "~"];
    }

    getValue() {
        let val = this._textarea.value;
        /** @type {InputValue[]} */
        let values = [];

        let x = 0;
        let y = 0;
        let index = 0;

        let braceStack = [];

        for (let char of val) {
            let currX = x++;
            let currY = y;
            
            if (char === "\n" || x > 80) {
                x = 0;
                y++;
            }
            
            if (!this._accecptedChars.includes(char)) { continue; }
            
            let currIndex = index++;
            let inputValue = new InputValue(char, currX, currY, currIndex);
            values.push(inputValue);

            if (char === "[") {
                braceStack.push(inputValue);
            } else if (char === "]") {
                let brace = braceStack.pop();
                brace.match = currIndex;
                inputValue.match = brace.index;
            }
        }

        if (braceStack.length > 0) {
            throw new SyntaxError("Unmatched braces");
        }

        return values;
    }

    _createElement() {
        let elm = document.createElement("div");
        elm.classList.add("input");
        return elm;
    }

    _createTextarea() {
        let textarea = document.createElement("textarea");
        textarea.classList.add("textarea");
        this._textarea = textarea;
        this.element.appendChild(textarea);

        textarea.value = sampleInput;
    }
}