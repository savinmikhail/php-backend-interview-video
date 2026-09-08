import {createContext, useContext, type ReactNode} from 'react';
import generatedTimeline from './generated/speaker-timeline.json';
import type {Speaker} from './timeline';

type SpeakerSegment = {
  start: number;
  end: number;
  speaker: Speaker;
};

const segments = generatedTimeline.segments as SpeakerSegment[];
const ReviewSpeakerContext = createContext<Speaker | null>(null);

export const speakerAtReviewSecond = (second: number): Speaker => {
  let low = 0;
  let high = segments.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const segment = segments[middle];
    if (second < segment.start) high = middle - 1;
    else if (second >= segment.end) low = middle + 1;
    else return segment.speaker;
  }

  return 'interviewer';
};

export const ReviewSpeakerProvider = ({
  children,
  speaker,
}: {
  children: ReactNode;
  speaker: Speaker;
}) => (
  <ReviewSpeakerContext.Provider value={speaker}>
    {children}
  </ReviewSpeakerContext.Provider>
);

export const useReviewSpeaker = () => useContext(ReviewSpeakerContext);
