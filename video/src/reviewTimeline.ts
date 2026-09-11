import reviewTimeline from './generated/review-timeline.json';
import {
  sourceSecondToReviewSecond,
  timestampToSeconds,
} from './timeMap';

export type ReviewSegment = {
  start: string;
  end: string;
  slideId: string;
};

export const reviewSegments: ReviewSegment[] = reviewTimeline;

const reviewSegmentsById = new Map(
  reviewSegments.map((segment) => [segment.slideId, segment]),
);

if (reviewSegmentsById.size !== reviewSegments.length) {
  throw new Error('Review timeline slide IDs must be unique');
}

const reviewSegmentById = (slideId: string) => {
  const segment = reviewSegmentsById.get(slideId);
  if (!segment) throw new Error(`Unknown review timeline slide: ${slideId}`);
  return segment;
};

const sourceTimestampToOutputFrame = (timestamp: string, fps: number) => {
  const outputSecond = sourceSecondToReviewSecond(timestampToSeconds(timestamp));
  if (outputSecond === null) {
    throw new Error(`Timestamp lies inside an editorial cut: ${timestamp}`);
  }
  return Math.round(outputSecond * fps);
};

export const reviewSlideStartFrame = (slideId: string, fps: number) =>
  sourceTimestampToOutputFrame(reviewSegmentById(slideId).start, fps);

export const reviewSlideDuration = (slideId: string, fps: number) => {
  const segment = reviewSegmentById(slideId);
  const start = sourceSecondToReviewSecond(timestampToSeconds(segment.start));
  const end = sourceSecondToReviewSecond(timestampToSeconds(segment.end));
  if (start === null || end === null) {
    throw new Error(`Slide boundary lies inside an editorial cut: ${slideId}`);
  }
  return Math.round((end - start) * fps);
};

export const hasReviewVisualAtSourceSecond = (sourceSecond: number) =>
  reviewSegments.some((segment) =>
    sourceSecond >= timestampToSeconds(segment.start)
    && sourceSecond < timestampToSeconds(segment.end));
