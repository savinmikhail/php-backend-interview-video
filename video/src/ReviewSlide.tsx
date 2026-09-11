import type {ComponentType, ReactNode} from 'react';
import {CanvasImage, Easing, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {InterviewShell, type ContentLayout, type Format} from './InterviewShell';
import {PhpCodeBlock, PhpTokens, PhpLines} from './PhpCodeBlock';
import {
  DateTimeComparison,
  DateTimePitfall,
  ExceptionCorrection,
  ExceptionTypes,
  ObjectIdentity,
  ObjectMutation,
} from './slides/EarlyQuestionSlides';
import {OopAbstract, OopInterface, OopTrait} from './slides/OopSlides';
import {ReadonlyBenefits, ReadonlyNuance, ReadonlyRules} from './slides/ReadonlySlides';
import {TOTAL_QUESTIONS, type Speaker} from './timeline';

type CardTone = 'neutral' | 'brand' | 'structure' | 'success' | 'warning' | 'danger';
type Pattern = 'question' | 'custom' | 'columns' | 'grid' | 'flow' | 'stack' | 'enum' | 'di-graph' | 'di-compile' | 'decorator-code' | 'compiler-pass-code' | 'controller-code' | 'cache-aside-code' | 'cache-triangle' | 'doctrine' | 'uuid' | 'telegram-promo';
type StandardPattern = Exclude<Pattern, 'custom'>;

type Card = {
  label?: string;
  title: string;
  lines?: string[];
  tradeoffs?: {text: string; kind: 'plus' | 'minus'}[];
  code?: string[];
  codeLanguage?: 'php';
  tone?: CardTone;
};

type ReviewSlideBase = {
  id: string;
  counter: string;
  title: string;
  speaker?: Speaker;
  cards?: Card[];
  footer?: ReactNode;
  contentLayout?: ContentLayout | ((format: Format) => ContentLayout);
};

export type ReviewSlideDefinition = ReviewSlideBase & (
  | {pattern: 'custom'; body: ComponentType<{format: Format}>}
  | {pattern?: StandardPattern; body?: never}
);

const q = (id: string, counter: string, title: string): ReviewSlideDefinition => ({
  id,
  counter,
  title,
  speaker: 'interviewer',
  pattern: 'question',
});

const s = (
  id: string,
  counter: string,
  title: string,
  pattern: StandardPattern,
  cards: Card[],
  footer?: ReactNode,
  speaker: Speaker = 'mikhail',
): ReviewSlideDefinition => ({id, counter, title, pattern, cards, footer, speaker});

const custom = (
  id: string,
  counter: string,
  title: string,
  body: ComponentType<{format: Format}>,
  contentLayout: ContentLayout | ((format: Format) => ContentLayout),
): ReviewSlideDefinition => ({id, counter, title, pattern: 'custom', body, contentLayout});

const shortLayout = (short: ContentLayout, wide: ContentLayout) =>
  (format: Format): ContentLayout => format === 'short' ? short : wide;

export const reviewSlides: ReviewSlideDefinition[] = [
  q('01-question', '1', 'Что такое readonly-класс в PHP?'),
  custom('01-rules', '1', 'Что такое readonly-класс в PHP?', ReadonlyRules, 'balanced'),
  custom('01-benefits', '1', 'Зачем ограничивать мутацию?', ReadonlyBenefits, 'compact'),
  custom('01-nuance', '1', 'readonly не означает deep immutable', ReadonlyNuance, shortLayout('dense', 'compact')),

  q('02-question', '2', 'Интерфейс, абстрактный класс, trait — что для чего?'),
  custom('02-interface', '2', 'Интерфейс, абстрактный класс, trait — что для чего?', OopInterface, shortLayout('dense', 'compact')),
  custom('02-abstract', '2', 'Интерфейс, абстрактный класс, trait — что для чего?', OopAbstract, shortLayout('dense', 'compact')),
  custom('02-trait', '2', 'Интерфейс, абстрактный класс, trait — что для чего?', OopTrait, shortLayout('dense', 'compact')),

  q('03-question', '3', 'Что происходит при передаче объекта в метод?'),
  custom('03-mutation', '3', 'Что происходит при передаче объекта в метод?', ObjectMutation, shortLayout('balanced', 'compact')),
  custom('03-identity', '3', 'Что происходит при передаче объекта в метод?', ObjectIdentity, shortLayout('dense', 'compact')),

  q('04-question', '4', 'DateTimeImmutable лучше или хуже DateTime?'),
  custom('04-comparison', '4', 'DateTime и DateTimeImmutable — в чём разница?', DateTimeComparison, shortLayout('balanced', 'compact')),
  custom('04-pitfall', '4', 'DateTimeImmutable возвращает новый объект', DateTimePitfall, 'compact'),

  q('05-question', '5', 'Как работать с исключениями в слоях и DDD?'),
  custom('05-types', '5', 'Исключение должно сообщать смысл сбоя', ExceptionTypes, shortLayout('balanced', 'compact')),
  q('05-follow-up', '5', 'А где лучше ловить исключение?'),
  custom('05-correction', '5', 'Где ловить исключение?', ExceptionCorrection, shortLayout('dense', 'compact')),

  s('06-enum', '6', 'Для чего и когда использовать enum?', 'enum', [
  ], 'Конечный набор доменных вариантов — хороший кандидат для enum'),

  q('07-question', '7', 'Как работает DI-контейнер Symfony и что он даёт?'),
  s('07-graph', '7', 'Контейнер строит object graph', 'di-graph', [],
    'Контейнер создаёт Checkout и передаёт выбранные реализации'),
  s('07-compile', '7', 'Сборка и runtime — разные фазы', 'di-compile', [],
    'dev/debug: cache stale → rebuild · cache fresh → reuse'),
  s('07-tradeoff', '7', 'Две стратегии затрат', 'columns', [
    {label: 'Symfony', title: 'Compile + PHP dump', lines: ['Цена warmup / rebuild', 'Повторно используем generated container'], tone: 'neutral'},
    {label: 'Runtime-resolved DI', title: 'Resolve при выполнении', lines: ['Definitions читаются в runtime', 'Нет compiled-container artifact'], tone: 'neutral'},
  ], 'Что быстрее — показывает benchmark конкретного приложения'),

  q('08-question', '8', 'Когда autowiring, а когда явная конфигурация?'),
  s('08-axes', '8', 'Не смешиваем две независимые оси', 'columns', [
    {label: 'Механизм выбора', title: 'Autowiring или explicit wiring', lines: ['Как контейнер выбирает аргумент'], tone: 'neutral'},
    {label: 'Формат описания', title: 'PHP · YAML · XML · attributes', lines: ['Где записана конфигурация'], tone: 'neutral'},
  ], 'Механизм выбора ≠ формат конфигурации'),
  s('08-rules', '8', 'Autowiring по умолчанию, явно — при неоднозначности', 'grid', [
    {label: 'AUTO', title: 'Одна object-зависимость', code: ['LoggerInterface $logger'], codeLanguage: 'php', tone: 'success'},
    {label: 'EXPLICIT', title: 'Несколько реализаций', code: ['PaymentGatewayInterface → ?'], tone: 'structure'},
    {label: 'EXPLICIT', title: 'Scalar / config value', code: ['string $dsn', 'int $timeout'], codeLanguage: 'php', tone: 'structure'},
    {label: 'EXPLICIT', title: 'Factory или особая сборка', lines: ['Нужен контекст создания'], tone: 'structure'},
  ], 'И учитываем соглашения существующего проекта'),

  q('09-question', '9', 'Event Subscriber · Middleware · Decorator — что это?'),
  s('09-subscriber', '9', 'Event Subscriber сам объявляет подписки', 'flow', [
    {label: 'Subscriber', title: 'getSubscribedEvents()', code: ['OrderPaid::class', 'KernelEvents::REQUEST'], codeLanguage: 'php', tone: 'structure'},
    {label: 'Dispatcher', title: 'Event', lines: ['Находит всех подписчиков'], tone: 'structure'},
    {label: 'Fan-out', title: 'listener A · listener B', lines: ['Несколько реакций на событие'], tone: 'structure'},
  ]),
  s('09-middleware', '9', 'Middleware — цепочка вокруг handler', 'flow', [
    {title: 'Request / message', tone: 'structure'},
    {title: 'Middleware A', lines: ['before ↓  ↑ after'], tone: 'structure'},
    {title: 'Middleware B', lines: ['before ↓  ↑ after'], tone: 'structure'},
    {title: 'Handler', tone: 'structure'},
  ], 'Не только Laravel: PSR-15, Symfony Messenger и другие pipelines'),
  s('09-decorator', '9', 'Decorator сохраняет контракт сервиса', 'decorator-code', [],
    'Тот же интерфейс · поведение до и после делегирования'),

  q('10-question', '10', 'Чем полезен Symfony Messenger, кроме очередей?'),
  s('10-bus', '10', 'Message bus не равен очереди', 'flow', [
    {title: 'Message', code: ['CreateInvoice'], tone: 'structure'},
    {title: 'Message Bus', lines: ['dispatch по типу'], tone: 'structure'},
    {label: 'SYNC', title: 'Handler сейчас', tone: 'structure'},
    {label: 'ASYNC', title: 'Transport → worker', tone: 'structure'},
  ], 'Transport — опциональная ветка, а не определение message bus'),
  s('10-middleware', '10', 'Middleware оборачивает обработчик', 'flow', [
    {title: 'Ping DB', lines: ['before'], tone: 'structure'},
    {title: 'Handle message', lines: ['полезная работа'], tone: 'structure'},
    {title: 'Close DB', lines: ['after'], tone: 'structure'},
  ], 'Сквозная логика без изменения handler'),

  q('11-question', '11', 'Когда писать свой consumer вместо Messenger?'),
  s('11-pull-push', '11', 'Messenger polling или RabbitMQ subscription', 'columns', [
    {label: 'Symfony AMQP transport · get()', title: 'Polling', lines: ['Worker сам запрашивает следующее сообщение'], tone: 'neutral'},
    {label: 'RabbitMQ · basic.consume', title: 'Push / subscription', lines: ['Broker доставляет зарегистрированному consumer'], tone: 'neutral'},
  ], 'Критерий этого кейса — broker-driven push вместо polling', 'interviewer'),
  s('11-symfony', '11', 'Почему consumer не виден в RabbitMQ UI?', 'columns', [
    {label: 'Symfony AMQP transport', title: 'Получает через get()', lines: ['Неблокирующий fetch', 'Message или empty → следующий цикл'], tone: 'neutral'},
    {label: 'RabbitMQ', title: 'Нет basic.consume', lines: ['Значит, нет зарегистрированной subscription'], tone: 'neutral'},
  ], 'get() не регистрирует subscription в RabbitMQ'),
  s('11-runtime', '11', 'get() и consume() меняют способ ожидания', 'columns', [
    {label: 'Polling · basic.get', title: 'Worker спрашивает очередь', lines: ['empty → пауза → новый get()', 'Периодические пустые запросы'], tone: 'neutral'},
    {label: 'Subscription · basic.consume', title: 'Worker ждёт delivery', lines: ['Подписка по открытому соединению', 'Без холостого polling'], tone: 'neutral'},
  ], 'basic.consume снижает холостую нагрузку, но не устраняет утечки PHP-worker', 'interviewer'),
  q('12-question', '12', 'Что такое Compiler Pass в Symfony?'),
  s('12-compile', '12', 'Compiler Pass проверяет контейнер при сборке', 'compiler-pass-code', [],
    'Ошибка конфигурации обнаружена до запуска приложения'),

  q('13-question', '13', 'Unit of Work: persist, flush и clear'),
  s('13-persist', '13', 'persist() регистрирует entity', 'doctrine', []),
  s('13-flush-listener', '13', 'onFlush: читаем рассчитанные изменения', 'doctrine', []),
  s('13-flush-audit', '13', 'Новая entity внутри onFlush', 'doctrine', []),
  s('13-flush-result', '13', 'Что остаётся после flush()', 'doctrine', []),
  s('13-clear', '13', 'clear() отсоединяет entities', 'doctrine', []),
  s('13-clear-batch', '13', 'clear() освобождает Identity Map', 'doctrine', []),

  q('14-question', '14', 'Почему не стоит делать flush в репозитории?'),
  s('14-identity', '14', 'Identity Map убирает повторный SELECT', 'doctrine', []),
  s('14-layers', '14', 'Один ID → один managed-объект', 'doctrine', []),
  s('14-boundary', '14', 'flush() — граница всей операции', 'doctrine', []),

  q('15-question', '15', 'Lazy loading — какие плюсы?'),
  s('15-lazy', '15', 'Не используем relation — не загружаем её', 'doctrine', []),
  s('15-n-plus-one', '15', 'Перебор lazy relation создаёт N+1', 'doctrine', []),
  s('15-fetch-join', '15', 'Relation нужна всем — загружаем явно', 'doctrine', []),
  s('15-extra-lazy', '15', 'EXTRA_LAZY для больших коллекций', 'columns', [
    {label: 'Обычная коллекция', title: 'count() может загрузить всё', lines: ['Много объектов в память'], tone: 'warning'},
    {label: 'EXTRA_LAZY', title: 'count() отдельным SQL', code: ['SELECT COUNT(*) …'], lines: ['Collection не инициализируется целиком'], tone: 'success'},
  ]),

  q('16-question', '16', 'Когда транзакции приходится использовать вручную?'),
  s('16-implicit', '16', 'Обычно beginTransaction() не нужен', 'doctrine', []),
  s('16-explicit', '16', 'Когда открываем транзакцию явно?', 'doctrine', []),

  q('17-question', '17', 'UUID или автоинкремент?'),
  s('17-size', '17', 'Размер, вместимость и порядок вставки', 'uuid', []),
  s('17-v7', '17', 'Из чего состоит UUIDv7', 'uuid', []),
  s('17-before-db', '17', 'ID существует до записи в БД', 'uuid', []),
  s('17-distributed', '17', 'Несколько БД без общей sequence', 'uuid', []),

  q('18-question', '18', 'Про индексы что-нибудь расскажи?'),
  s('18-tradeoff', '18', 'Индекс ускоряет чтение не бесплатно', 'columns', [
    {label: 'READ', title: 'Быстрее поиск и сортировка', lines: ['Меньше страниц для чтения'], tone: 'success'},
    {label: 'WRITE + STORAGE', title: 'Дороже изменения', lines: ['INSERT / UPDATE поддерживают индекс', 'Дополнительное место на диске'], tone: 'warning'},
  ]),
  s('18-access', '18', 'Метод доступа выбирают под оператор', 'grid', [
    {title: 'B-tree', lines: ['equality · range · sort'], tone: 'structure'},
    {title: 'GIN', lines: ['JSONB · arrays · full text'], tone: 'structure'},
    {title: 'GiST', lines: ['ranges · geometry · nearest'], tone: 'structure'},
    {title: 'BRIN', lines: ['огромные коррелированные таблицы'], tone: 'structure'},
  ]),
  s('18-forms', '18', 'Формы индекса и физический порядок', 'grid', [
    {title: 'Multicolumn', code: ['(tenant_id, created_at)'], tone: 'structure'},
    {title: 'INCLUDE', lines: ['covering index'], tone: 'structure'},
    {title: 'Partial', code: ["WHERE status = 'active'"], tone: 'structure'},
    {title: 'Clustered', lines: ['Физический порядок строк по ключу', 'В PostgreSQL требует повторного CLUSTER'], tone: 'structure'},
  ]),

  q('19-question', '19', 'Что такое чистая архитектура?'),
  s('19-rule', '19', 'Зависимости исходного кода направлены внутрь', 'stack', [
    {label: 'Внешние детали', title: 'Web · DB · Framework', lines: ['Могут зависеть от внутренних контрактов'], tone: 'structure'},
    {label: 'Adapters', title: 'Controllers · gateways · presenters', tone: 'structure'},
    {label: 'Ядро', title: 'Business rules', lines: ['Не знает о внешних деталях'], tone: 'structure'},
  ], 'Граница нужна ради направления зависимостей, а не ради папок'),

  q('20-question', '20', 'Domain Service и Application Service — что для чего?'),
  s('20-levels', '20', 'Domain Service и Application Service', 'columns', [
    {label: 'Application', title: 'Оркестрирует use case', lines: ['Загрузить · вызвать · сохранить · отправить'], tone: 'neutral'},
    {label: 'Domain', title: 'Выражает бизнес-решение', lines: ['Правило, не принадлежащее одной entity'], tone: 'neutral'},
  ]),
  s('20-usecase', '20', 'Один use case — две ответственности', 'flow', [
    {label: 'Application', title: 'TransferMoney', lines: ['load accounts'], tone: 'structure'},
    {label: 'Domain', title: 'TransferPolicy', lines: ['можно ли выполнить перевод?'], tone: 'structure'},
    {label: 'Application', title: 'save + publish event', tone: 'structure'},
  ]),
  s('20-criterion', '20', 'Проверочный вопрос', 'columns', [
    {title: 'Это порядок действий?', lines: ['Application Service'], tone: 'neutral'},
    {title: 'Это решение предметной области?', lines: ['Domain / Entity / Value Object'], tone: 'neutral'},
  ]),

  q('21-question', '21', 'Можно ли контроллеру идти в репозиторий?'),
  s('21-direct', '21', 'Для простого чтения отдельный сервис избыточен', 'controller-code', []),

  q('22-question', '22', 'DTO против Entity — что для чего?'),
  s('22-entity', '22', 'Entity — не просто ORM-объект', 'stack', []),
  s('22-dto', '22', 'DTO переносит данные через границу', 'stack', []),
  s('22-correction', '22', 'Не определяем тип по случайным признакам', 'columns', [
    {label: 'Entity', title: 'Не обязана быть mutable или ORM', lines: ['Главное — identity и lifecycle'], tone: 'neutral'},
    {label: 'DTO', title: 'Не обязан быть readonly', lines: ['Главное — перенос данных'], tone: 'neutral'},
  ]),

  q('23-question', '23', 'Как выделять модули из монолита и как разделять их работу между собой?'),
  s('23-boundary', '23', 'Хорошая граница модуля', 'columns', [
    {label: 'Внутри', title: 'Высокая cohesion', lines: ['Связанные бизнес-правила рядом'], tone: 'neutral'},
    {label: 'Снаружи', title: 'Низкая coupling', lines: ['Маленький стабильный контракт'], tone: 'neutral'},
  ]),
  s('23-deployment', '23', 'Что я имел в виду под отдельным сервисом логов', 'flow', [
    {label: 'Источники', title: 'Другие сервисы', code: ['REST · JSON-RPC'], tone: 'structure'},
    {label: 'Log service', title: 'Принимает логи', lines: ['Единая точка записи и чтения'], tone: 'structure'},
    {label: 'Хранилища', title: 'Elastic · Kafka · ClickHouse', tone: 'structure'},
  ], 'Поисковые endpoints · фильтры · выдача логов'),
  s('23-monolith', '23', 'Начать можно с modular monolith', 'flow', [
    {title: 'Module A', lines: ['Command · Query · Event'], tone: 'structure'},
    {title: 'In-process contracts', lines: ['Явные границы'], tone: 'structure'},
    {title: 'Module B', tone: 'structure'},
  ], 'Выносить в отдельный deployment — когда есть измеримая причина'),

  q('24-question', '24', 'Где хранить интерфейс репозитория?'),
  s('24-location', '24', 'Где хранить интерфейс репозитория?', 'columns', [
    {title: 'Domain?', lines: ['Если контракт нужен доменной политике'], tone: 'neutral'},
    {title: 'Application?', lines: ['Если контракт нужен use case'], tone: 'neutral'},
  ], 'Вопрос не про универсальную папку — он про владельца абстракции'),
  s('24-dependency', '24', 'Порт рядом с внутренним потребителем', 'flow', [
    {title: 'Application / Domain', lines: ['объявляет Repository interface'], tone: 'structure'},
    {title: 'Port', code: ['OrderRepository'], tone: 'structure'},
    {title: 'Infrastructure', lines: ['DoctrineOrderRepository implements'], tone: 'structure'},
  ], 'Зависимость направлена внутрь'),

  q('25-question', '25', 'С редисом, с кэшом работал?'),
  q('25-aside-question', '25', 'Что такое Cache Aside?'),
  s('25-classes', '25', 'Четыре паттерна — два разных вопроса', 'columns', [
    {label: 'Read miss', title: 'Cache Aside · Read Through', lines: ['Кто загружает данные в cache'], tone: 'neutral'},
    {label: 'Write path', title: 'Write Through · Write Behind', lines: ['Когда запись попадает в database'], tone: 'neutral'},
  ], 'Паттерны можно комбинировать · список не исчерпывающий'),
  s('25-aside', '25', 'Cache Aside — загрузка по требованию', 'cache-aside-code', [],
    'При записи: DB update → cache delete'),
  s('25-writes', '25', 'Две write-стратегии', 'columns', [
    {label: 'WRITE-THROUGH', title: 'DB + cache до success', tradeoffs: [{text: 'Выше write latency', kind: 'minus'}, {text: 'После успеха данные свежие', kind: 'plus'}], tone: 'neutral'},
    {label: 'WRITE-BEHIND', title: 'Cache / queue → async DB', tradeoffs: [{text: 'Ниже write latency', kind: 'plus'}, {text: 'Сложнее failure recovery', kind: 'minus'}], tone: 'neutral'},
  ], 'База остаётся источником истины'),
  s('25-choice', '25', 'Выбор стратегии — баланс трёх требований', 'cache-triangle', []),

  q('26-question', '26', 'Чем аутентификация от авторизации отличается?'),
  s('26-auth', '26', 'Authentication ≠ Authorization', 'columns', [
    {label: 'AUTHENTICATION · AuthN', title: 'Кто ты?', code: ['credentials → identity'], tone: 'neutral'},
    {label: 'AUTHORIZATION · AuthZ', title: 'Что тебе разрешено?', code: ['identity + policy → allow / deny'], tone: 'neutral'},
  ]),

  q('28-question', '28', 'Таблица 10 млн строк стала медленной после фильтра. Что делать?'),
  s('28-query', '28', '10 млн строк · фильтр стал медленным', 'columns', [
    {label: 'Первый шаг', title: 'EXPLAIN (ANALYZE, BUFFERS)', code: ['SELECT … WHERE status = ?'], tone: 'structure'},
    {label: 'Смотрим в плане', title: 'actual time · rows · loops', lines: ['Seq / Index Scan · buffers'], tone: 'structure'},
  ], <><strong>Осторожно:</strong>&nbsp; ANALYZE выполняет запрос · сначала безопасная среда</>),
  s('28-telegram', '28', 'Реальный кейс · EXPLAIN ANALYZE', 'telegram-promo', []),

  q('29-question', '29', 'Что такое SOLID'),
  s('29-so', '29', 'SOLID · эвристики управления изменениями', 'columns', [
    {label: 'S · Single Responsibility', title: 'Одна ось изменения', lines: ['InvoiceFormatter ≠ Sender'], tone: 'neutral'},
    {label: 'O · Open / Closed', title: 'Расширяем стабильный dispatch', lines: ['+ CryptoHandler без правки существующего'], tone: 'neutral'},
  ]),
  s('29-lsp', '29', 'L · Подтип сохраняет обещания базового типа', 'stack', [
    {title: 'DHLCarrier вместо Carrier', code: ['ship(Carrier $carrier)', '$carrier->deliver($parcel)'], codeLanguage: 'php', lines: ['Клиентский код не ломается'], tone: 'success'},
    {title: 'Безопасная вариативность сигнатуры', lines: ['Параметр может быть шире · contravariance', 'Return type может быть уже · covariance'], tone: 'structure'},
  ]),
  s('29-id', '29', 'I · Interface Segregation / D · Dependency Inversion', 'columns', [
    {label: 'I', title: 'Контракт под нужды клиента', lines: ['Printer не обязан scan / fax'], tone: 'neutral'},
    {label: 'D', title: 'Зависимость от abstraction', lines: ['policy → PaymentGateway', 'StripeAdapter implements interface'], tone: 'neutral'},
  ]),
  q('29-required-question', '29', 'Является SOLID всегда обязательным правилом?'),
  s('29-tradeoff', '29', 'SOLID не обязателен «на максимум»', 'columns', [
    {label: 'Польза', title: 'Легче менять и тестировать', lines: ['Ясные зависимости'], tone: 'success'},
    {label: 'Цена', title: 'Больше типов и переходов', lines: ['Простой код становится сложнее читать'], tone: 'warning'},
  ], 'Применяем под реальные изменения, а не ради соответствия'),

  s('30-basics', '30', 'DRY и KISS отвечают на разные риски', 'columns', [
    {label: 'DRY', title: 'Одно знание — одно место', lines: ['Риск: рассинхронизация'], tone: 'neutral'},
    {label: 'KISS', title: 'Минимальная нужная сложность', lines: ['Риск: лишние конструкции'], tone: 'neutral'},
  ]),
  q('30-question', '30', 'Противоречит ли KISS и DRY?'),
  s('30-copy', '30', 'Похожий код ещё не означает общую abstraction', 'columns', [
    {label: 'Invoice', title: 'total + tax', lines: ['Сегодня строки похожи'], tone: 'neutral'},
    {label: 'Cart', title: 'total + discount', lines: ['Меняется по другой причине'], tone: 'neutral'},
  ], 'Преждевременная FactoryFactory связала независимые правила'),
  s('30-criterion', '30', 'Что делать с повтором?', 'columns', [
    {label: 'Меняется вместе?', title: 'ДА → выделить общее', tone: 'success'},
    {label: 'Нет или неясно?', title: 'Оставить локально и просто', tone: 'structure'},
  ], 'Устойчивую абстракцию легче добавить позже'),
];

const reviewSlidesById = new Map(reviewSlides.map((slide) => [slide.id, slide]));

if (reviewSlidesById.size !== reviewSlides.length) {
  throw new Error('Review slide IDs must be unique');
}

const reviewSlideById = (slideId: string) => {
  const slide = reviewSlidesById.get(slideId);
  if (!slide) throw new Error(`Unknown review slide: ${slideId}`);
  return slide;
};

const contentLayoutForSlide = (slide: ReviewSlideDefinition, format: Format): ContentLayout => {
  if (slide.contentLayout) {
    return typeof slide.contentLayout === 'function'
      ? slide.contentLayout(format)
      : slide.contentLayout;
  }

  switch (slide.pattern) {
    case 'question':
      return 'fill';
    case 'columns':
    case 'controller-code':
      return 'compact';
    case 'flow':
      return (slide.cards?.length ?? 0) >= 4 ? 'balanced' : 'compact';
    case 'di-compile':
    case 'compiler-pass-code':
    case 'cache-aside-code':
      return 'dense';
    default:
      return 'balanced';
  }
};

const CardView = ({card}: {card: Card}) => (
  <article className={`rr-card rr-card--${card.tone ?? 'neutral'}`}>
    {card.label && <div className="rr-card__label">{card.label}</div>}
    <h2>{card.title}</h2>
    {card.code && <pre><code>{card.codeLanguage === 'php' ? <PhpTokens code={card.code.join('\n')} /> : card.code.join('\n')}</code></pre>}
    {card.lines?.map((line) => <p key={line}>{line}</p>)}
    {card.tradeoffs && <div className="rr-tradeoffs">{card.tradeoffs.map(({text, kind}) => (
      <div key={text} className={`rr-tradeoff rr-tradeoff--${kind}`}>
        <b>{kind === 'plus' ? '+' : '−'}</b><span>{text}</span>
      </div>
    ))}</div>}
  </article>
);

const EnumComparison = () => (
  <div className="enum-comparison">
    <article className="enum-card enum-card--string">
      <div className="enum-card__label">Открытая строка · weak mode</div>
      <h2>Пропускает лишнее</h2>
      <pre className="enum-card__definition"><code><PhpTokens code={`function changeStatus(string $status): void {}`} /></code></pre>
      <div className="enum-examples">
        <div className="enum-example enum-example--warning">
          <code><PhpTokens code={`changeStatus(0);`} /></code>
          <span><code><PhpTokens code={`$status === '0'`} /></code></span>
        </div>
        <div className="enum-example enum-example--warning">
          <code><PhpTokens code={`changeStatus('canceled');`} /></code>
          <span>опечатка принята</span>
        </div>
      </div>
    </article>

    <article className="enum-card enum-card--typed">
      <div className="enum-card__label">Закрытый тип</div>
      <h2>Типобезопасный набор</h2>
      <pre className="enum-card__definition"><code><PhpTokens code={`enum OrderStatus: string {
  case Paid = 'paid';
  case Cancelled = 'cancelled';
}`} /></code></pre>
      <div className="enum-examples">
        <div className="enum-example enum-example--error">
          <code><PhpTokens code={`changeStatus(0);`} /></code>
          <span>TypeError</span>
        </div>
        <div className="enum-example enum-example--error">
          <code><PhpTokens code={`OrderStatus::from('canceled');`} /></code>
          <span>ValueError</span>
        </div>
      </div>
    </article>
  </div>
);

const DiObjectGraph = () => (
  <div className="di-graph-layout">
    <pre className="di-source-code"><code><PhpTokens code={`final class Checkout
{
  public function __construct(
    private PaymentGatewayInterface $gateway,
    private LoggerInterface $logger,
  ) {}
}`} /></code></pre>

    <aside className="di-bindings">
      <div className="di-bindings__label">Definitions + autowiring</div>
      <div className="di-binding">
        <code>PaymentGatewayInterface</code>
        <span>→</span>
        <strong>StripeGateway</strong>
      </div>
      <div className="di-binding">
        <code>LoggerInterface</code>
        <span>→</span>
        <strong>MonologLogger</strong>
      </div>
      <div className="di-created-service">
        <span>Результат</span>
        <code><PhpTokens code={`new Checkout($gateway, $logger)`} /></code>
      </div>
    </aside>
  </div>
);

const DiCompileRuntime = () => (
  <div className="di-compile-layout">
    <section className="di-build-pipeline">
      <article className="di-build-step di-build-step--discovery">
        <span>1 · Service discovery</span>
        <code><span className="syntax-type">App\:</span>{`\n`}  <span className="syntax-name">resource</span>: <span className="syntax-string">'../src/'</span></code>
        <p>Регистрирует классы как services</p>
      </article>
      <div className="di-build-arrow">→</div>
      <article className="di-build-step di-build-step--resolve">
        <span>2 · Resolve</span>
        <strong>autowire · autoconfigure</strong>
        <p>type-hints · Reflection · tags</p>
      </article>
      <div className="di-build-arrow">→</div>
      <article className="di-build-step di-build-step--compile">
        <span>3 · Compile + dump</span>
        <code><span className="syntax-type">App_KernelProdContainer</span>.php</code>
        <p>Готовый PHP-класс в cache</p>
      </article>
    </section>

    <section className="di-runtime-flow">
      <div className="di-requests" aria-label="Несколько запросов используют один сгенерированный контейнер">
        <div className="di-request-list">
          <code>Request 1</code>
          <code>Request 2</code>
          <code>Request N</code>
        </div>
        <svg className="di-request-merge" viewBox="0 0 72 104" aria-hidden="true">
          <path d="M2 14H34V52H66" />
          <path d="M2 52H34" />
          <path d="M2 90H34V52" />
          <path d="M58 44L66 52L58 60" />
        </svg>
      </div>
      <article className="di-generated-container">
        <span>generated PHP container</span>
        <code><PhpTokens code={`return new Checkout(
  $this->getStripeGatewayService(),
  $this->getLoggerService(),
);`} /></code>
      </article>
      <div className="di-runtime-result">
        <strong>reuse</strong>
        <span>без повторного разбора definitions</span>
      </div>
    </section>
  </div>
);

const DecoratorCode = () => (
  <pre className="decorator-code"><code><PhpLines code={`final class MetricsGateway implements PaymentGatewayInterface
{
  public function __construct(
    private PaymentGatewayInterface $inner,
    private Metrics $metrics,
  ) {}
  public function pay(Money $amount): Receipt
  {
    $this->metrics->start(); // до
    $receipt = $this->inner->pay($amount); // делегирование
    $this->metrics->success(); // после
    return $receipt;
  }
}`} /></code></pre>
);

const CompilerPassCode = () => (
  <div className="compiler-pass-layout">
    <pre className="compiler-pass-code"><code><PhpLines code={`final class UniqueQueuePass implements CompilerPassInterface
{
  public function process(ContainerBuilder $container): void
  {
    $queues = [];
    $consumers = $container->findTaggedServiceIds('app.consumer');
    foreach ($consumers as $tags) {
      $queue = $tags[0]['queue'];
      if (isset($queues[$queue])) {
        throw new LogicException("Duplicate queue: $queue");
      }
      $queues[$queue] = true;
    }
  }
}`} /></code></pre>

    <aside className="compiler-pass-example">
      <div className="compiler-pass-example__label">Конфликт конфигурации</div>
      <article className="compiler-pass-service compiler-pass-service--structure">
        <strong>EmailConsumer</strong>
        <code>queue: emails</code>
      </article>
      <article className="compiler-pass-service compiler-pass-service--structure">
        <strong>RetryConsumer</strong>
        <code>queue: emails</code>
      </article>
      <div className="compiler-pass-error">
        <span>build failed</span>
        <code>Duplicate queue: emails</code>
      </div>
    </aside>
  </div>
);

const controllerReadSource = `#[Route('/users/{id}', methods: ['GET'])]
public function show(
    #[MapEntity(id: 'id')] User $user,
): JsonResponse {
    return $this->json([
        'id' => $user->getId(),
        'email' => $user->getEmail(),
    ]);
}`;

const ControllerReadCode = () => (
  <div className="controller-code-layout">
    <PhpCodeBlock className="controller-code" code={controllerReadSource} />
  </div>
);

const DtoTransfer = () => (
  <div className="dto-transfer-layout">
    <pre className="doctrine-code dto-transfer-code"><code><PhpLines code={`final readonly class CreateOrderDto
{
  public function __construct(
    public int $customerId,
    public int $productId,
    public int $quantity,
  ) {}
}`} /></code></pre>
    <pre className="doctrine-code doctrine-code--structure dto-transfer-code"><code><PhpLines code={`#[Route('/orders', methods: ['POST'])]
public function create(
  #[MapRequestPayload] CreateOrderDto $input,
  CreateOrderService $service,
): JsonResponse {
  $service->create($input);

  return new JsonResponse(status: 201);
}`} /></code></pre>
    <div className="takeaways dto-transfer-points">
      <div className="takeaway"><strong>Явный контракт данных</strong></div>
      <div className="takeaway"><strong>Без зависимости от HTTP Request</strong></div>
      <div className="takeaway"><strong>Связанные параметры вместе</strong></div>
    </div>
  </div>
);

const RichEntity = () => (
  <div className="rich-entity-layout">
    <pre className="doctrine-code rich-entity-code"><code><PhpLines code={`final class Order
{
  private OrderStatus $status = OrderStatus::Draft;

  public function __construct(
    private readonly OrderId $id,
  ) {}

  public function pay(): void
  {
    if ($this->status !== OrderStatus::Draft) {
      throw new OrderCannotBePaid();
    }

    $this->status = OrderStatus::Paid;
  }
}`} /></code></pre>
    <div className="takeaways rich-entity-points">
      <div className="takeaway"><div><strong>Identity</strong><span><code>$id</code> сохраняется при изменении заказа</span></div></div>
      <div className="takeaway"><div><strong>Lifecycle</strong><span><code>Draft → Paid</code> через <code>pay()</code></span></div></div>
      <div className="takeaway"><div><strong>Invariants</strong><span>Оплатить можно только <code>Draft</code></span></div></div>
    </div>
  </div>
);

const PhpCode = ({children, tone = 'neutral'}: {children: ReactNode; tone?: CardTone}) => (
  <pre className={`doctrine-code doctrine-code--${tone}`}><code>{children}</code></pre>
);

const DoctrinePersist = () => (
  <div className="doctrine-two-column">
    <PhpCode><PhpLines code={`$uow = $em->getUnitOfWork();

$uow->getEntityState($user)
  === UnitOfWork::STATE_NEW; // true

$em->persist($user);

$uow->getEntityState($user)
  === UnitOfWork::STATE_MANAGED; // true`} /></PhpCode>
    <section className="doctrine-state-panel doctrine-state-panel--persist">
      <div className="doctrine-state doctrine-state--structure"><small>entity state</small><strong>NEW</strong></div>
      <div className="doctrine-arrow-step"><code><PhpTokens code={`persist($user)`} /></code><span>→</span></div>
      <div className="doctrine-state doctrine-state--success"><small>Unit of Work</small><strong>MANAGED</strong><span>scheduled: INSERT</span></div>
      <div className="doctrine-zero-sql"><strong>SQL-запросов: 0</strong><span>persist() только регистрирует объект</span></div>
    </section>
    <div className="doctrine-footer">ID может появиться до <code><PhpTokens code={`flush()`} /></code>; после успешного <code><PhpTokens code={`flush()`} /></code> он гарантирован</div>
  </div>
);

const DoctrineFlushListener = () => (
  <div className="doctrine-two-column doctrine-two-column--listener">
    <PhpCode><PhpLines code={`$uow = $em->getUnitOfWork();

foreach (
  $uow->getScheduledEntityUpdates()
  as $entity
) {
  $changes = $uow
    ->getEntityChangeSet($entity);
}`} /></PhpCode>
    <section className="change-set-card">
      <div className="change-set-card__label">Результат для User#42</div>
      <code className="change-set-output">
        <span>[</span>
        <span className="code-line--indent-1"><PhpTokens code="'email' => [" /></span>
        <span className="code-line--indent-2"><b className="change-set-index change-set-index--old">0 · old</b> <PhpTokens code="'old@example.com'," /></span>
        <span className="code-line--indent-2"><b className="change-set-index change-set-index--new">1 · new</b> <PhpTokens code="'new@example.com'," /></span>
        <span className="code-line--indent-1">],</span>
        <span>]</span>
      </code>
      <p><code>onFlush</code> уже видит рассчитанные change sets</p>
    </section>
  </div>
);

