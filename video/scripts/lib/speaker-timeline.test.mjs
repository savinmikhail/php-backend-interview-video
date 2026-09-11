import assert from 'node:assert/strict';
import test from 'node:test';
import {buildSpeakerTimeline} from './speaker-timeline.mjs';

const speakerMappings = {
  Михаил: 'mikhail',
  Интервьюер: 'interviewer',
};

test('clips final-time diarization and suppresses an isolated short switch', () => {
  const segments = buildSpeakerTimeline({
    utterances: [
      {speaker: 'Михаил', startMs: 500, endMs: 1500},
      {speaker: 'Михаил', startMs: 2000, endMs: 2400},
      {speaker: 'Интервьюер', startMs: 3500, endMs: 3700},
      {speaker: 'Михаил', startMs: 3900, endMs: 4300},
      {speaker: 'Интервьюер', startMs: 5000, endMs: 5500},
    ],
    speakerMappings,
    initialSpeaker: 'interviewer',
    reviewStartMs: 1000,
    reviewDurationMs: 6000,
    glitchThresholdMs: 1000,
  });

  assert.deepEqual(segments, [
    {startMs: 0, endMs: 1000, speaker: 'interviewer'},
    {startMs: 1000, endMs: 4000, speaker: 'mikhail'},
    {startMs: 4000, endMs: 6000, speaker: 'interviewer'},
  ]);
});

test('applies reviewed overrides after smoothing', () => {
  const segments = buildSpeakerTimeline({
    utterances: [{speaker: 'Михаил', startMs: 2000, endMs: 3000}],
    speakerMappings,
    initialSpeaker: 'interviewer',
    reviewStartMs: 1000,
    reviewDurationMs: 4000,
    glitchThresholdMs: 1000,
    overrides: [{startMs: 2500, endMs: 4000, speaker: 'interviewer'}],
  });

  assert.deepEqual(segments, [
    {startMs: 0, endMs: 1000, speaker: 'interviewer'},
    {startMs: 1000, endMs: 2500, speaker: 'mikhail'},
    {startMs: 2500, endMs: 4000, speaker: 'interviewer'},
  ]);
});

test('rejects an unmapped diarization speaker', () => {
  assert.throws(() => buildSpeakerTimeline({
    utterances: [{speaker: 'Неизвестный', startMs: 1000, endMs: 2000}],
    speakerMappings,
    initialSpeaker: 'interviewer',
    reviewStartMs: 0,
    reviewDurationMs: 3000,
    glitchThresholdMs: 1000,
  }), /No speaker mapping/);
});
