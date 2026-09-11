import {
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TypeRelationshipDiagram, type RelationshipVariant} from '../TypeRelationshipDiagram';

const DiagramSlide = ({variant}: {variant: RelationshipVariant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <TypeRelationshipDiagram variant={variant} frame={frame} fps={fps} />
  );
};

export const OopInterface = () => <DiagramSlide variant="interface" />;
export const OopAbstract = () => <DiagramSlide variant="abstract" />;
export const OopTrait = () => <DiagramSlide variant="trait" />;
