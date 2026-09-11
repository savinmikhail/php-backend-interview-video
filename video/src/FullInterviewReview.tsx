import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {BaseReview} from './BaseReview';
import type {Format} from './InterviewShell';
import {ReviewSlide} from './ReviewSlide';
import {
  hasReviewVisualAtSourceSecond,
  reviewSegments,
  reviewSlideDuration,
  reviewSlideStartFrame,
} from './reviewTimeline';
import {ReviewSpeakerProvider, speakerAtReviewSecond} from './speakerTimeline';
import {
  reviewDurationSeconds,
  reviewSecondToSourceSecond,
} from './timeMap';

type Props = {
  format: Format;
  withAudio?: boolean;
};

const FULL_REVIEW_AUDIO = 'generated/full-review-audio-cut.m4a';
export const FULL_REVIEW_DURATION = reviewDurationSeconds;

const BaseTrack = ({format}: {format: Format}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sourceSecond = reviewSecondToSourceSecond(frame / fps);
  const hasVisual = hasReviewVisualAtSourceSecond(sourceSecond);

  return hasVisual ? null : (
    <BaseReview format={format} speakerFrame={Math.round(sourceSecond * fps)} />
  );
};

export const FullInterviewReview = ({format, withAudio = true}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const speaker = speakerAtReviewSecond(frame / fps);

  return (
    <ReviewSpeakerProvider speaker={speaker}>
      <AbsoluteFill>
      {withAudio && <Audio src={staticFile(FULL_REVIEW_AUDIO)} />}

      <Sequence
        name="Базовая сцена"
        durationInFrames={Math.round(FULL_REVIEW_DURATION * fps)}
        premountFor={fps}
      >
        <BaseTrack format={format} />
      </Sequence>

      {reviewSegments.map(({slideId}) => (
        <Sequence
          key={slideId}
          name={slideId}
          from={reviewSlideStartFrame(slideId, fps)}
          durationInFrames={reviewSlideDuration(slideId, fps)}
          premountFor={fps}
        >
          <ReviewSlide format={format} slideId={slideId} />
        </Sequence>
      ))}
      </AbsoluteFill>
    </ReviewSpeakerProvider>
  );
};
