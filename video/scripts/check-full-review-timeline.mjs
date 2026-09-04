import {readFileSync} from 'node:fs';

const tsvSegments = readFileSync('review-timeline.tsv', 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && !line.includes('video:'))
  .map((line) => line.split('\t').join('|'));

const source = readFileSync('src/FullInterviewReview.tsx', 'utf8');
const componentSegments = [...source.matchAll(
  /start: '([^']+)', end: '([^']+)', slideId: '([^']+)'/g,
)].map((match) => [match[1], match[2], match[3]].join('|'));

const missing = tsvSegments.filter((segment) => !componentSegments.includes(segment));
const extra = componentSegments.filter((segment) => !tsvSegments.includes(segment));

if (missing.length > 0 || extra.length > 0 || tsvSegments.length !== componentSegments.length) {
  console.error('FullInterviewReview timeline differs from review-timeline.tsv');
  if (missing.length > 0) console.error('Missing:', missing);
  if (extra.length > 0) console.error('Extra:', extra);
  process.exit(1);
}

console.log(`Full review timeline: ${componentSegments.length} slide segments match`);
