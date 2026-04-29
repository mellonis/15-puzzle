import {randomBytes} from 'node:crypto';
import {sign} from './sign.js';
import {canonicalBoard, replay} from './canonical.js';

const movesToHex = (moves) => moves.map((m) => m.toString(16)).join('');

// We verify sigUserSeed by re-signing and comparing — Ed25519 is
// deterministic, so a re-sign with the same key produces the same bytes.
const reSign = (message, expected) => sign(message) === expected;

// /seed → plain-text [userSeed:8 hex][sig:128 hex] = 136 hex chars
export function seedHandler() {
  const userSeed = randomBytes(4).readUInt32BE(0);
  return userSeed.toString(16).padStart(8, '0') + sign('seed:' + userSeed);
}

// /sign → plain-text 128-hex Ed25519 signature, or null on rejection
export function signHandler(body) {
  const reject = (reason) => { console.warn('[sign] reject:', reason); return null; };
  if (!body || typeof body !== 'object') return reject('no body');
  const {level, moves, userSeed, sigUserSeed} = body;
  if (!Number.isInteger(level) || level < 1) return reject('bad level: ' + level);
  if (!Array.isArray(moves) || moves.length < 2) return reject('bad moves: len=' + moves?.length);
  if (!Number.isInteger(userSeed)) return reject('bad userSeed: ' + userSeed);
  if (typeof sigUserSeed !== 'string') return reject('bad sigUserSeed type');
  if (!reSign('seed:' + userSeed, sigUserSeed)) return reject('sigUserSeed mismatch for ' + userSeed);
  const board = canonicalBoard(level, userSeed);
  if (!replay(board, moves)) return reject(`replay failed: level=${level} userSeed=${userSeed} movesLen=${moves.length}`);
  return sign('proof:' + level + ':' + userSeed + ':' + movesToHex(moves));
}
