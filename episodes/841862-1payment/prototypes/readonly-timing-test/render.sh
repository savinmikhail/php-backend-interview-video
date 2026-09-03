#!/usr/bin/env bash
set -euo pipefail

prototype_dir="$(cd "$(dirname "$0")" && pwd)"
source_video="${1:-/Users/mikhailsavin/Movies/2026-07-10 merged.mp4}"
output_video="$prototype_dir/readonly-14m17s-15m45s-prototype.mp4"

ffmpeg -hide_banner -y \
  -ss 00:14:17 -t 88 -i "$source_video" \
  -loop 1 -i "$prototype_dir/frames/01-question.png" \
  -loop 1 -i "$prototype_dir/frames/01b-question-author.png" \
  -loop 1 -i "$prototype_dir/frames/02-rules.png" \
  -loop 1 -i "$prototype_dir/frames/03-benefits.png" \
  -loop 1 -i "$prototype_dir/frames/04-nuance-interviewer.png" \
  -filter_complex "\
    [1:v]trim=duration=2,setpts=PTS-STARTPTS[q-interviewer];\
    [2:v]trim=duration=2,setpts=PTS-STARTPTS[q-author];\
    [1:v]trim=duration=1,setpts=PTS-STARTPTS[q-clarified];\
    [3:v]trim=duration=34,setpts=PTS-STARTPTS[rules];\
    [4:v]trim=duration=21,setpts=PTS-STARTPTS[benefits];\
    [5:v]trim=duration=28,setpts=PTS-STARTPTS[bonus];\
    [q-interviewer][q-author][q-clarified][rules][benefits][bonus]concat=n=6:v=1:a=0,fps=30,format=yuv420p[video]" \
  -map "[video]" -map 0:a:0 \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -b:a 192k \
  -movflags +faststart -shortest \
  "$output_video"

printf '%s\n' "$output_video"
