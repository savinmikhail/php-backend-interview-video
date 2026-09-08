#!/usr/bin/env bash
set -euo pipefail

SOURCE_VIDEO="${1:-/Users/mikhailsavin/Movies/2026-07-10 merged.mp4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$(cd "$VIDEO_DIR/.." && pwd)"
TIMELINE="$VIDEO_DIR/review-timeline.tsv"
TIME_MAP="$VIDEO_DIR/scripts/review-time.mjs"
SLIDES_DIR="$VIDEO_DIR/public/generated/review-slides"
SEGMENTS_DIR="$VIDEO_DIR/public/generated/full-review-segments"
BASE_LOOP="$VIDEO_DIR/public/generated/base-review-loop.mp4"
AUDIO_SOURCE="$VIDEO_DIR/public/generated/full-review-audio-loud.wav"
OUTPUT="${2:-$PROJECT_DIR/renders/841862-full-review.mp4}"
CONCAT_FILE="$SEGMENTS_DIR/concat.txt"
SOURCE_DURATION="${REVIEW_DURATION:-$(node "$TIME_MAP" source-duration-seconds)}"
CUT_STARTS=()
CUT_ENDS=()
while IFS=$'\t' read -r cut_start cut_end; do
  CUT_STARTS+=("$cut_start")
  CUT_ENDS+=("$cut_end")
done < <(node "$TIME_MAP" cuts-seconds)
INTRO_END="${CUT_ENDS[0]}"

if [[ ! -f "$SOURCE_VIDEO" ]]; then
  echo "Source video not found: $SOURCE_VIDEO" >&2
  exit 1
fi

FULL_REVIEW_SOURCE="$SOURCE_VIDEO" "$SCRIPT_DIR/prepare-full-review-assets.sh"
"$SCRIPT_DIR/render-review-stills.sh"
if [[ ! -f "$BASE_LOOP" \
  || "$VIDEO_DIR/src/BaseReview.tsx" -nt "$BASE_LOOP" \
  || "$VIDEO_DIR/src/InterviewShell.tsx" -nt "$BASE_LOOP" \
  || "$VIDEO_DIR/src/styles.css" -nt "$BASE_LOOP" ]]; then
  echo "Rendering animated base scene"
  npx remotion render src/index.ts BaseReviewDev "$BASE_LOOP" --codec=h264 --crf=18
fi
mkdir -p "$SEGMENTS_DIR" "$(dirname "$OUTPUT")"
: > "$CONCAT_FILE"

timestamp_to_seconds() {
  local timestamp="$1"
  local hours minutes seconds
  IFS=: read -r hours minutes seconds <<< "$timestamp"
  awk -v hours="$hours" -v minutes="$minutes" -v seconds="$seconds" \
    'BEGIN {printf "%.6f", hours * 3600 + minutes * 60 + seconds}'
}

seconds_between() {
  awk -v start="$1" -v end="$2" 'BEGIN {printf "%.6f", end - start}'
}

number_le() {
  awk -v left="$1" -v right="$2" 'BEGIN {exit !(left <= right)}'
}

number_lt() {
  awk -v left="$1" -v right="$2" 'BEGIN {exit !(left < right)}'
}

number_ge() {
  awk -v left="$1" -v right="$2" 'BEGIN {exit !(left >= right)}'
}

number_gt() {
  awk -v left="$1" -v right="$2" 'BEGIN {exit !(left > right)}'
}

encode_common=(
  -c:v libx264 -preset veryfast -crf 19
  -pix_fmt yuv420p -r 30 -g 60
  -c:a aac -b:a 192k -ar 48000
  -movflags +faststart
)

segment_number=0
cursor="$INTRO_END"

append_segment() {
  local path="$1"
  printf "file '%s'\n" "$path" >> "$CONCAT_FILE"
}

render_base_segment() {
  local start="$1"
  local end="$2"
  local duration
  duration="$(seconds_between "$start" "$end")"
  number_le "$duration" 0 && return
  segment_number=$((segment_number + 1))
  local output="$SEGMENTS_DIR/$(printf '%03d' "$segment_number")-base.mp4"
  echo "[$segment_number] Base scene ${start}–${end}"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -stream_loop -1 -i "$BASE_LOOP" \
    -ss "$start" -t "$duration" -i "$AUDIO_SOURCE" \
    -map 0:v:0 -map 1:a:0 -t "$duration" \
    -vf 'fps=30,format=yuv420p' \
    "${encode_common[@]}" "$output"
  append_segment "$output"
}

