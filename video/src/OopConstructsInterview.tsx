import {
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {InterviewShell, type Format} from './InterviewShell';
import {TypeRelationshipDiagram, type RelationshipVariant} from './TypeRelationshipDiagram';
import type {Speaker} from './timeline';

const DiagramSlide = ({format, speaker, variant}: {
  format: Format;
  speaker: Speaker;
  variant: RelationshipVariant;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <InterviewShell
      format={format}
      speaker={speaker}
      counter="2"
      question="Интерфейс, абстрактный класс, trait — что для чего?"
      contentLayout={format === 'short' ? 'dense' : 'compact'}
    >
      <TypeRelationshipDiagram variant={variant} frame={frame} fps={fps} />
    </InterviewShell>
  );
};

export const OopSlide = ({format, speaker, slideId}: {format: Format; speaker: Speaker; slideId: string}) => {
  const variant = slideId.replace('02-', '') as RelationshipVariant;
  if (!['interface', 'abstract', 'trait'].includes(variant)) return null;
  return <DiagramSlide format={format} speaker={speaker} variant={variant} />;
};
