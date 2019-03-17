import React, { Component } from 'react';
import {connect} from "react-redux";
import './Help.scss';
import { hideHelp } from "../actions/gameActions";

class Help extends Component {
    render() {
        return (
            <div className="Help" onClick={this.hide}>
                This is a help window!
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