import {useCurrentFrame, useVideoConfig} from 'remotion';
import {InterviewShell, type Format} from './InterviewShell';

export const BaseReview = ({
  format,
  speakerFrame,
}: {
  format: Format;
  speakerFrame?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frameForSpeaker = speakerFrame ?? frame;
  const speaker = Math.floor(frameForSpeaker / (6 * fps)) % 2 === 0 ? 'mikhail' : 'interviewer';

  return (
    <InterviewShell
      format={format}
      speaker={speaker}
      counter=""
      question=""
      showHeader={false}
      bareVisual
      animateMikhail
      speakerMode="conversation"
    >
      <div />
    </InterviewShell>
  );
};
