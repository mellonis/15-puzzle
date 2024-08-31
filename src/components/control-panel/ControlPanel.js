import React, { useCallback } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { restart, showAbout, showHelp, undo } from '../../services/reducers';
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
      { !isSolved && canUndo && <button title="Undo" className="control-panel__button control-panel__button_undo" onClick={onUndoClick}>←</button> }
      <button title="New game" className="control-panel__button" onClick={onRestartClick}>⟳</button>
      <button title="Help" className="control-panel__button" onClick={onShowHelpClick}>?</button>
      <button title="About" className="control-panel__button" onClick={onShowAboutClick}>i</button>
    </div>
  );
};

export default ControlPanel;
