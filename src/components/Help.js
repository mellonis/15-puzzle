import React, { Component } from 'react';
import {connect} from "react-redux";
import './Help.scss';
import { hideHelp } from "../actions/gameActions";

class Help extends Component {
    render() {
        return (
            <div className="help" onClick={this.hide}>
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

    hide = () => {
        this.props.hideHelp();
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        hideHelp() {
            dispatch(hideHelp());
        },
    };
};

export default connect(null, mapDispatchToProps)(Help);