export default class Patn {
  static #size = {
    height: 4,
    width: 4,
  };
  #tileList = [];
  #movementList = [];
  #level;
  #levelCount;
  #possibleMoves;

  constructor(levelCount, lastSolvedLevel = 0) {
    this.#levelCount = levelCount;

    if (lastSolvedLevel < 0) {
      lastSolvedLevel = 0;
    }

    this.#level = lastSolvedLevel;

    if (this.#level > this.#levelCount) {
      this.#level = this.#levelCount;
    }

    this.generateRightMoves();
    this.generate();
  }

  get canBeSolved() {
    const tile = this.#tileList.map(i => i - 1);

    let e = -1;
    let k = 0;

    for (let i = 0; i < 16; ++i) {
      if (tile[i] === 15) {
        e = Math.floor((i + 1) / 4);
        if ((i + 1) % 4 > 0)
          ++e;
        break;
      }
    }

    for (let i = 0; i < 16; ++i) {
      for (let j = 0; j < i; ++j) {
        if ((tile[j] > tile[i]) && (tile[j] < 15)) {
          ++k;
        }
      }
    }

    return (k + e) % 2 === 0;
  }

  get canUndo() {
    return !this.isSolved && this.movesCount > 0;
  }

  get emptyIx() {
    return this.#tileList.findIndex((order) => order === 16);
  }

  get isLastLevel() {
    return this.#level === this.#levelCount;
  }

  get isSolved() {
    let isSolved = true;

    for (let i = 1; i < this.#tileList.length; ++i) {
      if (this.#tileList[i] - this.#tileList[i - 1] !== 1) {
        isSolved = false;
        break;
      }
    }

    return isSolved;
  }

  get level() {
    return this.#level;
  }

  get movesCount() {
    return this.#movementList.length;
  }

  get tileList() {
    return Array.from(this.#tileList);
  }

  checkIfItPossibleMove(ix) {
    return !this.isSolved && this.#possibleMoves[ix].findIndex(order => order === this.emptyIx) >= 0;
  };

  generate(isFirstRun = true) {
    if (isFirstRun && this.isSolved && this.#level < this.#levelCount) {
      this.#level += 1;
    }

    this.#movementList = [];
    this.#tileList = Array.apply(null, {length: Patn.#size.width * Patn.#size.height})
      .map(Number.call, (i) => i + 1)
      .sort(() => Math.random() - 0.5);

    while (!this.canBeSolved || this.isSolved) {
      this.generate(false);
    }
  }

  generateRightMoves() {
    this.#possibleMoves = [];

    for (let i = 0, r = 0, c = 0; i < Patn.#size.width * Patn.#size.height; ++i) {
      this.#possibleMoves[i] = [];
      c = i % Patn.#size.width;
      r = (i - c) / Patn.#size.width;

      if (r > 0) {
        this.#possibleMoves[i].push((r - 1) * Patn.#size.width + c);
      }

      if (c < Patn.#size.width - 1) {
        this.#possibleMoves[i].push(r * Patn.#size.width + c + 1);
      }

      if (r < Patn.#size.height - 1) {
        this.#possibleMoves[i].push((r + 1) * Patn.#size.width + c);
      }

      if (c > 0) {
        this.#possibleMoves[i].push(r * Patn.#size.width + c - 1);
      }
    }
  }

  move(ix) {
    const emptyIx = this.emptyIx;

    if (Array.isArray(ix)) {
      ix.forEach(this.move.bind(this));
      return;
    }

    if (this.checkIfItPossibleMove(ix)) {
      this.#simpleMove(ix);
      return;
    }

    const isEmptyInTheSameColumn = ix % Patn.#size.width === emptyIx % Patn.#size.width;

    if (isEmptyInTheSameColumn) {
      const movementList = [];
      let t;

      if (ix > emptyIx) {
        t = emptyIx + Patn.#size.width;

        while (t <= ix) {
          movementList.push(t);
          t += Patn.#size.width;
        }
      } else {
        t = emptyIx - Patn.#size.width;

        while (t >= ix) {
          movementList.push(t);
          t -= Patn.#size.width;
        }
      }

      this.move(movementList);
      return;
    }

    const isEmptyInTheSameRow = (ix - ix % Patn.#size.width) / Patn.#size.width === (emptyIx - emptyIx % Patn.#size.width) / Patn.#size.width;

    if (isEmptyInTheSameRow) {
      const movementList = [];
      let t;

      if (ix > emptyIx) {
        t = emptyIx + 1;

        while (t <= ix) {
          movementList.push(t);
          t++;
        }
      } else {
        t = emptyIx - 1;

        while (t >= ix) {
          movementList.push(t);
          t--;
        }
      }

      this.move(movementList);
    }
  }

  moveDown() {
    this.move(this.emptyIx % 4);
  }

  moveLeft() {
    this.move(Math.floor(this.emptyIx / 4) * 4 + 3);
  }

  moveRight() {
    this.move(Math.floor(this.emptyIx / 4) * 4);
  }

  moveUp() {
    this.move(this.emptyIx % 4 + 12);
  }

  #simpleMove = (ix, isUndo = false) => {
    const emptyIx = this.emptyIx;

    this.#tileList[emptyIx] = this.#tileList[ix];
    this.#tileList[ix] = 16;

    this.#tileList = Array.from(this.#tileList);

    if (isUndo === false) {
      this.#movementList = this.#movementList.concat(emptyIx);
    }
  }

  undo() {
    if (this.canUndo) {
      this.#simpleMove(this.#movementList.pop(), true);
      this.#movementList = Array.from(this.#movementList);
    }
  }
}
