import {test} from 'node:test';
import assert from 'node:assert/strict';

const {seedHandler, signHandler} = await import('./handlers.js');
const {sign} = await import('./sign.js');
const {canonicalBoard} = await import('./canonical.js');

test('seedHandler returns 136-hex-char string [userSeed:8][sig:128]', () => {
  const r = seedHandler();
  assert.equal(typeof r, 'string');
  assert.equal(r.length, 136);
  const userSeedHex = r.slice(0, 8);
  const sigHex = r.slice(8);
  const userSeed = parseInt(userSeedHex, 16);
  assert.ok(Number.isFinite(userSeed));
  assert.equal(sign('seed:' + userSeed), sigHex);
});

test('signHandler rejects when sigUserSeed is forged', () => {
  const r = signHandler({level: 1, moves: [0, 1], userSeed: 42, sigUserSeed: 'forged'});
  assert.equal(r, null);
});

test('signHandler rejects when moves do not solve', () => {
  const r = signHandler({level: 1, moves: [0, 0], userSeed: 42, sigUserSeed: sign('seed:42')});
  assert.equal(r, null);
});

test('signHandler accepts a valid trajectory and returns 128-hex sig', () => {
  let target;
  for (let userSeed = 0; userSeed < 0xFFFF; userSeed++) {
    const board = canonicalBoard(1, userSeed);
    const emptyIdx = board.indexOf(16);
    const neighbors = [];
    if (emptyIdx >= 4) neighbors.push(emptyIdx - 4);
    if (emptyIdx < 12) neighbors.push(emptyIdx + 4);
    if (emptyIdx % 4 > 0) neighbors.push(emptyIdx - 1);
    if (emptyIdx % 4 < 3) neighbors.push(emptyIdx + 1);
    for (const n of neighbors) {
      const tiles = [...board];
      [tiles[emptyIdx], tiles[n]] = [tiles[n], tiles[emptyIdx]];
      if (tiles.every((v, i) => v === i + 1)) {
        target = {userSeed, neighborIdx: n, emptyIdx};
        break;
      }
    }
    if (target) break;
  }
  if (!target) return;

  const sigUserSeed = sign('seed:' + target.userSeed);
  const moves = [target.emptyIdx, target.neighborIdx];
  const r = signHandler({level: 1, moves, userSeed: target.userSeed, sigUserSeed});
  assert.equal(typeof r, 'string');
  assert.equal(r.length, 128);
});

test('signHandler rejects bad shapes', () => {
  assert.equal(signHandler(null), null);
  assert.equal(signHandler({}), null);
  assert.equal(signHandler({level: -1, moves: [0, 1], userSeed: 1, sigUserSeed: 'x'}), null);
  assert.equal(signHandler({level: 1, moves: [0], userSeed: 1, sigUserSeed: 'x'}), null);
});
