import {execFileSync} from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import {basename, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  applyReplacements,
  applySegmentPunctuation,
  assignSpeakers,
  buildCues,
  mergeShortCues,
  renderSrt,
  renderTranscript,
  smoothSpeakerRuns,
  validateCues,
} from './lib/captions.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');

const loadEnvFile = (path, overwrite) => {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separator = line.indexOf('=');
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (overwrite || process.env[key] === undefined) process.env[key] = value;
  }
};

loadEnvFile(resolve(projectRoot, '.env.local'), false);
loadEnvFile(resolve(projectRoot, '.env'), false);

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
};

const hasFlag = (name) => process.argv.includes(name);
const numberSetting = (name) => {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
  return value;
};

const inputArgument = argumentValue('--input');
const outputArgument = argumentValue('--output');
const replacementsArgument = argumentValue('--replacements');
const speakersArgument = argumentValue('--speakers');
if (!outputArgument) {
  throw new Error('Usage: npm run captions:transcribe -- --input <audio> --output <directory> [--replacements <json>] [--speakers <json>] [--force]\nFor rebuilding derived files: npm run captions:build -- --output <directory>');
}

const outputDirectory = resolve(process.cwd(), outputArgument);
const buildOnly = hasFlag('--build-only');
const fromRaw = hasFlag('--from-raw');
const prepareOnly = hasFlag('--prepare-only');
const force = hasFlag('--force');
const paths = {
  metadata: resolve(outputDirectory, 'metadata.json'),
  uploadAudio: resolve(outputDirectory, 'audio-upload.mp3'),
  diarizedRaw: resolve(outputDirectory, 'diarized.raw.json'),
  wordsRaw: resolve(outputDirectory, 'words.raw.json'),
  words: resolve(outputDirectory, 'words.json'),
  utterancesRaw: resolve(outputDirectory, 'utterances.raw.json'),
  utterancesReview: resolve(outputDirectory, 'utterances.review.json'),
  captions: resolve(outputDirectory, 'captions.json'),
  srt: resolve(outputDirectory, 'captions.srt'),
  transcript: resolve(outputDirectory, 'transcript.txt'),
};

const options = {
  language: process.env.CAPTIONS_LANGUAGE,
  diarizeModel: process.env.CAPTIONS_DIARIZE_MODEL,
  wordModel: process.env.CAPTIONS_WORD_MODEL,
  maxUploadBytes: numberSetting('CAPTIONS_MAX_UPLOAD_BYTES'),
  maxAudioBitrateKbps: numberSetting('CAPTIONS_MAX_AUDIO_BITRATE_KBPS'),
  minAudioBitrateKbps: numberSetting('CAPTIONS_MIN_AUDIO_BITRATE_KBPS'),
  maxChunkSeconds: numberSetting('CAPTIONS_MAX_CHUNK_SECONDS'),
  apiConcurrency: numberSetting('CAPTIONS_API_CONCURRENCY'),
  maxCharsPerLine: numberSetting('CAPTIONS_MAX_CHARS_PER_LINE'),
  maxLines: numberSetting('CAPTIONS_MAX_LINES'),
  maxCueDurationMs: numberSetting('CAPTIONS_MAX_CUE_DURATION_MS'),
  silenceBreakMs: numberSetting('CAPTIONS_SILENCE_BREAK_MS'),
  minCueDurationMs: numberSetting('CAPTIONS_MIN_CUE_DURATION_MS'),
  speakerGlitchMs: numberSetting('CAPTIONS_SPEAKER_GLITCH_MS'),
};

const replacements = replacementsArgument
  ? JSON.parse(readFileSync(resolve(process.cwd(), replacementsArgument), 'utf8'))
  : [];
if (!Array.isArray(replacements)
  || replacements.some((item) => typeof item.from !== 'string' || typeof item.to !== 'string')) {
  throw new Error('Replacement file must contain an array of {from, to, caseSensitive?} objects');
}
const speakerMap = speakersArgument
  ? JSON.parse(readFileSync(resolve(process.cwd(), speakersArgument), 'utf8'))
  : {};
