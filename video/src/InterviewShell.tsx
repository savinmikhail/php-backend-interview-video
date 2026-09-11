import type {ReactNode} from 'react';
import {
  AbsoluteFill,
  CanvasImage,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {PRODUCTION_FPS, TOTAL_QUESTIONS, type Speaker} from './timeline';
import {useReviewSpeaker} from './speakerTimeline';

export type Format = 'wide' | 'short';
export type SpeakerMode = 'hidden' | 'conversation';
export type ContentLayout = 'fill' | 'compact' | 'balanced' | 'dense';

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

type MouthState = 'closed' | 'half' | 'open' | 'o';

const mouthPattern: MouthState[] = [
  'half',
  'open',
  'half',
  'closed',
  'half',
  'o',
  'half',
  'open',
];

const MikhailAvatar = ({
  active,
  frame,
  animated,
}: {
  active: boolean;
  frame: number;
  animated: boolean;
}) => {
  const mouthState = active && animated
    ? mouthPattern[Math.floor(frame / 16) % mouthPattern.length]
    : 'closed';

  return (
    <span className="avatar avatar--mikhail">
      <CanvasImage
className="avatar__image"
src={staticFile('avatars/mikhail-v1.png')}
from={-430} />
      {mouthState !== 'o' && (
        <span className="avatar__mouth-crop">
          <CanvasImage
            className="avatar__mouth-image"
            src={staticFile(`avatars/mikhail-mouth-${mouthState}-v1.png`)}
          />
        </span>
      )}
    </span>
  );
};

const Avatar = ({
  kind,
  active,
  frame,
  animateMikhail,
}: {
  kind: Speaker;
  active: boolean;
  frame: number;
  animateMikhail: boolean;
}) =>
  kind === 'mikhail' ? (
    <MikhailAvatar
      active={active}
      frame={frame}
      animated={animateMikhail}
    />
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
  animateMikhail,
}: {
  kind: Speaker;
  active: boolean;
  frame: number;
  animateMikhail: boolean;
}) => (
  <div className={`speaker speaker--${kind} ${active ? 'is-active' : ''}`}>
    {kind === 'mikhail' && (
      <Avatar
        kind={kind}
        active={active}
        frame={frame}
        animateMikhail={animateMikhail}
      />
    )}
    <div className="speaker__copy">
      <strong>{kind === 'mikhail' ? 'Михаил' : 'Интервьюер'}</strong>
      <span>
        <Wave frame={frame} active={active} />
        {active ? 'говорит' : 'слушает'}
      </span>
    </div>
    {kind === 'interviewer' && (
      <Avatar
        kind={kind}
        active={active}
        frame={frame}
        animateMikhail={animateMikhail}
      />
    )}
  </div>
);

const QuestionHeader = ({counter, question}: {counter: string; question: ReactNode}) => (
  <header className="question-header">
    <div className="counter">
      <b>{counter.padStart(2, '0')}</b>
      <span>/ {TOTAL_QUESTIONS}</span>
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
  animateMikhail = false,
  speakerMode = 'hidden',
  contentLayout = 'fill',
}: {
  children: ReactNode;
  format: Format;
  speaker: Speaker;
  counter: string;
  question: ReactNode;
  showHeader?: boolean;
  bareVisual?: boolean;
  animateMikhail?: boolean;
  speakerMode?: SpeakerMode;
  contentLayout?: ContentLayout;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reviewSpeaker = useReviewSpeaker();
  const activeSpeaker = reviewSpeaker ?? speaker;
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
      <main className={`stage stage--${speakerMode} ${showHeader ? '' : 'stage--question'}`}>
        {showHeader && <QuestionHeader counter={counter} question={question} />}
        <section className={`visual visual--layout-${contentLayout} ${showHeader ? '' : 'visual--question'} ${bareVisual ? 'visual--bare' : ''}`}>{children}</section>
        {speakerMode === 'conversation' && (
          <footer className="speakers">
            <SpeakerBadge
              kind="mikhail"
              active={activeSpeaker === 'mikhail'}
              frame={animationFrame}
              animateMikhail={animateMikhail}
            />
            <SpeakerBadge
              kind="interviewer"
              active={activeSpeaker === 'interviewer'}
              frame={animationFrame}
              animateMikhail={animateMikhail}
            />
          </footer>
        )}
      </main>
    </AbsoluteFill>
  );
};
