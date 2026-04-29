#!/bin/bash
# Pull the requested image and (re)start its container on the VPS.
# Usage: IMAGE=<image> ./run.sh <service>
set -e

SERVICE="${1:-}"

usage() {
  echo "Usage: IMAGE=<image> $0 <service>"
  echo "Services: 15-puzzle-genuine"
  exit 1
}

case "$SERVICE" in
  15-puzzle-genuine)
    NAME="15-puzzle-genuine"
    PORT="20005:3001"
    PRIVATE_KEY_FILE="/var/web-apps/15-puzzle-genuine.pem"
    DATA_DIR="/var/web-apps/15-puzzle-genuine-data"
    ;;
  *)
    usage
    ;;
esac

if [ -z "$IMAGE" ]; then
  echo "Error: IMAGE env var is required" >&2
  usage
fi

if [ ! -f "$PRIVATE_KEY_FILE" ]; then
  echo "Error: $PRIVATE_KEY_FILE missing" >&2
  exit 1
fi

mkdir -p "$DATA_DIR"
# Container runs as USER node (uid 1000 in node:alpine images).
chown -R 1000:1000 "$DATA_DIR"

if docker container inspect "$NAME" >/dev/null 2>&1; then
  docker stop "$NAME" >/dev/null
  docker rm "$NAME" >/dev/null
  echo "Removed previous $NAME container"
else
  echo "No previous $NAME container — first deploy"
fi

docker pull "$IMAGE"

docker run -d \
  -p "127.0.0.1:$PORT" \
  -e "PRIVATE_KEY=$(cat "$PRIVATE_KEY_FILE")" \
  -v "$DATA_DIR:/data" \
  --name "$NAME" \
  --restart unless-stopped \
  "$IMAGE"
