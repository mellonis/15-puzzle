export default class Patn {
    boardSize = {
        cols: 4,
        rows: 4,
    };
    tileList = [];
    moveList = [];
    isSolved = false;
    level = 1;
    levelCount;
    isLastLevel;
    rightMoves;

    constructor(levelCount, lastSolvedLevel=0) {
        this.levelCount = levelCount;
        this.level = lastSolvedLevel + 1;

        if (this.level > this.levelCount) {
            this.level = this.levelCount;
        }

        this.generateRightMoves();
        this.generate();
    }

    generate(isFirstRun=true) {
        if (isFirstRun && this.isSolved && this.level < this.levelCount) {
            this.level += 1;
        }

        this.moveList = [];
        this.tileList = Array.apply(null, {length: this.boardSize.cols * this.boardSize.rows})
            .map(Number.call, (i) => i + 1)
            .sort(() => Math.random() - 0.5);

        while (!this.canBeSolved() || this.checkIfSolved()) {
            this.generate(false);
        }
        this.isLastLevel = this.level === this.levelCount;
    }

    generateRightMoves() {
        this.rightMoves = [];

        for (let i = 0, r = 0, c = 0; i < this.boardSize.cols * this.boardSize.rows; ++i) {
            this.rightMoves[i] = [];
            c = i % this.boardSize.cols;
            r = (i - c) / this.boardSize.cols;
            if (r > 0) {
                this.rightMoves[i].push((r - 1) * this.boardSize.cols + c);
            }
            if (c < this.boardSize.cols - 1) {
                this.rightMoves[i].push(r * this.boardSize.cols + c + 1);
            }
            if (r < this.boardSize.rows - 1) {
                this.rightMoves[i].push((r + 1) * this.boardSize.cols + c);
            }
            if (c > 0) {
                this.rightMoves[i].push(r * this.boardSize.cols + c - 1);
            }
        }
    }

    getEmptyIx() {
        return this.tileList.findIndex((order) => order === 16);
    }

    canBeSolved() {
        const qq = this.tileList.map(i => i - 1);

        let e = -1;
        let k = 0;

        for (let i = 0; i < 16; ++i) {
            if (qq[i] === 15) {
                e = Math.floor((i + 1) / 4);
                if ((i + 1) % 4 > 0)
                    ++e;
                break;
            }
        }

        for (let i = 0; i < 16; ++i) {
            for (let j = 0; j < i; ++j) {
                if ((qq[j] > qq[i]) && (qq[j] < 15)) {
                    ++k;
                }
            }
        }

        return (k + e) % 2 === 0;
    }

    checkIfRightMove(ix) {
        const emptyIx = this.getEmptyIx();

        return this.rightMoves[ix].findIndex(order => order === emptyIx) >= 0;
    };

    checkIfSolved() {
        let isSolved = true;

        for (let i = 1; i < this.tileList.length; ++i) {
            if (this.tileList[i] - this.tileList[i - 1] !== 1) {
                isSolved = false;
                break;
            }
        }

        this.isSolved = isSolved;

        return isSolved;
    }

    move(ix) {
        const emptyIx = this.getEmptyIx();

        if (Array.isArray(ix)) {
            ix.forEach(this.move.bind(this));
        } else if (this.checkIfRightMove(ix)) {
            this.elementaryMove(ix);
        } else if (ix % this.boardSize.cols === emptyIx % this.boardSize.cols) {
            const movementList = [];
            let t;

            if (ix > emptyIx) {
                t = emptyIx + this.boardSize.cols;

                while (t <= ix) {
                    movementList.push(t);
                    t += this.boardSize.cols;
                }
            } else {
                t = emptyIx - this.boardSize.cols;

                while (t >= ix) {
                    movementList.push(t);
                    t -= this.boardSize.cols;
                }
            }

            this.move(movementList);
        } else if ((ix - ix % this.boardSize.cols) / this.boardSize.cols === (emptyIx - emptyIx % this.boardSize.cols) / this.boardSize.cols) {
            const moveList = [];
            let t;

            if (ix > emptyIx) {
                t = emptyIx + 1;

                while (t <= ix) {
                    moveList.push(t);
                    t++;
                }
            } else {
                t = emptyIx - 1;

                while (t >= ix) {
                    moveList.push(t);
                    t--;
                }
            }

            this.move(moveList);
        }

        this.checkIfSolved();
    }

    undo() {
        if (this.moveList.length) {
            const ix = this.moveList.pop();

            this.elementaryMove(ix, true);
            this.moveList = Array.from(this.moveList);
        }
    }

    elementaryMove(ix, isUndo=false) {
        let emptyIx = this.getEmptyIx();
        this.tileList[emptyIx] = this.tileList[ix];
        this.tileList[ix] = 16;

        this.tileList = Array.from(this.tileList);

        if (isUndo === false) {
            this.moveList = this.moveList.concat(emptyIx);
        }
    }
}