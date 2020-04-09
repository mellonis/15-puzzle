import React, { Component } from 'react';
import {connect} from "react-redux";
import './Help.scss';
import { hideHelp } from "../actions/gameActions";

class Help extends Component {
    render() {
        return (
            <div className="Help" onClick={this.hide}>
                <div className="container">
                    <ul>
                        <li>
                            The object of the puzzle is to place the tiles in order by making sliding moves that use the empty space.
                        </li>
                        <li>
                            To move a tile to the empty space, click on that tile. You can also move entire columns or rows.
                        </li>
                        <li>
                            You can also undo your moves.
                        </li>
                        <li>
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