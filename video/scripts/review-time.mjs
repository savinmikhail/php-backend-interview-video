import {readFileSync} from 'node:fs';
import {
  editorialCuts,
  keptSourceRanges,
  reviewSecondToSourceSecond,
  secondsToTimestamp,
  sourceDurationSeconds,
  sourceSecondToReviewSecond,
  timestampToSeconds,
} from './lib/time-map.mjs';

const [command, ...args] = process.argv.slice(2);

const usage = () => {
  console.error(`Usage:
  npm run time -- review-to-source MM:SS
  npm run time -- source-to-review HH:MM:SS
  npm run time -- segment SLIDE_ID`);
  process.exit(1);
};

const timelineRows = () => readFileSync(new URL('../review-timeline.tsv', import.meta.url), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && !line.includes('video:'))
  .map((line) => {
    const [start, end, slideId] = line.split('\t');
    return {start, end, slideId};
  });

const printSegment = (slideId) => {
  const segment = timelineRows().find((row) => row.slideId === slideId);
  if (!segment) throw new Error(`Unknown review slide: ${slideId}`);

  const reviewStart = sourceSecondToReviewSecond(timestampToSeconds(segment.start));
  const reviewEnd = sourceSecondToReviewSecond(timestampToSeconds(segment.end));
  if (reviewStart === null || reviewEnd === null) {
    throw new Error(`${slideId} overlaps an editorial cut`);
  }

  console.log(slideId);
  console.log(`source  ${secondsToTimestamp(timestampToSeconds(segment.start))}–${secondsToTimestamp(timestampToSeconds(segment.end))}`);
  console.log(`review  ${secondsToTimestamp(reviewStart)}–${secondsToTimestamp(reviewEnd)}`);
};

try {
  if (command === 'review-to-source' && args.length === 1) {
    const review = timestampToSeconds(args[0]);
    const source = reviewSecondToSourceSecond(review);
    console.log(`review ${secondsToTimestamp(review)} → source ${secondsToTimestamp(source)}`);
  } else if (command === 'source-to-review' && args.length === 1) {
    const source = timestampToSeconds(args[0]);
    const review = sourceSecondToReviewSecond(source);
    if (review === null) throw new Error(`${args[0]} lies inside an editorial cut`);
    console.log(`source ${secondsToTimestamp(source)} → review ${secondsToTimestamp(review)}`);
  } else if (command === 'segment' && args.length === 1) {
    printSegment(args[0]);
  } else if (command === 'cuts-seconds' && args.length === 0) {
    for (const cut of editorialCuts) console.log(`${cut.start}\t${cut.end}`);
  } else if (command === 'source-duration-seconds' && args.length === 0) {
    console.log(sourceDurationSeconds);
  } else if (command === 'ffmpeg-audio-filter' && args.length === 0) {
    const ranges = keptSourceRanges();
    const trims = ranges.map((range, index) => (
      `[0:a:0]atrim=start=${range.start}:end=${range.end},asetpts=PTS-STARTPTS[a${index}]`
    ));
    const inputs = ranges.map((_, index) => `[a${index}]`).join('');
    console.log(`${trims.join(';')};${inputs}concat=n=${ranges.length}:v=0:a=1[out]`);
  } else {
    usage();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
