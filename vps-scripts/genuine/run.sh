#!/bin/bash
# Container: 15-puzzle-genuine  (Ed25519 signing service for the 15-puzzle game)
# Domain:    15-puzzle.mellonis.ru (proxied via nginx; admin endpoints basic-auth gated)
# Expected files in this directory:
#   .env        — runtime env (PORT defaults are fine; see .env.example in repo)
#   .htpasswd   — basic-auth for /boards and /board/<id>/attempts admin endpoints
#   private.pem — Ed25519 PEM (chmod 600) — passed to container as PRIVATE_KEY
#   data/       — persistent data dir (uid 1000, mounted at /data inside container)
#   run.sh      — this wrapper
exec /var/web-apps/run.sh 15-puzzle-genuine "$@"
