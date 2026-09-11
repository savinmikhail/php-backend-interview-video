import {readFileSync, renameSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {basename, resolve} from 'node:path';

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
};

const inputArgument = argumentValue('--input');
if (!inputArgument) {
  throw new Error('Usage: npm run speakers:import -- --input <utterances.review.json>');
}

const projectRoot = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(projectRoot, 'speaker-diarization.config.json'), 'utf8'));
const inputPath = resolve(process.cwd(), inputArgument);
const outputPath = resolve(projectRoot, config.diarization);
const input = readFileSync(inputPath, 'utf8');
const utterances = JSON.parse(input);

if (!Array.isArray(utterances) || utterances.length === 0) {
  throw new Error('Diarization input must be a non-empty utterance array');
}

const compact = utterances.map((utterance, index) => {
  if (typeof utterance.speaker !== 'string'
    || !Number.isFinite(utterance.startMs)
    || !Number.isFinite(utterance.endMs)
    || utterance.endMs <= utterance.startMs) {
    throw new Error(`Invalid diarization utterance at index ${index}`);
  }
  return {
    speaker: utterance.speaker,
    startMs: Math.round(utterance.startMs),
    endMs: Math.round(utterance.endMs),
  };
});

const serialized = `${JSON.stringify({
  importedFrom: basename(inputPath),
  sourceSha256: createHash('sha256').update(input).digest('hex'),
  timeScale: config.timeScale,
  utterances: compact,
}, null, 2)}\n`;
const temporaryPath = `${outputPath}.tmp`;
writeFileSync(temporaryPath, serialized, 'utf8');
renameSync(temporaryPath, outputPath);
console.log(`Imported ${compact.length} utterance(s) into ${config.diarization}`);
