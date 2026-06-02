#!/usr/bin/env bash
# Copy KeyShot Touch 2 Master export into public/ for ?touch2-playground=1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="${TOUCH2_SRC:-$HOME/Downloads}"
DEST="$ROOT/public/models/touch-2-master"
mkdir -p "$DEST"
cp "$SRC_DIR/Touch 2 Master.obj" "$SRC_DIR/Touch 2 Master.mtl" "$DEST/"
echo "Copied to $DEST"
