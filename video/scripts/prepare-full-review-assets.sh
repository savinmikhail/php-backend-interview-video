#!/usr/bin/env bash
set -euo pipefail

SOURCE_VIDEO="${FULL_REVIEW_SOURCE:-/Users/mikhailsavin/Movies/2026-07-10 merged.mp4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT="$VIDEO_DIR/public/generated/full-review-audio.m4a"
LOUD_OUTPUT="$VIDEO_DIR/public/generated/full-review-audio-loud.wav"

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

if [[ ! -f "$LOUD_OUTPUT" || "$SOURCE_VIDEO" -nt "$LOUD_OUTPUT" ]]; then
  mkdir -p "$(dirname "$LOUD_OUTPUT")"
  echo "Preparing +10 dB lossless review audio"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -i "$SOURCE_VIDEO" -map 0:a:0 -vn \
    -af "volume=10dB,alimiter=limit=0.8912509:attack=5:release=100:level=false:latency=true" \
    -c:a pcm_s16le -ar 48000 "$LOUD_OUTPUT"
fi

echo "Loud review audio: $LOUD_OUTPUT"