if (!speakerMap || Array.isArray(speakerMap)
  || Object.entries(speakerMap).some(([from, to]) => !from || typeof to !== 'string' || !to)) {
  throw new Error('Speaker file must contain an object mapping diarization labels to names');
}

const writeJsonAtomic = (path, value) => {
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, path);
};

const probeAudio = (path) => {
  const output = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration,size,bit_rate',
    '-of', 'json',
    path,
  ], {encoding: 'utf8'});
  const format = JSON.parse(output).format ?? {};
  const durationSeconds = Number(format.duration);
  const sizeBytes = Number(format.size);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(sizeBytes)) {
    throw new Error(`Unable to probe audio: ${path}`);
  }
  return {durationSeconds, sizeBytes, bitRate: Number(format.bit_rate) || null};
};

const chooseBitrate = (durationSeconds) => {
  const safeBits = options.maxUploadBytes * 8 * 0.94;
  const longestUploadSeconds = Math.min(durationSeconds, options.maxChunkSeconds);
  const fittingKbps = Math.floor(safeBits / longestUploadSeconds / 1000 / 8) * 8;
  const bitrate = Math.min(options.maxAudioBitrateKbps, fittingKbps);
  if (bitrate < options.minAudioBitrateKbps) {
    throw new Error(`Audio is too long for a single upload at ${options.minAudioBitrateKbps} kbps; split support is required`);
  }
  return bitrate;
};

const prepareAudio = (inputPath) => {
  const source = probeAudio(inputPath);
  const bitrateKbps = chooseBitrate(source.durationSeconds);
  console.log(`Source: ${source.durationSeconds.toFixed(3)}s, ${(source.sizeBytes / 1_000_000).toFixed(2)} MB`);
  console.log(`Preparing mono 16 kHz upload at ${bitrateKbps} kbps`);
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', inputPath,
    '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '16000',
    '-codec:a', 'libmp3lame', '-b:a', `${bitrateKbps}k`,
    '-map_metadata', '-1',
    paths.uploadAudio,
  ], {stdio: 'inherit'});
  const prepared = probeAudio(paths.uploadAudio);
  const durationDelta = Math.abs(prepared.durationSeconds - source.durationSeconds);
  if (durationDelta > 0.1) {
    throw new Error(`Prepared audio duration shifted by ${durationDelta.toFixed(3)}s`);
  }
  console.log(`Prepared: ${prepared.durationSeconds.toFixed(3)}s, ${(prepared.sizeBytes / 1_000_000).toFixed(2)} MB`);

  const chunksDirectory = resolve(outputDirectory, 'audio-chunks');
  mkdirSync(chunksDirectory, {recursive: true});
  for (const name of readdirSync(chunksDirectory)) {
    if (/^audio-\d{3}\.mp3$/u.test(name)) unlinkSync(resolve(chunksDirectory, name));
  }

  if (prepared.durationSeconds <= options.maxChunkSeconds && prepared.sizeBytes < options.maxUploadBytes) {
    return {
      source,
      prepared,
      bitrateKbps,
      chunks: [{path: paths.uploadAudio, offsetMs: 0, durationMs: Math.round(prepared.durationSeconds * 1000)}],
    };
  }

  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', paths.uploadAudio,
    '-map', '0:a:0', '-codec:a', 'copy',
    '-f', 'segment', '-segment_time', String(options.maxChunkSeconds),
    '-reset_timestamps', '1',
    resolve(chunksDirectory, 'audio-%03d.mp3'),
  ], {stdio: 'inherit'});

  let offsetMs = 0;
  const chunks = readdirSync(chunksDirectory)
    .filter((name) => /^audio-\d{3}\.mp3$/u.test(name))
    .sort()
    .map((name) => {
      const path = resolve(chunksDirectory, name);
      const probe = probeAudio(path);
      if (probe.sizeBytes >= options.maxUploadBytes) {
        throw new Error(`Prepared chunk is too large: ${path} (${probe.sizeBytes} bytes)`);
      }
      if (probe.durationSeconds > options.maxChunkSeconds + 1) {
        throw new Error(`Prepared chunk exceeds configured duration: ${path} (${probe.durationSeconds}s)`);
      }
      const chunk = {path, offsetMs, durationMs: Math.round(probe.durationSeconds * 1000)};
      offsetMs += chunk.durationMs;
      return chunk;
    });
  if (chunks.length === 0) throw new Error('FFmpeg did not create audio chunks');
  if (Math.abs(offsetMs - Math.round(source.durationSeconds * 1000)) > 250) {
    throw new Error(`Chunk durations differ from source by ${offsetMs - Math.round(source.durationSeconds * 1000)}ms`);
  }
  console.log(`Prepared ${chunks.length} API chunks`);
  return {source, prepared, bitrateKbps, chunks};
};