const DoctrineFlushAudit = () => (
  <div className="doctrine-two-column doctrine-two-column--audit">
    <PhpCode><PhpLines code={`$auditLog = AuditLog::from(
  $entity, $changes,
);

$em->persist($auditLog);
$metadata = $em->getClassMetadata(
  AuditLog::class,
);
$uow->computeChangeSet(
  $metadata, $auditLog,
);`} /></PhpCode>
    <section className="audit-steps">
      <article><span>1</span><div><strong>Создаём AuditLog</strong><p>внутри <code>onFlush</code></p></div></article>
      <article><span>2</span><div><strong><code><PhpTokens code={`persist()`} /></code></strong><p>регистрирует новую entity</p></div></article>
      <article><span>3</span><div><strong><code><PhpTokens code={`computeChangeSet()`} /></code></strong><p>добавляет её mapped changes в текущий flush</p></div></article>
    </section>
  </div>
);

const DoctrineFlushResult = () => (
  <div className="doctrine-result-layout">
    <div className="doctrine-correction">Обработанные change sets очищены, но managed entities остаются</div>
    <section className="doctrine-result-card doctrine-result-card--cleared">
      <small>Очищено после успешной синхронизации</small>
      <code>entityChangeSets: []</code>
      <code>scheduledUpdates: []</code>
    </section>
    <section className="doctrine-result-card doctrine-result-card--kept">
      <small>Остаётся в EntityManager</small>
      <code>User#42: MANAGED</code>
      <code>Identity Map: сохранена</code>
    </section>
    <div className="doctrine-footer"><code><PhpTokens code={`flush()`} /></code> синхронизирует с БД — <code><PhpTokens code={`clear()`} /></code> отсоединяет объекты</div>
  </div>
);

