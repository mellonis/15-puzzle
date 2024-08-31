import React, {useCallback, useEffect} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {restart, showAbout, showHelp, undo} from '../../services/reducers';
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

  useEffect(() => {
    const onKeyDownHandler = ({altKey: isGroupMove, key, keyCode}) => {
      switch (keyCode) {
        case 72:
          return onShowHelpClick();
        case 73:
          return onShowAboutClick();
        case 82:
          return onRestartClick();
        case 85:
          return onUndoClick();
        // no default
      }
    };

    window.addEventListener('keydown', onKeyDownHandler, {passive: true});

    return () => {
      window.removeEventListener('keydown', onKeyDownHandler);
    };
  }, [dispatch, isSolved, onRestartClick, onShowAboutClick, onShowHelpClick, onUndoClick]);

  return (
    <div className="control-panel">
      <div className="control-panel__level">Level: {level}</div>
      <div className="control-panel__moves-count">
        {movesCount > 0 && `Steps: ${movesCount}`}
      </div>
      {!isSolved && canUndo && <button title="Undo" className="control-panel__button control-panel__button_undo"
                                       onClick={onUndoClick}>←</button>}
      <button title="New game" className="control-panel__button" onClick={onRestartClick}>⟳</button>
      <button title="Help" className="control-panel__button" onClick={onShowHelpClick}>?</button>
      <button title="About" className="control-panel__button" onClick={onShowAboutClick}>i</button>
    </div>
  );
};

export default ControlPanel;
