import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import './Board.scss';
import { move } from "../actions/gameActions";

class Board extends Component {
    render() {
        return (
            <div className={'Board' + (this.props.isSolved ? ' done' : '')} data-level={this.props.level}>
                {
                    this.props.tileList
                        ?
                        this.props.tileList.map((order, ix) => {
                            return (
                                order < this.props.tileList.length
                                ?
                                    <div key={order} data-ix={ix} className={'tile tile' + order} onClick={this.move}/>
                                :
                                    this.props.isSolved
                                        ?
                                        <Fragment>
                                            <div key={order} data-ix={ix} className={'tile tile' + order} onClick={this.move}/>
                                            <div key={order + 1} className="info">
                                                <div className="title">{this.props.levelList[this.props.level - 1].title}</div>
                                                <div className="director">{this.props.levelList[this.props.level - 1].director}</div>
                                                { <div className="title_ru">{this.props.levelList[this.props.level - 1].title_ru}</div> || '' }
                                            </div>
                                        </Fragment>
                                        :
                                        <div key={order} className='empty'/>
                            );
                        })
                        :
                        'loading...'
                }
            </div>
        );
    }

    move = (ev) => {
        const ix = Number(ev.target.dataset.ix);

        this.props.move(ix);
    };
}

const mapStateToProps = (state) => {
    return {
        level: state.game.puzzle.level,
        levelList: state.game.levelList,
        tileList: state.game.puzzle.tileList,
        isSolved: state.game.puzzle.isSolved,
    };
};



const mapDispatchToProps = (dispatch) => {
    return {
        move(ix) {
            dispatch(move(ix));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Board);