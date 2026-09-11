import {Video} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from 'remotion';
import {FULL_REVIEW_DURATION, FullInterviewReview} from './FullInterviewReview';

const INTRO_FIRST_SOURCE_START = 2.65;
const INTRO_FIRST_SOURCE_END = 32.65;
const INTRO_SECOND_SOURCE_START = 38.74;
const INTRO_SECOND_SOURCE_END = 46.75;
const OUTRO_SOURCE_START = 1.5;
const OUTRO_SOURCE_END = 46.65;

const secondsToFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

export const finalInterviewDuration = (fps: number) =>
  secondsToFrames(INTRO_FIRST_SOURCE_END - INTRO_FIRST_SOURCE_START, fps)
  + secondsToFrames(INTRO_SECOND_SOURCE_END - INTRO_SECOND_SOURCE_START, fps)
  + secondsToFrames(FULL_REVIEW_DURATION, fps)
  + secondsToFrames(OUTRO_SOURCE_END - OUTRO_SOURCE_START, fps);

const FullFrameVideo = ({src, trimBefore}: {src: string; trimBefore: number}) => (
  <Video
    src={staticFile(src)}
    trimBefore={trimBefore}
    style={{width: '100%', height: '100%'}}
    objectFit="cover"
  />
);

export const FinalInterview = () => {
  const {fps} = useVideoConfig();
  const introFirstFrames = secondsToFrames(INTRO_FIRST_SOURCE_END - INTRO_FIRST_SOURCE_START, fps);
  const introSecondFrames = secondsToFrames(INTRO_SECOND_SOURCE_END - INTRO_SECOND_SOURCE_START, fps);
  const introFrames = introFirstFrames + introSecondFrames;
  const interviewFrames = secondsToFrames(FULL_REVIEW_DURATION, fps);
  const outroFrames = secondsToFrames(OUTRO_SOURCE_END - OUTRO_SOURCE_START, fps);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence name="Интро · часть 1" durationInFrames={introFirstFrames}>
        <FullFrameVideo
          src="episode-841862/intro.mp4"
          trimBefore={secondsToFrames(INTRO_FIRST_SOURCE_START, fps)}
        />
      </Sequence>

      <Sequence name="Интро · часть 2" from={introFirstFrames} durationInFrames={introSecondFrames}>
        <FullFrameVideo
          src="episode-841862/intro.mp4"
          trimBefore={secondsToFrames(INTRO_SECOND_SOURCE_START, fps)}
        />
      </Sequence>

      <Sequence name="Интервью" from={introFrames} durationInFrames={interviewFrames} premountFor={fps}>
        <FullInterviewReview format="wide" />
      </Sequence>

      <Sequence
        name="Аутро"
        from={introFrames + interviewFrames}
        durationInFrames={outroFrames}
        premountFor={fps}
      >
        <FullFrameVideo
          src="episode-841862/outro.mp4"
          trimBefore={secondsToFrames(OUTRO_SOURCE_START, fps)}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
