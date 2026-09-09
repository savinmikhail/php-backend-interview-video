import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Format} from './InterviewShell';
import {ReviewSlide} from './ReviewSlide';
import {TypeRelationshipDiagram, type RelationshipVariant} from './TypeRelationshipDiagram';
import {oopTimeline, speakerAtOop, type Speaker} from './timeline';

type Props = {format: Format; withAudio?: boolean};

const DiagramSlide = ({format, speaker, variant}: {
  format: Format;
  speaker: Speaker;
  variant: RelationshipVariant;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId={`02-${variant}`}
      contentLayout={format === 'short' ? 'dense' : 'compact'}
    >
      <TypeRelationshipDiagram variant={variant} frame={frame} fps={fps} />
    </ReviewSlide>
  );
};

export const OopConstructsInterview = ({format, withAudio = true}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeline = oopTimeline(fps);
  const speaker = speakerAtOop(frame, fps);

  return (
    <AbsoluteFill>
      {withAudio && <Audio src={staticFile('generated/oop-constructs-audio.m4a')} />}
      <Sequence from={timeline.question.from} durationInFrames={timeline.question.duration} name="Вопрос">
        <ReviewSlide format={format} slideId="02-question" speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.interface.from} durationInFrames={timeline.interface.duration} name="Interface">
        <DiagramSlide format={format} speaker={speaker} variant="interface" />
      </Sequence>
      <Sequence from={timeline.abstract.from} durationInFrames={timeline.abstract.duration} name="Abstract class">
        <DiagramSlide format={format} speaker={speaker} variant="abstract" />
      </Sequence>
      <Sequence from={timeline.trait.from} durationInFrames={timeline.trait.duration} name="Trait">
        <DiagramSlide format={format} speaker={speaker} variant="trait" />
      </Sequence>
    </AbsoluteFill>
  );
};
