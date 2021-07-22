import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { newLevel } from "../../services/reducers";
import About from '../about/About';
import Board from '../board/Board';
import ControlPanel from '../control-panel/ControlPanel';
import Help from '../help/Help';

import './Game.scss';

const Game = () => {
  const {
    isHelpShown,
    isAboutShown,
    puzzle,
  } = useSelector(({
    main: {
      isHelpShown,
      isAboutShown,
      puzzle,
    }
  }) => ({
    isHelpShown,
    isAboutShown,
    puzzle,
  }), shallowEqual);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!puzzle) {
      dispatch(newLevel());
    }
  }, [dispatch, puzzle])

  return (
    <div className="game">
      { puzzle && <>
        <Board/>
        <ControlPanel/>
        { isHelpShown && <Help/> }
        { isAboutShown && <About/> }
      </>}
    </div>
  );
}

export default Game;
