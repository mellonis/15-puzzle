import {requestSeed, signProof, verifyProof, verifyUserSeed} from './server';

const STORAGE_KEY = 'progress';
const SEED_HEX = 8;
const SIG_HEX = 128; // Ed25519 = 64 bytes
const CHAIN_HEX = 8;
const LEVEL_HEX = 3;
const MOVES_LEN_HEX = 3;
const MAX_MOVES = 16 ** MOVES_LEN_HEX;
const ZERO_CHAIN = '0'.repeat(CHAIN_HEX);

const movesToHex = (moves) => moves.map((m) => m.toString(16)).join('');
const hexToMoves = (hex) => Array.from(hex, (c) => parseInt(c, 16));
const isValidChainHash = (h) => typeof h === 'string' && /^[0-9a-f]{8}$/.test(h);

function decodeStorage(hex) {
  if (typeof hex !== 'string' || hex.length < SEED_HEX + SIG_HEX) return null;
  const userSeed = parseInt(hex.slice(0, SEED_HEX), 16);
  if (!Number.isFinite(userSeed)) return null;
  const sigUserSeed = hex.slice(SEED_HEX, SEED_HEX + SIG_HEX);

  const proofs = [];
  let i = SEED_HEX + SIG_HEX;
  while (i < hex.length) {
    const remaining = hex.length - i;
    if (remaining < LEVEL_HEX + MOVES_LEN_HEX) break;
    const level = parseInt(hex.slice(i, i + LEVEL_HEX), 16);
    const movesLen = parseInt(hex.slice(i + LEVEL_HEX, i + LEVEL_HEX + MOVES_LEN_HEX), 16);
    const proofLen = LEVEL_HEX + MOVES_LEN_HEX + movesLen + SIG_HEX;
    if (i + proofLen > hex.length) break;
    const movesHex = hex.slice(i + LEVEL_HEX + MOVES_LEN_HEX, i + LEVEL_HEX + MOVES_LEN_HEX + movesLen);
    const sig = hex.slice(i + LEVEL_HEX + MOVES_LEN_HEX + movesLen, i + proofLen);
    proofs.push(level, movesHex, sig);
    i += proofLen;
  }

  // A trailing 8-hex-char block is the optional chainHash.
  const tail = hex.slice(i);
  const chainHash = isValidChainHash(tail) ? tail : ZERO_CHAIN;
  return [userSeed, sigUserSeed, chainHash, ...proofs];
}

function encodeStorage(progress) {
  let out = progress[0].toString(16).padStart(SEED_HEX, '0') + progress[1];
  for (let i = 3; i + 3 <= progress.length; i += 3) {
    const level = progress[i];
    const movesHex = progress[i + 1];
    const sig = progress[i + 2];
    out += level.toString(16).padStart(LEVEL_HEX, '0');
    out += movesHex.length.toString(16).padStart(MOVES_LEN_HEX, '0');
    out += movesHex;
    out += sig;
  }
  if (progress[2] && progress[2] !== ZERO_CHAIN) out += progress[2];
  return out;
}

export const userSeedOf = (p) => p?.[0];
export const sigUserSeedOf = (p) => p?.[1];
export const chainHashOf = (p) => p?.[2];

export function lastSolvedLevelOf(p) {
  if (!Array.isArray(p) || p.length < 3) return 0;
  let max = 0;
  for (let i = 3; i + 3 <= p.length; i += 3) {
    if (p[i] > max) max = p[i];
  }
  return max;
}

export function setChainHash(progress, hash) {
  if (!isValidChainHash(hash)) return;
  if (progress[2] === hash) return;
  progress[2] = hash;
  localStorage.setItem(STORAGE_KEY, encodeStorage(progress));
}

export async function loadProgress() {
  localStorage.removeItem('lastSolvedLevel');
  const decoded = decodeStorage(localStorage.getItem(STORAGE_KEY));

  if (!decoded || !(await verifyUserSeed(decoded[0], decoded[1]))) {
    const issued = await requestSeed();
    if (!issued) return null;
    const fresh = [issued.userSeed, issued.sig, ZERO_CHAIN];
    localStorage.setItem(STORAGE_KEY, encodeStorage(fresh));
    return fresh;
  }

  const userSeed = decoded[0];
  const chainHash = isValidChainHash(decoded[2]) ? decoded[2] : ZERO_CHAIN;
  const seen = new Set();
  const result = [decoded[0], decoded[1], chainHash];
  for (let i = 3; i + 3 <= decoded.length; i += 3) {
    const level = decoded[i];
    const movesHex = decoded[i + 1];
    const sig = decoded[i + 2];
    if (level < 1 || seen.has(level)) continue;
    if (!(await verifyProof(level, hexToMoves(movesHex), userSeed, sig))) continue;
    seen.add(level);
    result.push(level, movesHex, sig);
  }
  return result;
}

export async function saveProof(progress, level, moves) {
  if (moves.length >= MAX_MOVES) return progress;
  const sig = await signProof(level, moves, userSeedOf(progress), sigUserSeedOf(progress));
  if (!sig) return progress;
  const movesHex = movesToHex(moves);
  const next = [progress[0], progress[1], progress[2]];
  for (let i = 3; i + 3 <= progress.length; i += 3) {
    if (progress[i] !== level) {
      next.push(progress[i], progress[i + 1], progress[i + 2]);
    }
  }
  next.push(level, movesHex, sig);
  localStorage.setItem(STORAGE_KEY, encodeStorage(next));
  return next;
}
