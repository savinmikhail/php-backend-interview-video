import type {CSSProperties, ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  PRODUCTION_FPS,
  readonlyTimeline,
  speakerAt,
  type Speaker,
} from './timeline';

type Format = 'wide' | 'short';
type Props = {format: Format};
type SlideProps = Props & {speaker: Speaker};

const enter = (frame: number): CSSProperties => ({
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

const QuestionHeader = () => (
  <header className="question-header">
    <div className="counter"><b>01</b><span>/ 58</span></div>
    <h1>Что такое readonly-класс в PHP?</h1>
  </header>
);

const Shell = ({
  children,
  format,
  speaker,
  showHeader = true,
}: {
  children: ReactNode;
  format: Format;
  speaker: Speaker;
  showHeader?: boolean;
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
        {showHeader && <QuestionHeader />}
        <section className={`visual ${showHeader ? '' : 'visual--question'}`}>{children}</section>
        <footer className="speakers">
          <SpeakerBadge kind="mikhail" active={speaker === 'mikhail'} frame={animationFrame} />
          <SpeakerBadge kind="interviewer" active={speaker === 'interviewer'} frame={animationFrame} />
        </footer>
      </main>
    </AbsoluteFill>
  );
};

const QuestionSlide = ({format, speaker}: SlideProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Shell format={format} speaker={speaker} showHeader={false}>
      <div className="question-slide" style={enter(frame * PRODUCTION_FPS / fps)}>
        <div className="eyebrow">Вопрос 1 из 58</div>
        <h1>Что такое<br /><em>readonly-класс</em> в PHP?</h1>
      </div>
    </Shell>
  );
};

const ErrorLine = () => (
  <div className="error-line">
    <span>Error</span>
    Cannot modify readonly property User::$name
  </div>
);

const LockIcon = ({small = false}: {small?: boolean}) => (
  <span className={`lock-icon ${small ? 'lock-icon--small' : ''}`} aria-label="защищено" />
);

const RulesSlide = ({format, speaker}: SlideProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Shell format={format} speaker={speaker}>
      <div className="rules-layout" style={enter(frame * PRODUCTION_FPS / fps)}>
        <div className="code-card">
          <pre><code><span className="kw">readonly class</span> <span className="type">User</span>{`\n{\n`}  <span className="kw">public function</span> __construct({`\n`}    <span className="kw">public string</span> <span className="var">$name</span>,{`\n`}    <span className="kw">public Address</span> <span className="var">$address</span>,{`\n`}  ) {'{}'}{`\n}`}{`\n\n`}<span className="var">$user</span>-&gt;name = <span className="str">'Alex'</span>;</code></pre>
          <ErrorLine />
        </div>
        <div className="takeaways">
          <Takeaway icon={<LockIcon />} title="Одно присваивание" text="После инициализации изменить нельзя" />
          <Takeaway icon="C" title="Все свойства readonly" text="Модификатор класса применяется ко всем свойствам" />
          <Takeaway
            icon="P"
            title="Readonly-свойство"
            text="Можно пометить одно свойство, не весь класс"
            snippet="public readonly string $name;"
          />
        </div>
      </div>
    </Shell>
  );
};

const Takeaway = ({icon, title, text, snippet, className = ''}: {icon: ReactNode; title: string; text: string; snippet?: string; className?: string}) => (
  <div className={`takeaway ${className}`}>
    <span className="takeaway__icon">{icon}</span>
    <div><strong>{title}</strong><span>{text}</span>{snippet && <code>{snippet}</code>}</div>
  </div>
);

const BenefitsSlide = ({format, speaker}: SlideProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Shell format={format} speaker={speaker}>
      <div className="benefits" style={enter(frame * PRODUCTION_FPS / fps)}>
        <div className="benefits__grid">
          <Benefit icon="↺" title="Меньше мутаций" text="Меньше неожиданных переходов состояния" />
          <Benefit icon="⌕" title="Проще рассуждать и дебажить" text="Понятнее состояние объекта и источник значения" />
          <Benefit icon="→" title="DTO · events · messages" text="Объекты, которые не должны менять состояние" />
          <Benefit icon="∞" title="Полезно в long-running" text="Меньше риска протекания состояния между задачами" />
        </div>
        <div className="benefits__caveat"><strong>Важно:</strong> readonly снижает риск случайного накопления состояния, но не является общей защитой от memory leaks.</div>
      </div>
    </Shell>
  );
};

const Benefit = ({icon, title, text}: {icon: string; title: string; text: string}) => (
  <article className="benefit">
    <span className="benefit__icon">{icon}</span>
    <h2>{title}</h2>
    <p>{text}</p>
  </article>
);

const NuanceSlide = ({format, speaker}: SlideProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Shell format={format} speaker={speaker}>
      <div className="nuance" style={enter(frame * PRODUCTION_FPS / fps)}>
        <h2>readonly <span>≠</span> deep immutable</h2>
        <div className="object-comparison">
          <div className="object object--readonly">
            <small>readonly class</small><strong>User</strong>
            <code>$name <LockIcon small /></code>
            <code>$address <span className="property-note">ссылка защищена <LockIcon small /></span></code>
          </div>
          <div className="arrow">→</div>
          <div className="object object--mutable">
            <small>обычный mutable-класс</small><strong>Address</strong>
            <code>$city: 'Moscow'</code>
            <span className="object__state">Состояние объекта изменяемо</span>
          </div>
          <div className="result result--bad"><code>$user-&gt;name = 'Alex';</code><b>Ошибка</b></div>
          <div className="result result--good"><code>$user-&gt;address-&gt;city = 'Berlin';</code><b>Допустимо</b></div>
          <Takeaway
            icon={<LockIcon />}
            title="Ссылка защищена"
            text="Нельзя присвоить другой Address"
            className="nuance-summary nuance-summary--readonly"
          />
          <Takeaway
            icon="↻"
            title="Объект не заморожен"
            text="Его состояние всё ещё изменяемо"
            className="nuance-summary nuance-summary--mutable"
          />
        </div>
      </div>
    </Shell>
  );
};

export const ReadonlyInterview = ({format}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeline = readonlyTimeline(fps);
  const speaker = speakerAt(frame, fps);

  return (
    <AbsoluteFill>
      <Audio src={staticFile('generated/readonly-audio.m4a')} />
      <Sequence from={timeline.question.from} durationInFrames={timeline.question.duration} name="Вопрос">
        <QuestionSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.rules.from} durationInFrames={timeline.rules.duration} name="Как работает">
        <RulesSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.benefits.from} durationInFrames={timeline.benefits.duration} name="Зачем">
        <BenefitsSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.nuance.from} durationInFrames={timeline.nuance.duration} name="Readonly ≠ immutable">
        <NuanceSlide format={format} speaker={speaker} />
      </Sequence>
    </AbsoluteFill>
  );
};
