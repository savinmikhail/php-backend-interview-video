const STRONG_PUNCTUATION = /[.!?…][”»"]?$/u;
const NO_SPACE_BEFORE = /^[,.:;!?%\])}»…]+$/u;
const NO_SPACE_AFTER = /[(\[{«]$/u;

export const joinWordTexts = (values) => {
  let result = '';
  for (const rawValue of values) {
    const value = String(rawValue ?? '').trim();
    if (!value) continue;
    if (!result || NO_SPACE_BEFORE.test(value) || NO_SPACE_AFTER.test(result)) result += value;
    else result += ` ${value}`;
  }
  return result.trim();
};

export const applySegmentPunctuation = (words, segments) => {
  const result = words.map((word) => ({...word}));
  for (const segment of segments) {
    const punctuation = String(segment.text ?? '').trim().match(/[,.!?;:…]+[”»"]?$/u)?.[0];
    if (!punctuation) continue;
    const segmentEndMs = Math.round(Number(segment.end) * 1000);
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < result.length; index++) {
      const distance = Math.abs(Math.round(Number(result[index].end) * 1000) - segmentEndMs);
      if (distance <= bestDistance && distance <= 500) {
        bestIndex = index;
        bestDistance = distance;
      }
    }
    if (bestIndex !== -1 && !/[,.!?;:…][”»"]?$/u.test(result[bestIndex].word ?? result[bestIndex].text ?? '')) {
      const key = result[bestIndex].word === undefined ? 'text' : 'word';
      result[bestIndex][key] = `${result[bestIndex][key]}${punctuation}`;
    }
  }
  return result;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

export const applyReplacements = (text, replacements) => replacements.reduce(
  (value, replacement) => value.replace(
    new RegExp(escapeRegExp(replacement.from), replacement.caseSensitive ? 'gu' : 'giu'),
    replacement.to,
  ),
  text,
);

const overlapMs = (startA, endA, startB, endB) =>
  Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));

export const assignSpeakers = (words, diarizedSegments) => {
  const segments = diarizedSegments
    .map((segment) => ({
      startMs: Math.round(Number(segment.start) * 1000),
      endMs: Math.round(Number(segment.end) * 1000),
      speaker: String(segment.speaker ?? 'unknown'),
    }))
    .filter((segment) => Number.isFinite(segment.startMs)
      && Number.isFinite(segment.endMs)
      && segment.endMs > segment.startMs)
    .sort((left, right) => left.startMs - right.startMs);

  return words.map((word) => {
    const startMs = Math.round(Number(word.start) * 1000);
    const rawEndMs = Math.round(Number(word.end) * 1000);
    if (!Number.isFinite(startMs) || !Number.isFinite(rawEndMs) || rawEndMs < startMs) {
      throw new Error(`Invalid Whisper word timing: ${JSON.stringify(word)}`);
    }
    const endMs = Math.max(rawEndMs, startMs + 1);

    let best = null;
    let bestOverlap = -1;
    for (const segment of segments) {
      const overlap = overlapMs(startMs, endMs, segment.startMs, segment.endMs);
      if (overlap > bestOverlap) {
        best = segment;
        bestOverlap = overlap;
      }
      if (segment.startMs > endMs && bestOverlap > 0) break;
    }

    if (!best || bestOverlap === 0) {
      const midpoint = (startMs + endMs) / 2;
      best = segments.reduce((closest, segment) => {
        const segmentMidpoint = (segment.startMs + segment.endMs) / 2;
        const distance = Math.abs(segmentMidpoint - midpoint);
        return !closest || distance < closest.distance ? {segment, distance} : closest;
      }, null)?.segment ?? null;
    }

    return {
      text: String(word.word ?? word.text ?? '').trim(),
      startMs,
      endMs,
      speaker: best?.speaker ?? 'unknown',
    };
  }).filter((word) => word.text);
};

export const smoothSpeakerRuns = (words, maxGlitchMs) => {
  const result = words.map((word) => ({...word}));
  let start = 0;
  while (start < result.length) {
    let end = start + 1;
    while (end < result.length && result[end].speaker === result[start].speaker) end++;
    const previous = result[start - 1];
    const next = result[end];
    const durationMs = result[end - 1].endMs - result[start].startMs;
    if (previous && next
      && previous.speaker === next.speaker
      && previous.speaker !== result[start].speaker
      && durationMs <= maxGlitchMs) {
      for (let index = start; index < end; index++) result[index].speaker = previous.speaker;
    }
    start = end;
  }
  return result;
};

const cueTextLength = (words) => joinWordTexts(words.map((word) => word.text)).length;

export const buildCues = (words, options) => {
  const maxCharacters = options.maxCharsPerLine * options.maxLines;
  const cues = [];
  let current = [];

  const flush = () => {
    if (current.length === 0) return;
    cues.push({
      speaker: current[0].speaker,
      text: joinWordTexts(current.map((word) => word.text)),
      startMs: current[0].startMs,
      endMs: current.at(-1).endMs,
      timestampMs: null,
      confidence: null,
    });
    current = [];
  };

  for (const word of words) {
    const previous = current.at(-1);
    const candidate = [...current, word];
    const speakerChanged = previous && previous.speaker !== word.speaker;
    const silenceBreak = previous && word.startMs - previous.endMs >= options.silenceBreakMs;
    const durationExceeded = current.length > 0
      && word.endMs - current[0].startMs > options.maxCueDurationMs;
    const candidateLength = cueTextLength(candidate);
    const shortSentenceEnding = STRONG_PUNCTUATION.test(word.text)
      && word.endMs - word.startMs < options.minCueDurationMs;
    const lengthExceeded = current.length > 0
      && candidateLength > maxCharacters
      && !(shortSentenceEnding && candidateLength <= maxCharacters + 12);

    if (speakerChanged || silenceBreak || durationExceeded || lengthExceeded) flush();
    current.push(word);

    if (STRONG_PUNCTUATION.test(word.text)
      && current.at(-1).endMs - current[0].startMs >= 900) flush();
  }
  flush();

  return cues.map((cue, index) => {
    const next = cues[index + 1];
    const nonOverlappingEnd = next && cue.endMs > next.startMs ? next.startMs : cue.endMs;
    const readableEnd = Math.max(
      nonOverlappingEnd,
      Math.min(cue.startMs + options.minCueDurationMs, next?.startMs ?? Number.POSITIVE_INFINITY),
    );
    return {...cue, endMs: readableEnd};
  });
};

export const mergeShortCues = (cues, options) => {
  const maxCharacters = options.maxCharsPerLine * options.maxLines + 12;
  const result = cues.map((cue) => ({...cue}));
  let index = 0;
  while (index < result.length) {
    const cue = result[index];
    if (cue.endMs - cue.startMs >= options.minCueDurationMs) {
      index++;
      continue;
    }

    const previous = result[index - 1];
    const next = result[index + 1];
    const mergeForward = next
      && next.startMs - cue.endMs <= options.silenceBreakMs
      && joinWordTexts([cue.text, next.text]).length <= maxCharacters
      && !STRONG_PUNCTUATION.test(cue.text);
    const mergeBackward = previous
      && cue.startMs - previous.endMs <= options.silenceBreakMs
      && joinWordTexts([previous.text, cue.text]).length <= maxCharacters;

    if (mergeForward) {
      result.splice(index, 2, {
        ...cue,
        text: joinWordTexts([cue.text, next.text]),
        endMs: next.endMs,
      });
      continue;
    }
    if (mergeBackward) {
      result.splice(index - 1, 2, {
        ...previous,
        text: joinWordTexts([previous.text, cue.text]),
        endMs: cue.endMs,
      });
      index = Math.max(0, index - 1);
      continue;
    }
    index++;
  }
  return result;
};

export const wrapText = (text, maxCharsPerLine, maxLines) => {
  const words = text.trim().split(/\s+/u);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxCharsPerLine && lines.length < maxLines - 1) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
};

export const formatSrtTimestamp = (milliseconds) => {
  const value = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(value / 3_600_000);
  const minutes = Math.floor((value % 3_600_000) / 60_000);
  const seconds = Math.floor((value % 60_000) / 1000);
  const millis = value % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
};

export const renderSrt = (cues, options) => `${cues.map((cue, index) => [
  String(index + 1),
  `${formatSrtTimestamp(cue.startMs)} --> ${formatSrtTimestamp(cue.endMs)}`,
  wrapText(cue.text, options.maxCharsPerLine, options.maxLines),
].join('\n')).join('\n\n')}\n`;

export const renderTranscript = (cues) => `${cues.map((cue) =>
  `[${formatSrtTimestamp(cue.startMs).replace(',', '.')}–${formatSrtTimestamp(cue.endMs).replace(',', '.')}] [${cue.speaker}] ${cue.text}`
).join('\n')}\n`;

export const validateCues = (cues, durationMs) => {
  const errors = [];
  if (cues.length === 0) errors.push('No caption cues were generated');
  cues.forEach((cue, index) => {
    if (!cue.text?.trim()) errors.push(`Cue ${index + 1} has empty text`);
    if (!Number.isFinite(cue.startMs) || !Number.isFinite(cue.endMs) || cue.endMs <= cue.startMs) {
      errors.push(`Cue ${index + 1} has invalid timing`);
    }
    if (index > 0 && cue.startMs < cues[index - 1].endMs) {
      errors.push(`Cue ${index + 1} overlaps cue ${index}`);
    }
    if (cue.endMs > durationMs + 250) errors.push(`Cue ${index + 1} ends after the audio`);
  });
  if (errors.length > 0) throw new Error(errors.slice(0, 20).join('\n'));
};
