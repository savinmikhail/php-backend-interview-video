#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMELINE="$VIDEO_DIR/review-timeline.tsv"
OUTPUT_DIR="$VIDEO_DIR/public/generated/review-slides"

mkdir -p "$OUTPUT_DIR"

while IFS=$'\t' read -r start end source; do
  [[ -z "${start:-}" || "$start" == \#* || "$source" == video:* ]] && continue
  output="$OUTPUT_DIR/$source.png"
  if [[ -f "$output" && "${1:-}" != "--force" \
    && "$output" -nt "$VIDEO_DIR/src/ReviewSlide.tsx" \
    && "$output" -nt "$VIDEO_DIR/src/review-slide.css" \
    && "$output" -nt "$VIDEO_DIR/src/InterviewShell.tsx" \
    && "$output" -nt "$VIDEO_DIR/src/styles.css" ]]; then
    continue
  fi
  echo "Rendering $source"
  npx remotion still src/index.ts ReviewSlide "$output" \
    --frame=29 \
    --props="{\"format\":\"wide\",\"slideId\":\"$source\"}"
done < "$TIMELINE"

echo "Review stills are ready in $OUTPUT_DIR"
