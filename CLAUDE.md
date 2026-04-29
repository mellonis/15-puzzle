# CLAUDE.md

Repo layout:

```
/
  static/         # the static SPA (the game UI)
  genuine/        # the signing server (real key lives here)
  vps-scripts/    # deploy helpers rsynced to the VPS by CI
  vps-nginx/      # nginx config for 15-puzzle.mellonis.ru (manual deploy)
  vps-certbot/    # snapshot of /etc/letsencrypt/renewal/15-puzzle.mellonis.ru.conf
  .github/        # CD workflow
```

## static

Vanilla JS + Vite. ESM only.

- `npm run dev` — Vite dev server on http://localhost:3000
- `npm run build` — production build to `static/dist/`
- `npm run preview` — serve the built bundle
- `npm run lint` — ESLint over `src/`
- `npm run chain` — manually regenerate per-level JSON blobs and `chain-entry.js`. Also runs as `prebuild`/`predev`/`prepare`.

`scripts/build-chain.js` writes `public/levels/<random>.{json,webp}` (pre-solve + reward blobs per level) and `src/services/chain-entry.js` (the entry URL). Both are gitignored.

`src/services/server.js` is currently the **mock** signer/chain-walker. It signs proofs with a hardcoded mock HMAC key and walks the static chain at `/levels/...`. TODO(server) markers tag every spot that becomes a `fetch` call to genuine when wired up.

`src/services/proof.js` owns the localStorage encoding — a single hex string:
`[userSeed:8][sigSeed:8] [proof tuples 3+3+movesLen+8] [chainHash:8]?`

`src/classes/Patn.js` is the puzzle. Constructor takes a `getRng` factory; no level tracking inside — that lives in `src/index.js` (`currentLevel`).

## genuine

Bare-Node HTTP server. No external runtime deps.

- `npm start` — start on `PORT` (default 3001)
- `npm run dev` — same with `--watch`
- `npm test` — Node's built-in test runner
- `npm run lint`

Endpoints (responses are plain text hex; requests are JSON):
- `POST /seed` → 136 hex chars: `[userSeed:8][sig:128]`. The server issues a random userSeed and Ed25519-signs `seed:<userSeed>`.
- `POST /sign` ← `{level, moves, userSeed, sigUserSeed}` → 128-hex Ed25519 sig, or 403. The server verifies sigUserSeed (re-sign + compare — Ed25519 is deterministic), regenerates the canonical board for `(level, userSeed)`, replays the moves, and signs `proof:<level>:<userSeed>:<movesHex>` only if the replay ends solved.

`src/canonical.js` mirrors static's puzzle generation (mulberry32 + shuffle + solvability check). Keep in sync with `static/src/classes/Patn.js` if the shuffle algorithm changes.

`PRIVATE_KEY` env var holds the PEM-encoded Ed25519 private key. With it unset, the server warns and falls back to a hardcoded DEV key (matching public key is bundled into static for verification in dev).

`Dockerfile` is in `genuine/`; image is published to `ghcr.io/<owner>/<repo>-genuine` by CI.

## Deployment (`.github/workflows/main.yml`)

VPS conventions, deploy pattern, container/port table, env file map, and CI/CD shape are documented in the workspace `CLAUDE.md` one directory up. The notes below are the 15-puzzle-specific bits.

Three jobs run on push to `master`:

1. **`gh-pages`** — builds `static` with `--base=/15-puzzle/` and publishes `static/dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages@v4`. Lands at `https://<owner>.github.io/15-puzzle/`.
2. **`vps-static`** — rebuilds `static` with the default base (`/`) and rsyncs `static/dist/` to `/var/web-apps/15-puzzle/static/` on the VPS.
3. **`vps-genuine`** — lints + tests `genuine`, builds a Docker image, pushes to `ghcr.io/<owner>/<repo>-genuine:{latest,sha}`, and SSHes to invoke `/var/web-apps/run.sh 15-puzzle-genuine`. The per-container wrapper at `/var/web-apps/15-puzzle/genuine/run.sh` (canonical source: `vps-scripts/genuine/run.sh`) is for ad-hoc manual restart only — not shipped by CI.

### Repo-specific secrets (beyond the workspace baseline)

- `PRIVATE_KEY` — PEM Ed25519 private key (used by the static build to sign chain blobs).
- `VITE_PUBLIC_KEY` — base64url raw 32-byte public key (embedded into the static bundle by Vite).

### Generating and placing a fresh keypair

Run locally — the snippet prints both keys (PEM private to a file, public key as a single line):

```sh
node -e "
const {generateKeyPairSync} = require('crypto');
const fs = require('fs');
const {privateKey, publicKey} = generateKeyPairSync('ed25519');
fs.writeFileSync('15-puzzle.private.pem', privateKey.export({type: 'pkcs8', format: 'pem'}));
fs.writeFileSync('15-puzzle.public.txt', publicKey.export({format: 'jwk'}).x + '\n');
console.log('Wrote 15-puzzle.private.pem (paste into PRIVATE_KEY)');
console.log('Wrote 15-puzzle.public.txt  (paste into VITE_PUBLIC_KEY)');
"
```

Then place them:

1. **GitHub repo → Settings → Secrets and variables → Actions**: paste private PEM into `PRIVATE_KEY`, public key into `VITE_PUBLIC_KEY`.
2. **VPS**: copy the full PEM to `/var/web-apps/15-puzzle/genuine/private.pem`, `chmod 600`. The dispatcher reads it and passes via `-e PRIVATE_KEY=$(cat …)` on each container start. Redeploy the genuine container to pick up changes.
3. **Local files**: `rm 15-puzzle.private.pem 15-puzzle.public.txt`. Don't commit.

After all three are in place, re-trigger the workflow so static rebuilds with the matching `VITE_PUBLIC_KEY` and chain blobs get re-signed.

### Where keys are stored

| Key | Location | Used by |
|---|---|---|
| **Production private** (PEM) | GitHub repo secret `PRIVATE_KEY` | static's CI build (build-chain signs blobs) |
| **Production private** (PEM) | VPS file `/var/web-apps/15-puzzle/genuine/private.pem` (full PEM, multi-line) | genuine container at runtime — dispatcher reads it and passes via `-e PRIVATE_KEY=$(cat …)` |
| **Production public** (base64url) | GitHub repo secret `VITE_PUBLIC_KEY` | static's CI build (Vite inlines it into the bundle) |
| **Dev private** (PEM) | hardcoded in `genuine/src/sign.js` and `static/scripts/build-chain.js` | local dev fallback |
| **Dev public** (base64url) | hardcoded in `static/src/services/server.js` (`DEV_PUBLIC_KEY`) | local dev fallback |

The private key never reaches the browser; the bundle embeds only the public key. The dev keypair is hardcoded in three files so `npm run dev` works without configuration. Rotating the production key: regenerate, update the two repo secrets, update the VPS PEM, redeploy both jobs.

### One-time VPS setup (15-puzzle only)

1. Place `private.pem` at `/var/web-apps/15-puzzle/genuine/private.pem` (`chmod 600`) — see "Where keys are stored" above.
2. Copy `vps-nginx/15-puzzle.mellonis.ru` to `/etc/nginx/sites-available/`, symlink into `sites-enabled/`, then `nginx -t && systemctl reload nginx`. Static files plus `/seed` and `/sign` proxied to `127.0.0.1:20005`.
3. If the image is private, `docker login ghcr.io` on the VPS with a PAT scoped `read:packages`.
