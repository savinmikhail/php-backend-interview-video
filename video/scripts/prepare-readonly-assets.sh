#!/usr/bin/env bash
set -euo pipefail

SOURCE_VIDEO="${1:-/Users/mikhailsavin/Movies/2026-07-10 merged.mp4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$(cd "$VIDEO_DIR/.." && pwd)"
GENERATED_DIR="$VIDEO_DIR/public/generated"

mkdir -p "$GENERATED_DIR"

ffmpeg -hide_banner -loglevel error -y \
  -ss 00:14:17 -t 88 -i "$SOURCE_VIDEO" \
  -vn -c:a aac -b:a 192k \
  "$GENERATED_DIR/readonly-audio.m4a"

cp \
  "$PROJECT_DIR/episodes/841862-1payment/mockups/references/current-layout.png" \
  "$GENERATED_DIR/current-layout.png"

echo "Prepared Remotion assets in $GENERATED_DIR"
