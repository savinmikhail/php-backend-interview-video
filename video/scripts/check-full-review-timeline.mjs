import {readFileSync} from 'node:fs';
import {
  reviewSecondToSourceSecond,
  secondsToTimestamp,
  sourceSecondToReviewSecond,
  timestampToSeconds,
} from './lib/time-map.mjs';

const timelineRows = readFileSync('review-timeline.tsv', 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && !line.includes('video:'))
  .map((line) => {
    const [start, end, slideId] = line.split('\t');
    return {start, end, slideId};
  });
const tsvSegments = timelineRows.map(({start, end, slideId}) => [start, end, slideId].join('|'));

const source = readFileSync('src/FullInterviewReview.tsx', 'utf8');
const componentSegments = [...source.matchAll(
  /start: '([^']+)', end: '([^']+)', slideId: '([^']+)'/g,
)].map((match) => [match[1], match[2], match[3]].join('|'));
const authoredLayers = [...source.matchAll(
  /<ReviewSlide format=\{format\} slideId="([^"]+)"/g,
)].map((match) => match[1]);

const missing = tsvSegments.filter((segment) => !componentSegments.includes(segment));
const extra = componentSegments.filter((segment) => !tsvSegments.includes(segment));

if (missing.length > 0 || extra.length > 0 || tsvSegments.length !== componentSegments.length) {
  console.error('FullInterviewReview timeline differs from review-timeline.tsv');
  if (missing.length > 0) console.error('Missing:', missing);
  if (extra.length > 0) console.error('Extra:', extra);
  process.exit(1);
}

const tsvIds = tsvSegments.map((segment) => segment.split('|')[2]);
const missingLayers = tsvIds.filter((slideId) => !authoredLayers.includes(slideId));
const duplicateLayers = authoredLayers.filter(
  (slideId, index) => authoredLayers.indexOf(slideId) !== index,
);

if (missingLayers.length > 0 || duplicateLayers.length > 0 || authoredLayers.length !== tsvIds.length) {
  console.error('FullInterviewReview layers are not authored one-by-one');
  if (missingLayers.length > 0) console.error('Missing layers:', missingLayers);
  if (duplicateLayers.length > 0) console.error('Duplicate layers:', duplicateLayers);
  process.exit(1);
}

const invalidRanges = [];
for (const segment of timelineRows) {
  const sourceStart = timestampToSeconds(segment.start);
  const sourceEnd = timestampToSeconds(segment.end);
  const reviewStart = sourceSecondToReviewSecond(sourceStart);
  const reviewEnd = sourceSecondToReviewSecond(sourceEnd);

  if (sourceEnd <= sourceStart) invalidRanges.push(`${segment.slideId}: duration must be positive`);
  if (reviewStart === null || reviewEnd === null) {
    invalidRanges.push(`${segment.slideId}: boundary lies inside an editorial cut`);
    continue;
  }

  const roundTripStart = reviewSecondToSourceSecond(reviewStart);
  const roundTripEnd = reviewSecondToSourceSecond(reviewEnd);
  const remappedStart = sourceSecondToReviewSecond(roundTripStart);
  const remappedEnd = sourceSecondToReviewSecond(roundTripEnd);
  if (remappedStart === null || remappedEnd === null
    || Math.abs(remappedStart - reviewStart) > 0.001
    || Math.abs(remappedEnd - reviewEnd) > 0.001) {
    invalidRanges.push(`${segment.slideId}: source/review conversion does not round-trip`);
  }
}

const locks = readFileSync('review-timing-locks.tsv', 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const [slideId, reviewStart, reviewEnd] = line.split('\t');
    return {slideId, reviewStart, reviewEnd};
  });
const brokenLocks = [];

for (const lock of locks) {
  const segment = timelineRows.find((row) => row.slideId === lock.slideId);
  if (!segment) {
    brokenLocks.push(`${lock.slideId}: locked slide is missing`);
    continue;
  }

  const actualStart = sourceSecondToReviewSecond(timestampToSeconds(segment.start));
  const actualEnd = sourceSecondToReviewSecond(timestampToSeconds(segment.end));
  const expectedStart = timestampToSeconds(lock.reviewStart);
  const expectedEnd = timestampToSeconds(lock.reviewEnd);
  if (actualStart === null || actualEnd === null
    || Math.abs(actualStart - expectedStart) > 0.001
    || Math.abs(actualEnd - expectedEnd) > 0.001) {
    brokenLocks.push(
      `${lock.slideId}: expected review ${lock.reviewStart}–${lock.reviewEnd}, got ${actualStart === null ? 'cut' : secondsToTimestamp(actualStart)}–${actualEnd === null ? 'cut' : secondsToTimestamp(actualEnd)}`,
    );
  }
}

if (invalidRanges.length > 0 || brokenLocks.length > 0) {
  console.error('Full review timing validation failed');
  for (const error of [...invalidRanges, ...brokenLocks]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Full review timeline: ${componentSegments.length} slide segments and layers match`);
console.log(`Review timing locks: ${locks.length} accepted interval(s) match`);

if (process.argv.includes('--show-times')) {
  for (const segment of timelineRows) {
    const reviewStart = sourceSecondToReviewSecond(timestampToSeconds(segment.start));
    const reviewEnd = sourceSecondToReviewSecond(timestampToSeconds(segment.end));
    console.log([
      segment.slideId.padEnd(24),
      `source ${segment.start}–${segment.end}`,
      `review ${secondsToTimestamp(reviewStart)}–${secondsToTimestamp(reviewEnd)}`,
    ].join('  '));
  }
}
