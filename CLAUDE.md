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

Three jobs run on push to `master`:

1. **`gh-pages`** — builds `static` with `--base=/15-puzzle/` and publishes `static/dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages@v4`. Lands at `https://<owner>.github.io/15-puzzle/`.

2. **`vps-static`** — rebuilds `static` with the default base (`/`) and rsyncs `static/dist/` to `/var/web-apps/15-puzzle.mellonis.ru/` on the VPS. nginx serves it at `https://15-puzzle.mellonis.ru/`.

3. **`vps-genuine`** — lints + tests `genuine`, builds a `linux/amd64` Docker image, pushes to `ghcr.io/<owner>/<repo>-genuine:{latest,sha}`, rsyncs `vps-scripts/` to the VPS, and SSHes to run:
   ```
   IMAGE=<image> bash <vps-scripts-path>/run.sh 15-puzzle-genuine
   ```
   `run.sh` pulls the image and (re)starts the container on the default bridge network with port `127.0.0.1:20005` mapped to the container's `3001`, env from `/var/web-apps/.env.15-puzzle-genuine`.

### Required repo secrets

| Secret | Purpose |
|---|---|
| `SSH_KEY` | private key with VPS access |
| `SSH_HOST` | VPS hostname/IP |
| `SSH_USER` | VPS user |
| `GITHUB_TOKEN` | auto, used for gh-pages + GHCR push |

Once Ed25519 wiring is finished, also: `PRIVATE_KEY` (PEM, used by both the genuine container and the static build script for chain-blob signing), `VITE_PUBLIC_KEY` (raw 32-byte public key, base64url, embedded into the static bundle).

### One-time VPS setup

1. **PEM file**: `/var/web-apps/15-puzzle-genuine.pem` containing the full Ed25519 PEM (`-----BEGIN PRIVATE KEY-----` … `-----END PRIVATE KEY-----`). `chmod 600`. `run.sh` reads this and passes via `-e PRIVATE_KEY=...` on each container start.
2. **Nginx**: copy `vps-nginx/15-puzzle.mellonis.ru` to `/etc/nginx/sites-available/15-puzzle.mellonis.ru` on the VPS, symlink into `sites-enabled/`, then `nginx -t && systemctl reload nginx`. Static files plus `/seed` and `/sign` proxied to `127.0.0.1:20005`.
3. **GHCR auth**: if the image is private, `docker login ghcr.io` once on the VPS with a PAT scoped `read:packages`.

### Required env / secrets (production)

| Where | Var | Notes |
|---|---|---|
| CI (build static) | `PRIVATE_KEY` | PEM Ed25519 private key, used by build-chain to sign blobs |
| CI (build static) | `VITE_PUBLIC_KEY` | base64url raw 32-byte public key, embedded in bundle |
| VPS (genuine container) | `PRIVATE_KEY` | same PEM as above, in `/var/web-apps/.env.15-puzzle-genuine` |

### Generating and placing a fresh keypair

Run locally — the snippet prints both keys to stdout in plumbing-friendly form (PEM private to a file, public key as a single line):

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

Then put the keys where they're consumed:

1. **GitHub repo → Settings → Secrets and variables → Actions**
   - `PRIVATE_KEY` ← paste the entire contents of `15-puzzle.private.pem` (including BEGIN/END lines)
   - `VITE_PUBLIC_KEY` ← paste the contents of `15-puzzle.public.txt` (single base64url line, no quotes)

2. **VPS** — copy the full PEM (verbatim, multi-line) to `/var/web-apps/15-puzzle-genuine.pem`, then `chmod 600`. `run.sh` reads it on each container start. Redeploy the genuine container to pick up changes.

3. **Local files**: `rm 15-puzzle.private.pem 15-puzzle.public.txt`. Do not commit (the private one especially).

After all three are in place, re-trigger the workflow (push or `workflow_dispatch`) so static rebuilds with the matching `VITE_PUBLIC_KEY` and chain blobs get re-signed.

### Where keys are stored

| Key | Location | Used by |
|---|---|---|
| **Production private** (PEM) | GitHub repo secret `PRIVATE_KEY` | static's CI build (build-chain signs blobs) |
| **Production private** (PEM) | VPS file `/var/web-apps/15-puzzle-genuine.pem` (full PEM, multi-line) | genuine container at runtime — `run.sh` reads it and passes via `-e PRIVATE_KEY=$(cat …)` |
| **Production public** (base64url) | GitHub repo secret `VITE_PUBLIC_KEY` | static's CI build (Vite inlines it into the bundle) |
| **Dev private** (PEM) | hardcoded in `genuine/src/sign.js` and `static/scripts/build-chain.js` | local dev fallback |
| **Dev public** (base64url) | hardcoded in `static/src/services/server.js` (`DEV_PUBLIC_KEY`) | local dev fallback |

The private key never reaches the browser; the bundle embeds only the public key. The dev keypair is hardcoded in three files so `npm run dev` works without configuration. Rotating the production key: regenerate, update the two repo secrets, update the VPS env file, redeploy both jobs.
