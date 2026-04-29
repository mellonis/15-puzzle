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
  if (!body || typeof body !== 'object') return null;
  const {level, moves, userSeed, sigUserSeed} = body;
  if (!Number.isInteger(level) || level < 1) return null;
  if (!Array.isArray(moves) || moves.length < 2) return null;
  if (!Number.isInteger(userSeed)) return null;
  if (typeof sigUserSeed !== 'string') return null;
  if (!reSign('seed:' + userSeed, sigUserSeed)) return null;
  const board = canonicalBoard(level, userSeed);
  if (!replay(board, moves)) return null;
  return sign('proof:' + level + ':' + userSeed + ':' + movesToHex(moves));
}
