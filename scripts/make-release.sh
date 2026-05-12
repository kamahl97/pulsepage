#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="pulsepage"
VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
OUT_DIR="$ROOT/dist"
RELEASE_DIR="$OUT_DIR/$NAME-$VERSION"
ARCHIVE="$OUT_DIR/$NAME-$VERSION.tar.gz"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

copy_path() {
  local src="$1"
  local dest="$RELEASE_DIR/$1"
  mkdir -p "$(dirname "$dest")"
  cp -R "$ROOT/$src" "$dest"
}

copy_path api
copy_path app
copy_path docs
copy_path deploy
copy_path package.json
copy_path package-lock.json
copy_path capacitor.config.json
copy_path .env.example

# Keep runtime data out of releases. The VPS will use /var/lib/pulsepage.
rm -rf "$RELEASE_DIR/api/data"
mkdir -p "$RELEASE_DIR/api/data"

tar -C "$OUT_DIR" -czf "$ARCHIVE" "$NAME-$VERSION"
printf '%s\n' "$ARCHIVE"
