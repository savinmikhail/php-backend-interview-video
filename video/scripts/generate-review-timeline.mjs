import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const videoDir = fileURLToPath(new URL('..', import.meta.url));
const sourcePath = resolve(videoDir, 'review-timeline.tsv');
const outputPath = resolve(videoDir, 'src/generated/review-timeline.json');

const segments = readFileSync(sourcePath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && !line.includes('video:'))
  .map((line, index) => {
    const columns = line.split('\t');
    if (columns.length !== 3 || columns.some((column) => column.length === 0)) {
      throw new Error(`Invalid review timeline row ${index + 1}: ${line}`);
    }
    const [start, end, slideId] = columns;
    return {start, end, slideId};
  });

const duplicateIds = segments
  .map(({slideId}) => slideId)
  .filter((slideId, index, ids) => ids.indexOf(slideId) !== index);

if (duplicateIds.length > 0) {
  throw new Error(`Duplicate review slide IDs: ${[...new Set(duplicateIds)].join(', ')}`);
}

const generated = `${JSON.stringify(segments, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) {
    console.error('Generated review timeline is stale. Run npm run timeline:generate.');
    process.exit(1);
  }
  console.log(`Review timeline: ${segments.length} generated segment(s) match`);
  process.exit(0);
}

mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, generated);
console.log(`Review timeline: wrote ${segments.length} segment(s) to ${outputPath}`);
