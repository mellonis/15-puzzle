# 15-puzzle

Live: <https://15-puzzle.mellonis.ru>
Static-only mirror: <https://mellonis.github.io/15-puzzle/>

## Idea

A 4×4 sliding puzzle played as a chain of levels. Each board is procedurally generated from a seed; each level is themed around a film. Solving a board reveals the film's poster and title — that's the reward.

The films are a hand-picked selection of personal favourites, with each puzzle image prepared by hand. The list isn't fixed — more levels may be added over time.

What makes it a chain rather than just a series: progression is gated by signed proofs of completion. To start level *N*, you must hold a server-issued signature attesting that level *N − 1* was actually solved. You can't skip ahead, and a saved game from one device carries the cryptographic trail that lets another device verify where you actually are.

## Conception

Two components, one cryptographic invariant tying them together.

- **`static/`** — the SPA. Vanilla JS, no framework. Renders the board, handles input, persists progress in `localStorage` as a single hex blob.
- **`genuine/`** — a small Node HTTP service. Issues seeded user IDs and signs proofs of completion using Ed25519.

Boards are deterministic from `(level, userSeed)`. Both client and server use the same generator (`mulberry32` + Fisher–Yates + parity-based solvability check), so the server can regenerate any board the client played and replay the submitted move list. It only signs a proof when the replay actually ends solved — meaning the signature is itself evidence of a real solve, not just a claim.

Pre-solved chain blobs (per-level metadata + reward image, signed at build time with the same key) are served as static JSON/WebP. The client verifies them with a public key embedded into the bundle, no round-trip needed.

Both the blobs and the puzzle images are renamed at build time to unguessable 16-char hex hashes (`/levels/<random>.json`, `/levels/<random>.webp`). The mapping never appears in the bundle: each blob signs only the URL of the *next* level, so you can only discover level *N*'s assets by walking through level *N − 1*. That makes the chain enforced at the URL layer too — listing the directory or guessing names doesn't reveal the films in order.

## Technical details

### `static/`

- Vanilla JS + Vite, ESM only. No framework.
- `src/classes/Patn.js` — puzzle state and move logic. Deterministic from a `getRng` factory passed in by the caller; the class itself doesn't track levels.
- `src/services/server.js` — client of `genuine`. Handles `/seed` and `/sign`, verifies fetched chain blobs and proofs against the bundled Ed25519 public key.
- `src/services/proof.js` — `localStorage` encoding. A single hex string: `[userSeed:8][sigSeed:8] [proof tuples 3+3+movesLen+8] [chainHash:8]?`.
- `public/levels/<random>.{json,webp}` and `src/services/chain-entry.js` are generated at build time by `scripts/build-chain.js` and gitignored.

### `genuine/`

- Bare-Node HTTP server, no runtime deps.
- `POST /seed` → `[userSeed:8][sig:128]` hex. Issues a random `userSeed` and Ed25519-signs `seed:<userSeed>`.
- `POST /sign` ← `{level, moves, userSeed, sigUserSeed}` → 128-hex signature, or 403. Re-signs `sigUserSeed` to verify it (Ed25519 is deterministic), regenerates the canonical board, replays the moves, and signs `proof:<level>:<userSeed>:<movesHex>` only on a solved end-state.
- `src/canonical.js` mirrors `static`'s puzzle generator and must stay in sync.
- Signed attempts are logged to SQLite; auth-gated `/boards` and `/board/:id/attempts` expose them.
- `PRIVATE_KEY` env var holds the PEM Ed25519 key. With it unset, the server warns and falls back to a hardcoded dev key (matching public key bundled into `static` for dev verification).

## Build

### `static`

```sh
cd static
npm install
npm run dev      # vite dev server on :3000 (regenerates chain blobs first)
npm run build    # production build to dist/
npm run preview  # serve the built bundle
npm run lint
```

`npm run chain` regenerates the per-level JSON/WebP blobs and `chain-entry.js`. It runs automatically as `prebuild`/`predev`/`prepare`.

### `genuine`

```sh
cd genuine
npm install
npm start        # default :3001
npm run dev      # node --watch
npm test         # node's built-in test runner
npm run lint
```

## Deployment

`.github/workflows/main.yml` runs three jobs on push to `master`:

1. **gh-pages** — builds `static` with `--base=/15-puzzle/` and publishes `dist/` to the `gh-pages` branch.
2. **vps-static** — rebuilds `static` with the default base and rsyncs `dist/` to `/var/web-apps/15-puzzle/static/` on the VPS.
3. **vps-genuine** — lints and tests `genuine`, builds a Docker image, pushes to `ghcr.io`, and SSHes to the VPS to restart the container.

VPS host config (nginx, certbot, dispatcher, per-container wrappers) lives in [`mellonis/vps`](https://github.com/mellonis/vps), not here.

## License

[GPL-3.0](LICENSE).
