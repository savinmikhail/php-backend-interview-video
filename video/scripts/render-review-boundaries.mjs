import {mkdirSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {
  secondsToTimestamp,
  sourceSecondToReviewSecond,
  timestampToSeconds,
} from './lib/time-map.mjs';

const slideId = process.argv[2];
if (!slideId) {
  console.error('Usage: npm run render:timing -- SLIDE_ID');
  process.exit(1);
}

const videoDir = fileURLToPath(new URL('..', import.meta.url));
const timeline = readFileSync(resolve(videoDir, 'review-timeline.tsv'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('\t'));
const row = timeline.find(([, , candidate]) => candidate === slideId);

if (!row) {
  console.error(`Unknown review slide: ${slideId}`);
  process.exit(1);
}

const [sourceStartText, sourceEndText] = row;
const reviewStart = sourceSecondToReviewSecond(timestampToSeconds(sourceStartText));
const reviewEnd = sourceSecondToReviewSecond(timestampToSeconds(sourceEndText));
if (reviewStart === null || reviewEnd === null) {
  console.error(`${slideId} overlaps an editorial cut`);
  process.exit(1);
}

const fps = 10;
const startFrame = Math.round(reviewStart * fps);
const endFrame = Math.round(reviewEnd * fps);
const frames = [
  {label: 'before-start', frame: Math.max(0, startFrame - 1)},
  {label: 'at-start', frame: startFrame},
  {label: 'before-end', frame: Math.max(0, endFrame - 1)},
  {label: 'at-end', frame: endFrame},
];
const outputDir = resolve(videoDir, '../renders/timing-checks', slideId);
mkdirSync(outputDir, {recursive: true});

for (const item of frames) {
  const reviewTime = secondsToTimestamp(item.frame / fps).replaceAll(':', '-').replace('.', '-');
  const output = resolve(outputDir, `${item.label}-review-${reviewTime}.png`);
  const result = spawnSync('npx', [
    'remotion', 'still', 'src/index.ts', 'FullInterviewReviewDev', output,
    `--frame=${item.frame}`,
    `--props=${JSON.stringify({format: 'wide', withAudio: false})}`,
  ], {cwd: videoDir, stdio: 'inherit'});

  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`source  ${secondsToTimestamp(timestampToSeconds(sourceStartText))}–${secondsToTimestamp(timestampToSeconds(sourceEndText))}`);
console.log(`review  ${secondsToTimestamp(reviewStart)}–${secondsToTimestamp(reviewEnd)}`);
console.log(`frames  ${outputDir}`);
