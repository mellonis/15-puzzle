function hideAbout() {
    return {
        type: 'hideAbout',
    };
}

function hideHelp() {
    return {
        type: 'hideHelp',
    };
}

function move(ix) {
    return {
        type: 'move',
        ix: ix,
    };
}

function restart() {
    return {
        type: 'restart',
    };
}

function showHelp() {
    return {
        type: 'showHelp',
    };
}

function showAbout() {
    return {
        type: 'showAbout',
    };
}

function undo() {
    return {
        type: 'undo',
    };
}

export { hideAbout, hideHelp, move, restart, showAbout, showHelp, undo };