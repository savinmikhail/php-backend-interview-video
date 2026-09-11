import {Composition} from 'remotion';
import {ReviewSlide} from './ReviewSlide';
import {BaseReview} from './BaseReview';
import {FULL_REVIEW_DURATION, FullInterviewReview} from './FullInterviewReview';
import {AvatarAnimationTest} from './AvatarAnimationTest';
import {FinalInterview, finalInterviewDuration} from './FinalInterview';
import {DEV_FPS, PRODUCTION_FPS} from './timeline';

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
      durationInFrames={90 * PRODUCTION_FPS}
      fps={PRODUCTION_FPS}
      width={1920}
      height={1080}
      defaultProps={{format: 'wide' as const, slideId: '06-enum'}}
    />
    <Composition
      id="ReviewSlideShort"
      component={ReviewSlide}
      durationInFrames={90 * PRODUCTION_FPS}
      fps={PRODUCTION_FPS}
      width={1080}
      height={1920}
      defaultProps={{format: 'short' as const, slideId: '06-enum'}}
    />
  </>
);