const DoctrineClear = () => (
  <div className="doctrine-two-column doctrine-two-column--clear">
    <PhpCode><PhpLines code={`$em->contains($user); // true

$em->clear();

$em->contains($user); // false`} /></PhpCode>
    <section className="clear-state-flow">
      <div><small>до clear()</small><strong>MANAGED</strong><span>Identity Map содержит User#42</span></div>
      <b>→</b>
      <div><small>после clear()</small><strong>DETACHED</strong><span>Identity Map → empty</span></div>
    </section>
  </div>
);

const DoctrineClearBatch = () => (
  <div className="doctrine-two-column doctrine-two-column--batch">
    <PhpCode tone="structure"><PhpLines code={`foreach ($rows as $i => $row) {
  process($row);

  if ($i % 100 === 0) {
    $em->flush();
    $em->clear();
  }
}`} /></PhpCode>
    <section className="batch-memory">
      <div className="batch-memory__entities"><span>User#1</span><span>User#2</span><span>…</span><span>User#100</span></div>
      <div className="batch-memory__map"><small>Identity Map</small><strong>100 managed entities</strong></div>
      <div className="batch-memory__clear">flush() → clear()</div>
      <div className="batch-memory__empty"><strong>empty</strong><span>объекты можно освободить</span></div>
    </section>
  </div>
);

