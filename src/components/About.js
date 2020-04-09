import React, { Component } from 'react';
import { connect } from 'react-redux';
import './About.scss';
import { hideAbout } from "../actions/gameActions";

class About extends Component {
    render() {
        return (
            <div className="About" onClick={this.hide}>
                <div className="container">
                    Yet another 15 puzzle
                </div>
            </div>
        );
    }

    hide = () => {
        this.props.hideAbout();
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        hideAbout() {
            dispatch(hideAbout());
        },
    };
};

export default connect(null, mapDispatchToProps)(About);