import { createSlice } from '@reduxjs/toolkit';
import {Patn} from '../../classes/Patn';
import levelList from '../../levels.json';

const initialState = {
  isAboutShown: false,
  isHelpShown: false,
  levelList,
  puzzle: undefined,
};

let puzzle = null;

function mapPuzzleToPlainObject(puzzle) {
  return {
    canUndo: puzzle.canUndo,
    isSolved: puzzle.isSolved,
    level: puzzle.level,
    movesCount: puzzle.movesCount,
    tileList: puzzle.tileList,
  };
}

export const appSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    hideAbout(state) {
      state.isAboutShown = false;
    },
    hideHelp(state) {
      state.isHelpShown = false;
    },
    move(state, { payload: ix}) {
      if (!puzzle) {
        return;
      }

      puzzle.move(ix, true);

      if (puzzle.isSolved) {
        localStorage.setItem('lastSolvedLevel', puzzle.level);
      }

      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    moveDown(state, {payload: isGroupMove}) {
      if (!puzzle) {
        return;
      }

      puzzle.moveDown(isGroupMove);
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    moveLeft(state, {payload: isGroupMove}) {
      if (!puzzle) {
        return;
      }

      puzzle.moveLeft(isGroupMove);
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    moveRight(state, {payload: isGroupMove}) {
      if (!puzzle) {
        return;
      }

      puzzle.moveRight(isGroupMove);
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    moveUp(state, {payload: isGroupMove}) {
      if (!puzzle) {
        return;
      }

      puzzle.moveUp(isGroupMove);
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    newLevel(state) {
      const lastSolvedLevel = Number(localStorage.getItem('lastSolvedLevel'));

      puzzle = new Patn(levelList.length, lastSolvedLevel);
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    restart(state) {
      if (!puzzle) {
        return;
      }

      puzzle.generate();
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    },
    showAbout(state) {
      state.isAboutShown = true;
    },
    showHelp(state) {
      state.isHelpShown = true;
    },
    undo(state) {
      if (!puzzle) {
        return;
      }

      puzzle.undo();
      state.puzzle = mapPuzzleToPlainObject(puzzle);
    }
  },
});

export const {
  hideAbout,
  hideHelp,
  move,
  moveDown,
  moveLeft,
  moveRight,
  moveUp,
  newLevel,
  restart,
  showAbout,
  showHelp,
  undo,
} = appSlice.actions;
export default appSlice.reducer;
