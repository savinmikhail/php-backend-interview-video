const roundMilliseconds = (value) => Math.round(value);

const mergeAdjacent = (segments) => {
  const merged = [];
  for (const segment of segments) {
    if (segment.endMs <= segment.startMs) continue;
    const previous = merged.at(-1);
    if (previous?.speaker === segment.speaker && previous.endMs === segment.startMs) {
      previous.endMs = segment.endMs;
    } else {
      merged.push({...segment});
    }
  }
  return merged;
};

const suppressShortIsolatedRuns = (input, thresholdMs) => {
  const segments = input.map((segment) => ({...segment}));
  let changed = true;

  while (changed) {
    changed = false;
    for (let index = 1; index < segments.length - 1; index++) {
      const previous = segments[index - 1];
      const current = segments[index];
      const next = segments[index + 1];
      if (current.endMs - current.startMs > thresholdMs || previous.speaker !== next.speaker) continue;

      previous.endMs = next.endMs;
      segments.splice(index, 2);
      changed = true;
      break;
    }
  }

  return segments;
};

const applyOverrides = (input, overrides) => {
  let segments = input.map((segment) => ({...segment}));

  for (const override of overrides) {
    const updated = [];
    for (const segment of segments) {
      const overlapStart = Math.max(segment.startMs, override.startMs);
      const overlapEnd = Math.min(segment.endMs, override.endMs);
      if (overlapEnd <= overlapStart) {
        updated.push(segment);
        continue;
      }
      if (segment.startMs < overlapStart) updated.push({...segment, endMs: overlapStart});
      updated.push({startMs: overlapStart, endMs: overlapEnd, speaker: override.speaker});
      if (overlapEnd < segment.endMs) updated.push({...segment, startMs: overlapEnd});
    }
    segments = mergeAdjacent(updated);
  }

  return segments;
};

export const buildSpeakerTimeline = ({
  utterances,
  speakerMappings,
  initialSpeaker,
  reviewStartMs,
  reviewDurationMs,
  glitchThresholdMs,
  overrides = [],
}) => {
  if (!Array.isArray(utterances) || utterances.length === 0) {
    throw new Error('Diarization must contain utterances');
  }
  if (!Number.isFinite(reviewStartMs) || reviewStartMs < 0
    || !Number.isFinite(reviewDurationMs) || reviewDurationMs <= 0
    || !Number.isFinite(glitchThresholdMs) || glitchThresholdMs < 0) {
    throw new Error('Invalid speaker timeline timing configuration');
  }
  if (!Object.values(speakerMappings).includes(initialSpeaker)) {
    throw new Error(`Initial speaker is not mapped: ${initialSpeaker}`);
  }
  const allowedSpeakers = new Set(Object.values(speakerMappings));
  for (const override of overrides) {
    if (!allowedSpeakers.has(override.speaker)
      || !Number.isFinite(override.startMs)
      || !Number.isFinite(override.endMs)
      || override.startMs < 0
      || override.endMs <= override.startMs
      || override.endMs > reviewDurationMs) {
      throw new Error('Invalid speaker timeline override');
    }
  }

  const reviewEndMs = reviewStartMs + reviewDurationMs;
  const events = [{atMs: 0, speaker: initialSpeaker, order: -1}];
  utterances.forEach((utterance, order) => {
    const speaker = speakerMappings[utterance.speaker];
    if (!speaker) throw new Error(`No speaker mapping for ${utterance.speaker}`);
    if (!Number.isFinite(utterance.startMs) || !Number.isFinite(utterance.endMs)
      || utterance.startMs < 0 || utterance.endMs <= utterance.startMs) {
      throw new Error(`Invalid diarization utterance at index ${order}`);
    }
    // An intro utterance may cross the edit boundary. It must not become the
    // initial interview speaker merely because its tail survives numerically.
    if (utterance.startMs < reviewStartMs || utterance.startMs >= reviewEndMs) return;
    events.push({
      atMs: roundMilliseconds(utterance.startMs - reviewStartMs),
      speaker,
      order,
    });
  });

  events.sort((left, right) => left.atMs - right.atMs || left.order - right.order);
  const deduplicated = [];
  for (const event of events) {
    if (deduplicated.at(-1)?.atMs === event.atMs) deduplicated[deduplicated.length - 1] = event;
    else deduplicated.push(event);
  }

  const segments = [];
  let active = deduplicated[0].speaker;
  let startMs = 0;
  for (const event of deduplicated.slice(1)) {
    if (event.speaker === active) continue;
    segments.push({startMs, endMs: event.atMs, speaker: active});
    startMs = event.atMs;
    active = event.speaker;
  }
  segments.push({startMs, endMs: reviewDurationMs, speaker: active});

  const smoothed = suppressShortIsolatedRuns(mergeAdjacent(segments), glitchThresholdMs);
  return applyOverrides(smoothed, overrides);
};
