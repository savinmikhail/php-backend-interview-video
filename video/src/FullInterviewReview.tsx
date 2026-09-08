import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
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

const INTRO_END = timestampToSeconds('00:13:46');
const PROJECT_SECTION_START = timestampToSeconds('01:02:45');
const PROJECT_SECTION_END = timestampToSeconds('01:17:20');
const SOURCE_DURATION = timestampToSeconds('01:21:53');
const FULL_REVIEW_AUDIO = 'generated/full-review-audio-cut.m4a';
const EDITORIAL_CUTS = [
  {start: 0, end: INTRO_END},
  {start: timestampToSeconds('00:31:30'), end: timestampToSeconds('00:31:51')},
  {start: timestampToSeconds('00:35:02'), end: timestampToSeconds('00:35:53')},
  {start: PROJECT_SECTION_START, end: PROJECT_SECTION_END},
];
export const FULL_REVIEW_DURATION = SOURCE_DURATION - EDITORIAL_CUTS.reduce(
  (total, cut) => total + cut.end - cut.start,
  0,
);

const sourceSecondToOutputSecond = (sourceSecond: number) => {
  let removedDuration = 0;

  for (const cut of EDITORIAL_CUTS) {
    if (sourceSecond <= cut.start) return sourceSecond - removedDuration;
    if (sourceSecond < cut.end) return null;
    removedDuration += cut.end - cut.start;
  }

  return sourceSecond - removedDuration;
};

const outputSecondToSourceSecond = (outputSecond: number) => {
  let removedDuration = 0;

  for (const cut of EDITORIAL_CUTS) {
    const cutStartOnOutput = cut.start - removedDuration;
    if (outputSecond < cutStartOnOutput) break;
    removedDuration += cut.end - cut.start;
  }

  return outputSecond + removedDuration;
};

// Keep these entries in sync with review-timeline.tsv. The earlier animated
// sequences are mounted separately below and therefore are not duplicated here.
const reviewSegments: ReviewSegment[] = [
  {start: '00:20:59', end: '00:21:23', slideId: '06-enum'},
  {start: '00:21:37', end: '00:21:42', slideId: '07-question'},
  {start: '00:21:42', end: '00:22:16', slideId: '07-graph'},
  {start: '00:22:16', end: '00:22:37', slideId: '07-compile'},
  {start: '00:22:37', end: '00:23:00', slideId: '07-tradeoff'},
  {start: '00:23:09', end: '00:23:37', slideId: '08-question'},
  {start: '00:23:37', end: '00:24:43', slideId: '08-axes'},
  {start: '00:24:43', end: '00:26:24', slideId: '08-rules'},
  {start: '00:26:26', end: '00:26:39', slideId: '09-question'},
  {start: '00:26:39', end: '00:27:13', slideId: '09-subscriber'},
  {start: '00:27:13', end: '00:27:49', slideId: '09-middleware'},
  {start: '00:27:49', end: '00:28:23', slideId: '09-decorator'},
  {start: '00:28:26', end: '00:28:51', slideId: '10-question'},
  {start: '00:28:51', end: '00:29:20', slideId: '10-bus'},
  {start: '00:29:20', end: '00:29:57', slideId: '10-middleware'},
  {start: '00:30:11', end: '00:31:17', slideId: '11-question'},
  {start: '00:31:17', end: '00:31:28', slideId: '11-pull-push'},
  {start: '00:31:55', end: '00:32:27', slideId: '11-symfony'},
  {start: '00:32:27', end: '00:33:38', slideId: '11-runtime'},
  {start: '00:34:50', end: '00:34:53', slideId: '12-question'},
  {start: '00:34:53', end: '00:35:02', slideId: '12-compile'},
  {start: '00:35:59', end: '00:36:04', slideId: '13-question'},
  {start: '00:36:04', end: '00:36:33', slideId: '13-persist'},
  {start: '00:36:33', end: '00:36:43', slideId: '13-flush-listener'},
  {start: '00:36:43', end: '00:36:51', slideId: '13-flush-audit'},
  {start: '00:36:51', end: '00:36:58', slideId: '13-flush-result'},
  {start: '00:36:58', end: '00:37:07', slideId: '13-clear'},
  {start: '00:37:07', end: '00:37:32', slideId: '13-clear-batch'},
  {start: '00:37:32', end: '00:37:45', slideId: '14-question'},
  {start: '00:37:45', end: '00:37:53', slideId: '14-identity'},
  {start: '00:37:53', end: '00:37:59', slideId: '14-layers'},
  {start: '00:37:59', end: '00:38:01', slideId: '14-boundary'},
  {start: '00:38:01', end: '00:38:05', slideId: '15-question'},
  {start: '00:38:05', end: '00:38:11.07', slideId: '15-lazy'},
  {start: '00:38:11.07', end: '00:38:20', slideId: '15-n-plus-one'},
  {start: '00:38:20', end: '00:38:25', slideId: '15-fetch-join'},
  {start: '00:38:25', end: '00:38:52', slideId: '15-extra-lazy'},
  {start: '00:38:38', end: '00:38:52', slideId: '16-question'},
  {start: '00:38:52', end: '00:39:13', slideId: '16-implicit'},
  {start: '00:39:13', end: '00:40:01', slideId: '16-explicit'},
  {start: '00:39:54', end: '00:40:22', slideId: '17-question'},
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
  {start: '00:15:45', end: '00:16:42'},
  {start: '00:16:42', end: '00:20:59'},
  ...reviewSegments,
].sort((left, right) => timestampToSeconds(left.start) - timestampToSeconds(right.start));

