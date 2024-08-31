import React from 'react';
import {Provider} from 'react-redux';
//import * as serviceWorker from './serviceWorker';
import store from './services/store';
import Game from './components/game/Game';
import './index.scss';
import {createRoot} from "react-dom/client";

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<Provider store={store}>
    <Game/>
</Provider>);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.register();
