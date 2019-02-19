class Buffer {
    constructor() {
        /** @type {number[]} */
        this._buffer = [];
        this._max = 1e8;

        /** @type {function[]} */
        this._writeWaiters = [];
        this.waiting = false;
    }

    /**
     * @param {string | number} char 
     */
    write(char) {
        if (this._buffer.length >= this._max) {
            throw new Error("Buffer max reached");
        }

        if (typeof char === "string") {
            this._buffer.push(char.charCodeAt(0));
        } else {
            this._buffer.push(char);
        }

        this._checkWaiters();
    }

    _checkWaiters() {
        let firstWaiter = this._writeWaiters.shift();
        if (firstWaiter) {
            firstWaiter();
        }

        if (!this._writeWaiters.length) {
            this.waiting = false;
        }
    }

    async read() {
        let v = this._buffer.shift();
        if (v !== undefined) { return v; }

        await new Promise(
            /** @this Buffer */
            function(res) {
                this._writeWaiters.push(res);
                this.waiting = true;
            }.bind(this)
        );

        return this.read();
    }

    close() {
        this._writeWaiters.length = 0;
        this._buffer.length = 0;
    }
}