import React, { useCallback } from 'react';
import { useDispatch } from "react-redux";
import { hideHelp } from "../../services/reducers";

import './Help.scss';

const Help = () => {
  const dispatch = useDispatch();
  const onHideClick = useCallback(() => {
    dispatch(hideHelp());
  }, [dispatch]);

  return (
    <div className="help" onClick={onHideClick}>
      <div className="container">
        <ul className="rules">
          <li className="rules__rule rules__rule_aim">
            The object of the puzzle is to place the tiles in order by making sliding moves that use the empty space.
          </li>
          <li className="rules__rule rules__rule_move">
            To move a tile to the empty space, click on that tile. You can also move entire columns or rows.
          </li>
          <li className="rules__rule rules__rule_undo">
            You can also undo your moves.
          </li>
          <li className="rules__rule rules__rule_shuffle">
            And you can generate a new variant of the puzzle.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Help;
