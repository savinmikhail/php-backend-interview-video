import {PhpTokens} from '../PhpCodeBlock';
import {
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {enter, reveal} from '../slideMotion';
import {
  PRODUCTION_FPS,
} from '../timeline';

const useAnimationFrame = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame: frame * PRODUCTION_FPS / fps, fps};
};

export const ObjectMutation = () => {
  const {frame, fps} = useAnimationFrame();

  return (
    <div className="early-content early-content--single-code" style={enter(frame)}>
      <div className="early-code-card">
        <div className="early-code-card__label">Параметр без &amp;</div>
        <pre>
          <code><PhpTokens code={`function rename(User $user): void {
  $user->name = 'Alex';
}

$user = new User('Mikhail');
rename($user);`} /></code>
        </pre>
      </div>
      <div className="early-result early-result--good" style={reveal(frame, 7 * fps)}>
        <span>После вызова</span>
        <code><PhpTokens code={`$user->name`} /></code>
        <strong>'Alex'</strong>
        <small>Изменение объекта видно снаружи</small>
      </div>
    </div>
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

export const ObjectIdentity = () => {
  const {frame, fps} = useAnimationFrame();

  return (
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
  );
};

export const DateTimeComparison = () => {
  const {frame, fps} = useAnimationFrame();

  return (
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
  );
};

export const DateTimePitfall = () => {
  const {frame, fps} = useAnimationFrame();

  return (
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
  );
};

export const ExceptionTypes = () => {
  const {frame} = useAnimationFrame();

  return (
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
  );
};

const CorrectionPrinciple = ({frame, fps}: {frame: number; fps: number}) => (
  <div className="correction-principle">
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

export const ExceptionCorrection = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flowStartsAt = 60 * fps;

  return (
    <div className="exception-correction">
      {frame < flowStartsAt ? (
        <CorrectionPrinciple frame={frame} fps={fps} />
      ) : (
        <ExceptionFlow frame={frame - flowStartsAt} fps={fps} />
      )}
    </div>
  );
};
