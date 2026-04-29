import './index.css';
import './styles/game.css';
import './styles/board.css';
import './styles/controlpanel.css';
import './styles/about.css';
import './styles/help.css';

import {Patn} from './classes/Patn';
import {chainHashOf, lastSolvedLevelOf, loadProgress, saveProof, setChainHash, userSeedOf} from './services/proof';
import {getLevelMetadata, getLevelReward, rngForLevel, verifyLevelMetadata, verifyLevelReward} from './services/server';
import {ICON_ARROW_BACK, ICON_HAND, ICON_HELP, ICON_INFO, ICON_REFRESH, ICON_TARGET} from './icons';

const root = document.getElementById('root');

let puzzle = null;
let progress = null;
let levelMetadata = null;
let levelReward = null;
let currentLevel = 0;
let isAboutShown = false;
let isHelpShown = false;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, val);
        else node.style[prop] = val;
      }
    }
    else if (k === 'on') for (const [evt, fn] of Object.entries(v)) node.addEventListener(evt, fn);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function iconButton(svg, title, className, onClick) {
  return el('button', {
    class: 'control-panel__button' + (className ? ' ' + className : ''),
    title,
    html: svg,
    on: {click: onClick},
  });
}

function renderBoard() {
  const isSolved = puzzle.isSolved;
  const tileList = puzzle.tileList;
  const board = el('div', {
    class: 'board' + (isSolved ? ' board_done' : ''),
    'data-level': currentLevel,
    style: levelMetadata ? {'--puzzle-image': `url(${levelMetadata.imageUrl})`} : null,
  });
  for (let ix = 0; ix < tileList.length; ix++) {
    const order = tileList[ix];
    if (!isSolved && order >= tileList.length) {
      board.appendChild(el('div', {class: 'board__empty'}));
    } else {
      board.appendChild(el('div', {
        class: `board__tile board__tile_${order}`,
        'data-ix': ix,
        on: !isSolved ? {click: onTileClick} : undefined,
      }));
    }
  }
  if (isSolved && levelReward) {
    board.appendChild(el('div', {class: 'board__info'},
      el('div', {class: 'title'}, levelReward.title),
      el('div', {class: 'director'}, levelReward.director),
      levelReward.title_ru ? el('div', {class: 'title_ru'}, levelReward.title_ru) : null,
    ));
  }
  return board;
}

function renderControlPanel() {
  const panel = el('div', {class: 'control-panel'});
  panel.appendChild(el('div', {class: 'control-panel__level'}, puzzle ? `Level: ${currentLevel}` : ''));
  panel.appendChild(el('div', {class: 'control-panel__moves-count'},
    puzzle && puzzle.movesCount > 0 ? `Steps: ${puzzle.movesCount}` : ''));
  if (puzzle && !puzzle.isSolved && puzzle.canUndo) {
    panel.appendChild(iconButton(ICON_ARROW_BACK, 'Undo', 'control-panel__button_undo', onUndo));
  }
  if (puzzle && puzzle.movesCount > 0) {
    panel.appendChild(iconButton(ICON_REFRESH, 'New game', null, onRestart));
  }
  panel.appendChild(iconButton(ICON_HELP, 'Help', null, () => { isHelpShown = true; render(); }));
  panel.appendChild(iconButton(ICON_INFO, 'About', null, () => { isAboutShown = true; render(); }));
  return panel;
}

function renderHelp() {
  const rule = (icon, text) => el('li', {class: 'rules__rule'},
    el('span', {class: 'rules__icon', html: icon}),
    text,
  );
  return el('div', {
    class: 'help',
    on: {click: () => { isHelpShown = false; render(); }},
  }, el('div', {class: 'container'},
    el('ul', {class: 'rules'},
      rule(ICON_TARGET, 'The object of the puzzle is to place the tiles in order by making sliding moves that use the empty space'),
      rule(ICON_HAND, 'To move a tile to the empty space, click on that tile. You can also move entire columns or rows'),
      rule(ICON_ARROW_BACK, 'You can also undo your moves'),
    ),
  ));
}

function renderAbout() {
  return el('div', {
    class: 'about',
    on: {click: () => {
      if (puzzle) {
        isAboutShown = false;
        render();
      } else {
        startNewLevel();
      }
    }},
  }, el('div', {class: 'container'}, 'Yet another 15 puzzle'));
}

function render() {
  const game = el('div', {class: 'game'});
  if (puzzle) game.appendChild(renderBoard());
  game.appendChild(renderControlPanel());
  if (isHelpShown) game.appendChild(renderHelp());
  if (!puzzle || isAboutShown) game.appendChild(renderAbout());
  root.replaceChildren(game);
}

function buildPuzzle(level) {
  const userSeed = userSeedOf(progress);
  puzzle = new Patn(() => rngForLevel(level, userSeed));
  currentLevel = level;
  levelReward = null;
}

async function startNewLevel() {
  if (puzzle) return;
  progress = await loadProgress();
  if (!progress) return; // genuine server unreachable
  buildPuzzle(lastSolvedLevelOf(progress) + 1);
  await refreshMetadata();
  render();
}

async function refreshMetadata() {
  if (!puzzle) return;
  const userSeed = userSeedOf(progress);
  const meta = await getLevelMetadata(currentLevel, userSeed, lastSolvedLevelOf(progress), chainHashOf(progress));
  if (meta && await verifyLevelMetadata(meta)) {
    levelMetadata = meta;
    setChainHash(progress, meta.chainHash);
  } else {
    levelMetadata = null;
  }
}

async function captureIfSolved() {
  if (!puzzle?.isSolved || !progress) return;
  const solvedLevel = currentLevel;
  progress = await saveProof(progress, solvedLevel, puzzle.moveTrajectory);
  const userSeed = userSeedOf(progress);
  const reward = await getLevelReward(solvedLevel, userSeed, chainHashOf(progress));
  if (currentLevel !== solvedLevel) return; // user advanced before reward arrived
  if (reward && await verifyLevelReward(reward)) {
    levelReward = reward;
    render();
  }
}

async function onTileClick(event) {
  if (!puzzle || puzzle.isSolved) return;
  const ix = Number(event.currentTarget.dataset.ix);
  puzzle.move(ix, true);
  render();
  await captureIfSolved();
}

async function onRestart() {
  if (!puzzle) return;
  if (puzzle.isSolved) {
    buildPuzzle(currentLevel + 1);
  } else {
    puzzle.generate();
  }
  await refreshMetadata();
  render();
}

function onUndo() {
  if (!puzzle || !puzzle.canUndo) return;
  puzzle.undo();
  render();
}

window.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape') {
    if (isAboutShown) { isAboutShown = false; render(); return; }
    if (isHelpShown) { isHelpShown = false; render(); return; }
  }

  if (!puzzle) return;

  if (!puzzle.isSolved) {
    const isGroupMove = event.altKey;
    switch (event.key) {
      case 'ArrowDown': puzzle.moveDown(isGroupMove); render(); await captureIfSolved(); return;
      case 'ArrowUp': puzzle.moveUp(isGroupMove); render(); await captureIfSolved(); return;
      case 'ArrowLeft': puzzle.moveLeft(isGroupMove); render(); await captureIfSolved(); return;
      case 'ArrowRight': puzzle.moveRight(isGroupMove); render(); await captureIfSolved(); return;
    }
  }

  switch (event.code) {
    case 'KeyH': isHelpShown = true; render(); return;
    case 'KeyI': isAboutShown = true; render(); return;
    case 'KeyR': onRestart(); return;
    case 'KeyU': onUndo(); return;
  }
}, {passive: true});

render();
