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
  if [[ -f "$output" && "${1:-}" != "--force" ]]; then
    newer_source="$(find "$VIDEO_DIR/src" -type f \
      \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.json' \) \
      -newer "$output" -print -quit)"
    if [[ -z "$newer_source" && "$output" -nt "$TIMELINE" ]]; then
      continue
    fi
  fi
  echo "Rendering $source"
  npx remotion still src/index.ts ReviewSlide "$output" \
    --frame=29 \
    --props="{\"format\":\"wide\",\"slideId\":\"$source\"}"
done < "$TIMELINE"

echo "Review stills are ready in $OUTPUT_DIR"
