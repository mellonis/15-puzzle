import Path from '../classes/Patn';
import levelList from '../levels.json';

const gameReducer = (state = {}, action) => {
    switch (action.type) {
        case 'hideAbout':
            state = {
                ...state,
                isAboutShown: false,
            };
            break;
        case 'hideHelp':
            state = {
                ...state,
                isHelpShown: false,
            };
            break;
        case 'move':
            state = {
                ...state,
            };
            state.puzzle.move(action.ix);

            if (state.puzzle.isSolved) {
                localStorage.setItem('lastSolvedLevel', state.puzzle.level);
            }
            break;
        case 'newLevel':
            const lastSolvedLevel = Number(localStorage.getItem('lastSolvedLevel'));

            state = {
                isHelpShown: state.isHelpShown || false,
                isAboutShown: state.isAboutShown || false,
                puzzle: new Path(levelList.length, lastSolvedLevel),
                levelList: levelList,
            };
            break;
        case 'restart':
            state = {
                ...state,
            };
            state.puzzle.generate();
            break;
        case 'showAbout':
            state = {
                ...state,
                isAboutShown: true,
            };
            break;
        case 'showHelp':
            state = {
                ...state,
                isHelpShown: true,
            };
            break;
        case 'undo':
            state = {
                ...state,
            };
            state.puzzle.undo();
            break;

        // no default
    }

    return state;
};

export default gameReducer;