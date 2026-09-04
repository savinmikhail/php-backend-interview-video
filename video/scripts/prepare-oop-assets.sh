#!/usr/bin/env bash
set -euo pipefail

SOURCE_VIDEO="${1:-/Users/mikhailsavin/Movies/2026-07-10 merged.mp4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$VIDEO_DIR/public/generated"

mkdir -p "$GENERATED_DIR"

ffmpeg -hide_banner -loglevel error -y \
  -ss 00:15:45 -t 55 -i "$SOURCE_VIDEO" \
  -vn -c:a aac -b:a 192k \
  "$GENERATED_DIR/oop-constructs-audio.m4a"

echo "Prepared OOP constructs audio in $GENERATED_DIR"