const segmentById = (slideId: string) => {
  const segment = reviewSegments.find((candidate) => candidate.slideId === slideId);
  if (!segment) throw new Error(`Unknown review slide: ${slideId}`);
  return segment;
};

const sourceTimestampToOutputFrame = (timestamp: string, fps: number) => {
  const outputSecond = sourceSecondToOutputSecond(timestampToSeconds(timestamp));
  if (outputSecond === null) throw new Error(`Timestamp lies inside an editorial cut: ${timestamp}`);
  return Math.round(outputSecond * fps);
};

const slideFrom = (slideId: string, fps: number) =>
  sourceTimestampToOutputFrame(segmentById(slideId).start, fps);

const slideDuration = (slideId: string, fps: number) => {
  const segment = segmentById(slideId);
  return Math.round((timestampToSeconds(segment.end) - timestampToSeconds(segment.start)) * fps);
};

const BaseTrack = ({format}: {format: Format}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sourceSecond = outputSecondToSourceSecond(frame / fps);
  const hasVisual = occupiedSegments.some((segment) =>
    sourceSecond >= timestampToSeconds(segment.start)
    && sourceSecond < timestampToSeconds(segment.end));

  return hasVisual ? null : (
    <BaseReview format={format} speakerFrame={Math.round(sourceSecond * fps)} />
  );
};

