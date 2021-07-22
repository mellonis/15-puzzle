import React, { useCallback } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { restart, showAbout, showHelp, undo } from "../../services/reducers";

import './ControlPanel.scss';

const ControlPanel = () => {
  const {
    canUndo,
    isSolved,
    level,
    movesCount,
  } = useSelector(({
    main: {
      puzzle: {
        canUndo,
        isSolved,
        level,
        movesCount,
      } = {}
    },
  }) => ({
    canUndo,
    isSolved,
    level,
    movesCount,
  }), shallowEqual);
  const dispatch = useDispatch();
  const onShowAboutClick = useCallback(() => {
    dispatch(showAbout());
  }, [dispatch]);
  const onShowHelpClick = useCallback(() => {
    dispatch(showHelp());
  }, [dispatch]);
  const onRestartClick = useCallback(() => {
    dispatch(restart());
  }, [dispatch]);
  const onUndoClick = useCallback(() => {
    dispatch(undo());
  }, [dispatch]);

  return (
    <div className="control-panel">
      <div className="control-panel__level">Level: {level}</div>
      <div className="control-panel__moves-count">
        { movesCount > 0 && `Steps: ${movesCount}` }
      </div>
      { !isSolved && canUndo && <div className="control-panel__undo" onClick={onUndoClick}>←</div> }
      <div className="control-panel__restart" onClick={onRestartClick}>⟳</div>
      <div className="control-panel__help" onClick={onShowHelpClick}>?</div>
      <div className="control-panel__about" onClick={onShowAboutClick}>i</div>
    </div>
  );
};

export default ControlPanel;
