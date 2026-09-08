import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  keptSourceRanges,
  reviewDurationSeconds,
  secondsToTimestamp,
  sourceDurationSeconds,
  sourceSecondToReviewSecond,
  timestampToSeconds,
} from './lib/time-map.mjs';

const projectRoot = resolve(import.meta.dirname, '..');
const configPath = resolve(projectRoot, 'speaker-diarization.config.json');
const outputPath = resolve(projectRoot, 'src/generated/speaker-timeline.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const transcriptPath = resolve(projectRoot, config.transcript);

const parseBoundary = (value, fallback) => value === undefined
  ? fallback
  : timestampToSeconds(value);

const mappings = config.labelMappings.map((mapping) => ({
  ...mapping,
  startSecond: parseBoundary(mapping.start, 0),
  endSecond: parseBoundary(mapping.end, Number.POSITIVE_INFINITY),
}));

const speakerFor = (label, sourceSecond) => {
  const matches = mappings.filter((mapping) =>
    mapping.label === label
    && sourceSecond >= mapping.startSecond
    && sourceSecond < mapping.endSecond);

  if (matches.length === 0) {
    throw new Error(`No speaker mapping for ${label} at ${secondsToTimestamp(sourceSecond)}`);
  }

  return matches.at(-1).speaker;
};

const transcriptEntries = readFileSync(transcriptPath, 'utf8')
  .split('\n')
  .map((line, index) => {
    const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]/);
    if (!match) return null;
    return {
      sourceSecond: timestampToSeconds(match[1]),
      label: match[2],
      index,
    };
  })
  .filter(Boolean)
  .sort((left, right) => left.sourceSecond - right.sourceSecond || left.index - right.index);

if (transcriptEntries.length === 0) throw new Error('Transcript contains no timed speaker entries');

// At identical STT timestamps only one badge can be active. Prefer the last
// utterance in file order, which is the turn that continues after the boundary.
const entries = [];
for (const entry of transcriptEntries) {
  if (entries.at(-1)?.sourceSecond === entry.sourceSecond) entries[entries.length - 1] = entry;
  else entries.push(entry);
}

const mappingBoundaries = mappings.flatMap((mapping) => [
  mapping.startSecond,
  mapping.endSecond,
]).filter(Number.isFinite);
const boundaries = [...new Set([
  ...entries.map((entry) => entry.sourceSecond),
  ...mappingBoundaries,
  sourceDurationSeconds,
])].sort((left, right) => left - right);

const sourceSegments = [];
let entryIndex = 0;
for (let index = 0; index < boundaries.length - 1; index++) {
  const start = boundaries[index];
  const end = boundaries[index + 1];
  while (entryIndex + 1 < entries.length && entries[entryIndex + 1].sourceSecond <= start) {
    entryIndex++;
  }
  const entry = entries[entryIndex];
  if (!entry || entry.sourceSecond > start || end <= start) continue;
  sourceSegments.push({start, end, speaker: speakerFor(entry.label, start)});
}

const clipped = [];
for (const segment of sourceSegments) {
  for (const kept of keptSourceRanges()) {
    const sourceStart = Math.max(segment.start, kept.start);
    const sourceEnd = Math.min(segment.end, kept.end);
    if (sourceEnd <= sourceStart) continue;

    const reviewStart = sourceSecondToReviewSecond(sourceStart);
    const reviewEnd = sourceSecondToReviewSecond(sourceEnd);
    if (reviewStart === null || reviewEnd === null) throw new Error('Kept range mapped into a cut');

    clipped.push({
      start: Math.round(reviewStart * 1000) / 1000,
      end: Math.round(reviewEnd * 1000) / 1000,
      speaker: segment.speaker,
    });
  }
}

const segments = [];
for (const segment of clipped) {
  const previous = segments.at(-1);
  if (previous && previous.speaker === segment.speaker && Math.abs(previous.end - segment.start) < 0.001) {
    previous.end = segment.end;
  } else {
    segments.push({...segment});
  }
}

if (segments.length === 0
  || Math.abs(segments[0].start) > 0.001
  || Math.abs(segments.at(-1).end - reviewDurationSeconds) > 0.001
  || segments.some((segment, index) => index > 0
    && Math.abs(segments[index - 1].end - segment.start) > 0.001)) {
  throw new Error('Generated review speaker timeline contains a gap');
}

const generated = `${JSON.stringify({
  generatedFrom: config.transcript,
  timeScale: 'review',
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