export const FullInterviewReview = ({format, withAudio = true}: Props) => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill>
      {withAudio && <Audio src={staticFile(FULL_REVIEW_AUDIO)} />}

      <Sequence
        name="Базовая сцена"
        durationInFrames={FULL_REVIEW_DURATION * fps}
        premountFor={fps}
      >
        <BaseTrack format={format} />
      </Sequence>

      <Sequence
        name="01 · Readonly class"
        from={sourceTimestampToOutputFrame('00:14:17', fps)}
        durationInFrames={88 * fps}
        premountFor={fps}
      >
        <ReadonlyInterview format={format} withAudio={false} />
      </Sequence>
      <Sequence
        name="02 · Interface / abstract class / trait"
        from={sourceTimestampToOutputFrame('00:15:45', fps)}
        durationInFrames={57 * fps}
        premountFor={fps}
      >
        <OopConstructsInterview format={format} withAudio={false} />
      </Sequence>
      <Sequence
        name="03–05 · Objects / DateTime / exceptions"
        from={sourceTimestampToOutputFrame('00:16:42', fps)}
        durationInFrames={257 * fps}
        premountFor={fps}
      >
        <QuestionBatchInterview format={format} withAudio={false} />
      </Sequence>

      {/* Review slides are authored individually so Studio exposes each layer. */}
      <Sequence name="06-enum" from={slideFrom('06-enum', fps)} durationInFrames={slideDuration('06-enum', fps)} premountFor={fps}><ReviewSlide format={format} slideId="06-enum" /></Sequence>
      <Sequence name="07-question" from={slideFrom('07-question', fps)} durationInFrames={slideDuration('07-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="07-question" /></Sequence>
      <Sequence name="07-graph" from={slideFrom('07-graph', fps)} durationInFrames={slideDuration('07-graph', fps)} premountFor={fps}><ReviewSlide format={format} slideId="07-graph" /></Sequence>
      <Sequence name="07-compile" from={slideFrom('07-compile', fps)} durationInFrames={slideDuration('07-compile', fps)} premountFor={fps}><ReviewSlide format={format} slideId="07-compile" /></Sequence>
      <Sequence name="07-tradeoff" from={slideFrom('07-tradeoff', fps)} durationInFrames={slideDuration('07-tradeoff', fps)} premountFor={fps}><ReviewSlide format={format} slideId="07-tradeoff" /></Sequence>
      <Sequence name="08-question" from={slideFrom('08-question', fps)} durationInFrames={slideDuration('08-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="08-question" /></Sequence>
      <Sequence name="08-axes" from={slideFrom('08-axes', fps)} durationInFrames={slideDuration('08-axes', fps)} premountFor={fps}><ReviewSlide format={format} slideId="08-axes" /></Sequence>
      <Sequence name="08-rules" from={slideFrom('08-rules', fps)} durationInFrames={slideDuration('08-rules', fps)} premountFor={fps}><ReviewSlide format={format} slideId="08-rules" /></Sequence>
      <Sequence name="09-question" from={slideFrom('09-question', fps)} durationInFrames={slideDuration('09-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="09-question" /></Sequence>
      <Sequence name="09-subscriber" from={slideFrom('09-subscriber', fps)} durationInFrames={slideDuration('09-subscriber', fps)} premountFor={fps}><ReviewSlide format={format} slideId="09-subscriber" /></Sequence>
      <Sequence name="09-middleware" from={slideFrom('09-middleware', fps)} durationInFrames={slideDuration('09-middleware', fps)} premountFor={fps}><ReviewSlide format={format} slideId="09-middleware" /></Sequence>
      <Sequence name="09-decorator" from={slideFrom('09-decorator', fps)} durationInFrames={slideDuration('09-decorator', fps)} premountFor={fps}><ReviewSlide format={format} slideId="09-decorator" /></Sequence>
      <Sequence name="10-question" from={slideFrom('10-question', fps)} durationInFrames={slideDuration('10-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="10-question" /></Sequence>
      <Sequence name="10-bus" from={slideFrom('10-bus', fps)} durationInFrames={slideDuration('10-bus', fps)} premountFor={fps}><ReviewSlide format={format} slideId="10-bus" /></Sequence>
      <Sequence name="10-middleware" from={slideFrom('10-middleware', fps)} durationInFrames={slideDuration('10-middleware', fps)} premountFor={fps}><ReviewSlide format={format} slideId="10-middleware" /></Sequence>
      <Sequence name="11-question" from={slideFrom('11-question', fps)} durationInFrames={slideDuration('11-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="11-question" /></Sequence>
      <Sequence name="11-pull-push" from={slideFrom('11-pull-push', fps)} durationInFrames={slideDuration('11-pull-push', fps)} premountFor={fps}><ReviewSlide format={format} slideId="11-pull-push" /></Sequence>
      <Sequence name="11-symfony" from={slideFrom('11-symfony', fps)} durationInFrames={slideDuration('11-symfony', fps)} premountFor={fps}><ReviewSlide format={format} slideId="11-symfony" /></Sequence>
      <Sequence name="11-runtime" from={slideFrom('11-runtime', fps)} durationInFrames={slideDuration('11-runtime', fps)} premountFor={fps}><ReviewSlide format={format} slideId="11-runtime" /></Sequence>
      <Sequence name="12-question" from={slideFrom('12-question', fps)} durationInFrames={slideDuration('12-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="12-question" /></Sequence>
      <Sequence name="12-compile" from={slideFrom('12-compile', fps)} durationInFrames={slideDuration('12-compile', fps)} premountFor={fps}><ReviewSlide format={format} slideId="12-compile" /></Sequence>
      <Sequence name="13-question" from={slideFrom('13-question', fps)} durationInFrames={slideDuration('13-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-question" /></Sequence>
      <Sequence name="13-persist" from={slideFrom('13-persist', fps)} durationInFrames={slideDuration('13-persist', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-persist" /></Sequence>
      <Sequence name="13-flush-listener" from={slideFrom('13-flush-listener', fps)} durationInFrames={slideDuration('13-flush-listener', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-flush-listener" /></Sequence>
      <Sequence name="13-flush-audit" from={slideFrom('13-flush-audit', fps)} durationInFrames={slideDuration('13-flush-audit', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-flush-audit" /></Sequence>
      <Sequence name="13-flush-result" from={slideFrom('13-flush-result', fps)} durationInFrames={slideDuration('13-flush-result', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-flush-result" /></Sequence>
      <Sequence name="13-clear" from={slideFrom('13-clear', fps)} durationInFrames={slideDuration('13-clear', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-clear" /></Sequence>
      <Sequence name="13-clear-batch" from={slideFrom('13-clear-batch', fps)} durationInFrames={slideDuration('13-clear-batch', fps)} premountFor={fps}><ReviewSlide format={format} slideId="13-clear-batch" /></Sequence>
      <Sequence name="14-question" from={slideFrom('14-question', fps)} durationInFrames={slideDuration('14-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="14-question" /></Sequence>
      <Sequence name="14-identity" from={slideFrom('14-identity', fps)} durationInFrames={slideDuration('14-identity', fps)} premountFor={fps}><ReviewSlide format={format} slideId="14-identity" /></Sequence>
      <Sequence name="14-layers" from={slideFrom('14-layers', fps)} durationInFrames={slideDuration('14-layers', fps)} premountFor={fps}><ReviewSlide format={format} slideId="14-layers" /></Sequence>
      <Sequence name="14-boundary" from={slideFrom('14-boundary', fps)} durationInFrames={slideDuration('14-boundary', fps)} premountFor={fps}><ReviewSlide format={format} slideId="14-boundary" /></Sequence>
      <Sequence name="15-question" from={slideFrom('15-question', fps)} durationInFrames={slideDuration('15-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="15-question" /></Sequence>
      <Sequence name="15-lazy" from={slideFrom('15-lazy', fps)} durationInFrames={slideDuration('15-lazy', fps)} premountFor={fps}><ReviewSlide format={format} slideId="15-lazy" /></Sequence>
      <Sequence name="15-n-plus-one" from={slideFrom('15-n-plus-one', fps)} durationInFrames={slideDuration('15-n-plus-one', fps)} premountFor={fps}><ReviewSlide format={format} slideId="15-n-plus-one" /></Sequence>
      <Sequence name="15-fetch-join" from={slideFrom('15-fetch-join', fps)} durationInFrames={slideDuration('15-fetch-join', fps)} premountFor={fps}><ReviewSlide format={format} slideId="15-fetch-join" /></Sequence>
      <Sequence name="15-extra-lazy" from={slideFrom('15-extra-lazy', fps)} durationInFrames={slideDuration('15-extra-lazy', fps)} premountFor={fps}><ReviewSlide format={format} slideId="15-extra-lazy" /></Sequence>
      <Sequence name="16-question" from={slideFrom('16-question', fps)} durationInFrames={slideDuration('16-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="16-question" /></Sequence>
      <Sequence name="16-implicit" from={slideFrom('16-implicit', fps)} durationInFrames={slideDuration('16-implicit', fps)} premountFor={fps}><ReviewSlide format={format} slideId="16-implicit" /></Sequence>
      <Sequence name="16-explicit" from={slideFrom('16-explicit', fps)} durationInFrames={slideDuration('16-explicit', fps)} premountFor={fps}><ReviewSlide format={format} slideId="16-explicit" /></Sequence>
      <Sequence name="17-question" from={slideFrom('17-question', fps)} durationInFrames={slideDuration('17-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="17-question" /></Sequence>
      <Sequence name="17-size" from={slideFrom('17-size', fps)} durationInFrames={slideDuration('17-size', fps)} premountFor={fps}><ReviewSlide format={format} slideId="17-size" /></Sequence>
      <Sequence name="17-before-db" from={slideFrom('17-before-db', fps)} durationInFrames={slideDuration('17-before-db', fps)} premountFor={fps}><ReviewSlide format={format} slideId="17-before-db" /></Sequence>
      <Sequence name="17-distributed" from={slideFrom('17-distributed', fps)} durationInFrames={slideDuration('17-distributed', fps)} premountFor={fps}><ReviewSlide format={format} slideId="17-distributed" /></Sequence>
      <Sequence name="18-tradeoff" from={slideFrom('18-tradeoff', fps)} durationInFrames={slideDuration('18-tradeoff', fps)} premountFor={fps}><ReviewSlide format={format} slideId="18-tradeoff" /></Sequence>
      <Sequence name="18-access" from={slideFrom('18-access', fps)} durationInFrames={slideDuration('18-access', fps)} premountFor={fps}><ReviewSlide format={format} slideId="18-access" /></Sequence>
      <Sequence name="18-forms" from={slideFrom('18-forms', fps)} durationInFrames={slideDuration('18-forms', fps)} premountFor={fps}><ReviewSlide format={format} slideId="18-forms" /></Sequence>
      <Sequence name="19-question" from={slideFrom('19-question', fps)} durationInFrames={slideDuration('19-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="19-question" /></Sequence>
      <Sequence name="19-rule" from={slideFrom('19-rule', fps)} durationInFrames={slideDuration('19-rule', fps)} premountFor={fps}><ReviewSlide format={format} slideId="19-rule" /></Sequence>
      <Sequence name="20-levels" from={slideFrom('20-levels', fps)} durationInFrames={slideDuration('20-levels', fps)} premountFor={fps}><ReviewSlide format={format} slideId="20-levels" /></Sequence>
      <Sequence name="20-usecase" from={slideFrom('20-usecase', fps)} durationInFrames={slideDuration('20-usecase', fps)} premountFor={fps}><ReviewSlide format={format} slideId="20-usecase" /></Sequence>
      <Sequence name="20-criterion" from={slideFrom('20-criterion', fps)} durationInFrames={slideDuration('20-criterion', fps)} premountFor={fps}><ReviewSlide format={format} slideId="20-criterion" /></Sequence>
      <Sequence name="21-direct" from={slideFrom('21-direct', fps)} durationInFrames={slideDuration('21-direct', fps)} premountFor={fps}><ReviewSlide format={format} slideId="21-direct" /></Sequence>
      <Sequence name="21-boundary" from={slideFrom('21-boundary', fps)} durationInFrames={slideDuration('21-boundary', fps)} premountFor={fps}><ReviewSlide format={format} slideId="21-boundary" /></Sequence>
      <Sequence name="22-entity" from={slideFrom('22-entity', fps)} durationInFrames={slideDuration('22-entity', fps)} premountFor={fps}><ReviewSlide format={format} slideId="22-entity" /></Sequence>
      <Sequence name="22-dto" from={slideFrom('22-dto', fps)} durationInFrames={slideDuration('22-dto', fps)} premountFor={fps}><ReviewSlide format={format} slideId="22-dto" /></Sequence>
      <Sequence name="22-correction" from={slideFrom('22-correction', fps)} durationInFrames={slideDuration('22-correction', fps)} premountFor={fps}><ReviewSlide format={format} slideId="22-correction" /></Sequence>
      <Sequence name="23-question" from={slideFrom('23-question', fps)} durationInFrames={slideDuration('23-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="23-question" /></Sequence>
      <Sequence name="23-boundary" from={slideFrom('23-boundary', fps)} durationInFrames={slideDuration('23-boundary', fps)} premountFor={fps}><ReviewSlide format={format} slideId="23-boundary" /></Sequence>
      <Sequence name="23-deployment" from={slideFrom('23-deployment', fps)} durationInFrames={slideDuration('23-deployment', fps)} premountFor={fps}><ReviewSlide format={format} slideId="23-deployment" /></Sequence>
      <Sequence name="23-monolith" from={slideFrom('23-monolith', fps)} durationInFrames={slideDuration('23-monolith', fps)} premountFor={fps}><ReviewSlide format={format} slideId="23-monolith" /></Sequence>
      <Sequence name="24-question" from={slideFrom('24-question', fps)} durationInFrames={slideDuration('24-question', fps)} premountFor={fps}><ReviewSlide format={format} slideId="24-question" /></Sequence>
      <Sequence name="24-dependency" from={slideFrom('24-dependency', fps)} durationInFrames={slideDuration('24-dependency', fps)} premountFor={fps}><ReviewSlide format={format} slideId="24-dependency" /></Sequence>
      <Sequence name="25-classes" from={slideFrom('25-classes', fps)} durationInFrames={slideDuration('25-classes', fps)} premountFor={fps}><ReviewSlide format={format} slideId="25-classes" /></Sequence>
      <Sequence name="25-aside" from={slideFrom('25-aside', fps)} durationInFrames={slideDuration('25-aside', fps)} premountFor={fps}><ReviewSlide format={format} slideId="25-aside" /></Sequence>
      <Sequence name="25-writes" from={slideFrom('25-writes', fps)} durationInFrames={slideDuration('25-writes', fps)} premountFor={fps}><ReviewSlide format={format} slideId="25-writes" /></Sequence>
      <Sequence name="25-choice" from={slideFrom('25-choice', fps)} durationInFrames={slideDuration('25-choice', fps)} premountFor={fps}><ReviewSlide format={format} slideId="25-choice" /></Sequence>
      <Sequence name="26-auth" from={slideFrom('26-auth', fps)} durationInFrames={slideDuration('26-auth', fps)} premountFor={fps}><ReviewSlide format={format} slideId="26-auth" /></Sequence>
      <Sequence name="27-jwt" from={slideFrom('27-jwt', fps)} durationInFrames={slideDuration('27-jwt', fps)} premountFor={fps}><ReviewSlide format={format} slideId="27-jwt" /></Sequence>
      <Sequence name="28-query" from={slideFrom('28-query', fps)} durationInFrames={slideDuration('28-query', fps)} premountFor={fps}><ReviewSlide format={format} slideId="28-query" /></Sequence>
      <Sequence name="29-so" from={slideFrom('29-so', fps)} durationInFrames={slideDuration('29-so', fps)} premountFor={fps}><ReviewSlide format={format} slideId="29-so" /></Sequence>
      <Sequence name="29-lsp" from={slideFrom('29-lsp', fps)} durationInFrames={slideDuration('29-lsp', fps)} premountFor={fps}><ReviewSlide format={format} slideId="29-lsp" /></Sequence>
      <Sequence name="29-id" from={slideFrom('29-id', fps)} durationInFrames={slideDuration('29-id', fps)} premountFor={fps}><ReviewSlide format={format} slideId="29-id" /></Sequence>
      <Sequence name="29-tradeoff" from={slideFrom('29-tradeoff', fps)} durationInFrames={slideDuration('29-tradeoff', fps)} premountFor={fps}><ReviewSlide format={format} slideId="29-tradeoff" /></Sequence>
      <Sequence name="30-basics" from={slideFrom('30-basics', fps)} durationInFrames={slideDuration('30-basics', fps)} premountFor={fps}><ReviewSlide format={format} slideId="30-basics" /></Sequence>
      <Sequence name="30-copy" from={slideFrom('30-copy', fps)} durationInFrames={slideDuration('30-copy', fps)} premountFor={fps}><ReviewSlide format={format} slideId="30-copy" /></Sequence>
      <Sequence name="30-criterion" from={slideFrom('30-criterion', fps)} durationInFrames={slideDuration('30-criterion', fps)} premountFor={fps}><ReviewSlide format={format} slideId="30-criterion" /></Sequence>
      <Sequence name="32-uses" from={slideFrom('32-uses', fps)} durationInFrames={slideDuration('32-uses', fps)} premountFor={fps}><ReviewSlide format={format} slideId="32-uses" /></Sequence>
      <Sequence name="32-risk" from={slideFrom('32-risk', fps)} durationInFrames={slideDuration('32-risk', fps)} premountFor={fps}><ReviewSlide format={format} slideId="32-risk" /></Sequence>
      <Sequence name="32-loop" from={slideFrom('32-loop', fps)} durationInFrames={slideDuration('32-loop', fps)} premountFor={fps}><ReviewSlide format={format} slideId="32-loop" /></Sequence>
      <Sequence name="32-readable" from={slideFrom('32-readable', fps)} durationInFrames={slideDuration('32-readable', fps)} premountFor={fps}><ReviewSlide format={format} slideId="32-readable" /></Sequence>
    </AbsoluteFill>
  );
};
