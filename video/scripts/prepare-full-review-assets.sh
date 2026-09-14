#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$(cd "$VIDEO_DIR/.." && pwd)"
SOURCE_VIDEO="${FULL_REVIEW_SOURCE:-$VIDEO_DIR/public/episode-841862/interview.mp4}"
OUTPUT="$VIDEO_DIR/public/generated/full-review-audio.m4a"
LOUD_OUTPUT="$VIDEO_DIR/public/generated/full-review-audio-loud.wav"
CUT_OUTPUT="$VIDEO_DIR/public/generated/full-review-audio-cut.m4a"
CUTS_CONFIG="$VIDEO_DIR/src/editorial-cuts.json"
TIME_MAP="$VIDEO_DIR/scripts/review-time.mjs"
TIME_MAP_LIB="$VIDEO_DIR/scripts/lib/time-map.mjs"
REPAIR_AUDIO="${FULL_REVIEW_REPAIR_AUDIO:-$PROJECT_DIR/episodes/841862-1payment/audio-for-restoration/interviewer-repaired-34m23s-42m36s.wav}"

# The repair includes 15-second handles around source 34:38–42:21.
# Include the overlap in the adjoining input so acrossfade keeps the master
# duration unchanged.
REPAIR_SOURCE_START=2078
AFTER_SOURCE_WITH_OVERLAP_START=2540.92
REPAIR_TRIM_WITH_OVERLAP_START=14.92
REPAIR_TRIM_END=478
CROSSFADE=0.08

if [[ ! -f "$SOURCE_VIDEO" ]]; then
  echo "Source video not found: $SOURCE_VIDEO" >&2
  exit 1
fi

if [[ ! -f "$REPAIR_AUDIO" ]]; then
  echo "Repaired audio not found: $REPAIR_AUDIO" >&2
  exit 1
fi

if [[ ! -f "$OUTPUT" || "$SOURCE_VIDEO" -nt "$OUTPUT" ]]; then
  mkdir -p "$(dirname "$OUTPUT")"
  echo "Extracting full interview audio for Remotion Studio"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -i "$SOURCE_VIDEO" -map 0:a:0 -vn -c:a copy "$OUTPUT"
fi

echo "Full review audio: $OUTPUT"

if [[ ! -f "$LOUD_OUTPUT" \
  || "$SOURCE_VIDEO" -nt "$LOUD_OUTPUT" \
  || "$REPAIR_AUDIO" -nt "$LOUD_OUTPUT" \
  || "$0" -nt "$LOUD_OUTPUT" ]]; then
  mkdir -p "$(dirname "$LOUD_OUTPUT")"
  echo "Preparing repaired +10 dB lossless review audio"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -i "$SOURCE_VIDEO" -i "$REPAIR_AUDIO" -vn \
    -filter_complex "\
[0:a:0]atrim=start=0:end=$REPAIR_SOURCE_START,asetpts=PTS-STARTPTS[before];\
[1:a:0]atrim=start=$REPAIR_TRIM_WITH_OVERLAP_START:end=$REPAIR_TRIM_END,asetpts=PTS-STARTPTS[repaired];\
[0:a:0]atrim=start=$AFTER_SOURCE_WITH_OVERLAP_START,asetpts=PTS-STARTPTS[after];\
[before][repaired]acrossfade=d=$CROSSFADE:c1=tri:c2=tri[head];\
[head][after]acrossfade=d=$CROSSFADE:c1=tri:c2=tri[patched];\
[patched]volume=10dB,alimiter=limit=0.8912509:attack=5:release=100:level=false:latency=true[out]" \
    -map "[out]" \
    -c:a pcm_s16le -ar 48000 "$LOUD_OUTPUT"
fi

echo "Loud review audio: $LOUD_OUTPUT"

if [[ ! -f "$CUT_OUTPUT" \
  || "$LOUD_OUTPUT" -nt "$CUT_OUTPUT" \
  || "$CUTS_CONFIG" -nt "$CUT_OUTPUT" \
  || "$TIME_MAP" -nt "$CUT_OUTPUT" \
  || "$TIME_MAP_LIB" -nt "$CUT_OUTPUT" \
  || "$0" -nt "$CUT_OUTPUT" ]]; then
  echo "Preparing editorially cut review audio"
  AUDIO_CUT_FILTER="$(node "$TIME_MAP" ffmpeg-audio-filter)"
  ffmpeg -nostdin -hide_banner -loglevel error -y \
    -i "$LOUD_OUTPUT" \
    -filter_complex "$AUDIO_CUT_FILTER" \
    -map "[out]" \
    -c:a aac -b:a 192k -ar 48000 "$CUT_OUTPUT"
fi

echo "Cut review audio: $CUT_OUTPUT"
