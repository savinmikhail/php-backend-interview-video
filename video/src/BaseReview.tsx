import {useCurrentFrame, useVideoConfig} from 'remotion';
import {InterviewShell, type Format} from './InterviewShell';

export const BaseReview = ({format}: {format: Format}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const speaker = Math.floor(frame / (6 * fps)) % 2 === 0 ? 'mikhail' : 'interviewer';

  return (
    <InterviewShell
      format={format}
      speaker={speaker}
      counter=""
      question=""
      showHeader={false}
      bareVisual
    >
      <div />
    </InterviewShell>
  );
};
