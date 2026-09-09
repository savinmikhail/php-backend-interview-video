import {Audio} from '@remotion/media';
import {staticFile, useVideoConfig} from 'remotion';
import {InterviewShell} from './InterviewShell';

const SOURCE_START_SECONDS = 14 * 60 + 28;

export const AvatarAnimationTest = () => {
  const {fps} = useVideoConfig();

  return (
    <InterviewShell
      format="wide"
      speaker="mikhail"
      counter=""
      question=""
      showHeader={false}
      bareVisual
      animateMikhail
      speakerMode="conversation"
    >
      <Audio
        src={staticFile('generated/full-review-audio.m4a')}
        trimBefore={SOURCE_START_SECONDS * fps}
      />
      <div />
    </InterviewShell>
  );
};
