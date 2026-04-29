// Mirrors static/src/classes/Patn.js + canonical board generation,
// just enough for the server to validate a proof. Keep in sync if Patn's
// shuffle algorithm or solvability check changes on the client.

const SIZE = 4;

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

const isSorted = (tiles) => tiles.every((v, i) => v === i + 1);

function isSolvable(tiles) {
  let e = -1;
  let k = 0;
  for (let i = 0; i < 16; i++) {
    if (tiles[i] === 16) {
      e = Math.floor((i + 1) / SIZE);
      if ((i + 1) % SIZE > 0) e += 1;
      break;
    }
  }
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < i; j++) {
      if (tiles[j] > tiles[i] && tiles[j] < 16) k += 1;
    }
  }
  return (k + e) % 2 === 0;
}

function shuffleOnce(rng) {
  return Array.from({length: 16}, (_, i) => i + 1).sort(() => rng() - 0.5);
}

export function canonicalBoard(level, userSeed) {
  const rng = mulberry32((userSeed >>> 0) ^ (level * 0x9E3779B9));
  let tiles;
  do {
    tiles = shuffleOnce(rng);
  } while (!isSolvable(tiles) || isSorted(tiles));
  return tiles;
}

const areNeighbors = (a, b) => {
  const ar = a >> 2, ac = a & 3, br = b >> 2, bc = b & 3;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
};

export function replay(initialTiles, trajectory) {
  if (!Array.isArray(trajectory) || trajectory.length < 2) return false;
  const tiles = [...initialTiles];
  if (trajectory[0] !== tiles.indexOf(16)) return false;
  for (let i = 1; i < trajectory.length; i++) {
    const prev = trajectory[i - 1];
    const next = trajectory[i];
    if (!Number.isInteger(next) || next < 0 || next > 15 || !areNeighbors(prev, next)) return false;
    tiles[prev] = tiles[next];
    tiles[next] = 16;
  }
  return isSorted(tiles);
}
