export const PRODUCTION_FPS = 30;
export const DEV_FPS = 10;
export const TOTAL_QUESTIONS = 32;

const seconds = (value: number, fps: number) => Math.round(value * fps);

export const readonlyTimeline = (fps: number) => ({
  duration: seconds(88, fps),
  question: {from: seconds(0, fps), duration: seconds(5, fps)},
  rules: {from: seconds(5, fps), duration: seconds(34, fps)},
  benefits: {from: seconds(39, fps), duration: seconds(21, fps)},
  nuance: {from: seconds(60, fps), duration: seconds(28, fps)},
});

export const oopTimeline = (fps: number) => ({
  duration: seconds(57, fps),
  question: {from: seconds(0, fps), duration: seconds(5, fps)},
  interface: {from: seconds(5, fps), duration: seconds(17, fps)},
  abstract: {from: seconds(22, fps), duration: seconds(17, fps)},
  trait: {from: seconds(39, fps), duration: seconds(18, fps)},
});

export const questionBatchTimeline = (fps: number) => ({
  duration: seconds(250, fps),
  objectQuestion: {from: seconds(0, fps), duration: seconds(6, fps)},
  objectMutation: {from: seconds(6, fps), duration: seconds(16, fps)},
  objectIdentity: {from: seconds(22, fps), duration: seconds(15, fps)},
  objectAtmosphere: {from: seconds(37, fps), duration: seconds(24, fps)},
  objectOutcomes: {from: seconds(61, fps), duration: seconds(6, fps)},
  transitionToDateTime: {from: seconds(67, fps), duration: seconds(4, fps)},
  dateTimeQuestion: {from: seconds(71, fps), duration: seconds(9, fps)},
  dateTimeComparison: {from: seconds(80, fps), duration: seconds(6, fps)},
  dateTimePitfall: {from: seconds(86, fps), duration: seconds(6, fps)},
  exceptionContext: {from: seconds(92, fps), duration: seconds(31, fps)},
  exceptionQuestion: {from: seconds(123, fps), duration: seconds(14, fps)},
  exceptionTypes: {from: seconds(137, fps), duration: seconds(22, fps)},
  exceptionFollowUp: {from: seconds(159, fps), duration: seconds(8, fps)},
  exceptionCorrection: {from: seconds(167, fps), duration: seconds(83, fps)},
});

export type Speaker = 'mikhail' | 'interviewer';

export const speakerAt = (frame: number, fps: number): Speaker => {
  if (frame < seconds(2, fps)) return 'interviewer';
  if (frame < seconds(4, fps)) return 'mikhail';
  if (frame < seconds(5, fps)) return 'interviewer';
  if (frame < seconds(60, fps)) return 'mikhail';
  return 'interviewer';
};

export const speakerAtOop = (frame: number, fps: number): Speaker =>
  frame < seconds(5, fps) ? 'interviewer' : 'mikhail';

export const speakerAtQuestionBatch = (frame: number, fps: number): Speaker => {
  const at = frame / fps;

  if (at < 6) return 'interviewer';
  if (at < 11) return 'mikhail';
  if (at < 22) return 'interviewer';
  if (at < 37) return 'mikhail';
  if (at < 80) return 'interviewer';
  if (at < 90) return 'mikhail';
  if (at < 93) return 'interviewer';
  if (at < 137) return 'interviewer';
  if (at < 159) return 'mikhail';
  if (at < 167) return 'interviewer';
  if (at < 180) return 'mikhail';
  if (at < 217) return 'interviewer';
  if (at < 227) return 'mikhail';
  return 'interviewer';
};
