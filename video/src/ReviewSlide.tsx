import type {ReactNode} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {InterviewShell, type Format} from './InterviewShell';
import {PhpCodeBlock, PhpTokens, PhpLines} from './PhpCodeBlock';
import {TOTAL_QUESTIONS, type Speaker} from './timeline';

type Tone = 'purple' | 'cyan' | 'green' | 'amber' | 'red';
type Pattern = 'question' | 'columns' | 'grid' | 'flow' | 'stack' | 'enum' | 'di-graph' | 'di-compile' | 'decorator-code' | 'compiler-pass-code' | 'controller-code' | 'doctrine' | 'uuid';

type Card = {
  label?: string;
  title: string;
  lines?: string[];
  code?: string[];
  codeLanguage?: 'php';
  tone?: Tone;
};

export type ReviewSlideDefinition = {
  id: string;
  counter: string;
  title: string;
  speaker?: Speaker;
  badge?: string;
  pattern?: Pattern;
  cards?: Card[];
  footer?: ReactNode;
};

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
  pattern: Pattern,
  cards: Card[],
  footer?: ReactNode,
  badge?: string,
  speaker: Speaker = 'mikhail',
): ReviewSlideDefinition => ({id, counter, title, pattern, cards, footer, badge, speaker});

export const reviewSlides: ReviewSlideDefinition[] = [
  s('06-enum', '6', 'Для чего и когда использовать enum?', 'enum', [
  ], 'Конечный набор доменных вариантов — хороший кандидат для enum'),

  q('07-question', '7', 'Как работает DI-контейнер Symfony и что он даёт?'),
  s('07-graph', '7', 'Контейнер строит object graph', 'di-graph', [],
    'Контейнер создаёт Checkout и передаёт выбранные реализации'),
  s('07-compile', '7', 'Сборка и runtime — разные фазы', 'di-compile', [],
    'dev/debug: cache stale → rebuild · cache fresh → reuse'),
  s('07-tradeoff', '7', 'Две стратегии затрат', 'columns', [
    {label: 'Symfony', title: 'Compile + PHP dump', lines: ['Цена warmup / rebuild', 'Повторно используем generated container'], tone: 'purple'},
    {label: 'Runtime-resolved DI', title: 'Resolve при выполнении', lines: ['Definitions читаются в runtime', 'Нет compiled-container artifact'], tone: 'cyan'},
  ], 'Что быстрее — показывает benchmark конкретного приложения'),

  q('08-question', '8', 'Когда autowiring, а когда явная конфигурация?'),
  s('08-axes', '8', 'Не смешиваем две независимые оси', 'columns', [
    {label: 'Механизм выбора', title: 'Autowiring или explicit wiring', lines: ['Как контейнер выбирает аргумент'], tone: 'purple'},
    {label: 'Формат описания', title: 'PHP · YAML · XML · attributes', lines: ['Где записана конфигурация'], tone: 'cyan'},
  ], 'Механизм выбора ≠ формат конфигурации', 'Уточнение ответа'),
  s('08-rules', '8', 'Autowiring по умолчанию, явно — при неоднозначности', 'grid', [
    {label: 'AUTO', title: 'Одна object-зависимость', code: ['LoggerInterface $logger'], codeLanguage: 'php', tone: 'green'},
    {label: 'EXPLICIT', title: 'Несколько реализаций', code: ['PaymentGatewayInterface → ?'], tone: 'amber'},
    {label: 'EXPLICIT', title: 'Scalar / config value', code: ['string $dsn', 'int $timeout'], codeLanguage: 'php', tone: 'amber'},
    {label: 'EXPLICIT', title: 'Factory или особая сборка', lines: ['Нужен контекст создания'], tone: 'purple'},
  ], 'И учитываем соглашения существующего проекта'),

  q('09-question', '9', 'Event Subscriber · Middleware · Decorator — что это?'),
  s('09-subscriber', '9', 'Event Subscriber сам объявляет подписки', 'flow', [
    {label: 'Subscriber', title: 'getSubscribedEvents()', code: ['OrderPaid::class', 'KernelEvents::REQUEST'], codeLanguage: 'php', tone: 'purple'},
    {label: 'Dispatcher', title: 'Event', lines: ['Находит всех подписчиков'], tone: 'amber'},
    {label: 'Fan-out', title: 'listener A · listener B', lines: ['Несколько реакций на событие'], tone: 'cyan'},
  ]),
  s('09-middleware', '9', 'Middleware — цепочка вокруг handler', 'flow', [
    {title: 'Request / message', tone: 'purple'},
    {title: 'Middleware A', lines: ['before ↓  ↑ after'], tone: 'cyan'},
    {title: 'Middleware B', lines: ['before ↓  ↑ after'], tone: 'cyan'},
    {title: 'Handler', tone: 'green'},
  ], 'Не только Laravel: PSR-15, Symfony Messenger и другие pipelines', 'Уточнение ответа'),
  s('09-decorator', '9', 'Decorator сохраняет контракт сервиса', 'decorator-code', [],
    'Тот же интерфейс · поведение до и после делегирования'),

  q('10-question', '10', 'Чем полезен Symfony Messenger, кроме очередей?'),
  s('10-bus', '10', 'Message bus не равен очереди', 'flow', [
    {title: 'Message', code: ['CreateInvoice'], tone: 'purple'},
    {title: 'Message Bus', lines: ['dispatch по типу'], tone: 'amber'},
    {label: 'SYNC', title: 'Handler сейчас', tone: 'green'},
    {label: 'ASYNC', title: 'Transport → worker', tone: 'cyan'},
  ], 'Transport — опциональная ветка, а не определение message bus'),
  s('10-middleware', '10', 'Middleware оборачивает обработчик', 'flow', [
    {title: 'Ping DB', lines: ['before'], tone: 'cyan'},
    {title: 'Handle message', lines: ['полезная работа'], tone: 'purple'},
    {title: 'Close DB', lines: ['after'], tone: 'cyan'},
  ], 'Сквозная логика без изменения handler'),

  q('11-question', '11', 'Когда писать свой consumer вместо Messenger?'),
  s('11-pull-push', '11', 'Messenger polling или RabbitMQ subscription', 'columns', [
    {label: 'Symfony AMQP transport · get()', title: 'Polling', lines: ['Worker сам запрашивает следующее сообщение'], tone: 'purple'},
    {label: 'RabbitMQ · basic.consume', title: 'Push / subscription', lines: ['Broker доставляет зарегистрированному consumer'], tone: 'cyan'},
  ], 'Критерий этого кейса — broker-driven push вместо polling', undefined, 'interviewer'),
  s('11-symfony', '11', 'Почему consumer не виден в RabbitMQ UI?', 'columns', [
    {label: 'Symfony AMQP transport', title: 'Получает через get()', lines: ['Неблокирующий fetch', 'Message или empty → следующий цикл'], tone: 'purple'},
    {label: 'RabbitMQ', title: 'Нет basic.consume', lines: ['Значит, нет зарегистрированной subscription'], tone: 'cyan'},
  ], 'get() не регистрирует subscription в RabbitMQ'),
  s('11-runtime', '11', 'get() и consume() меняют способ ожидания', 'columns', [
    {label: 'Polling · basic.get', title: 'Worker спрашивает очередь', lines: ['empty → пауза → новый get()', 'Периодические пустые запросы'], tone: 'purple'},
    {label: 'Subscription · basic.consume', title: 'Worker ждёт delivery', lines: ['Подписка по открытому соединению', 'Без холостого polling'], tone: 'cyan'},
  ], 'basic.consume снижает холостую нагрузку, но не устраняет утечки PHP-worker', undefined, 'interviewer'),
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
    {label: 'Обычная коллекция', title: 'count() может загрузить всё', lines: ['Много объектов в память'], tone: 'red'},
    {label: 'EXTRA_LAZY', title: 'count() отдельным SQL', code: ['SELECT COUNT(*) …'], lines: ['Collection не инициализируется целиком'], tone: 'green'},
  ]),

  q('16-question', '16', 'Когда транзакции приходится использовать вручную?'),
  s('16-implicit', '16', 'Обычно beginTransaction() не нужен', 'doctrine', []),
  s('16-explicit', '16', 'Когда открываем транзакцию явно?', 'doctrine', [], undefined, 'Уточнение ответа'),

  q('17-question', '17', 'UUID или автоинкремент?'),
  s('17-size', '17', 'Размер, вместимость и порядок вставки', 'uuid', [], undefined, 'Исправление ответа'),
  s('17-v7', '17', 'Из чего состоит UUIDv7', 'uuid', []),
  s('17-before-db', '17', 'ID существует до записи в БД', 'uuid', []),
  s('17-distributed', '17', 'Несколько БД без общей sequence', 'uuid', []),

  q('18-question', '18', 'Про индексы что-нибудь расскажи?'),
  s('18-tradeoff', '18', 'Индекс ускоряет чтение не бесплатно', 'columns', [
    {label: 'READ', title: 'Быстрее поиск и сортировка', lines: ['Меньше страниц для чтения'], tone: 'green'},
    {label: 'WRITE + STORAGE', title: 'Дороже изменения', lines: ['INSERT / UPDATE поддерживают индекс', 'Дополнительное место на диске'], tone: 'amber'},
  ]),
  s('18-access', '18', 'Метод доступа выбирают под оператор', 'grid', [
    {title: 'B-tree', lines: ['equality · range · sort'], tone: 'purple'},
    {title: 'GIN', lines: ['JSONB · arrays · full text'], tone: 'cyan'},
    {title: 'GiST', lines: ['ranges · geometry · nearest'], tone: 'amber'},
    {title: 'BRIN', lines: ['огромные коррелированные таблицы'], tone: 'green'},
  ]),
  s('18-forms', '18', 'Формы индекса и физический порядок', 'grid', [
    {title: 'Multicolumn', code: ['(tenant_id, created_at)'], tone: 'purple'},
    {title: 'INCLUDE', lines: ['covering index'], tone: 'cyan'},
    {title: 'Partial', code: ["WHERE status = 'active'"], tone: 'amber'},
    {title: 'Clustered', lines: ['Физический порядок строк по ключу', 'В PostgreSQL требует повторного CLUSTER'], tone: 'green'},
  ]),

  q('19-question', '19', 'Что такое чистая архитектура?'),
  s('19-rule', '19', 'Зависимости исходного кода направлены внутрь', 'stack', [
    {label: 'Внешние детали', title: 'Web · DB · Framework', lines: ['Могут зависеть от внутренних контрактов'], tone: 'cyan'},
    {label: 'Adapters', title: 'Controllers · gateways · presenters', tone: 'purple'},
    {label: 'Ядро', title: 'Business rules', lines: ['Не знает о внешних деталях'], tone: 'green'},
  ], 'Граница нужна ради направления зависимостей, а не ради папок'),

  q('20-question', '20', 'Domain Service и Application Service — что для чего?'),
  s('20-levels', '20', 'Domain Service и Application Service', 'columns', [
    {label: 'Application', title: 'Оркестрирует use case', lines: ['Загрузить · вызвать · сохранить · отправить'], tone: 'purple'},
    {label: 'Domain', title: 'Выражает бизнес-решение', lines: ['Правило, не принадлежащее одной entity'], tone: 'cyan'},
  ]),
  s('20-usecase', '20', 'Один use case — две ответственности', 'flow', [
    {label: 'Application', title: 'TransferMoney', lines: ['load accounts'], tone: 'purple'},
    {label: 'Domain', title: 'TransferPolicy', lines: ['можно ли выполнить перевод?'], tone: 'cyan'},
    {label: 'Application', title: 'save + publish event', tone: 'green'},
  ]),
  s('20-criterion', '20', 'Проверочный вопрос', 'columns', [
    {title: 'Это порядок действий?', lines: ['Application Service'], tone: 'purple'},
    {title: 'Это решение предметной области?', lines: ['Domain / Entity / Value Object'], tone: 'cyan'},
  ]),

  q('21-question', '21', 'Можно ли контроллеру идти в репозиторий?'),
  s('21-direct', '21', 'Для простого чтения отдельный сервис избыточен', 'controller-code', []),

  q('22-question', '22', 'DTO против Entity — что для чего?'),
  s('22-entity', '22', 'Entity — не просто ORM-объект', 'stack', []),
  s('22-dto', '22', 'DTO переносит данные через границу', 'stack', []),
  s('22-correction', '22', 'Не определяем тип по случайным признакам', 'columns', [
    {label: 'Entity', title: 'Не обязана быть mutable или ORM', lines: ['Главное — identity и lifecycle'], tone: 'purple'},
    {label: 'DTO', title: 'Не обязан быть readonly', lines: ['Главное — перенос данных'], tone: 'cyan'},
  ], undefined, 'Уточнение ответа'),

  q('23-question', '23', 'Как выделять модули из монолита и как разделять их работу между собой?'),
  s('23-boundary', '23', 'Хорошая граница модуля', 'columns', [
    {label: 'Внутри', title: 'Высокая cohesion', lines: ['Связанные бизнес-правила рядом'], tone: 'purple'},
    {label: 'Снаружи', title: 'Низкая coupling', lines: ['Маленький стабильный контракт'], tone: 'cyan'},
  ]),
  s('23-deployment', '23', 'Что я имел в виду под отдельным сервисом логов', 'flow', [
    {label: 'Источники', title: 'Другие сервисы', code: ['REST · JSON-RPC'], tone: 'purple'},
    {label: 'Log service', title: 'Принимает логи', lines: ['Единая точка записи и чтения'], tone: 'cyan'},
    {label: 'Хранилища', title: 'Elastic · Kafka · ClickHouse', tone: 'green'},
  ], 'Поисковые endpoints · фильтры · выдача логов', 'Уточнение ответа'),
  s('23-monolith', '23', 'Начать можно с modular monolith', 'flow', [
    {title: 'Module A', lines: ['Command · Query · Event'], tone: 'purple'},
    {title: 'In-process contracts', lines: ['Явные границы'], tone: 'cyan'},
    {title: 'Module B', tone: 'green'},
  ], 'Выносить в отдельный deployment — когда есть измеримая причина'),

  s('24-question', '24', 'Где хранить интерфейс репозитория?', 'columns', [
    {title: 'Domain?', lines: ['Если контракт нужен доменной политике'], tone: 'purple'},
    {title: 'Application?', lines: ['Если контракт нужен use case'], tone: 'cyan'},
  ], 'Вопрос не про универсальную папку — он про владельца абстракции'),
  s('24-dependency', '24', 'Порт рядом с внутренним потребителем', 'flow', [
    {title: 'Application / Domain', lines: ['объявляет Repository interface'], tone: 'purple'},
    {title: 'Port', code: ['OrderRepository'], tone: 'amber'},
    {title: 'Infrastructure', lines: ['DoctrineOrderRepository implements'], tone: 'cyan'},
  ], 'Зависимость направлена внутрь'),

  q('25-question', '25', 'С редисом, с кэшом работал?'),
  s('25-classes', '25', 'Не смешиваем две группы стратегий', 'columns', [
    {label: 'Read/write pattern', title: 'Cache Aside · Read Through', lines: ['Кто загружает данные в cache'], tone: 'purple'},
    {label: 'Write policy', title: 'Write Through · Write Behind', lines: ['Когда обновляется source of truth'], tone: 'cyan'},
  ], undefined, 'Уточнение ответа'),
  s('25-aside', '25', 'Cache Aside', 'flow', [
    {title: 'Cache GET', lines: ['hit → вернуть'], tone: 'purple'},
    {title: 'miss → DB', lines: ['прочитать источник истины'], tone: 'cyan'},
    {title: 'Cache SET', lines: ['сохранить результат'], tone: 'green'},
  ], 'При записи: DB update → invalidate cache', 'Исправление ответа'),
  s('25-writes', '25', 'Две write-стратегии', 'columns', [
    {label: 'WRITE-THROUGH', title: 'DB + cache до success', lines: ['Выше write latency', 'После успеха данные свежие'], tone: 'green'},
    {label: 'WRITE-BEHIND', title: 'Cache / queue → async DB', lines: ['Ниже latency', 'Сложнее failure recovery'], tone: 'amber'},
  ], 'База остаётся источником истины'),
  s('25-choice', '25', 'Кэш всегда создаёт trade-off', 'grid', [
    {title: 'Freshness', lines: ['Допустимы stale data?'], tone: 'purple'},
    {title: 'Write latency', lines: ['Можно ждать два слоя?'], tone: 'cyan'},
    {title: 'Failure recovery', lines: ['Кто чинит рассинхронизацию?'], tone: 'amber'},
  ], 'Критичные данные не храним только в Redis'),

  s('26-auth', '26', 'Authentication ≠ Authorization', 'columns', [
    {label: 'AUTHENTICATION · AuthN', title: 'Кто ты?', code: ['credentials → identity'], tone: 'purple'},
    {label: 'AUTHORIZATION · AuthZ', title: 'Что тебе разрешено?', code: ['identity + policy → allow / deny'], tone: 'cyan'},
  ], 'Permission проверяется на каждом защищённом запросе'),

  s('27-jwt', '27', 'JWT — компактный контейнер claims', 'flow', [
    {label: 'HEADER', title: 'eyJ…', tone: 'purple'},
    {label: 'PAYLOAD', title: 'eyJ…', lines: ['claims'], tone: 'cyan'},
    {label: 'SIGNATURE', title: 'Sfl…', tone: 'amber'},
  ], <><strong>signed ≠ encrypted</strong> · подпись проверяет целостность</>),

  s('28-query', '28', '10 млн строк · фильтр стал медленным', 'columns', [
    {label: 'Первый шаг', title: 'EXPLAIN (ANALYZE, BUFFERS)', code: ['SELECT … WHERE status = ?'], tone: 'purple'},
    {label: 'Смотрим в плане', title: 'actual time · rows · loops', lines: ['Seq / Index Scan · buffers'], tone: 'cyan'},
  ], 'Осторожно: ANALYZE выполняет запрос · сначала безопасная среда'),

  s('29-so', '29', 'SOLID · эвристики управления изменениями', 'columns', [
    {label: 'S · Single Responsibility', title: 'Одна ось изменения', lines: ['InvoiceFormatter ≠ Sender'], tone: 'purple'},
    {label: 'O · Open / Closed', title: 'Расширяем стабильный dispatch', lines: ['+ CryptoHandler без правки существующего'], tone: 'cyan'},
  ]),
  s('29-lsp', '29', 'L · Подтип сохраняет обещания базового типа', 'stack', [
    {title: 'DHLCarrier вместо Carrier', code: ['ship(Carrier $carrier)', '$carrier->deliver($parcel)'], codeLanguage: 'php', lines: ['Клиентский код не ломается'], tone: 'green'},
    {title: 'Безопасная вариативность сигнатуры', lines: ['Параметр может быть шире · contravariance', 'Return type может быть уже · covariance'], tone: 'purple'},
  ], undefined, 'Исправление ответа'),
  s('29-id', '29', 'I · Interface Segregation / D · Dependency Inversion', 'columns', [
    {label: 'I', title: 'Контракт под нужды клиента', lines: ['Printer не обязан scan / fax'], tone: 'purple'},
    {label: 'D', title: 'Зависимость от abstraction', lines: ['policy → PaymentGateway', 'StripeAdapter implements interface'], tone: 'cyan'},
  ]),
  s('29-tradeoff', '29', 'SOLID не обязателен «на максимум»', 'columns', [
    {label: 'Польза', title: 'Легче менять и тестировать', lines: ['Ясные зависимости'], tone: 'green'},
    {label: 'Цена', title: 'Больше типов и переходов', lines: ['Простой код становится сложнее читать'], tone: 'amber'},
  ], 'Применяем под реальные изменения, а не ради соответствия'),

  s('30-basics', '30', 'DRY и KISS отвечают на разные риски', 'columns', [
    {label: 'DRY', title: 'Одно знание — одно место', lines: ['Риск: рассинхронизация'], tone: 'purple'},
    {label: 'KISS', title: 'Минимальная нужная сложность', lines: ['Риск: лишние конструкции'], tone: 'cyan'},
  ]),
  s('30-copy', '30', 'Похожий код ещё не означает общую abstraction', 'columns', [
    {label: 'Invoice', title: 'total + tax', lines: ['Сегодня строки похожи'], tone: 'purple'},
    {label: 'Cart', title: 'total + discount', lines: ['Меняется по другой причине'], tone: 'cyan'},
  ], 'Преждевременная FactoryFactory связала независимые правила'),
  s('30-criterion', '30', 'Что делать с повтором?', 'columns', [
    {label: 'Меняется вместе?', title: 'ДА → выделить общее', tone: 'green'},
    {label: 'Нет или неясно?', title: 'Оставить локально и просто', tone: 'amber'},
  ], 'Устойчивую абстракцию легче добавить позже'),

  s('32-uses', '32', 'Как использовать AI в разработке?', 'grid', [
    {title: 'Найти контекст', tone: 'purple'},
    {title: 'Набросать первую версию', tone: 'cyan'},
    {title: 'Механически изменить код', tone: 'amber'},
  ], 'Польза зависит от задачи и рабочего процесса'),
  s('32-risk', '32', 'Сгенерированный код — ещё не принятый код', 'columns', [
    {label: 'PROMPT', title: '«Исправь локальную ошибку»', lines: ['Маленькая задача'], tone: 'purple'},
    {label: 'OUTPUT', title: 'Изменено 14 файлов', lines: ['giant class · лишний scope · скрытые правки'], tone: 'red'},
  ], 'Проверяем scope, архитектуру и побочные изменения'),
  s('32-loop', '32', 'AI-assisted ≠ AI-approved', 'flow', [
    {title: 'Контекст', tone: 'purple'},
    {title: 'Маленькая задача', tone: 'cyan'},
    {title: 'Diff', tone: 'amber'},
    {title: 'Tests + static analysis', tone: 'green'},
    {title: 'Human review', tone: 'purple'},
  ], 'Ответственность за изменение остаётся у разработчика'),
  s('32-readable', '32', 'Результат должен быть понятен человеку', 'columns', [
    {label: 'ЯСНО', title: 'Доменные имена', lines: ['Локальные изменения', 'Очевидный поток'], tone: 'green'},
    {label: '«SOLID НА МАКСИМУМ»', title: '12 interfaces · 8 factories', lines: ['Смысл размазан по слоям'], tone: 'red'},
  ], 'Архитектура помогает изменениям, а не демонстрирует паттерны'),
];

