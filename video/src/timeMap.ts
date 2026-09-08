import config from './editorial-cuts.json';

export const timestampToSeconds = (timestamp: string) => {
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

export const editorialCuts = config.cuts.map((cut) => ({
  start: timestampToSeconds(cut.start),
  end: timestampToSeconds(cut.end),
}));

export const sourceDurationSeconds = timestampToSeconds(config.sourceDuration);
export const reviewDurationSeconds = sourceDurationSeconds - editorialCuts.reduce(
  (total, cut) => total + cut.end - cut.start,
  0,
);

export const sourceSecondToReviewSecond = (sourceSecond: number) => {
  let removedDuration = 0;

  for (const cut of editorialCuts) {
    if (sourceSecond <= cut.start) return sourceSecond - removedDuration;
    if (sourceSecond < cut.end) return null;
    removedDuration += cut.end - cut.start;
  }

  return sourceSecond - removedDuration;
};

export const reviewSecondToSourceSecond = (reviewSecond: number) => {
  let removedDuration = 0;

  for (const cut of editorialCuts) {
    const cutStartOnReview = cut.start - removedDuration;
    if (reviewSecond < cutStartOnReview) break;
    removedDuration += cut.end - cut.start;
  }

  return reviewSecond + removedDuration;
};
