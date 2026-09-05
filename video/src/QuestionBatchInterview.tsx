import type {ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  enter,
  InterviewShell,
  reveal,
  type Format,
  type SlideProps,
} from './InterviewShell';
import {
  PRODUCTION_FPS,
  questionBatchTimeline,
  speakerAtQuestionBatch,
  TOTAL_QUESTIONS,
} from './timeline';

type Props = {format: Format; withAudio?: boolean};

const objectQuestion = 'Что происходит при передаче объекта в метод?';
const dateTimeQuestion = 'DateTimeImmutable лучше или хуже DateTime?';
const exceptionQuestion = 'Как работать с исключениями в слоях и DDD?';

const useAnimationFrame = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame: frame * PRODUCTION_FPS / fps, fps};
};

const QuestionSlide = ({
  format,
  speaker,
  counter,
  eyebrow,
  children,
  className = '',
}: SlideProps & {
  counter: string;
  eyebrow: string;
  children: ReactNode;
  className?: string;
}) => {
  const {frame} = useAnimationFrame();

  return (
    <InterviewShell
      format={format}
      speaker={speaker}
      counter={counter}
      question={children}
      showHeader={false}
    >
      <div className={`question-slide batch-question ${className}`} style={enter(frame)}>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{children}</h1>
      </div>
    </InterviewShell>
  );
};

const BareScene = ({format, speaker}: SlideProps) => (
  <InterviewShell
    format={format}
    speaker={speaker}
    counter=""
    question=""
    showHeader={false}
    bareVisual
  >
    <div />
  </InterviewShell>
);

const ObjectMutationSlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <InterviewShell format={format} speaker={speaker} counter="3" question={objectQuestion}>
      <div className="batch-content batch-content--single-code" style={enter(frame)}>
        <div className="batch-code-card">
          <div className="batch-code-card__label">Параметр без &amp;</div>
          <pre>
            <code>
              <span className="kw">function</span> rename(<span className="type">User</span> <span className="var">$user</span>): <span className="type">void</span>{' '}
              {'{'}{`\n`}  <span className="var">$user</span>-&gt;name = <span className="str">'Alex'</span>;{`\n`}{'}'}
              {`\n\n`}<span className="var">$user</span> = <span className="kw">new</span> <span className="type">User</span>(<span className="str">'Mikhail'</span>);{`\n`}
              rename(<span className="var">$user</span>);
            </code>
          </pre>
        </div>
        <div className="batch-result batch-result--good" style={reveal(frame, 7 * fps)}>
          <span>После вызова</span>
          <code>$user-&gt;name</code>
          <strong>'Alex'</strong>
          <small>Изменение объекта видно снаружи</small>
        </div>
      </div>
    </InterviewShell>
  );
};

const ZvalBox = ({name}: {name: '$user' | '$arg'}) => (
  <div className="zval-box">
    <strong>{name}</strong>
    <span>zval</span>
    <code>IS_OBJECT</code>
    <b>handle #1434</b>
  </div>
);

const ObjectIdentitySlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <InterviewShell format={format} speaker={speaker} counter="3" question={objectQuestion}>
      <div className="identity-layout" style={enter(frame)}>
        <div className="identity-checks">
          <code><span>до вызова</span> spl_object_id($user)</code><b>1434</b>
          <code><span>внутри inspect()</span> spl_object_id($arg)</code><b>1434</b>
        </div>
        <div className="zval-flow" style={reveal(frame, 3 * fps)}>
          <ZvalBox name="$user" />
          <div className="copy-arrow"><span>копия значения</span><b>→</b></div>
          <ZvalBox name="$arg" />
        </div>
        <div className="shared-object" style={reveal(frame, 7 * fps)}>
          <span>оба handle указывают сюда</span>
          <strong>User object #1434</strong>
        </div>
        <div className="identity-summary" style={reveal(frame, 10 * fps)}>
          <b>Две zval</b><span>·</span><b>один объект</b><span>·</span><b>не alias через &amp;</b>
        </div>
      </div>
    </InterviewShell>
  );
};

const DateTimeComparisonSlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <InterviewShell format={format} speaker={speaker} counter="4" question="DateTime и DateTimeImmutable — в чём разница?">
      <div className="datetime-comparison" style={enter(frame)}>
        <article className="datetime-card datetime-card--mutable">
          <header><span>mutable</span><strong>DateTime</strong></header>
          <code>$next = $date-&gt;modify('+1 day');</code>
          <div className="date-transition"><b>01 Jan</b><i>→</i><b>02 Jan</b></div>
          <div className="identity-row"><span>$date === $next</span><b>true</b></div>
          <p>Меняет текущий объект</p>
        </article>
        <article className="datetime-card datetime-card--immutable" style={reveal(frame, 1.5 * fps)}>
          <header><span>immutable</span><strong>DateTimeImmutable</strong></header>
          <code>$next = $date-&gt;modify('+1 day');</code>
          <div className="date-transition date-transition--fork"><b>01 Jan</b><i>↗</i><b>new 02 Jan</b></div>
          <div className="identity-row"><span>$date === $next</span><b>false</b></div>
          <p>Возвращает новый объект</p>
        </article>
      </div>
    </InterviewShell>
  );
};

const DateTimePitfallSlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <InterviewShell format={format} speaker={speaker} counter="4" question="DateTimeImmutable возвращает новый объект">
      <div className="pitfall-layout" style={enter(frame)}>
        <article className="pitfall-card pitfall-card--lost">
          <span>Результат потерян</span>
          <code>$date-&gt;modify('+1 day');</code>
          <strong>2026-01-01</strong>
          <small>Исходный объект не изменился</small>
        </article>
        <article className="pitfall-card pitfall-card--saved" style={reveal(frame, 2 * fps)}>
          <span>Результат сохранён</span>
          <code>$date = $date-&gt;modify('+1 day');</code>
          <strong>2026-01-02</strong>
          <small>Новое значение присвоено переменной</small>
        </article>
      </div>
    </InterviewShell>
  );
};

const ExceptionTypesSlide = ({format, speaker}: SlideProps) => {
  const {frame} = useAnimationFrame();

  return (
    <InterviewShell format={format} speaker={speaker} counter="5" question="Исключение должно сообщать смысл сбоя">
      <div className="exception-types" style={enter(frame)}>
        <article className="exception-generic">
          <span>Один общий тип</span>
          <code>new Exception(<br />&nbsp;&nbsp;'Payment failed'<br />);</code>
          <p>Смысл спрятан в строке</p>
        </article>
        <div className="exception-divider">→</div>
        <div className="exception-semantic">
          <article style={reveal(frame, 6 * PRODUCTION_FPS)}>
            <span>Бизнес-отказ</span>
            <strong>PaymentDeclined</strong>
            <p>Можно обработать отдельным сценарием</p>
          </article>
          <article style={reveal(frame, 6 * PRODUCTION_FPS)}>
            <span>Сбой зависимости</span>
            <strong>PaymentGatewayUnavailable</strong>
            <p>Техническая причина выражена типом</p>
          </article>
        </div>
      </div>
    </InterviewShell>
  );
};

const CorrectionPrinciple = ({frame, fps}: {frame: number; fps: number}) => (
  <div className="correction-principle">
    <div className="correction-badge">Уточнение ответа</div>
    <h2>Ловим там, где можем принять решение</h2>
    <div className="decision-grid">
      <article style={reveal(frame, 0)}><b>1</b><strong>Восстановиться</strong><span>Повторить операцию или выбрать fallback</span></article>
      <article style={reveal(frame, 8 * fps)}><b>2</b><strong>Перевести ошибку</strong><span>Выразить сбой на языке следующего слоя</span></article>
      <article style={reveal(frame, 28 * fps)}><b>3</b><strong>Сформировать ответ</strong><span>Вернуть внешний response и записать ошибку</span></article>
    </div>
    <div className="propagate-rule" style={reveal(frame, 45 * fps)}>
      Нечего осмысленно обработать? <strong>Не ловим — пропускаем выше ↑</strong>
    </div>
  </div>
);

const ExceptionFlow = ({frame, fps}: {frame: number; fps: number}) => (
  <div className="exception-flow">
    <div className="correction-badge">Уточнение ответа</div>
    <h2>Переводим исключение на границе</h2>
    <div className="flow-row">
      <article className="flow-node flow-node--source" style={reveal(frame, 0)}>
        <span>Payment provider</span>
        <strong>GatewayTimeout</strong>
        <small>инфраструктурный сбой</small>
      </article>
      <div className="flow-arrow" style={reveal(frame, 2 * fps)}><span>catch + translate</span><b>→</b><code>previous: $e</code></div>
      <article className="flow-node flow-node--app" style={reveal(frame, 5 * fps)}>
        <span>Adapter boundary</span>
        <strong>PaymentGatewayUnavailable</strong>
        <small>ошибка понятна приложению</small>
      </article>
      <div className="flow-arrow" style={reveal(frame, 9 * fps)}><span>propagate</span><b>→</b></div>
      <article className="flow-node flow-node--response" style={reveal(frame, 12 * fps)}>
        <span>HTTP boundary</span>
        <strong>response + log</strong>
        <small>внешнее представление ошибки</small>
      </article>
    </div>
  </div>
);

