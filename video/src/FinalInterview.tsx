import {Video} from '@remotion/media';
import {AbsoluteFill, getRemotionEnvironment, Sequence, staticFile, useVideoConfig} from 'remotion';
import {CaptionOverlay} from './CaptionOverlay';
import {FULL_REVIEW_DURATION, FullInterviewReview} from './FullInterviewReview';

type Props = {
  captionsSrc?: string;
  showCaptions?: boolean;
};

const INTRO_FIRST_SOURCE_START = 2.65;
const INTRO_FIRST_SOURCE_END = 32.65;
const INTRO_SECOND_SOURCE_START = 38.74;
const INTRO_SECOND_SOURCE_END = 46.75;
const OUTRO_FIRST_SOURCE_START = 1.5;
const OUTRO_FIRST_SOURCE_END = 24.39;
const OUTRO_SECOND_SOURCE_START = 39.32;
const OUTRO_SECOND_SOURCE_END = 46.65;

const secondsToFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

export const finalInterviewDuration = (fps: number) =>
  secondsToFrames(INTRO_FIRST_SOURCE_END - INTRO_FIRST_SOURCE_START, fps)
  + secondsToFrames(INTRO_SECOND_SOURCE_END - INTRO_SECOND_SOURCE_START, fps)
  + secondsToFrames(FULL_REVIEW_DURATION, fps)
  + secondsToFrames(OUTRO_FIRST_SOURCE_END - OUTRO_FIRST_SOURCE_START, fps)
  + secondsToFrames(OUTRO_SECOND_SOURCE_END - OUTRO_SECOND_SOURCE_START, fps);

const FullFrameVideo = ({src, trimBefore}: {src: string; trimBefore: number}) => (
  <Video
    src={staticFile(src)}
    trimBefore={trimBefore}
    style={{width: '100%', height: '100%'}}
    objectFit="cover"
  />
);

export const FinalInterview = ({
  captionsSrc = 'generated/captions.json',
  showCaptions,
}: Props) => {
  const {fps} = useVideoConfig();
  const captionsVisible = showCaptions ?? getRemotionEnvironment().isStudio;
  const introFirstFrames = secondsToFrames(INTRO_FIRST_SOURCE_END - INTRO_FIRST_SOURCE_START, fps);
  const introSecondFrames = secondsToFrames(INTRO_SECOND_SOURCE_END - INTRO_SECOND_SOURCE_START, fps);
  const introFrames = introFirstFrames + introSecondFrames;
  const interviewFrames = secondsToFrames(FULL_REVIEW_DURATION, fps);
  const outroFirstFrames = secondsToFrames(OUTRO_FIRST_SOURCE_END - OUTRO_FIRST_SOURCE_START, fps);
  const outroSecondFrames = secondsToFrames(OUTRO_SECOND_SOURCE_END - OUTRO_SECOND_SOURCE_START, fps);
  const outroStartFrame = introFrames + interviewFrames;

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
        name="Аутро · часть 1"
        from={outroStartFrame}
        durationInFrames={outroFirstFrames}
        premountFor={fps}
      >
        <FullFrameVideo
          src="episode-841862/outro.mp4"
          trimBefore={secondsToFrames(OUTRO_FIRST_SOURCE_START, fps)}
        />
      </Sequence>

      <Sequence
        name="Аутро · часть 2"
        from={outroStartFrame + outroFirstFrames}
        durationInFrames={outroSecondFrames}
        premountFor={fps}
      >
        <FullFrameVideo
          src="episode-841862/outro.mp4"
          trimBefore={secondsToFrames(OUTRO_SECOND_SOURCE_START, fps)}
        />
      </Sequence>

      {captionsVisible ? (
        <Sequence name="Черновые субтитры">
          <CaptionOverlay src={captionsSrc} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
