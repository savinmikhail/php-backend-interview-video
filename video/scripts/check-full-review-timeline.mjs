import {readFileSync} from 'node:fs';
import ts from 'typescript';
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

const generatedRows = JSON.parse(
  readFileSync('src/generated/review-timeline.json', 'utf8'),
);
const serialize = ({start, end, slideId}) => [start, end, slideId].join('|');
const tsvSegments = timelineRows.map(serialize);
const generatedSegments = generatedRows.map(serialize);
const missingGenerated = tsvSegments.filter((segment) => !generatedSegments.includes(segment));
const extraGenerated = generatedSegments.filter((segment) => !tsvSegments.includes(segment));

if (
  missingGenerated.length > 0
  || extraGenerated.length > 0
  || tsvSegments.length !== generatedSegments.length
) {
  console.error('Generated review timeline differs from review-timeline.tsv');
  if (missingGenerated.length > 0) console.error('Missing:', missingGenerated);
  if (extraGenerated.length > 0) console.error('Extra:', extraGenerated);
  process.exit(1);
}

const slideSource = readFileSync('src/ReviewSlide.tsx', 'utf8');
const slideFile = ts.createSourceFile(
  'src/ReviewSlide.tsx',
  slideSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const reviewSlidesDeclaration = slideFile.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => statement.declarationList.declarations)
  .find((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'reviewSlides');

if (!reviewSlidesDeclaration || !ts.isArrayLiteralExpression(reviewSlidesDeclaration.initializer)) {
  console.error('Could not find the reviewSlides array in src/ReviewSlide.tsx');
  process.exit(1);
}

const slideIdFromCall = (call) => {
  if (!ts.isIdentifier(call.expression) || !['q', 's', 'custom'].includes(call.expression.text)) return null;
  const id = call.arguments[0];
  return id && ts.isStringLiteralLike(id) ? id.text : null;
};

const slideIdFromElement = (element) => {
  if (ts.isCallExpression(element)) return slideIdFromCall(element);
  if (!ts.isObjectLiteralExpression(element)) return null;

  for (const property of element.properties) {
    if (ts.isSpreadAssignment(property) && ts.isCallExpression(property.expression)) {
      const id = slideIdFromCall(property.expression);
      if (id) return id;
    }
    if (ts.isPropertyAssignment(property)
      && ts.isIdentifier(property.name)
      && property.name.text === 'id'
      && ts.isStringLiteralLike(property.initializer)) {
      return property.initializer.text;
    }
  }
  return null;
};

const registeredIds = reviewSlidesDeclaration.initializer.elements.map(slideIdFromElement);
const unreadableEntries = registeredIds
  .map((slideId, index) => slideId ? null : index + 1)
  .filter((index) => index !== null);

if (unreadableEntries.length > 0) {
  console.error('Could not read slide IDs from reviewSlides entries:', unreadableEntries);
  process.exit(1);
}
const timelineIds = timelineRows.map(({slideId}) => slideId);
const missingSlides = timelineIds.filter((slideId) => !registeredIds.includes(slideId));
const unusedSlides = registeredIds.filter((slideId) => !timelineIds.includes(slideId));
const duplicateSlides = registeredIds.filter(
  (slideId, index) => registeredIds.indexOf(slideId) !== index,
);
const orderMismatches = timelineIds
  .map((slideId, index) => registeredIds[index] === slideId
    ? null
    : `${index + 1}: timeline=${slideId}, registry=${registeredIds[index] ?? 'missing'}`)
  .filter((mismatch) => mismatch !== null);

if (
  missingSlides.length > 0
  || unusedSlides.length > 0
  || duplicateSlides.length > 0
  || orderMismatches.length > 0
  || registeredIds.length !== timelineIds.length
) {
  console.error('ReviewSlide registry differs from the active review timeline');
  if (missingSlides.length > 0) console.error('Missing slides:', missingSlides);
  if (unusedSlides.length > 0) console.error('Unused slides:', unusedSlides);
  if (duplicateSlides.length > 0) console.error('Duplicate slides:', duplicateSlides);
  if (orderMismatches.length > 0) console.error('Order mismatches:', orderMismatches);
  process.exit(1);
}
const invalidRanges = [];
for (const [index, segment] of timelineRows.entries()) {
  const sourceStart = timestampToSeconds(segment.start);
  const sourceEnd = timestampToSeconds(segment.end);
  const reviewStart = sourceSecondToReviewSecond(sourceStart);
  const reviewEnd = sourceSecondToReviewSecond(sourceEnd);

  if (sourceEnd <= sourceStart) invalidRanges.push(`${segment.slideId}: duration must be positive`);
  const previous = timelineRows[index - 1];
  if (previous && sourceStart < timestampToSeconds(previous.end)) {
    invalidRanges.push(
      `${previous.slideId} overlaps ${segment.slideId}: ${previous.end} > ${segment.start}`,
    );
  }
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

console.log(`Full review timeline: ${generatedSegments.length} generated segments and registered slides match`);
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
