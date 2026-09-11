import {Composition} from 'remotion';
import {ReadonlyInterview} from './ReadonlyInterview';
import {OopConstructsInterview} from './OopConstructsInterview';
import {QuestionBatchInterview} from './QuestionBatchInterview';
import {ReviewSlide} from './ReviewSlide';
import {BaseReview} from './BaseReview';
import {FULL_REVIEW_DURATION, FullInterviewReview} from './FullInterviewReview';
import {AvatarAnimationTest} from './AvatarAnimationTest';
import {FinalInterview, finalInterviewDuration} from './FinalInterview';
import {DEV_FPS, oopTimeline, PRODUCTION_FPS, questionBatchTimeline, readonlyTimeline} from './timeline';

const productionTimeline = readonlyTimeline(PRODUCTION_FPS);
const devTimeline = readonlyTimeline(DEV_FPS);
const oopProductionTimeline = oopTimeline(PRODUCTION_FPS);
const oopDevTimeline = oopTimeline(DEV_FPS);
const questionBatchProductionTimeline = questionBatchTimeline(PRODUCTION_FPS);
const questionBatchDevTimeline = questionBatchTimeline(DEV_FPS);

export const RemotionRoot = () => (
  <>
    <Composition
      id="AvatarAnimationTest"
      component={AvatarAnimationTest}
      durationInFrames={10 * PRODUCTION_FPS}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="FinalInterviewDev"
      component={FinalInterview}
      durationInFrames={finalInterviewDuration(DEV_FPS)}
      fps={DEV_FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="FinalInterview"
      component={FinalInterview}
      durationInFrames={finalInterviewDuration(PRODUCTION_FPS)}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="FullInterviewReviewDev"
      component={FullInterviewReview}
      durationInFrames={Math.round(FULL_REVIEW_DURATION * DEV_FPS)}
      fps={DEV_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide'}}
    />
    <Composition
      id="FullInterviewReview"
      component={FullInterviewReview}
      durationInFrames={Math.round(FULL_REVIEW_DURATION * PRODUCTION_FPS)}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide'}}
    />
    <Composition
      id="BaseReviewDev"
      component={BaseReview}
      durationInFrames={120}
      fps={DEV_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="BaseReviewShortDev"
      component={BaseReview}
      durationInFrames={120}
      fps={DEV_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
    <Composition
      id="ReviewSlide"
      component={ReviewSlide}
      durationInFrames={30}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const, slideId: '06-enum'}}
    />
    <Composition
      id="ReviewSlideShort"
      component={ReviewSlide}
      durationInFrames={30}
      fps={PRODUCTION_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const, slideId: '06-enum'}}
    />
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
    <Composition
      id="QuestionBatchInterview"
      component={QuestionBatchInterview}
      durationInFrames={questionBatchProductionTimeline.duration}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="QuestionBatchInterviewShort"
      component={QuestionBatchInterview}
      durationInFrames={questionBatchProductionTimeline.duration}
      fps={PRODUCTION_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
    <Composition
      id="QuestionBatchInterviewDev"
      component={QuestionBatchInterview}
      durationInFrames={questionBatchDevTimeline.duration}
      fps={DEV_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const}}
    />
    <Composition
      id="QuestionBatchInterviewShortDev"
      component={QuestionBatchInterview}
      durationInFrames={questionBatchDevTimeline.duration}
      fps={DEV_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const}}
    />
  </>
);