render_base_range() {
  local start="$1"
  local end="$2"
  local range_cursor="$start"
  local index cut_start cut_end

  for index in "${!CUT_STARTS[@]}"; do
    cut_start="${CUT_STARTS[$index]}"
    cut_end="${CUT_ENDS[$index]}"
    if number_le "$cut_end" "$range_cursor" || number_ge "$cut_start" "$end"; then
      continue
    fi
    number_lt "$range_cursor" "$cut_start" && render_base_segment "$range_cursor" "$cut_start"
    number_lt "$range_cursor" "$cut_end" && range_cursor="$cut_end"
  done

  number_lt "$range_cursor" "$end" && render_base_segment "$range_cursor" "$end"
}

overlaps_editorial_cut() {
  local start="$1"
  local end="$2"
  local index

  for index in "${!CUT_STARTS[@]}"; do
    if number_lt "$start" "${CUT_ENDS[$index]}" \
      && number_gt "$end" "${CUT_STARTS[$index]}"; then
      return 0
    fi
  done

  return 1
}

render_still_segment() {
  local start="$1"
  local end="$2"
  local slide_id="$3"
  local duration
  duration="$(seconds_between "$start" "$end")"
  segment_number=$((segment_number + 1))
  local output="$SEGMENTS_DIR/$(printf '%03d' "$segment_number")-$slide_id.mp4"
  echo "[$segment_number] Slide $slide_id ${start}–${end}"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -loop 1 -framerate 30 -i "$SLIDES_DIR/$slide_id.png" \
    -ss "$start" -t "$duration" -i "$AUDIO_SOURCE" \
    -map 0:v:0 -map 1:a:0 -t "$duration" \
    -vf 'format=yuv420p' \
    "${encode_common[@]}" "$output"
  append_segment "$output"
}

render_still_range() {
  local start="$1"
  local end="$2"
  local slide_id="$3"
  local range_cursor="$start"
  local index cut_start cut_end

  for index in "${!CUT_STARTS[@]}"; do
    cut_start="${CUT_STARTS[$index]}"
    cut_end="${CUT_ENDS[$index]}"
    if number_le "$cut_end" "$range_cursor" || number_ge "$cut_start" "$end"; then
      continue
    fi
    number_lt "$range_cursor" "$cut_start" && render_still_segment "$range_cursor" "$cut_start" "$slide_id"
    number_lt "$range_cursor" "$cut_end" && range_cursor="$cut_end"
  done

  number_lt "$range_cursor" "$end" && render_still_segment "$range_cursor" "$end" "$slide_id"
}

render_video() {
  local start="$1"
  local end="$2"
  local relative_path="$3"
  local duration
  duration="$(seconds_between "$start" "$end")"
  segment_number=$((segment_number + 1))
  local output="$SEGMENTS_DIR/$(printf '%03d' "$segment_number")-animated.mp4"
  echo "[$segment_number] Existing animated sequence ${start}–${end}"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -i "$VIDEO_DIR/$relative_path" \
    -ss "$start" -t "$duration" -i "$AUDIO_SOURCE" \
    -map 0:v:0 -map 1:a:0 -t "$duration" \
    -vf 'fps=30,format=yuv420p' \
    "${encode_common[@]}" "$output"
  append_segment "$output"
}

while IFS=$'\t' read -r start_stamp end_stamp source; do
  [[ -z "${start_stamp:-}" || "$start_stamp" == \#* ]] && continue
  start="$(timestamp_to_seconds "$start_stamp")"
  end="$(timestamp_to_seconds "$end_stamp")"
  number_ge "$start" "$SOURCE_DURATION" && break
  number_gt "$end" "$SOURCE_DURATION" && end="$SOURCE_DURATION"
  number_le "$end" "$INTRO_END" && continue
  number_lt "$start" "$INTRO_END" && start="$INTRO_END"

  if [[ "$source" == video:* ]] && overlaps_editorial_cut "$start" "$end"; then
    echo "Visual segment overlaps an editorial cut: $start_stamp–$end_stamp" >&2
    exit 1
  fi

  render_base_range "$cursor" "$start"
  if [[ "$source" == video:* ]]; then
    render_video "$start" "$end" "${source#video:}"
  else
    render_still_range "$start" "$end" "$source"
  fi
  cursor="$end"
done < "$TIMELINE"

render_base_range "$cursor" "$SOURCE_DURATION"

echo "Joining $segment_number segments"
ffmpeg -nostdin -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$CONCAT_FILE" \
  -c copy -movflags +faststart "$OUTPUT"

echo "Full review video: $OUTPUT"