export const defaultReviewSlide = reviewSlides[0];

const CardView = ({card}: {card: Card}) => (
  <article className={`rr-card rr-card--${card.tone ?? 'purple'}`}>
    {card.label && <div className="rr-card__label">{card.label}</div>}
    <h2>{card.title}</h2>
    {card.code && <pre><code>{card.codeLanguage === 'php' ? <PhpTokens code={card.code.join('\n')} /> : card.code.join('\n')}</code></pre>}
    {card.lines?.map((line) => <p key={line}>{line}</p>)}
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
        <code>Request 1 ─┐</code>
        <code>Request 2 ─┼──→</code>
        <code>Request N ─┘</code>
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
      <article className="compiler-pass-service compiler-pass-service--purple">
        <strong>EmailConsumer</strong>
        <code>queue: emails</code>
      </article>
      <article className="compiler-pass-service compiler-pass-service--cyan">
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
    <pre className="doctrine-code doctrine-code--cyan dto-transfer-code"><code><PhpLines code={`#[Route('/orders', methods: ['POST'])]
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

const PhpCode = ({children, tone = 'purple'}: {children: ReactNode; tone?: Tone}) => (
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
      <div className="doctrine-state doctrine-state--purple"><small>entity state</small><strong>NEW</strong></div>
      <div className="doctrine-arrow-step"><code><PhpTokens code={`persist($user)`} /></code><span>→</span></div>
      <div className="doctrine-state doctrine-state--green"><small>Unit of Work</small><strong>MANAGED</strong><span>scheduled: INSERT</span></div>
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
    <div className="doctrine-correction"><small>Исправление</small><span>Обработанные change sets очищены, но managed entities остаются</span></div>
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
    <PhpCode tone="cyan"><PhpLines code={`foreach ($rows as $i => $row) {
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
      <PhpCode tone="green"><PhpLines code={`$a = $em->find(User::class, 42); // SELECT
$b = $repository->find(42); // Identity Map
$a === $b; // true`} /></PhpCode>
      <div className="identity-result"><strong>SELECT ×1</strong><span>Один ID → один PHP-объект</span></div>
    </section>
    <section className="identity-card identity-card--laravel">
      <div className="identity-card__label">Laravel Eloquent</div>
      <PhpCode tone="red"><PhpLines code={`$a = User::find(42); // SELECT
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
    <PhpCode tone="green"><PhpLines code={`$user = $users->get(42);

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
      <PhpCode tone="cyan">
        <span
          className="lazy-code-line lazy-code-line--cyan"
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
      <PhpCode tone="red"><PhpLines code={`$orders = $repo->findRecent();

foreach ($orders as $order) {
  foreach ($order->getItems() as $item) {
    render($item);
  }
}`} lineProps={{3: {className: "lazy-code-line lazy-code-line--red", style: {
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
      <PhpCode tone="green">
        <span className="lazy-code-line lazy-code-line--green"><PhpTokens code={`$orders = $orderRepository`} /></span>
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

const DoctrineTransactionImplicit = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const trace = ['BEGIN', 'INSERT', 'INSERT', 'COMMIT'];

  return (
    <div className="transaction-implicit-layout">
      <PhpCode tone="green"><PhpLines code={`$em->persist($order);
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
    {code: '2 × flush()', text: 'общий rollback', tone: 'purple'},
    {code: 'PESSIMISTIC_WRITE', text: 'нужна active transaction', tone: 'amber'},
    {code: 'REPEATABLE_READ', text: 'изоляция всей операции', tone: 'cyan'},
  ];

  return (
    <div className="transaction-explicit-layout">
      <PhpCode tone="green"><PhpLines code={`$conn->transactional(
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
    <PhpCode tone="green"><PhpLines code={`final class Order
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
    {name: 'Service A / DB A', id: '…7cc3-98c4…', tone: 'purple'},
    {name: 'Service B / DB B', id: '…7a15-a4e2…', tone: 'cyan'},
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
}: {
  format: Format;
  slideId: string;
}) => {
  const slide = reviewSlides.find((candidate) => candidate.id === slideId) ?? defaultReviewSlide;

  if (slide.pattern === 'question') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'interviewer'} counter={slide.counter} question="" showHeader={false}>
        <div className="rr-question">
          <span>Вопрос {slide.counter} из {TOTAL_QUESTIONS}</span>
          <h1>{slide.title}</h1>
        </div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'enum') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--enum">
          <EnumComparison />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'di-graph' || slide.pattern === 'di-compile') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className={`rr-slide rr-slide--${slide.pattern}`}>
          {slide.badge && <div className="rr-badge">{slide.badge}</div>}
          {slide.pattern === 'di-graph' ? <DiObjectGraph /> : <DiCompileRuntime />}
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'decorator-code') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--decorator-code">
          <DecoratorCode />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'compiler-pass-code') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--compiler-pass-code">
          <CompilerPassCode />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      </InterviewShell>
    );
  }

  if (slide.id === '22-dto') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--dto-transfer"><DtoTransfer /></div>
      </InterviewShell>
    );
  }

  if (slide.id === '22-entity') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--rich-entity"><RichEntity /></div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'controller-code') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--controller-code">
          <ControllerReadCode />
          {slide.footer && <div className="rr-footer">{slide.footer}</div>}
        </div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'doctrine') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--doctrine">
          {slide.badge && <div className="rr-badge">{slide.badge}</div>}
          <DoctrineSlide slideId={slide.id} />
        </div>
      </InterviewShell>
    );
  }

  if (slide.pattern === 'uuid') {
    return (
      <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
        <div className="rr-slide rr-slide--uuid">
          {slide.badge && <div className="rr-badge">{slide.badge}</div>}
          <UuidSlide slideId={slide.id} />
        </div>
      </InterviewShell>
    );
  }

  return (
    <InterviewShell format={format} speaker={slide.speaker ?? 'mikhail'} counter={slide.counter} question={slide.title}>
      <div className={`rr-slide rr-slide--${slide.pattern ?? 'grid'}`}>
        {slide.badge && <div className="rr-badge">{slide.badge}</div>}
        <div className="rr-cards">
          {slide.cards?.map((card, index) => <CardView key={`${card.title}-${index}`} card={card} />)}
        </div>
        {slide.footer && <div className="rr-footer">{slide.footer}</div>}
      </div>
    </InterviewShell>
  );
};
