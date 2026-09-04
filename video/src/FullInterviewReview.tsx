import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from 'remotion';
import {BaseReview} from './BaseReview';
import type {Format} from './InterviewShell';
import {OopConstructsInterview} from './OopConstructsInterview';
import {QuestionBatchInterview} from './QuestionBatchInterview';
import {ReadonlyInterview} from './ReadonlyInterview';
import {ReviewSlide} from './ReviewSlide';

type Props = {
  format: Format;
  withAudio?: boolean;
};

type ReviewSegment = {
  start: string;
  end: string;
  slideId: string;
};

const timestampToSeconds = (timestamp: string) => {
  const [hours, minutes, seconds] = timestamp.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

// Keep these entries in sync with review-timeline.tsv. The earlier animated
// sequences are mounted separately below and therefore are not duplicated here.
const reviewSegments: ReviewSegment[] = [
  {start: '00:20:57', end: '00:21:10', slideId: '06-enum'},
  {start: '00:21:21', end: '00:21:42', slideId: '07-question'},
  {start: '00:21:42', end: '00:22:16', slideId: '07-graph'},
  {start: '00:22:16', end: '00:22:37', slideId: '07-compile'},
  {start: '00:22:37', end: '00:23:00', slideId: '07-tradeoff'},
  {start: '00:23:00', end: '00:23:37', slideId: '08-question'},
  {start: '00:23:37', end: '00:24:12', slideId: '08-axes'},
  {start: '00:24:12', end: '00:26:06', slideId: '08-rules'},
  {start: '00:26:26', end: '00:26:39', slideId: '09-question'},
  {start: '00:26:39', end: '00:27:13', slideId: '09-subscriber'},
  {start: '00:27:13', end: '00:27:26', slideId: '09-middleware'},
  {start: '00:27:26', end: '00:28:23', slideId: '09-decorator'},
  {start: '00:28:26', end: '00:28:51', slideId: '10-question'},
  {start: '00:28:51', end: '00:29:20', slideId: '10-bus'},
  {start: '00:29:20', end: '00:29:57', slideId: '10-middleware'},
  {start: '00:29:57', end: '00:31:10', slideId: '11-question'},
  {start: '00:31:11', end: '00:31:28', slideId: '11-pull-push'},
  {start: '00:31:48', end: '00:33:31', slideId: '11-symfony'},
  {start: '00:33:31', end: '00:34:45', slideId: '11-custom'},
  {start: '00:34:45', end: '00:34:53', slideId: '12-question'},
  {start: '00:34:53', end: '00:35:08', slideId: '12-compile'},
  {start: '00:35:16', end: '00:36:04', slideId: '13-question'},
  {start: '00:36:04', end: '00:36:33', slideId: '13-persist'},
  {start: '00:36:33', end: '00:36:58', slideId: '13-flush'},
  {start: '00:36:58', end: '00:37:41', slideId: '13-clear'},
  {start: '00:37:41', end: '00:37:45', slideId: '14-question'},
  {start: '00:37:45', end: '00:38:05', slideId: '14-boundary'},
  {start: '00:38:05', end: '00:38:20', slideId: '15-lazy'},
  {start: '00:38:20', end: '00:38:25', slideId: '15-n-plus-one'},
  {start: '00:38:25', end: '00:38:52', slideId: '15-extra-lazy'},
  {start: '00:38:52', end: '00:39:05', slideId: '16-implicit'},
  {start: '00:39:05', end: '00:39:27', slideId: '16-explicit'},
  {start: '00:39:27', end: '00:40:01', slideId: '16-correction'},
  {start: '00:40:01', end: '00:40:22', slideId: '17-question'},
  {start: '00:40:22', end: '00:40:44', slideId: '17-size'},
  {start: '00:40:44', end: '00:41:46', slideId: '17-before-db'},
  {start: '00:41:46', end: '00:42:47', slideId: '17-distributed'},
  {start: '00:42:47', end: '00:43:31', slideId: '18-tradeoff'},
  {start: '00:43:31', end: '00:43:54', slideId: '18-access'},
  {start: '00:43:54', end: '00:44:05', slideId: '18-forms'},
  {start: '00:44:05', end: '00:45:03', slideId: '19-question'},
  {start: '00:45:03', end: '00:45:42', slideId: '19-rule'},
  {start: '00:45:42', end: '00:46:54', slideId: '20-levels'},
  {start: '00:46:54', end: '00:47:28', slideId: '20-usecase'},
  {start: '00:47:28', end: '00:48:03', slideId: '20-criterion'},
  {start: '00:48:10', end: '00:48:38', slideId: '21-direct'},
  {start: '00:48:38', end: '00:48:47', slideId: '21-boundary'},
  {start: '00:48:47', end: '00:49:09', slideId: '22-entity'},
  {start: '00:49:09', end: '00:49:29', slideId: '22-dto'},
  {start: '00:49:29', end: '00:49:37', slideId: '22-correction'},
  {start: '00:49:37', end: '00:50:34', slideId: '23-question'},
  {start: '00:50:34', end: '00:51:01', slideId: '23-boundary'},
  {start: '00:51:01', end: '00:51:32', slideId: '23-deployment'},
  {start: '00:51:32', end: '00:52:42', slideId: '23-monolith'},
  {start: '00:52:42', end: '00:53:01', slideId: '24-question'},
  {start: '00:53:01', end: '00:53:19', slideId: '24-dependency'},
  {start: '00:53:35', end: '00:53:59', slideId: '25-classes'},
  {start: '00:53:59', end: '00:54:14', slideId: '25-aside'},
  {start: '00:54:14', end: '00:54:50', slideId: '25-writes'},
  {start: '00:54:50', end: '00:55:21', slideId: '25-choice'},
  {start: '00:56:36', end: '00:57:21', slideId: '26-auth'},
  {start: '00:57:29', end: '00:57:39', slideId: '27-jwt'},
  {start: '00:57:39', end: '00:58:03', slideId: '28-query'},
  {start: '00:58:03', end: '00:58:48', slideId: '29-so'},
  {start: '00:58:48', end: '00:59:31', slideId: '29-lsp'},
  {start: '00:59:31', end: '01:00:04', slideId: '29-id'},
  {start: '01:00:04', end: '01:00:41', slideId: '29-tradeoff'},
  {start: '01:00:41', end: '01:01:08', slideId: '30-basics'},
  {start: '01:01:08', end: '01:01:48', slideId: '30-copy'},
  {start: '01:01:48', end: '01:02:13', slideId: '30-criterion'},
  {start: '01:18:04', end: '01:18:41', slideId: '32-uses'},
  {start: '01:18:41', end: '01:19:20', slideId: '32-risk'},
  {start: '01:19:20', end: '01:20:06', slideId: '32-loop'},
  {start: '01:20:06', end: '01:20:59', slideId: '32-readable'},
];

const occupiedSegments = [
  {start: '00:14:17', end: '00:15:45'},
  {start: '00:15:45', end: '00:16:40'},
  {start: '00:16:42', end: '00:20:52'},
  ...reviewSegments,
].sort((left, right) => timestampToSeconds(left.start) - timestampToSeconds(right.start));

const baseSegments = occupiedSegments.reduce<Array<{start: number; end: number}>>(
  (segments, occupied, index) => {
    const previousEnd = index === 0
      ? 0
      : timestampToSeconds(occupiedSegments[index - 1].end);
    const start = timestampToSeconds(occupied.start);

    if (start > previousEnd) segments.push({start: previousEnd, end: start});
    if (index === occupiedSegments.length - 1) {
      const end = timestampToSeconds(occupied.end);
      if (end < 4913) segments.push({start: end, end: 4913});
    }

    return segments;
  },
  [],
);

export const FullInterviewReview = ({format, withAudio = true}: Props) => {
  const {fps} = useVideoConfig();
  const toFrame = (timestamp: string) => Math.round(timestampToSeconds(timestamp) * fps);

  return (
    <AbsoluteFill>
      {withAudio && <Audio src={staticFile('generated/full-review-audio.m4a')} />}

      {baseSegments.map((segment) => (
        <Sequence
          key={`base-${segment.start}`}
          name="Базовая сцена"
          from={segment.start * fps}
          durationInFrames={(segment.end - segment.start) * fps}
          premountFor={fps}
        >
          <BaseReview format={format} />
        </Sequence>
      ))}

      <Sequence
        name="01 · Readonly class"
        from={toFrame('00:14:17')}
        durationInFrames={88 * fps}
        premountFor={fps}
      >
        <ReadonlyInterview format={format} withAudio={false} />
      </Sequence>
      <Sequence
        name="02 · Interface / abstract class / trait"
        from={toFrame('00:15:45')}
        durationInFrames={55 * fps}
        premountFor={fps}
      >
        <OopConstructsInterview format={format} withAudio={false} />
      </Sequence>
      <Sequence
        name="03–05 · Objects / DateTime / exceptions"
        from={toFrame('00:16:42')}
        durationInFrames={250 * fps}
        premountFor={fps}
      >
        <QuestionBatchInterview format={format} withAudio={false} />
      </Sequence>

      {reviewSegments.map((segment) => {
        const from = toFrame(segment.start);
        const durationInFrames = toFrame(segment.end) - from;

        return (
          <Sequence
            key={segment.slideId}
            name={segment.slideId}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={fps}
          >
            <ReviewSlide format={format} slideId={segment.slideId} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
