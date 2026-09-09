import {PhpTokens} from './PhpCodeBlock';
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
import {ReviewSlide} from './ReviewSlide';
import {
  PRODUCTION_FPS,
  questionBatchTimeline,
  speakerAtQuestionBatch,
} from './timeline';

type Props = {format: Format; withAudio?: boolean};

const useAnimationFrame = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame: frame * PRODUCTION_FPS / fps, fps};
};

const QuestionSlide = ({
  format,
  speaker,
  slideId,
}: SlideProps & {slideId: string}) => (
  <ReviewSlide format={format} speaker={speaker} slideId={slideId} />
);

const BareScene = ({format, speaker}: SlideProps) => (
  <InterviewShell
    format={format}
    speaker={speaker}
    counter=""
    question=""
    showHeader={false}
    bareVisual
    speakerMode="conversation"
  >
    <div />
  </InterviewShell>
);

const ObjectMutationSlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId="03-mutation"
      contentLayout={format === 'short' ? 'balanced' : 'compact'}
    >
      <div className="batch-content batch-content--single-code" style={enter(frame)}>
        <div className="batch-code-card">
          <div className="batch-code-card__label">Параметр без &amp;</div>
          <pre>
            <code><PhpTokens code={`function rename(User $user): void {
  $user->name = 'Alex';
}

$user = new User('Mikhail');
rename($user);`} /></code>
          </pre>
        </div>
        <div className="batch-result batch-result--good" style={reveal(frame, 7 * fps)}>
          <span>После вызова</span>
          <code><PhpTokens code={`$user->name`} /></code>
          <strong>'Alex'</strong>
          <small>Изменение объекта видно снаружи</small>
        </div>
      </div>
    </ReviewSlide>
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
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId="03-identity"
      contentLayout={format === 'short' ? 'dense' : 'compact'}
    >
      <div className="identity-layout" style={enter(frame)}>
        <div className="identity-checks">
          <code><span>до вызова</span> <PhpTokens code="spl_object_id($user)" /></code><b>1434</b>
          <code><span>внутри inspect()</span> <PhpTokens code="spl_object_id($arg)" /></code><b>1434</b>
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
    </ReviewSlide>
  );
};

const DateTimeComparisonSlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId="04-comparison"
      contentLayout={format === 'short' ? 'balanced' : 'compact'}
    >
      <div className="datetime-comparison" style={enter(frame)}>
        <article className="datetime-card datetime-card--mutable">
          <header><span>mutable</span><strong>DateTime</strong></header>
          <code><PhpTokens code={`$next = $date->modify('+1 day');`} /></code>
          <div className="date-transition"><b>01 Jan</b><i>→</i><b>02 Jan</b></div>
          <div className="identity-row"><span><PhpTokens code="$date === $next" /></span><b>true</b></div>
          <p>Меняет текущий объект</p>
        </article>
        <article className="datetime-card datetime-card--immutable" style={reveal(frame, 1.5 * fps)}>
          <header><span>immutable</span><strong>DateTimeImmutable</strong></header>
          <code><PhpTokens code={`$next = $date->modify('+1 day');`} /></code>
          <div className="date-transition date-transition--fork"><b>01 Jan</b><i>↗</i><b>new 02 Jan</b></div>
          <div className="identity-row"><span><PhpTokens code="$date === $next" /></span><b>false</b></div>
          <p>Возвращает новый объект</p>
        </article>
      </div>
    </ReviewSlide>
  );
};

const DateTimePitfallSlide = ({format, speaker}: SlideProps) => {
  const {frame, fps} = useAnimationFrame();

  return (
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId="04-pitfall"
      contentLayout="compact"
    >
      <div className="pitfall-layout" style={enter(frame)}>
        <article className="pitfall-card pitfall-card--lost">
          <span>Результат потерян</span>
          <code><PhpTokens code={`$date->modify('+1 day');`} /></code>
          <strong>2026-01-01</strong>
          <small>Исходный объект не изменился</small>
        </article>
        <article className="pitfall-card pitfall-card--saved" style={reveal(frame, 2 * fps)}>
          <span>Результат сохранён</span>
          <code><PhpTokens code={`$date = $date->modify('+1 day');`} /></code>
          <strong>2026-01-02</strong>
          <small>Новое значение присвоено переменной</small>
        </article>
      </div>
    </ReviewSlide>
  );
};

const ExceptionTypesSlide = ({format, speaker}: SlideProps) => {
  const {frame} = useAnimationFrame();

  return (
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId="05-types"
      contentLayout={format === 'short' ? 'balanced' : 'compact'}
    >
      <div className="exception-types" style={enter(frame)}>
        <article className="exception-generic">
          <span>Один общий тип</span>
          <code><PhpTokens code={`new Exception(
  'Payment failed'
);`} /></code>
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
    </ReviewSlide>
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
      <div className="flow-arrow" style={reveal(frame, 2 * fps)}><span>catch + translate</span><b>→</b><code><PhpTokens code={`previous: $e`} /></code></div>
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
    <ReviewSlide
      format={format}
      speaker={speaker}
      slideId="05-correction"
      contentLayout={format === 'short' ? 'dense' : 'compact'}
    >
      <div className="exception-correction">
        {frame < flowStartsAt ? (
          <CorrectionPrinciple frame={frame} fps={fps} />
        ) : (
          <ExceptionFlow frame={frame - flowStartsAt} fps={fps} />
        )}
      </div>
    </ReviewSlide>
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
        <QuestionSlide format={format} speaker={speaker} slideId="03-question" />
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
        <QuestionSlide format={format} speaker={speaker} slideId="04-question" />
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
        <QuestionSlide format={format} speaker={speaker} slideId="05-question" />
      </Sequence>
      <Sequence from={timeline.exceptionTypes.from} durationInFrames={timeline.exceptionTypes.duration} name="05 · Типы исключений">
        <ExceptionTypesSlide format={format} speaker={speaker} />
      </Sequence>
      <Sequence from={timeline.exceptionFollowUp.from} durationInFrames={timeline.exceptionFollowUp.duration} name="05 · Follow-up">
        <QuestionSlide format={format} speaker={speaker} slideId="05-follow-up" />
      </Sequence>
      <Sequence from={timeline.exceptionCorrection.from} durationInFrames={timeline.exceptionCorrection.duration} name="05 · Уточнение ответа">
        <ExceptionCorrectionSlide format={format} speaker={speaker} />
      </Sequence>
    </AbsoluteFill>
  );
};
