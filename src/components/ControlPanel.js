import React, { Component } from 'react';
import { connect } from 'react-redux';
import './ControlPanel.scss';
import { restart, showAbout, showHelp, undo } from '../actions/gameActions'

class ControlPanel extends Component {
    render() {
        return (
            <div className="ControlPanel">
                <div>Level: {this.props.level}</div>
                <div>
                    {
                        this.props.movesCount
                            ?
                            <>Steps: {this.props.movesCount}</>
                            :
                            ''
                    }
                </div>
                {
                    !this.props.isSolved && this.props.canUndo
                        ?
                        <div onClick={this.undo}>←</div>
                        :
                        ''
                }
                <div onClick={this.restart}>⟳</div>
                <div onClick={this.showHelp}>?</div>
                <div onClick={this.showAbout}>i</div>
            </div>
        );
    }

    restart = () => {
        this.props.restart();
    };

    showAbout = () => {
        this.props.showAbout();
    };

    showHelp = () => {
        this.props.showHelp();
    };

    undo = () => {
        this.props.undo();
    };
}

const mapStateToProps = (state) => {
    return {
        level: state.game.puzzle.level,
        canUndo: state.game.puzzle.canUndo,
        movesCount: state.game.puzzle.movesCount,
        isSolved: state.game.puzzle.isSolved,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        restart() {
            dispatch(restart());
        },
        showAbout() {
            dispatch(showAbout());
        },
        showHelp() {
            dispatch(showHelp());
        },
        undo() {
            dispatch(undo());
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);