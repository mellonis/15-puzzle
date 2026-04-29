# Sourced by /var/web-apps/run.sh for service `15-puzzle-genuine`.
PORT="20005:3001"

[ -f "$DIR/private.pem" ] || { echo "Error: $DIR/private.pem missing" >&2; exit 1; }

# data/ is a persistent volume owned by uid 1000 (node:alpine USER node).
mkdir -p "$DIR/data"
chown -R 1000:1000 "$DIR/data"

EXTRA_ARGS+=(
  -e "PRIVATE_KEY=$(cat "$DIR/private.pem")"
  -v "$DIR/data:/data"
)
