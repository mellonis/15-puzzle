// Client of the genuine signing server.
// Bundle holds only the Ed25519 public key (used to verify fetched chain
// blobs and signed proofs). All signing happens server-side.

import {Patn} from '../classes/Patn';
import {ENTRY_URL} from './chain-entry';

const SIG_LEN_HEX = 128; // Ed25519 = 64 bytes

// DEV-ONLY public key. Production builds set VITE_PUBLIC_KEY at build time
// to the base64url-encoded raw 32-byte public key.
const DEV_PUBLIC_KEY = 'GQV1rqfPu2MN5WGrIDxoSphhHCyYV_SH0OwD8fVn0qc';
const PUBLIC_KEY_BASE64URL = import.meta.env.VITE_PUBLIC_KEY ?? DEV_PUBLIC_KEY;

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

// --- byte/hex helpers ---

function base64urlToBytes(s) {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const b = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(b)) return null;
    out[i] = b;
  }
  return out;
}

// --- Ed25519 verification ---

let publicKeyPromise;
function getPublicKey() {
  if (!publicKeyPromise) {
    publicKeyPromise = crypto.subtle.importKey(
      'raw',
      base64urlToBytes(PUBLIC_KEY_BASE64URL),
      {name: 'Ed25519'},
      false,
      ['verify'],
    );
  }
  return publicKeyPromise;
}

async function verifySignature(message, sigHex) {
  if (typeof sigHex !== 'string' || sigHex.length !== SIG_LEN_HEX) return false;
  const sig = hexToBytes(sigHex);
  if (!sig) return false;
  try {
    return await crypto.subtle.verify(
      {name: 'Ed25519'},
      await getPublicKey(),
      sig,
      new TextEncoder().encode(message),
    );
  } catch {
    return false;
  }
}

// --- deterministic puzzle generation (no signing) ---

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngForLevel(level, userSeed) {
  return mulberry32((userSeed >>> 0) ^ (level * 0x9E3779B9));
}

export function canonicalBoard(level, userSeed) {
  return new Patn(() => rngForLevel(level, userSeed)).tileList;
}

// --- network calls ---

// /seed → 136-hex plain text: [userSeed:8][sig:128]
export async function requestSeed() {
  try {
    const r = await fetch(`${API_BASE}/seed`, {method: 'POST'});
    if (!r.ok) return null;
    const text = (await r.text()).trim();
    if (text.length !== 8 + SIG_LEN_HEX) return null;
    const userSeed = parseInt(text.slice(0, 8), 16);
    if (!Number.isFinite(userSeed)) return null;
    return {userSeed, sig: text.slice(8)};
  } catch {
    return null;
  }
}

const movesToHex = (moves) => moves.map((m) => m.toString(16)).join('');

// /sign → 128-hex plain-text Ed25519 signature
export async function signProof(level, moves, userSeed, sigUserSeed) {
  try {
    const r = await fetch(`${API_BASE}/sign`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({level, moves, userSeed, sigUserSeed}),
    });
    if (!r.ok) return null;
    const sig = (await r.text()).trim();
    return sig.length === SIG_LEN_HEX ? sig : null;
  } catch {
    return null;
  }
}

// --- client-side verification ---

export async function verifyUserSeed(userSeed, sig) {
  if (!Number.isInteger(userSeed)) return false;
  return verifySignature('seed:' + userSeed, sig);
}

export async function verifyProof(level, moves, userSeed, sig) {
  return verifySignature('proof:' + level + ':' + userSeed + ':' + movesToHex(moves), sig);
}

// --- chain walking ---

const blobCache = new Map();
const ZERO_CHAIN = '00000000';

const STATIC_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const hashToUrl = (h) => `${STATIC_BASE}/levels/${h}.json`;
const urlToHash = (url) => {
  const m = /\/levels\/([^/.]+)\.json$/.exec(url);
  return m ? m[1] : null;
};

async function fetchPreSolveBlob(url) {
  if (blobCache.has(url)) return blobCache.get(url);
  let blob;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    blob = await res.json();
  } catch {
    return null;
  }
  if (!blob || !Number.isInteger(blob.level) || typeof blob.imageUrl !== 'string') return null;
  if (typeof blob.rewardUrl !== 'string') return null;
  if (blob.nextUrl != null && typeof blob.nextUrl !== 'string') return null;
  const msg = `presolve:${blob.level}:${blob.imageUrl}:${blob.nextUrl ?? ''}:${blob.rewardUrl}`;
  if (!(await verifySignature(msg, blob.sig))) return null;
  blobCache.set(url, blob);
  return blob;
}

async function fetchRewardBlob(url) {
  if (blobCache.has(url)) return blobCache.get(url);
  let blob;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    blob = await res.json();
  } catch {
    return null;
  }
  if (!blob || !Number.isInteger(blob.level) || typeof blob.title !== 'string') return null;
  const msg = `reward:${blob.level}:${blob.title}:${blob.director ?? ''}:${blob.title_ru ?? ''}`;
  if (!(await verifySignature(msg, blob.sig))) return null;
  blobCache.set(url, blob);
  return blob;
}

async function walkFrom(startUrl, level) {
  let url = startUrl;
  while (url) {
    const blob = await fetchPreSolveBlob(url);
    if (!blob) return null;
    if (blob.level === level) return {blob, url};
    if (blob.level > level) return null;
    url = blob.nextUrl;
  }
  return null;
}

async function blobForLevel(level, hintHash) {
  if (hintHash && hintHash !== ZERO_CHAIN) {
    const hintUrl = hashToUrl(hintHash);
    const blob = await fetchPreSolveBlob(hintUrl);
    if (blob) {
      if (blob.level === level) return {blob, url: hintUrl};
      if (blob.level < level && blob.nextUrl) {
        const found = await walkFrom(blob.nextUrl, level);
        if (found) return found;
      }
    }
  }
  return walkFrom(ENTRY_URL, level);
}

// --- public API ---

export async function getLevelMetadata(level, userSeed, lastSolvedLevel, hintHash) {
  if (level < 1 || level > lastSolvedLevel + 1) return null;
  const found = await blobForLevel(level, hintHash);
  if (!found) return null;
  const {blob, url} = found;
  return {
    level: blob.level,
    imageUrl: blob.imageUrl,
    nextUrl: blob.nextUrl,
    rewardUrl: blob.rewardUrl,
    chainHash: urlToHash(url),
    sig: blob.sig,
  };
}

export async function verifyLevelMetadata(meta) {
  if (!meta) return false;
  const msg = `presolve:${meta.level}:${meta.imageUrl}:${meta.nextUrl ?? ''}:${meta.rewardUrl}`;
  return verifySignature(msg, meta.sig);
}

export async function getLevelReward(level, _userSeed, hintHash) {
  const found = await blobForLevel(level, hintHash);
  if (!found) return null;
  const reward = await fetchRewardBlob(found.blob.rewardUrl);
  if (!reward || reward.level !== level) return null;
  return {
    level: reward.level,
    title: reward.title,
    director: reward.director,
    title_ru: reward.title_ru,
    sig: reward.sig,
  };
}

export async function verifyLevelReward(reward) {
  if (!reward) return false;
  const msg = `reward:${reward.level}:${reward.title}:${reward.director ?? ''}:${reward.title_ru ?? ''}`;
  return verifySignature(msg, reward.sig);
}
