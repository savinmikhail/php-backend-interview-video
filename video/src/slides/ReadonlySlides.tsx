import {PhpTokens} from '../PhpCodeBlock';
import type {ReactNode} from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {enter} from '../slideMotion';
import {
  PRODUCTION_FPS,
} from '../timeline';

const ErrorLine = () => (
  <div className="error-line">
    <span>Error</span>
    Cannot modify readonly property User::$name
  </div>
);

const LockIcon = ({small = false}: {small?: boolean}) => (
  <span className={`lock-icon ${small ? 'lock-icon--small' : ''}`} aria-label="защищено" />
);

export const ReadonlyRules = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div className="rules-layout" style={enter(frame * PRODUCTION_FPS / fps)}>
      <div className="code-card">
        <pre><code><PhpTokens code={`readonly class User
{
  public function __construct(
    public string $name,
    public Address $address,
  ) {}
}

$user->name = 'Alex';`} /></code></pre>
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
  );
};

const Takeaway = ({icon, title, text, snippet, className = ''}: {icon: ReactNode; title: string; text: string; snippet?: string; className?: string}) => (
  <div className={`takeaway ${className}`}>
    <span className="takeaway__icon">{icon}</span>
    <div><strong>{title}</strong><span>{text}</span>{snippet && <code><PhpTokens code={snippet} /></code>}</div>
  </div>
);

export const ReadonlyBenefits = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div className="benefits" style={enter(frame * PRODUCTION_FPS / fps)}>
      <div className="benefits__grid">
        <Benefit icon="↺" title="Меньше мутаций" text="Меньше неожиданных переходов состояния" />
        <Benefit icon="⌕" title="Проще рассуждать и дебажить" text="Понятнее состояние объекта и источник значения" />
        <Benefit icon="→" title="DTO · events · messages" text="Объекты, которые не должны менять состояние" />
        <Benefit icon="∞" title="Полезно в long-running" text="Меньше риска протекания состояния между задачами" />
      </div>
      <div className="benefits__caveat"><strong>Важно:</strong> readonly снижает риск случайного накопления состояния, но не является общей защитой от memory leaks.</div>
    </div>
  );
};

const Benefit = ({icon, title, text}: {icon: string; title: string; text: string}) => (
  <article className="benefit">
    <span className="benefit__icon">{icon}</span>
    <h2>{title}</h2>
    <p>{text}</p>
  </article>
);

export const ReadonlyNuance = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div className="nuance" style={enter(frame * PRODUCTION_FPS / fps)}>
      <h2>readonly <span>≠</span> deep immutable</h2>
      <div className="object-comparison">
        <div className="object object--readonly">
          <small>readonly class</small><strong>User</strong>
          <code><PhpTokens code="$name" /> <LockIcon small /></code>
          <code><PhpTokens code="$address" /> <span className="property-note">ссылка защищена <LockIcon small /></span></code>
        </div>
        <div className="arrow">→</div>
        <div className="object object--mutable">
          <small>обычный mutable-класс</small><strong>Address</strong>
          <code><PhpTokens code={`$city: 'Moscow'`} /></code>
          <span className="object__state">Состояние объекта изменяемо</span>
        </div>
        <div className="result result--bad"><code><PhpTokens code={`$user->name = 'Alex';`} /></code><b>Ошибка</b></div>
        <div className="result result--good"><code><PhpTokens code={`$user->address->city = 'Berlin';`} /></code><b>Допустимо</b></div>
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
  );
};
