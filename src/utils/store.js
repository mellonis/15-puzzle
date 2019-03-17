import { createStore, combineReducers } from 'redux';
import game from '../reducers/GameReducer';

const store = createStore(
    combineReducers({
        game,
    }),
    {}
);

store.dispatch({
    type: 'newLevel',
});

export default store;

