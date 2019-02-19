/**
 * Canvas
 * @type {HTMLCanvasElement}
 */
const C = document.getElementById("c");

/**
 * Rendering context
 * @type {CanvasRenderingContext2D}
 */
const X = C.getContext("2d");

/**
 * Matrix class - an array of arrays
 */
class Matrix {
    /**
     * Matrix constructor
     * @param {Array.<Number[]>} matrix Matrix represented as an array of arrays
     */
    constructor(matrix) {
        this.matrix = matrix;

        this.height = matrix[0].length;
        this.width = matrix.length;
    }

    /**
     * Gets value in matrix
     * @param {Number} x index
     * @param {Number} y index
     * @returns {Number} the value at the indicies
     */
    get(x, y) {
        return this.matrix[x][y];
    }

    /**
     * Multipies the this and other matrix together
     * @param {Matrix} x other matrix
     * @returns {Matrix} result
     */
    multiply(x) {
        return Matrix.multiply(this, x);
    }

    /**
     * Multipies two matricies together
     * @param {Matrix} ma matrix 1
     * @param {Matrix} mb matrix 2
     * @returns {Matrix} result
     */
    static multiply(ma, mb) {
        if (ma.width !== mb.height) return;

        let nwidth = mb.height,
            nheight = ma.height,
            ndata = new Array(nheight).fill(0).map(() => new Array(nwidth));

        for (let b = 0; b < mb.width; b++) {
            for (let y = 0; y < ma.height; y++) {
                let sum = 0;

                for (let x = 0; x < ma.width; x++) {
                    sum += mb.get(b, x) * ma.get(x, y);
                }

                ndata[b][y] = sum;
            }
        }

        return new Matrix(ndata);
    }
}

/**
 * Point class - an array of numbers
 */
class Vector extends Matrix {
    constructor(x, y, z) {
        super([[x, y, z, 1]]);

        this.x = x;
        this.y = y;
        this.z = z;

        /**
         * @type {Vector}
         */
        this.transformed = null;
    }

    /**
     * Multiplies by the matrix, and remembers it
     * @param {Matrix} mat matrix to transform to
     */
    transform(mat) {
        let nmat = mat.multiply(this);
        let w = nmat.get(0, 3);

        this.transformed = new Vector(
            nmat.get(0, 0) / w, 
            nmat.get(0, 1) / w, 
            nmat.get(0, 2) / w
        );
    }
}

/**
 * A face on a 3d form
 */
class Face {
    /**
     * Face constructor
     * @param {Vector[]} points points in face
     */
    constructor(...points) {
        this.points = points;
    }

    draw() {
        X.strokeStyle = "#000000";
        X.lineWidth = 2;

        X.beginPath();
        X.moveTo(this.points[0].transformed.x, this.points[0].transformed.y);

        for (let i = 1; i < this.points.length; i++) {
            X.lineTo(this.points[i].transformed.x, this.points[i].transformed.y);
        }

        X.closePath();
        X.stroke();
    }
}

class Cube {
    /**
     * 
     * @param {Number} x position
     * @param {Number} y position
     * @param {Number} z position
     * @param {Number} w width
     * @param {Number} h height
     * @param {Number} d depth (length)
     * @param {Matrix} projectionMatrix drawing projection matrix
     */
    constructor(x, y, z, w, h, d, projectionMatrix) {
        this.pos = new Vector(x, y, z);
        this.projectionMatrix = projectionMatrix;

        let xw = x + w,
            yh = y + h,
            zd = z + d,
            pt = [
                new Vector(x, y, z),
                new Vector(xw, y, z),
                new Vector(x, yh, z),
                new Vector(xw, yh, z),

                new Vector(x, y, zd),
                new Vector(xw, y, zd),
                new Vector(x, yh, zd),
                new Vector(xw, yh, zd)
            ];

        this.points = pt;

        this.faces = [
            new Face(pt[0], pt[2], pt[6], pt[4]), // x
            new Face(pt[0], pt[1], pt[5], pt[4]), // y
            new Face(pt[0], pt[1], pt[3], pt[2]), // z

            new Face(pt[1], pt[3], pt[7], pt[5]), // xw
            new Face(pt[2], pt[3], pt[7], pt[6]), // yh
            new Face(pt[4], pt[5], pt[7], pt[6]) // zd
        ];
    }

    draw() {
        for (let point of this.points) {
            point.transform(this.projectionMatrix);
        }

        console.log(this.points);

        for (let face of this.faces) {
            face.draw();
        }
    }
}

function main(xarg, yarg, zarg) {
    // let projectionMatrix = new Matrix([
    //     [1, 0, 0, 0],
    //     [0, 1, 0, 0]
    // ]);

    const FOV = 5;
    const S = 1 / Math.tan(FOV / 2 * Math.PI / 180);
    const FAR = 100;
    const NEAR = 0.1;

    const _temp1 = -(FAR / (FAR - NEAR));
    const _temp2 = -(FAR * NEAR / (FAR - NEAR));

    let projectionMatrix = new Matrix([
        [S,      0,      0,      0],
        [0,      S,      0,      0],
        [0,      0, _temp1, _temp2],
        [0,      0,     -1,      0]
    ]);

    console.log(projectionMatrix);

    X.clearRect(0, 0, C.width, C.height);
    X.save();
    X.translate(C.width / 2, C.height / 2);

    let cube = new Cube(xarg, yarg, zarg, 128, 128, 60, projectionMatrix);
    cube.draw();

    X.restore();
}


addEventListener("mousemove", function(e) {
    const x = e.clientX,
        y = e.clientY;

    main(
        -(x - innerWidth / 2),
        -(y - innerHeight / 2), 
        200
    );
});