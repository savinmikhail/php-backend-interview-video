import {Composition} from 'remotion';
import {ReadonlyInterview} from './ReadonlyInterview';
import {OopConstructsInterview} from './OopConstructsInterview';
import {DEV_FPS, oopTimeline, PRODUCTION_FPS, readonlyTimeline} from './timeline';

const productionTimeline = readonlyTimeline(PRODUCTION_FPS);
const devTimeline = readonlyTimeline(DEV_FPS);
const oopProductionTimeline = oopTimeline(PRODUCTION_FPS);
const oopDevTimeline = oopTimeline(DEV_FPS);

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
    <Composition
      id="OopConstructsInterview"
      component={OopConstructsInterview}
      durationInFrames={oopProductionTimeline.duration}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="OopConstructsInterviewShort"
      component={OopConstructsInterview}
      durationInFrames={oopProductionTimeline.duration}
      fps={PRODUCTION_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
    <Composition
      id="OopConstructsInterviewDev"
      component={OopConstructsInterview}
      durationInFrames={oopDevTimeline.duration}
      fps={DEV_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="OopConstructsInterviewShortDev"
      component={OopConstructsInterview}
      durationInFrames={oopDevTimeline.duration}
      fps={DEV_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
  </>
);