const ExceptionCorrectionSlide = ({format, speaker}: SlideProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flowStartsAt = 60 * fps;

  return (
    <InterviewShell format={format} speaker={speaker} counter="5" question="Где ловить исключение?">
      <div className="exception-correction">
        {frame < flowStartsAt ? (
          <CorrectionPrinciple frame={frame} fps={fps} />
        ) : (
          <ExceptionFlow frame={frame - flowStartsAt} fps={fps} />
        )}
      </div>
    </InterviewShell>
  );
};

export const QuestionBatchInterview = ({format, withAudio = true}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeline = questionBatchTimeline(fps);
  const speaker = speakerAtQuestionBatch(frame, fps);

  return (
    <AbsoluteFill>
      {withAudio && <Audio src={staticFile('generated/questions-03-05-audio.m4a')} />}

      <Sequence from={timeline.objectQuestion.from} durationInFrames={timeline.objectQuestion.duration} name="03 · Вопрос">
        <QuestionSlide format={format} speaker={speaker} counter="3" eyebrow={`Вопрос 3 из ${TOTAL_QUESTIONS}`}>
          Что происходит при передаче<br />объекта в метод?
        </QuestionSlide>
      </Sequence>
      <Sequence from={timeline.objectMutation.from} durationInFrames={timeline.objectMutation.duration} name="03 · Мутация без &amp;">
        <ObjectMutationSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.objectIdentity.from} durationInFrames={timeline.objectIdentity.duration} name="03 · Object identity">
        <ObjectIdentitySlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.objectAtmosphere.from} durationInFrames={timeline.objectAtmosphere.duration} name="03 · Живой разговор">
        <BareScene format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.transitionToDateTime.from} durationInFrames={timeline.transitionToDateTime.duration} name="Переход к DateTime">
        <BareScene format={format} speaker={speaker} />
      </Sequence>

      <Sequence from={timeline.dateTimeQuestion.from} durationInFrames={timeline.dateTimeQuestion.duration} name="04 · Вопрос">
        <QuestionSlide format={format} speaker={speaker} counter="4" eyebrow={`Вопрос 4 из ${TOTAL_QUESTIONS}`}>
          <span>DateTimeImmutable</span><br />лучше или хуже <span>DateTime</span>?
        </QuestionSlide>
      </Sequence>
      <Sequence from={timeline.dateTimeComparison.from} durationInFrames={timeline.dateTimeComparison.duration} name="04 · Сравнение">
        <DateTimeComparisonSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.dateTimePitfall.from} durationInFrames={timeline.dateTimePitfall.duration} name="04 · Потерянный результат">
        <DateTimePitfallSlide format={format} speaker={speaker} />
      </Sequence>

      <Sequence from={timeline.exceptionContext.from} durationInFrames={timeline.exceptionContext.duration} name="05 · Вводная">
        <BareScene format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.exceptionQuestion.from} durationInFrames={timeline.exceptionQuestion.duration} name="05 · Вопрос">
        <QuestionSlide format={format} speaker={speaker} counter="5" eyebrow={`Вопрос 5 из ${TOTAL_QUESTIONS}`}>
          Как работать с исключениями<br />в слоях и DDD?
        </QuestionSlide>
      </Sequence>
      <Sequence from={timeline.exceptionTypes.from} durationInFrames={timeline.exceptionTypes.duration} name="05 · Типы исключений">
        <ExceptionTypesSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.exceptionFollowUp.from} durationInFrames={timeline.exceptionFollowUp.duration} name="05 · Follow-up">
        <QuestionSlide format={format} speaker={speaker} counter="5" eyebrow="Уточнение интервьюера" className="batch-question--follow-up">
          А где лучше ловить<br />исключение?
        </QuestionSlide>
      </Sequence>
      <Sequence from={timeline.exceptionCorrection.from} durationInFrames={timeline.exceptionCorrection.duration} name="05 · Уточнение ответа">
        <ExceptionCorrectionSlide format={format} speaker={speaker} />
      </Sequence>
    </AbsoluteFill>
  );
};
