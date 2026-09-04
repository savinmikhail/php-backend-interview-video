#!/usr/bin/env bash
set -euo pipefail

SOURCE_VIDEO="${FULL_REVIEW_SOURCE:-/Users/mikhailsavin/Movies/2026-07-10 merged.mp4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT="$VIDEO_DIR/public/generated/full-review-audio.m4a"

if [[ ! -f "$SOURCE_VIDEO" ]]; then
  echo "Source video not found: $SOURCE_VIDEO" >&2
  exit 1
fi

if [[ ! -f "$OUTPUT" || "$SOURCE_VIDEO" -nt "$OUTPUT" ]]; then
  mkdir -p "$(dirname "$OUTPUT")"
  echo "Extracting full interview audio for Remotion Studio"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -i "$SOURCE_VIDEO" -map 0:a:0 -vn -c:a copy "$OUTPUT"
fi

echo "Full review audio: $OUTPUT"
