import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  enter,
  InterviewShell,
  type Format,
  type SlideProps,
} from './InterviewShell';
import {TypeRelationshipDiagram, type RelationshipVariant} from './TypeRelationshipDiagram';
import {oopTimeline, PRODUCTION_FPS, speakerAtOop, TOTAL_QUESTIONS} from './timeline';

type Props = {format: Format; withAudio?: boolean};

const question = <>Интерфейс, абстрактный класс, trait — что для чего?</>;

const QuestionSlide = ({format, speaker}: SlideProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <InterviewShell format={format} speaker={speaker} counter="2" question={question} showHeader={false}>
      <div className="question-slide oop-question" style={enter(frame * PRODUCTION_FPS / fps)}>
        <div className="eyebrow">Вопрос 2 из {TOTAL_QUESTIONS}</div>
        <h1>
          <span>Интерфейс,</span>{' '}
          <span>абстрактный класс,</span>{' '}
          <span><em>trait</em> — что для чего?</span>
        </h1>
      </div>
    </InterviewShell>
  );
};

const DiagramSlide = ({format, speaker, variant}: SlideProps & {variant: RelationshipVariant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <InterviewShell format={format} speaker={speaker} counter="2" question={question}>
      <TypeRelationshipDiagram variant={variant} frame={frame} fps={fps} />
    </InterviewShell>
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
        <QuestionSlide format={format} speaker={speaker} />
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
