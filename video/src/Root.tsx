import {Composition} from 'remotion';
import {ReadonlyInterview} from './ReadonlyInterview';
import {DEV_FPS, PRODUCTION_FPS, readonlyTimeline} from './timeline';

const productionTimeline = readonlyTimeline(PRODUCTION_FPS);
const devTimeline = readonlyTimeline(DEV_FPS);

export const RemotionRoot = () => (
  <>
    <Composition
      id="ReadonlyInterview"
      component={ReadonlyInterview}
      durationInFrames={productionTimeline.duration}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="ReadonlyInterviewShort"
      component={ReadonlyInterview}
      durationInFrames={productionTimeline.duration}
      fps={PRODUCTION_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
    <Composition
      id="ReadonlyInterviewDev"
      component={ReadonlyInterview}
      durationInFrames={devTimeline.duration}
      fps={DEV_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="ReadonlyInterviewShortDev"
      component={ReadonlyInterview}
      durationInFrames={devTimeline.duration}
      fps={DEV_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
  </>
);
