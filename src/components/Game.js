import React, { Component } from 'react';
import { connect } from 'react-redux';
import Board from './Board';
import ControlPanel from './ControlPanel';
import Help from './Help';
import About from './About';
import './Game.scss';

class Game extends Component {
    render() {
        return (
            <div className="Game">
                <Board/>
                <ControlPanel/>
                {
                    this.props.isHelpShown
                        ?
                        <Help/>
                        :
                        ''
                }
                {
                    this.props.isAboutShown
                        ?
                        <About/>
                        :
                        ''
                }
            </div>
        );
    };
}

const mapStateToProps = (state) => {
    return {
        isHelpShown: state.game.isHelpShown,
        isAboutShown: state.game.isAboutShown,
    };
};

export default connect(mapStateToProps)(Game);