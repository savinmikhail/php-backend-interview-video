import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {PRODUCTION_FPS, type Speaker} from './timeline';

export type Format = 'wide' | 'short';
export type SlideProps = {format: Format; speaker: Speaker};

export const enter = (frame: number): CSSProperties => ({
  opacity: interpolate(frame, [0, 12], [0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }),
  transform: `translateY(${interpolate(frame, [0, 14], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })}px)`,
});

export const reveal = (frame: number, delay: number): CSSProperties => ({
  opacity: interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }),
  transform: `translateY(${interpolate(frame, [delay, delay + 12], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })}px)`,
});

const Wave = ({frame, active}: {frame: number; active: boolean}) => (
  <span className="wave" aria-hidden="true">
    {[0, 1, 2, 3].map((index) => (
      <i
        key={index}
        style={{
          height: active
            ? 8 + Math.abs(Math.sin(frame * 0.28 + index * 1.7)) * 18
            : 7,
        }}
      />
    ))}
  </span>
);

const Avatar = ({kind}: {kind: Speaker}) =>
  kind === 'mikhail' ? (
    <span className="avatar avatar--mikhail">
      <Img
        className="avatar__image"
        src={staticFile('generated/current-layout.png')}
      />
    </span>
  ) : (
    <span className="avatar avatar--interviewer">
      <span className="anonymous-head" />
      <span className="anonymous-body" />
      <b>?</b>
    </span>
  );

const SpeakerBadge = ({
  kind,
  active,
  frame,
}: {
  kind: Speaker;
  active: boolean;
  frame: number;
}) => (
  <div className={`speaker speaker--${kind} ${active ? 'is-active' : ''}`}>
    {kind === 'mikhail' && <Avatar kind={kind} />}
    <div className="speaker__copy">
      <strong>{kind === 'mikhail' ? 'Михаил' : 'Интервьюер'}</strong>
      <span>
        <Wave frame={frame} active={active} />
        {active ? 'говорит' : 'слушает'}
      </span>
    </div>
    {kind === 'interviewer' && <Avatar kind={kind} />}
  </div>
);

const QuestionHeader = ({counter, question}: {counter: string; question: ReactNode}) => (
  <header className="question-header">
    <div className="counter">
      <b>{counter.padStart(2, '0')}</b>
      <span>/ 58</span>
    </div>
    <h1>{question}</h1>
  </header>
);

export const InterviewShell = ({
  children,
  format,
  speaker,
  counter,
  question,
  showHeader = true,
  bareVisual = false,
}: {
  children: ReactNode;
  format: Format;
  speaker: Speaker;
  counter: string;
  question: ReactNode;
  showHeader?: boolean;
  bareVisual?: boolean;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const animationFrame = frame * PRODUCTION_FPS / fps;
  const driftX = Math.sin(animationFrame / 95) * 52;
  const driftY = Math.cos(animationFrame / 118) * 34;

  return (
    <AbsoluteFill className={`composition composition--${format}`}>
      <div
        className="mist mist--one"
        style={{transform: `translate(${driftX}px, ${driftY}px) scale(1.08)`}}
      />
      <div
        className="mist mist--two"
        style={{transform: `translate(${-driftX * 0.7}px, ${-driftY}px) scale(1.12)`}}
      />
      <main className={`stage ${showHeader ? '' : 'stage--question'}`}>
        {showHeader && <QuestionHeader counter={counter} question={question} />}
        <section className={`visual ${showHeader ? '' : 'visual--question'} ${bareVisual ? 'visual--bare' : ''}`}>{children}</section>
        <footer className="speakers">
          <SpeakerBadge kind="mikhail" active={speaker === 'mikhail'} frame={animationFrame} />
          <SpeakerBadge kind="interviewer" active={speaker === 'interviewer'} frame={animationFrame} />
        </footer>
      </main>
    </AbsoluteFill>
  );
};
