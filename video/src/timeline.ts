export const PRODUCTION_FPS = 30;
export const DEV_FPS = 10;

const seconds = (value: number, fps: number) => Math.round(value * fps);

export const readonlyTimeline = (fps: number) => ({
  duration: seconds(88, fps),
  question: {from: seconds(0, fps), duration: seconds(5, fps)},
  rules: {from: seconds(5, fps), duration: seconds(34, fps)},
  benefits: {from: seconds(39, fps), duration: seconds(21, fps)},
  nuance: {from: seconds(60, fps), duration: seconds(28, fps)},
});

export type Speaker = 'mikhail' | 'interviewer';

export const speakerAt = (frame: number, fps: number): Speaker => {
  if (frame < seconds(2, fps)) return 'interviewer';
  if (frame < seconds(4, fps)) return 'mikhail';
  if (frame < seconds(5, fps)) return 'interviewer';
  if (frame < seconds(60, fps)) return 'mikhail';
  return 'interviewer';
};
