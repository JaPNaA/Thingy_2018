/**
 * @typedef {Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array} ArrayBuffTypes
 */
/**
 * @typedef {function(new:ArrayBuffTypes,number)} ArrayBuffConstructor
 */
/**
 * @typedef {object} Options
 * @property {ArrayBuffConstructor} [arrayConstructor]
 * @property {number} [size]
 */

/** @type {Options} */
const defaultOptions = {
    arrayConstructor: Int32Array,
    size: 256
};

class Memory {
    /**
     * @param {Options} [options] 
     */
    constructor(options) {
        this._options = {
            ...defaultOptions,
            ...options
        };

        this.size = this._options.size;

        /** @type {HTMLDivElement[]} */
        this._cellElms = null;

        /** @type {ArrayBuffer} */
        this.memory = this._createMemory();

        this.element = this._createElement();
        this._createMemoryCells();
    }

    /**
     * @param {number} index 
     */
    incrementCell(index) {
        ++this.memory[index];
        this._updateElm(index);
    }

    /**
     * @param {number} index 
     */
    decrementCell(index) {
        --this.memory[index];
        this._updateElm(index);
    }

    /**
     * @param {number} index 
     */
    get(index) {
        return this.memory[index];
    }

    /**
     * @param {number} index
     * @param {number} value
     */
    set(index, value) {
        this.memory[index] = value;
        this._updateElm(index);
    }

    clear() {
        for (let i = 0; i < this.size; i++) {
            this.set(i, 0);
        }
    }

    /**
     * @param {number} index
     */
    _updateElm(index) {
        const newVal = this.memory[index];
        const elm = this._cellElms[index];

        elm.innerText = newVal.toString();

        if (newVal) {
            elm.classList.add("active");
        } else {
            elm.classList.remove("active");
        }
    }

    _updateAllElms() {
        for (let i = 0; i < this.size; i++) {
            this._updateElm(i);
        }
    }

    _createElement() {
        const elm = document.createElement("div");
        elm.classList.add("memory");
        return elm;
    }

    _createMemoryCells() {
        const memory = document.createElement("div");
        const elms = [];
        memory.classList.add("cells");

        for (let i = 0; i < this.size; i++) {
            const elm = this._createCell();
            memory.appendChild(elm);
            elms.push(elm);
        }

        this._cellElms = elms;
        this._updateAllElms();
        this.element.appendChild(memory);
    }

    /**
     * @returns {HTMLDivElement}
     */
    _createCell() {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        return cell;
    }

    _createMemory() {
        return new this._options.arrayConstructor(256);
    }
}