const DoctrineIdentity = () => (
  <div className="identity-comparison">
    <section className="identity-card identity-card--doctrine">
      <div className="identity-card__label">Doctrine ORM</div>
      <PhpCode><PhpLines code={`$a = $em->find(User::class, 42); // SELECT
$b = $repository->find(42); // Identity Map
$a === $b; // true`} /></PhpCode>
      <div className="identity-result"><strong>SELECT ×1</strong><span>Один ID → один PHP-объект</span></div>
    </section>
    <section className="identity-card identity-card--laravel">
      <div className="identity-card__label">Laravel Eloquent</div>
      <PhpCode><PhpLines code={`$a = User::find(42); // SELECT
$b = User::find(42); // SELECT
$a === $b; // false`} /></PhpCode>
      <div className="identity-result"><strong>SELECT ×2</strong><span>Два экземпляра модели</span></div>
    </section>
    <div className="doctrine-footer doctrine-footer--quiet">Для поиска по primary key; произвольный DQL всё ещё может выполнить SQL</div>
  </div>
);

const DoctrineLayers = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const services = [
    {name: 'ProfileService', at: 0.05},
    {name: 'BillingService', at: 1.05},
    {name: 'AuditService', at: 1.55},
  ];
  const changes = [
    {field: 'email', before: 'old@example.com', after: 'new@example.com', at: 2.55},
    {field: 'plan', before: 'basic', after: 'pro', at: 3.15},
    {field: 'updatedAt', before: '12:30', after: '12:31', at: 3.75},
  ];

  return (
    <div className="identity-story">
      <section className="identity-services" aria-label="Сервисы запрашивают одного пользователя">
        {services.map((service) => (
          <article
            className="identity-service-card"
            key={service.name}
            style={{
              opacity: interpolate(frame, [fps * service.at, fps * (service.at + 0.3)], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: `0 ${interpolate(frame, [fps * service.at, fps * (service.at + 0.3)], [18, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })}px`,
            }}
          >
            <small>{service.name}</small>
            <code><PhpTokens code="$users->find(" /><span className="identity-id">42</span>)</code>
          </article>
        ))}
      </section>

      <div
        className="identity-story-arrow"
        style={{
          opacity: interpolate(frame, [fps * 0.3, fps * 0.65], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      ><span>один primary key</span><b>↓</b></div>

      <section
        className="identity-map-focus"
        style={{
          opacity: interpolate(frame, [fps * 0.45, fps * 0.8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [fps * 0.45, fps * 0.8], [0.97, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          boxShadow: `0 0 ${interpolate(frame, [fps * 1.05, fps * 1.9], [18, 42], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}px rgba(91, 220, 247, .2)`,
        }}
      >
        <div className="identity-map-core">
          <small>Identity Map</small>
          <strong>User <span className="identity-id">#42</span></strong>
          <span>один managed instance</span>
        </div>
        <div className="identity-map-stat">
          <small>Запрос к БД</small>
          <strong>SELECT ×1</strong>
          <span>следующие find() — из памяти</span>
        </div>
      </section>

      <div
        className="identity-story-arrow identity-story-arrow--changes"
        style={{
          opacity: interpolate(frame, [fps * 2.15, fps * 2.5], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      ><span>изменения этого же объекта</span><b>↓</b></div>

      <section className="identity-change-set">
        <header className="identity-change-set__title">
          <small>Change set</small>
          <strong>User <span className="identity-id">#42</span></strong>
        </header>
        <div className="identity-change-row identity-change-row--head">
          <span>Поле</span><span>Было</span><span>Стало</span>
        </div>
        {changes.map((change) => (
          <div
            className="identity-change-row"
            key={change.field}
            style={{
              opacity: interpolate(frame, [fps * change.at, fps * (change.at + 0.32)], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: `${interpolate(frame, [fps * change.at, fps * (change.at + 0.32)], [-18, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })}px 0`,
            }}
          >
            <code>{change.field}</code><span>{change.before}</span><strong>{change.after}</strong>
          </div>
        ))}
      </section>
    </div>
  );
};

const DoctrineBoundary = () => (
  <div className="doctrine-two-column doctrine-two-column--boundary">
    <PhpCode tone="success"><PhpLines code={`$user = $users->get(42);

$profile->changeEmail($user);
$billing->upgradePlan($user);

$em->flush();`} /></PhpCode>
    <section className="boundary-flow">
      <article><small>Repository</small><strong>возвращает / регистрирует</strong></article>
      <span>↓</span>
      <article><small>Application service</small><strong>видит всю операцию</strong></article>
      <span>↓</span>
      <article className="boundary-flow__commit"><small>flush()</small><strong>одна transaction</strong></article>
    </section>
    <div className="doctrine-footer">Один <code><PhpTokens code={`flush()`} /></code> — разумный default на логическую операцию, а не запрет</div>
  </div>
);

const LazyBenefit = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div className="lazy-code-layout">
      <PhpCode tone="structure">
        <span
          className="lazy-code-line lazy-code-line--structure"
          style={{
            opacity: interpolate(frame, [0, fps * 0.35], [0.35, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        ><PhpTokens code={`$order = $orders->find(42);`} /></span>
        <span>&nbsp;</span>
        <span
          style={{
            opacity: interpolate(frame, [fps * 0.9, fps * 1.25], [0.28, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        ><PhpTokens code={`echo $order->getNumber();`} /></span>
        <span>&nbsp;</span>
        <span
          style={{
            opacity: interpolate(frame, [fps * 2.0, fps * 2.45], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        ><PhpTokens code={`// getItems() не вызывается`} /></span>
      </PhpCode>

      <section className="lazy-sql-panel lazy-sql-panel--success">
        <div className="lazy-sql-panel__label">SQL log</div>
        <code
          className="lazy-sql-row lazy-sql-row--base"
          style={{
            opacity: interpolate(frame, [fps * 0.3, fps * 0.75], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: `${interpolate(frame, [fps * 0.3, fps * 0.75], [18, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}px 0px`,
          }}
        >SELECT * FROM orders WHERE id = 42;</code>
        <div aria-hidden="true" />
        <div
          className="lazy-query-count lazy-query-count--success"
          style={{
            opacity: interpolate(frame, [fps * 2.0, fps * 2.55], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            scale: interpolate(frame, [fps * 2.0, fps * 2.55], [0.96, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.spring({damping: 180}),
              output: 'perceptual-scale',
            }),
          }}
        ><strong>0</strong><span>запросов к items</span></div>
      </section>

      <div className="doctrine-footer">Нет обращения к relation → нет лишнего <code>SELECT</code></div>
    </div>
  );
};

const LazyNPlusOne = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const relationQueries = Math.min(3, Math.max(0, Math.floor((frame - fps * 1.8) / fps) + 1));
  const counter = frame >= fps * 5 ? '1 + N' : `1 + ${relationQueries}`;
  const queryRows = [42, 43, 44];

  return (
    <div className="lazy-code-layout">
      <PhpCode tone="danger"><PhpLines code={`$orders = $repo->findRecent();

foreach ($orders as $order) {
  foreach ($order->getItems() as $item) {
    render($item);
  }
}`} lineProps={{3: {className: "lazy-code-line lazy-code-line--danger", style: {
            opacity: interpolate(frame, [fps * 1.25, fps * 1.8], [0.35, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}}} /></PhpCode>

      <section className="lazy-sql-panel lazy-sql-panel--danger">
        <div className="lazy-sql-panel__label">SQL log</div>
        <code
          className="lazy-sql-row lazy-sql-row--base"
          style={{
            opacity: interpolate(frame, [fps * 0.25, fps * 0.7], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >SELECT * FROM orders;</code>
        <div className="lazy-sql-list">
          {queryRows.map((orderId, index) => {
            const at = fps * (1.8 + index);
            return (
              <code
                className="lazy-sql-row lazy-sql-row--relation"
                key={orderId}
                style={{
                  opacity: interpolate(frame, [at, at + fps * 0.35], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
                  translate: `${interpolate(frame, [at, at + fps * 0.35], [16, 0], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  })}px 0px`,
                }}
              >SELECT * FROM items WHERE order_id = {orderId};</code>
            );
          })}
          <code
            className="lazy-sql-more"
            style={{
              opacity: interpolate(frame, [fps * 4.8, fps * 5.2], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >… ещё по запросу на каждый Order</code>
        </div>
        <div className="lazy-query-count lazy-query-count--danger"><strong>{counter}</strong><span>SQL-запросов</span></div>
      </section>

      <div className="doctrine-footer doctrine-footer--danger">Перебор lazy relation скрывает N дополнительных <code>SELECT</code></div>
    </div>
  );
};

const LazyFetchJoin = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div className="lazy-code-layout">
      <PhpCode tone="success">
        <span className="lazy-code-line lazy-code-line--success"><PhpTokens code={`$orders = $orderRepository`} /></span>
        <span className="code-line--indent-1"><PhpTokens code={`->findRecentWithItems();`} /></span>
        <span>&nbsp;</span>
        <span
          className="lazy-code-detail"
          style={{
            opacity: interpolate(frame, [fps * 0.65, fps * 1.2], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <span><PhpTokens code={`// внутри OrderRepository`} /></span>
          <span><PhpTokens code={`return $this->createQueryBuilder('o')`} /></span>
          <span className="code-line--indent-1"><PhpTokens code={`->addSelect('i')`} /></span>
          <span className="code-line--indent-1"><PhpTokens code={`->leftJoin('o.items', 'i')`} /></span>
          <span className="code-line--indent-1"><PhpTokens code={`->getQuery()->getResult();`} /></span>
        </span>
      </PhpCode>

      <section className="lazy-sql-panel lazy-sql-panel--success">
        <div className="lazy-sql-panel__label">SQL log</div>
        <code
          className="lazy-sql-row lazy-sql-row--fetch"
          style={{
            opacity: interpolate(frame, [fps * 1.35, fps * 1.85], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: `${interpolate(frame, [fps * 1.35, fps * 1.85], [18, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}px 0px`,
          }}
        >SELECT o.*, i.* FROM orders o JOIN items i …;</code>
        <div aria-hidden="true" />
        <div
          className="lazy-query-count lazy-query-count--success"
          style={{
            opacity: interpolate(frame, [fps * 2.0, fps * 2.45], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        ><strong>1</strong><span>явный запрос</span></div>
      </section>

      <div className="doctrine-footer">Relation нужна всем → загружаем её явно</div>
    </div>
  );
};

const CacheAsideCode = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const trace = [
    {label: 'Cache', value: 'GET product:42 → MISS', tone: 'structure', at: 0.35},
    {label: 'Database', value: 'SELECT product WHERE id = 42', tone: 'structure', at: 1.65},
    {label: 'Cache', value: 'SET product:42', tone: 'success', at: 3.05},
  ];

  return (
    <div className="cache-aside-code-layout">
      <PhpCode tone="structure"><PhpLines code={`$value = $cache->get($key);

if ($value === null) {
  $value = $products->find($id);
  $cache->set($key, $value);
}

return $value;`} lineProps={{
          0: {className: 'cache-code-line', style: {backgroundColor: interpolateColors(frame, [0, fps * 0.15, fps * 0.35, fps * 0.95, fps * 1.25, fps * 5], ['rgba(91,220,247,0)', 'rgba(91,220,247,0)', 'rgba(91,220,247,.20)', 'rgba(91,220,247,.20)', 'rgba(91,220,247,0)', 'rgba(91,220,247,0)'], {easing: Easing.bezier(0.16, 1, 0.3, 1)})}},
          2: {className: 'cache-code-line', style: {backgroundColor: interpolateColors(frame, [0, fps * 0.45, fps * 0.60, fps * 0.95, fps * 1.25, fps * 5], ['rgba(91,220,247,0)', 'rgba(91,220,247,0)', 'rgba(91,220,247,.20)', 'rgba(91,220,247,.20)', 'rgba(91,220,247,0)', 'rgba(91,220,247,0)'], {easing: Easing.bezier(0.16, 1, 0.3, 1)})}},
          3: {className: 'cache-code-line', style: {backgroundColor: interpolateColors(frame, [0, fps * 1.45, fps * 1.65, fps * 2.35, fps * 2.65, fps * 5], ['rgba(91,220,247,0)', 'rgba(91,220,247,0)', 'rgba(91,220,247,.20)', 'rgba(91,220,247,.20)', 'rgba(91,220,247,0)', 'rgba(91,220,247,0)'], {easing: Easing.bezier(0.16, 1, 0.3, 1)})}},
          4: {className: 'cache-code-line', style: {backgroundColor: interpolateColors(frame, [0, fps * 2.85, fps * 3.05, fps * 3.65, fps * 4, fps * 5], ['rgba(111,239,192,0)', 'rgba(111,239,192,0)', 'rgba(111,239,192,.20)', 'rgba(111,239,192,.20)', 'rgba(111,239,192,0)', 'rgba(111,239,192,0)'], {easing: Easing.bezier(0.16, 1, 0.3, 1)})}},
        }} /></PhpCode>

      <section className="cache-trace-panel">
        <div className="cache-trace-panel__label">Execution trace</div>
        <div className="cache-trace-list">
          {trace.map((step, index) => (
            <article
              className={`cache-trace-step cache-trace-step--${step.tone}`}
              key={`${step.label}-${step.value}`}
              style={{
                opacity: interpolate(frame, [fps * step.at, fps * (step.at + 0.30)], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                translate: `${interpolate(frame, [fps * step.at, fps * (step.at + 0.30)], [18, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                })}px 0`,
              }}
            >
              <span>{index + 1}</span>
              <div><small>{step.label}</small><code>{step.value}</code></div>
            </article>
          ))}
        </div>
      </section>

      <div className="doctrine-footer cache-aside-footer">При записи: <code><PhpTokens code={`DB update`} /></code> → <code><PhpTokens code={`cache delete`} /></code></div>
    </div>
  );
};

const CacheTradeoffTriangle = () => (
  <div className="cache-triangle-layout">
    <svg className="cache-triangle-lines" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
      <path className="cache-triangle-lines__outline" d="M500 54 L118 500 L882 500 Z" />
      <path className="cache-triangle-lines__spokes" d="M500 292 L500 54 M500 292 L118 500 M500 292 L882 500" />
    </svg>

    <article className="cache-axis cache-axis--freshness">
      <small>CONSISTENCY</small>
      <strong>Freshness</strong>
      <span>Допустимы stale data?</span>
    </article>

    <article className="cache-axis cache-axis--recovery">
      <small>RELIABILITY</small>
      <strong>Recovery</strong>
      <span>Что будет при частичном сбое?</span>
    </article>

    <article className="cache-axis cache-axis--latency">
      <small>PERFORMANCE</small>
      <strong>Visibility latency</strong>
      <span>Когда клиент увидит запись?</span>
    </article>

    <div className="cache-triangle-center">
      <small>проверяем все три</small>
      <strong>Caching strategy</strong>
    </div>

    <div className="cache-edge cache-edge--sync">
      <code>sync write</code>
      <span>свежее · медленнее</span>
    </div>
    <div className="cache-edge cache-edge--async">
      <code>async write</code>
      <span>быстрее · сложнее recovery</span>
    </div>
    <div className="cache-edge cache-edge--invalidate">
      <code>invalidate</code>
      <span>возможен stale window</span>
    </div>
  </div>
);

const DoctrineTransactionImplicit = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const trace = ['BEGIN', 'INSERT', 'INSERT', 'COMMIT'];

  return (
    <div className="transaction-implicit-layout">
      <PhpCode tone="success"><PhpLines code={`$em->persist($order);
$em->persist($auditLog);

$em->flush();`} lineProps={{3: {className: "transaction-code-focus", style: {
            opacity: interpolate(frame, [fps * 0.12, fps * 0.28], [0.35, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}}} /></PhpCode>

      <section className="transaction-uow-panel">
        <div className="transaction-panel-label">Unit of Work</div>
        <div className="transaction-entities">
          <span>Order · INSERT</span>
          <span>AuditLog · INSERT</span>
        </div>
        <div
          className="transaction-flush"
          style={{
            opacity: interpolate(frame, [fps * 0.16, fps * 0.32], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        ><code><PhpTokens code={`flush()`} /></code><span>↓</span></div>
        <div className="transaction-trace">
          {trace.map((step, index) => {
            const at = fps * (0.25 + index * 0.11);
            return (
              <span
                className={`transaction-trace__step transaction-trace__step--${step.toLowerCase()}`}
                key={`${step}-${index}`}
                style={{
                  opacity: interpolate(frame, [at, at + fps * 0.14], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
                  translate: `${interpolate(frame, [at, at + fps * 0.14], [12, 0], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  })}px 0px`,
                }}
              >{step}</span>
            );
          })}
        </div>
      </section>

      <div className="doctrine-footer transaction-footer--success">Несколько ORM-записей · одна транзакция</div>
    </div>
  );
};

const DoctrineTransactionExplicit = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cases = [
    {code: '2 × flush()', text: 'общий rollback', tone: 'neutral'},
    {code: 'PESSIMISTIC_WRITE', text: 'нужна active transaction', tone: 'neutral'},
    {code: 'REPEATABLE_READ', text: 'изоляция всей операции', tone: 'neutral'},
  ];

  return (
    <div className="transaction-explicit-layout">
      <PhpCode tone="success"><PhpLines code={`$conn->transactional(
  function () use ($conn) {
    $conn->executeStatement($sql1);
    $conn->executeStatement($sql2);
  }
);`} /></PhpCode>

      <section className="transaction-cases">
        <div className="transaction-cases__label">Ещё случаи</div>
        {cases.map((item, index) => {
          const at = fps * (0.2 + index * 0.18);
          return (
            <article
              className={`transaction-case transaction-case--${item.tone}`}
              key={item.code}
              style={{
                opacity: interpolate(frame, [at, at + fps * 0.25], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                translate: `${interpolate(frame, [at, at + fps * 0.25], [14, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                })}px 0px`,
              }}
            >
              <code>{item.code}</code>
              <span>{item.text}</span>
            </article>
          );
        })}
      </section>

      <div className="doctrine-footer transaction-footer--direct">SQL/DQL-записи выполняются сразу — <code><PhpTokens code={`flush()`} /></code> их не собирает</div>
    </div>
  );
};

const UuidSize = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = (delay: number) => ({
    opacity: interpolate(frame, [delay, delay + fps * 0.3], [0, 1], {
      extrapolateLeft: 'clamp' as const,
      extrapolateRight: 'clamp' as const,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translate: `${interpolate(frame, [delay, delay + fps * 0.3], [14, 0], {
      extrapolateLeft: 'clamp' as const,
      extrapolateRight: 'clamp' as const,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    })}px 0px`,
  });

  return (
    <div className="uuid-size-layout">
      <section className="uuid-size-column uuid-size-column--bigint" style={reveal(0)}>
        <div className="uuid-size-heading"><small>BIGINT</small><strong>8 bytes</strong></div>
        <div className="uuid-capacity"><span>Положительные ID</span><code>до 9.22 × 10¹⁸</code></div>
        <div className="uuid-property uuid-property--plus"><b>+</b><span>Последовательные вставки растут с правого края индекса</span></div>
        <div className="uuid-property uuid-property--minus"><b>−</b><span>Sequence координирует генерацию внутри одной БД</span></div>
        <div className="uuid-db-note"><code>MySQL UNSIGNED</code><span>до 1.84 × 10¹⁹</span></div>
      </section>

      <div className="uuid-size-divider" aria-hidden="true" />

      <section className="uuid-size-column uuid-size-column--uuid" style={reveal(fps * 0.15)}>
        <div className="uuid-size-heading"><small>UUID</small><strong>16 bytes</strong></div>
        <div className="uuid-capacity"><span>Размер значения</span><code>128 bit</code></div>
        <div className="uuid-property uuid-property--minus"><b>−</b><span>Ключ и foreign keys вдвое шире, чем BIGINT</span></div>
        <div className="uuid-property uuid-property--minus"><b>−</b><span>UUIDv4 распределяет вставки по разным страницам B-tree</span></div>
        <div className="uuid-property uuid-property--plus"><b>+</b><span>UUIDv7 группирует новые ключи по времени</span></div>
      </section>

    </div>
  );
};

const UuidV7Anatomy = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div className="uuid-anatomy-layout">
      <section className="uuid-anatomy-value" aria-label="Структура UUID версии 7">
        <code>
          <span className="uuid-part uuid-part--time">017F22E2-79B0</span>
          <span className="uuid-separator">-</span>
          <span className="uuid-part uuid-part--version">7</span>
          <span className="uuid-part uuid-part--random">CC3</span>
          <span className="uuid-separator">-</span>
          <span className="uuid-part uuid-part--variant">9</span>
          <span className="uuid-part uuid-part--random">8C4-DC0C0C07398F</span>
        </code>
      </section>

      <section className="uuid-anatomy-legend">
        <article className="uuid-legend-item uuid-legend-item--time">
          <span>48 bit</span><strong>Unix timestamp, ms</strong><small>порядок по времени генерации</small>
        </article>
        <article className="uuid-legend-item uuid-legend-item--version">
          <span>4 bit</span><strong>version = 7</strong><small>версия формата</small>
        </article>
        <article className="uuid-legend-item uuid-legend-item--variant">
          <span>2 bit</span><strong>variant</strong><small>RFC layout</small>
        </article>
        <article className="uuid-legend-item uuid-legend-item--random">
          <span>74 bit</span><strong>random / counter</strong><small>уникальность внутри timestamp</small>
        </article>
      </section>

      <section
        className="uuid-datetime"
        style={{
          opacity: interpolate(frame, [fps * 0.25, fps * 0.6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <code><PhpTokens code={`$id->getDateTime()`} /></code>
        <span>22.02.2022 19:22:22 UTC</span>
        <small>время генерации ID, не дата INSERT</small>
      </section>

      <div className="uuid-order-note">Внутри одной миллисекунды строгий порядок зависит от генератора</div>
    </div>
  );
};

const UuidBeforeDatabase = () => (
  <div className="uuid-code-layout">
    <PhpCode tone="success"><PhpLines code={`final class Order
{
  public function __construct(
    private UuidV7 $id = new UuidV7(),
  ) {}
}

$order = new Order();
$bus->dispatch(
  new OrderCreated($order->id()),
);
$em->persist($order);`} lineProps={{3: {className: "uuid-code-highlight"}}} /></PhpCode>

    <aside className="uuid-code-result">
      <div><small>Тип поля</small><code>UuidV7</code></div>
      <div><small>До persist()</small><strong>ID уже известен</strong></div>
      <div className="uuid-code-result__success"><span>✓</span><strong>Без проверки на null</strong></div>
    </aside>
  </div>
);

const UuidDistributed = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sources = [
    {name: 'Service A / DB A', id: '…7cc3-98c4…', tone: 'structure'},
    {name: 'Service B / DB B', id: '…7a15-a4e2…', tone: 'structure'},
  ];

  return (
    <div className="uuid-distributed-layout">
      <section className="uuid-generators">
        {sources.map((source, index) => {
          const at = fps * (0.1 + index * 0.16);
          return (
            <article
              className={`uuid-generator uuid-generator--${source.tone}`}
              key={source.name}
              style={{
                opacity: interpolate(frame, [at, at + fps * 0.28], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                translate: `${interpolate(frame, [at, at + fps * 0.28], [-16, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                })}px 0px`,
              }}
            >
              <small>{source.name}</small>
              <code>{source.id}</code>
              <span>генерирует независимо</span>
            </article>
          );
        })}
      </section>

      <div className="uuid-distributed-link"><span>без общей sequence</span><b>→</b></div>

      <section className="uuid-event-id">
        <small>Event / API</small>
        <strong>Глобальный идентификатор</strong>
        <code>OrderId: UUIDv7</code>
      </section>

      <section className="uuid-distributed-facts">
        <div className="uuid-property uuid-property--plus"><b>+</b><span>Соседний ID нельзя вычислить как <code>id + 1</code></span></div>
      </section>
    </div>
  );
};

const UuidSlide = ({slideId}: {slideId: string}) => {
  switch (slideId) {
    case '17-size': return <UuidSize />;
    case '17-v7': return <UuidV7Anatomy />;
    case '17-before-db': return <UuidBeforeDatabase />;
    case '17-distributed': return <UuidDistributed />;
    default: return null;
  }
};

const ExplainAnalyzeTelegram = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div className="telegram-case-layout">
      <section
        className="telegram-case-copy"
        style={{
          opacity: interpolate(frame, [0, fps * 0.3], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: `${interpolate(frame, [0, fps * 0.3], [-18, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}px 0`,
        }}
      >
        <div className="telegram-case-kicker">Результат на боевой базе</div>
        <div className="telegram-case-metric">
          <strong>16,2 с</strong>
          <span>→</span>
          <strong>250 мс</strong>
        </div>
        <div className="telegram-case-observation">
          <small>EXPLAIN ANALYZE ПОКАЗАЛ</small>
          <strong>JIT занимал 16 из 16,2 секунды</strong>
        </div>
        <div className="telegram-case-note">
          В этом запросе помог <code>SET jit = off</code>
        </div>
      </section>

      <aside
        className="telegram-case-cta"
        style={{
          opacity: interpolate(frame, [fps * 0.45, fps * 0.8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [fps * 0.45, fps * 0.8], [0.96, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.spring({damping: 180}),
            output: 'perceptual-scale',
          }),
        }}
      >
        <div className="telegram-case-qr">
          <CanvasImage src={staticFile('qr/explain-analyze-post.svg')} />
        </div>
        <strong>План запроса и разбор</strong>
        <span>Telegram · @msavin_php · пост №52</span>
      </aside>
    </div>
  );
};

const DoctrineSlide = ({slideId}: {slideId: string}) => {
  switch (slideId) {
    case '13-persist': return <DoctrinePersist />;
    case '13-flush-listener': return <DoctrineFlushListener />;
    case '13-flush-audit': return <DoctrineFlushAudit />;
    case '13-flush-result': return <DoctrineFlushResult />;
    case '13-clear': return <DoctrineClear />;
    case '13-clear-batch': return <DoctrineClearBatch />;
    case '14-identity': return <DoctrineIdentity />;
    case '14-layers': return <DoctrineLayers />;
    case '14-boundary': return <DoctrineBoundary />;
    case '15-lazy': return <LazyBenefit />;
    case '15-n-plus-one': return <LazyNPlusOne />;
    case '15-fetch-join': return <LazyFetchJoin />;
    case '16-implicit': return <DoctrineTransactionImplicit />;
    case '16-explicit': return <DoctrineTransactionExplicit />;
    default: return null;
  }
};

export const ReviewSlide = ({
  format,
  slideId,
  speaker,
  contentLayout: contentLayoutOverride,
}: {
  format: Format;
  slideId: string;
  speaker?: Speaker;
  contentLayout?: ContentLayout;
}) => {
  const slide = reviewSlideById(slideId);
  const contentLayout = contentLayoutOverride ?? contentLayoutForSlide(slide, format);
  const resolvedSpeaker = speaker ?? slide.speaker ?? (slide.pattern === 'question' ? 'interviewer' : 'mikhail');

  if (slide.pattern === 'question') {
    return (
      <InterviewShell format={format} speaker={resolvedSpeaker} counter={slide.counter} question="" showHeader={false}>
        <div className="rr-question">
          <span>{`Вопрос ${slide.counter} из ${TOTAL_QUESTIONS}`}</span>
          <h1>{slide.title}</h1>
        </div>
      </InterviewShell>
    );
  }

  const body = (() => {
    if (slide.pattern === 'custom') {
      const Body = slide.body;
      return <Body format={format} />;
    }

    if (slide.pattern === 'enum') {
      return (
        <div className={`rr-slide rr-slide--enum rr-slide--${slide.id}`}>
          <EnumComparison />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      );
    }

    if (slide.pattern === 'di-graph' || slide.pattern === 'di-compile') {
      return (
        <div className={`rr-slide rr-slide--${slide.pattern} rr-slide--${slide.id}`}>
          {slide.pattern === 'di-graph' ? <DiObjectGraph /> : <DiCompileRuntime />}
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      );
    }

    if (slide.pattern === 'decorator-code') {
      return (
        <div className={`rr-slide rr-slide--decorator-code rr-slide--${slide.id}`}>
          <DecoratorCode />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      );
    }

    if (slide.pattern === 'compiler-pass-code') {
      return (
        <div className={`rr-slide rr-slide--compiler-pass-code rr-slide--${slide.id}`}>
          <CompilerPassCode />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      );
    }

    if (slide.id === '22-dto') {
      return <div className="rr-slide rr-slide--dto-transfer rr-slide--22-dto"><DtoTransfer /></div>;
    }

    if (slide.id === '22-entity') {
      return <div className="rr-slide rr-slide--rich-entity rr-slide--22-entity"><RichEntity /></div>;
    }

    if (slide.pattern === 'controller-code') {
      return (
        <div className={`rr-slide rr-slide--controller-code rr-slide--${slide.id}`}>
          <ControllerReadCode />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      );
    }

    if (slide.pattern === 'cache-aside-code') {
      return (
        <div className={`rr-slide rr-slide--cache-aside-code rr-slide--${slide.id}`}>
          <CacheAsideCode />
        </div>
      );
    }

    if (slide.pattern === 'cache-triangle') {
      return (
        <div className={`rr-slide rr-slide--cache-triangle rr-slide--${slide.id}`}>
          <CacheTradeoffTriangle />
        </div>
      );
    }

    if (slide.pattern === 'telegram-promo') {
      return (
        <div className="rr-slide rr-slide--telegram-promo rr-slide--28-telegram">
          <ExplainAnalyzeTelegram />
        </div>
      );
    }

    if (slide.pattern === 'doctrine') {
      return (
        <div className={`rr-slide rr-slide--doctrine rr-slide--${slide.id}`}>
          <DoctrineSlide slideId={slide.id} />
        </div>
      );
    }

    if (slide.pattern === 'uuid') {
      return (
        <div className={`rr-slide rr-slide--uuid rr-slide--${slide.id}`}>
          <UuidSlide slideId={slide.id} />
        </div>
      );
    }

    return (
      <div className={`rr-slide rr-slide--${slide.pattern ?? 'grid'} rr-slide--${slide.id}`}>
        <div className="rr-cards">
          {slide.cards?.map((card, index) => <CardView key={`${card.title}-${index}`} card={card} />)}
        </div>
        {slide.footer && <div className="rr-footer">{slide.footer}</div>}
      </div>
    );
  })();

  const shellLayout = slide.id === '22-dto' || slide.id === '22-entity'
    ? 'dense'
    : slide.id === '14-identity'
      ? 'compact'
      : slide.pattern === 'telegram-promo'
        ? 'balanced'
        : contentLayout;

  return (
    <InterviewShell
      format={format}
      speaker={resolvedSpeaker}
      counter={slide.counter}
      question={slide.title}
      contentLayout={shellLayout}
    >
      {body}
    </InterviewShell>
  );
};
