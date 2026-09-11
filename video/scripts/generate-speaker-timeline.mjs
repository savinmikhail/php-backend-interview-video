import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {reviewDurationSeconds, secondsToTimestamp, timestampToSeconds} from './lib/time-map.mjs';
import {buildSpeakerTimeline} from './lib/speaker-timeline.mjs';

const projectRoot = resolve(import.meta.dirname, '..');
const configPath = resolve(projectRoot, 'speaker-diarization.config.json');
const outputPath = resolve(projectRoot, 'src/generated/speaker-timeline.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const diarizationPath = resolve(projectRoot, config.diarization);
const diarization = JSON.parse(readFileSync(diarizationPath, 'utf8'));

if (config.timeScale !== 'final' || diarization.timeScale !== config.timeScale) {
  throw new Error(`Unsupported or mismatched diarization time scale: ${diarization.timeScale}`);
}

const overrides = (config.overrides ?? []).map((override) => ({
  startMs: Math.round(timestampToSeconds(override.start) * 1000),
  endMs: Math.round(timestampToSeconds(override.end) * 1000),
  speaker: override.speaker,
}));

const reviewDurationMs = Math.round(reviewDurationSeconds * 1000);
const timeline = buildSpeakerTimeline({
  utterances: diarization.utterances,
  speakerMappings: config.speakerMappings,
  initialSpeaker: config.initialSpeaker,
  reviewStartMs: config.reviewStartMs,
  reviewDurationMs,
  glitchThresholdMs: config.glitchThresholdMs,
  overrides,
});

const segments = timeline.map((segment) => ({
  start: segment.startMs / 1000,
  end: segment.endMs / 1000,
  speaker: segment.speaker,
}));

if (segments.length === 0
  || segments[0].start !== 0
  || segments.at(-1).end * 1000 !== reviewDurationMs
  || segments.some((segment, index) => index > 0 && segments[index - 1].end !== segment.start)) {
  throw new Error('Generated review speaker timeline contains a gap');
}

const generated = `${JSON.stringify({
  generatedFrom: config.diarization,
  sourceSha256: diarization.sourceSha256,
  sourceTimeScale: config.timeScale,
  timeScale: 'review',
  glitchThresholdMs: config.glitchThresholdMs,
  segments,
}, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) {
    console.error('Speaker timeline is stale. Run: npm run speakers:generate');
    process.exit(1);
  }
  console.log(`Speaker timeline: ${segments.length} generated review segment(s) match`);
} else {
  writeFileSync(outputPath, generated);
  console.log(`Wrote ${segments.length} review segment(s) to src/generated/speaker-timeline.json`);
}

const atIndex = process.argv.indexOf('--at');
if (atIndex !== -1) {
  const timestamp = process.argv[atIndex + 1];
  if (!timestamp) throw new Error('--at requires a review timestamp');
  const second = timestampToSeconds(timestamp);
  const segment = segments.find((candidate) => second >= candidate.start && second < candidate.end);
  console.log(`review ${secondsToTimestamp(second)}: ${segment?.speaker ?? 'unknown'}`);
}
