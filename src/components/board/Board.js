import React, {Fragment, useCallback, useEffect} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import cs from 'classnames';
import {move, moveDown, moveLeft, moveRight, moveUp} from '../../services/reducers';
import './Board.scss';

const Board = () => {
  const {
    isSolved, level, levelList, tileList,
  } = useSelector(({
                     main: {
                       levelList, puzzle: {
                         isSolved, level, tileList,
                       } = {}
                     }
                   }) => ({
    isSolved, level, levelList, tileList,
  }), shallowEqual);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isSolved) {
      return;
    }

    const onKeyDownHandler = ({key}) => {
      switch (key) {
        case 'ArrowDown':
          return dispatch(moveDown());
        case 'ArrowLeft':
          return dispatch(moveLeft());
        case 'ArrowRight':
          return dispatch(moveRight());
        case 'ArrowUp':
          return dispatch(moveUp());
        // no default
      }
    };

    window.addEventListener('keydown', onKeyDownHandler, {passive: true});

    return () => {
      window.removeEventListener('keydown', onKeyDownHandler);
    };
  }, [dispatch, isSolved]);

  const onMoveClickHandler = useCallback((event) => {
    const ix = Number(event.target.dataset.ix);

    if (!isSolved) {
      dispatch(move(ix));
    }
  }, [dispatch, isSolved]);
  const {
    title: movieTitle, title_ru: movieRussianTitle, director: movieDirector,
  } = levelList[level - 1];

  return (<div className={cs('board', {
      'board_done': isSolved
    })} data-level={level}>
      {tileList ? <>
        {tileList.map((order, ix) => isSolved || order < tileList.length ?
          <div key={order} data-ix={ix} className={'board__tile board__tile_' + order}
               onClick={onMoveClickHandler}/> : <div key={order} className="board__empty"/>)}
        {isSolved && (<div className="board__info">
          <div className="title">{movieTitle}</div>
          <div className="director">{movieDirector}</div>
          {movieRussianTitle && <div className="title_ru">{movieRussianTitle}</div>}
        </div>)}
      </> : 'loading...'}
    </div>);
};

export default Board;