const transcribe = async (audioPath, fields) => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is missing from the environment or video/.env.local');
  const form = new FormData();
  const audio = readFileSync(audioPath);
  form.append('file', new File([audio], basename(audioPath), {type: 'audio/mpeg'}));
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) value.forEach((item) => form.append(`${key}[]`, item));
    else form.append(key, String(value));
  }
  const response = await fetch(`${process.env.OPENAI_BASE_URL.replace(/\/$/u, '')}/audio/transcriptions`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`},
    body: form,
    signal: AbortSignal.timeout(60 * 60 * 1000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`OpenAI transcription failed (${response.status}): ${body.slice(0, 1000)}`);
  return JSON.parse(body);
};

const mapConcurrent = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
};

const transcribeChunks = async (chunks, kind, fields) => {
  const rawDirectory = resolve(outputDirectory, 'raw');
  mkdirSync(rawDirectory, {recursive: true});
  return mapConcurrent(chunks, options.apiConcurrency, async (chunk, index) => {
    console.log(`${kind} chunk ${index + 1}/${chunks.length}...`);
    const response = await transcribe(chunk.path, fields);
    const result = {
      index,
      offsetMs: chunk.offsetMs,
      durationMs: chunk.durationMs,
      response,
    };
    writeJsonAtomic(resolve(rawDirectory, `${kind}-${String(index).padStart(3, '0')}.json`), result);
    console.log(`${kind} chunk ${index + 1}/${chunks.length} saved`);
    return result;
  });
};

const buildDerivedFiles = (durationMs) => {
  const review = JSON.parse(readFileSync(paths.utterancesReview, 'utf8'));
  validateCues(review, durationMs);
  const subtitleCues = mergeShortCues(review, options);
  validateCues(subtitleCues, durationMs);
  const captions = subtitleCues.map(({text, startMs, endMs, timestampMs = null, confidence = null}) => ({
    text, startMs, endMs, timestampMs, confidence,
  }));
  writeJsonAtomic(paths.captions, captions);
  writeFileSync(paths.srt, renderSrt(subtitleCues, options), 'utf8');
  writeFileSync(paths.transcript, renderTranscript(review), 'utf8');
  console.log(`Built ${review.length} diarized cues and ${subtitleCues.length} subtitle cues`);
  console.log(`SRT: ${paths.srt}`);
};

const buildReviewFromRaw = (diarizedChunks, wordChunks, durationMs) => {
  if (diarizedChunks.some((chunk) => !Array.isArray(chunk.response.segments))
    || wordChunks.some((chunk) => !Array.isArray(chunk.response.words))) {
    throw new Error('OpenAI responses do not contain the expected diarized segments and timed words');
  }

  const diarizedSegments = diarizedChunks.flatMap((chunk) => chunk.response.segments.map((segment) => ({
    ...segment,
    start: (chunk.offsetMs + Number(segment.start) * 1000) / 1000,
    end: (chunk.offsetMs + Number(segment.end) * 1000) / 1000,
    speaker: `${String(chunk.index + 1).padStart(2, '0')}:${segment.speaker ?? 'unknown'}`,
  })));
  const words = wordChunks.flatMap((chunk) => {
    const punctuated = applySegmentPunctuation(chunk.response.words, chunk.response.segments ?? []);
    return punctuated.map((word) => ({
      ...word,
      start: (chunk.offsetMs + Number(word.start) * 1000) / 1000,
      end: (chunk.offsetMs + Number(word.end) * 1000) / 1000,
    }));
  });
  console.log(`Loaded ${diarizedSegments.length} diarized segments and ${words.length} timed words`);

  const timedWords = smoothSpeakerRuns(
    assignSpeakers(words, diarizedSegments),
    options.speakerGlitchMs,
  ).map((word) => ({...word, speaker: speakerMap[word.speaker] ?? word.speaker}));
  writeJsonAtomic(paths.words, timedWords);
  const cues = buildCues(timedWords, options);
  validateCues(cues, durationMs);
  writeJsonAtomic(paths.utterancesRaw, cues);
  if (!existsSync(paths.utterancesReview) || hasFlag('--reset-review')) {
    writeJsonAtomic(paths.utterancesReview, cues.map((cue) => ({
      ...cue,
      text: applyReplacements(cue.text, replacements),
    })));
  } else {
    console.log(`Preserved existing review file: ${paths.utterancesReview}`);
  }
  buildDerivedFiles(durationMs);
};

mkdirSync(outputDirectory, {recursive: true});

if (buildOnly) {
  if (!existsSync(paths.metadata) || !existsSync(paths.utterancesReview)) {
    throw new Error('Build-only requires metadata.json and utterances.review.json in the output directory');
  }
  const metadata = JSON.parse(readFileSync(paths.metadata, 'utf8'));
  buildDerivedFiles(Math.round(metadata.source.durationSeconds * 1000));
  process.exit(0);
}

if (fromRaw) {
  if (!existsSync(paths.metadata) || !existsSync(paths.diarizedRaw) || !existsSync(paths.wordsRaw)) {
    throw new Error('From-raw requires metadata.json, diarized.raw.json, and words.raw.json');
  }
  const metadata = JSON.parse(readFileSync(paths.metadata, 'utf8'));
  const diarized = JSON.parse(readFileSync(paths.diarizedRaw, 'utf8'));
  const words = JSON.parse(readFileSync(paths.wordsRaw, 'utf8'));
  buildReviewFromRaw(diarized.chunks, words.chunks, Math.round(metadata.source.durationSeconds * 1000));
  process.exit(0);
}

if (!inputArgument) throw new Error('--input is required unless --build-only is used');
const inputPath = resolve(process.cwd(), inputArgument);
if (!existsSync(inputPath)) throw new Error(`Input file not found: ${inputPath}`);
if (existsSync(paths.metadata) && !force) {
  throw new Error(`Output already contains a run: ${outputDirectory}. Pass --force to replace raw results.`);
}

const prepared = prepareAudio(inputPath);
const metadata = {
  createdAt: new Date().toISOString(),
  inputFile: basename(inputPath),
  source: prepared.source,
  upload: {...prepared.prepared, bitrateKbps: prepared.bitrateKbps},
  chunks: prepared.chunks.map(({path, offsetMs, durationMs}) => ({
    file: basename(path), offsetMs, durationMs,
  })),
  models: {diarize: options.diarizeModel, words: options.wordModel},
  language: options.language,
};
writeJsonAtomic(paths.metadata, metadata);

if (prepareOnly) {
  console.log(`Prepared without API calls: ${paths.uploadAudio}`);
  process.exit(0);
}

console.log(`Requesting ${options.diarizeModel} diarization...`);
const diarizedChunks = await transcribeChunks(prepared.chunks, 'diarized', {
  model: options.diarizeModel,
  language: options.language,
  response_format: 'diarized_json',
  chunking_strategy: 'auto',
});
writeJsonAtomic(paths.diarizedRaw, {model: options.diarizeModel, chunks: diarizedChunks});

console.log(`Requesting ${options.wordModel} word timestamps...`);
const wordChunks = await transcribeChunks(prepared.chunks, 'words', {
  model: options.wordModel,
  language: options.language,
  response_format: 'verbose_json',
  timestamp_granularities: ['word', 'segment'],
});
writeJsonAtomic(paths.wordsRaw, {model: options.wordModel, chunks: wordChunks});

buildReviewFromRaw(
  diarizedChunks,
  wordChunks,
  Math.round(prepared.source.durationSeconds * 1000),
);
