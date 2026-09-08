import {readFileSync} from 'node:fs';

const config = JSON.parse(readFileSync(
  new URL('../../src/editorial-cuts.json', import.meta.url),
  'utf8',
));

export const timestampToSeconds = (timestamp) => {
  const parts = timestamp.split(':').map(Number);
  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  const [hours, minutes, seconds] = parts.length === 3
    ? parts
    : [0, parts[0], parts[1]];

  if (![hours, minutes, seconds].every(Number.isFinite) || hours < 0 || minutes < 0 || seconds < 0) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  return hours * 3600 + minutes * 60 + seconds;
};

export const secondsToTimestamp = (value) => {
  const rounded = Math.round(value * 1000) / 1000;
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded - hours * 3600) / 60);
  const seconds = rounded - hours * 3600 - minutes * 60;
  const secondsText = Number.isInteger(seconds)
    ? String(seconds).padStart(2, '0')
    : seconds.toFixed(3).replace(/0+$/, '').padStart(2, '0');

  return [hours, minutes, secondsText]
    .map((part, index) => index < 2 ? String(part).padStart(2, '0') : part)
    .join(':');
};

export const editorialCuts = config.cuts.map((cut) => ({
  start: timestampToSeconds(cut.start),
  end: timestampToSeconds(cut.end),
}));

export const sourceDurationSeconds = timestampToSeconds(config.sourceDuration);
export const reviewDurationSeconds = sourceDurationSeconds - editorialCuts.reduce(
  (total, cut) => total + cut.end - cut.start,
  0,
);

const validateConfig = () => {
  let cursor = 0;
  for (const cut of editorialCuts) {
    if (cut.start < cursor || cut.end <= cut.start || cut.end > sourceDurationSeconds) {
      throw new Error('Editorial cuts must be ordered, non-overlapping, and inside source duration');
    }
    cursor = cut.end;
  }
};

validateConfig();

export const sourceSecondToReviewSecond = (sourceSecond) => {
  let removedDuration = 0;

  for (const cut of editorialCuts) {
    if (sourceSecond <= cut.start) return sourceSecond - removedDuration;
    if (sourceSecond < cut.end) return null;
    removedDuration += cut.end - cut.start;
  }

  return sourceSecond - removedDuration;
};

export const reviewSecondToSourceSecond = (reviewSecond) => {
  let removedDuration = 0;

  for (const cut of editorialCuts) {
    const cutStartOnReview = cut.start - removedDuration;
    if (reviewSecond < cutStartOnReview) break;
    removedDuration += cut.end - cut.start;
  }

  return reviewSecond + removedDuration;
};

export const sourceRangeOverlapsCut = (start, end) => editorialCuts.some(
  (cut) => start < cut.end && end > cut.start,
);

export const keptSourceRanges = () => {
  const ranges = [];
  let cursor = 0;

  for (const cut of editorialCuts) {
    if (cursor < cut.start) ranges.push({start: cursor, end: cut.start});
    cursor = cut.end;
  }

  if (cursor < sourceDurationSeconds) ranges.push({start: cursor, end: sourceDurationSeconds});
  return ranges;
};
