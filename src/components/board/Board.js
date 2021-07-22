import React, { Fragment, useCallback } from 'react';
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { move } from "../../services/reducers";

import './Board.scss';

const Board = () => {
  const {
    isSolved,
    level,
    levelList,
    tileList,
  } = useSelector(({
    main: {
      levelList,
      puzzle: {
        isSolved,
        level,
        tileList,
      } = {}
    }
  }) => ({
    isSolved,
    level,
    levelList,
    tileList,
  }), shallowEqual);
  const dispatch = useDispatch();
  const onMoveClickHandler = useCallback((event) => {
    const ix = Number(event.target.dataset.ix);

    dispatch(move(ix));
  }, [dispatch]);

  return (
    <div className={'board' + (isSolved ? ' board_done' : '')} data-level={level}>
      {
        tileList
          ?
          tileList.map((order, ix) => {
            const {
              title: movieTitle,
              title_ru: movieRussianTitle,
              director: movieDirector,
            } = levelList[level - 1];

            return (
              order < tileList.length
                ?
                <div key={order} data-ix={ix} className={'board__tile board__tile_' + order} onClick={onMoveClickHandler}/>
                :
                isSolved
                  ?
                  <Fragment key={order}>
                    <div data-ix={ix} className={'board__tile board__tile_' + order} onClick={onMoveClickHandler}/>
                    <div className="board__info">
                      <div className="title">{movieTitle}</div>
                      <div className="director">{movieDirector}</div>
                      { movieRussianTitle && <div className="title_ru">movieRussianTitle</div> }
                    </div>
                  </Fragment>
                  :
                  <div key={order} className="board__empty"/>
            );
          })
          :
          'loading...'
      }
    </div>
  );
}

export default Board;
