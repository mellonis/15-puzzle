import React, { Component } from 'react';
import { connect } from 'react-redux';
import './ControlPanel.scss';
import { restart, showAbout, showHelp, undo } from '../actions/gameActions'

class ControlPanel extends Component {
    render() {
        return (
            <div className="ControlPanel">
                <div>Level: {this.props.level}</div>
                <div>Steps: {this.props.moveList.length}</div>
                {
                    !this.props.isSolved && this.props.moveList.length
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
        moveList: state.game.puzzle.moveList,
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