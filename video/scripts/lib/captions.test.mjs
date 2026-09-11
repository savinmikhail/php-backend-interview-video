import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyReplacements,
  applySegmentPunctuation,
  assignSpeakers,
  buildCues,
  formatSrtTimestamp,
  joinWordTexts,
  mergeShortCues,
  renderSrt,
  smoothSpeakerRuns,
  validateCues,
} from './captions.mjs';

test('restores punctuation from Whisper segments', () => {
  const words = applySegmentPunctuation(
    [{word: 'SOLID', start: 0.5, end: 1}],
    [{text: ' Что такое SOLID?', start: 0, end: 1}],
  );
  assert.equal(words[0].word, 'SOLID?');
});

test('applies episode-specific literal replacements', () => {
  assert.equal(
    applyReplacements('middle symphony разработчик', [{from: 'symphony', to: 'Symfony'}]),
    'middle Symfony разработчик',
  );
});

test('joins punctuation without introducing spaces before it', () => {
  assert.equal(joinWordTexts(['Что', 'такое', 'SOLID', '?']), 'Что такое SOLID?');
});

test('assigns each word to the diarized segment with the largest overlap', () => {
  const words = assignSpeakers([
    {word: 'Привет', start: 0.1, end: 0.5},
    {word: 'Здравствуйте', start: 1.1, end: 1.8},
  ], [
    {speaker: 'A', start: 0, end: 1},
    {speaker: 'B', start: 1, end: 2},
  ]);
  assert.deepEqual(words.map((word) => word.speaker), ['A', 'B']);
});

test('expands a zero-duration Whisper word to one millisecond', () => {
  const [word] = assignSpeakers(
    [{word: 'слово', start: 1.25, end: 1.25}],
    [{speaker: 'A', start: 1, end: 2}],
  );
  assert.equal(word.endMs - word.startMs, 1);
});

test('smooths a short diarization glitch between words by the same speaker', () => {
  const words = smoothSpeakerRuns([
    {text: 'Binary', startMs: 0, endMs: 300, speaker: 'A'},
    {text: 'response', startMs: 300, endMs: 450, speaker: 'B'},
    {text: 'и', startMs: 500, endMs: 600, speaker: 'A'},
  ], 350);
  assert.deepEqual(words.map((word) => word.speaker), ['A', 'A', 'A']);
});

test('splits cues on speaker changes and produces valid SRT', () => {
  const cues = buildCues([
    {text: 'Привет.', startMs: 0, endMs: 700, speaker: 'A'},
    {text: 'Как', startMs: 900, endMs: 1100, speaker: 'B'},
    {text: 'дела?', startMs: 1120, endMs: 1600, speaker: 'B'},
  ], {
    maxCharsPerLine: 42,
    maxLines: 2,
    maxCueDurationMs: 6000,
    silenceBreakMs: 650,
    minCueDurationMs: 700,
  });
  assert.equal(cues.length, 2);
  validateCues(cues, 2000);
  assert.match(renderSrt(cues, {maxCharsPerLine: 42, maxLines: 2}), /00:00:00,000 --> 00:00:00,700/);
  assert.equal(formatSrtTimestamp(3_661_007), '01:01:01,007');
});

test('merges a short unfinished cue forward for readable subtitles', () => {
  const cues = mergeShortCues([
    {text: 'Или на', startMs: 0, endMs: 300, speaker: 'A'},
    {text: 'Паскале.', startMs: 320, endMs: 1200, speaker: 'B'},
  ], {maxCharsPerLine: 42, maxLines: 2, minCueDurationMs: 700, silenceBreakMs: 650});
  assert.deepEqual(cues.map((cue) => cue.text), ['Или на Паскале.']);
});
