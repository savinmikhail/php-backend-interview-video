import type {ReactNode} from 'react';
import {InterviewShell, type Format} from './InterviewShell';
import {TOTAL_QUESTIONS, type Speaker} from './timeline';

type Tone = 'purple' | 'cyan' | 'green' | 'amber' | 'red';
type Pattern = 'question' | 'columns' | 'grid' | 'flow' | 'stack' | 'enum' | 'di-graph' | 'di-compile' | 'decorator-code';

type Card = {
  label?: string;
  title: string;
  lines?: string[];
  code?: string[];
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
): ReviewSlideDefinition => ({id, counter, title, pattern, cards, footer, badge, speaker: 'mikhail'});

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
    {label: 'AUTO', title: 'Одна object-зависимость', code: ['LoggerInterface $logger'], tone: 'green'},
    {label: 'EXPLICIT', title: 'Несколько реализаций', code: ['PaymentGatewayInterface → ?'], tone: 'amber'},
    {label: 'EXPLICIT', title: 'Scalar / config value', code: ['string $dsn', 'int $timeout'], tone: 'amber'},
    {label: 'EXPLICIT', title: 'Factory или особая сборка', lines: ['Нужен контекст создания'], tone: 'purple'},
  ], 'И учитываем соглашения существующего проекта'),

  q('09-question', '9', 'Event Subscriber · Middleware · Decorator — что это?'),
  s('09-subscriber', '9', 'Event Subscriber сам объявляет подписки', 'flow', [
    {label: 'Subscriber', title: 'getSubscribedEvents()', code: ['OrderPaid::class', 'KernelEvents::REQUEST'], tone: 'purple'},
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

  s('11-question', '11', 'Когда нужен свой consumer?', 'columns', [
    {label: 'Гипотеза', title: '«Ради manual ack»', lines: ['Но ack доступен и в pull, и в push'], tone: 'red'},
    {label: 'Настоящий критерий', title: 'Нужен другой runtime', lines: ['Lifecycle · topology · протокол'], tone: 'green'},
  ], 'Способ доставки и гарантия подтверждения — разные решения', 'Исправление'),
  s('11-pull-push', '11', 'RabbitMQ: pull и push', 'columns', [
    {label: 'basic.get', title: 'Pull', lines: ['Клиент запрашивает следующее сообщение', 'Manual ack доступен'], tone: 'purple'},
    {label: 'basic.consume', title: 'Push', lines: ['Broker доставляет живому consumer', 'Manual ack доступен'], tone: 'cyan'},
  ]),
  s('11-symfony', '11', 'Transport, broker и process manager', 'flow', [
    {label: 'Process manager', title: 'Запускает и перезапускает worker', lines: ['memory/time limits — lifecycle'], tone: 'purple'},
    {label: 'Symfony receiver', title: 'Получает сообщения', lines: ['AMQP transport не вызывает blocking consume()'], tone: 'amber'},
    {label: 'RabbitMQ', title: 'Хранит и доставляет', lines: ['Consumer в UI зависит от режима'], tone: 'cyan'},
  ], 'Broker не «будит» остановленный PHP-процесс', 'Исправление ответа'),
  s('11-custom', '11', 'Когда расширять стандартный consumer', 'stack', [
    {title: '1 · Оставить стандартный handler', lines: ['Если отличается только бизнес-обработка'], tone: 'green'},
    {title: '2 · Настроить transport', lines: ['Routing · retry · topology'], tone: 'cyan'},
    {title: '3 · Свой runtime / transport', lines: ['Только если стандартные lifecycle и protocol не подходят'], tone: 'amber'},
  ]),

  s('12-question', '12', 'Что такое Compiler Pass в Symfony?', 'stack', [
    {label: 'Повреждён звук интервьюера', title: 'Вопрос восстановлен текстом', lines: ['Ответ и исходная атмосфера сохранены'], tone: 'amber'},
  ]),
  s('12-compile', '12', 'Compiler Pass меняет definitions при сборке', 'flow', [
    {title: 'Tagged services', code: ['app.consumer'], tone: 'purple'},
    {title: 'process(ContainerBuilder)', lines: ['найти · проверить · связать'], tone: 'amber'},
    {title: 'Modified definitions', lines: ['registry / topology'], tone: 'cyan'},
    {title: 'Compiled container', tone: 'green'},
  ], 'Точка расширения compilation контейнера', 'Уточнение ответа'),

  s('13-question', '13', 'Unit of Work: persist, flush и clear', 'stack', [
    {label: 'Повреждён звук интервьюера', title: 'Вопрос восстановлен текстом', lines: ['Что делает каждый вызов и как меняются entity states'], tone: 'amber'},
  ]),
  s('13-persist', '13', 'persist() регистрирует entity', 'flow', [
    {label: 'Entity state', title: 'NEW', tone: 'purple'},
    {label: 'persist()', title: 'Unit of Work', lines: ['запланировать insert'], tone: 'amber'},
    {label: 'После регистрации', title: 'MANAGED', lines: ['SQL ещё не выполнен'], tone: 'green'},
  ], 'ID до успешного flush зависит от generator strategy'),
  s('13-flush', '13', 'flush() синхронизирует Unit of Work с БД', 'flow', [
    {title: 'Managed entities', tone: 'purple'},
    {title: 'Compute change sets', tone: 'amber'},
    {title: 'SQL', lines: ['INSERT · UPDATE · DELETE'], tone: 'cyan'},
    {title: 'Transaction', tone: 'green'},
  ], <><strong>flush() ≠ clear()</strong> · entities остаются managed</>, 'Исправление ответа'),
  s('13-clear', '13', 'clear() отсоединяет entities', 'columns', [
    {label: 'До clear()', title: 'Identity Map', lines: ['Entity A · Entity B · Entity C', 'MANAGED'], tone: 'purple'},
    {label: 'После clear()', title: 'Пустой EntityManager', lines: ['Все entities → DETACHED'], tone: 'cyan'},
  ], <code>batch: flush(); clear();</code>),

  q('14-question', '14', 'Почему flush обычно вызывают один раз?'),
  s('14-boundary', '14', 'Одна осмысленная граница записи', 'flow', [
    {title: 'Unit of Work', lines: ['накапливает изменения'], tone: 'purple'},
    {title: 'flush()', lines: ['вычисляет change sets'], tone: 'amber'},
    {title: 'Одна transaction', lines: ['синхронизация с БД'], tone: 'green'},
  ], 'Один flush — разумный default, но не запрет на несколько'),

  s('15-lazy', '15', 'Lazy loading: relation загружается по обращению', 'flow', [
    {title: 'Order loaded', code: ['$order'], tone: 'purple'},
    {title: 'Relation proxy', code: ['$order->items'], lines: ['SQL пока нет'], tone: 'amber'},
    {title: 'Первое обращение', lines: ['SELECT items …'], tone: 'cyan'},
  ], 'Плюс: не загружаем то, чем не воспользовались'),
  s('15-n-plus-one', '15', 'Главный риск — N+1', 'columns', [
    {label: 'Lazy в цикле', title: '1 query + N queries', code: ['SELECT orders', 'foreach → SELECT items'], tone: 'red'},
    {label: 'Если relation нужна', title: 'Fetch join / eager query', code: ['orders JOIN items'], tone: 'green'},
  ]),
  s('15-extra-lazy', '15', 'EXTRA_LAZY для больших коллекций', 'columns', [
    {label: 'Обычная коллекция', title: 'count() может загрузить всё', lines: ['Много объектов в память'], tone: 'red'},
    {label: 'EXTRA_LAZY', title: 'count() отдельным SQL', code: ['SELECT COUNT(*) …'], lines: ['Collection не инициализируется целиком'], tone: 'green'},
  ]),

  s('16-implicit', '16', 'Когда нужны явные транзакции?', 'columns', [
    {label: 'Implicit', title: 'Один flush()', lines: ['Doctrine открывает transaction', 'пишет изменения · commit'], tone: 'green'},
    {label: 'Default', title: 'Одна Unit of Work', lines: ['Дополнительный transaction API не нужен'], tone: 'purple'},
  ]),
  s('16-explicit', '16', 'Явная граница нужна для общей атомарности', 'grid', [
    {title: 'ORM + DBAL SQL', tone: 'cyan'},
    {title: 'Несколько flush()', tone: 'purple'},
    {title: 'Pessimistic lock', tone: 'amber'},
    {title: 'Несколько шагов как одно целое', tone: 'green'},
  ]),
  s('16-correction', '16', 'Критерий — атомарность операции', 'columns', [
    {label: 'Не критерий', title: 'SQL против DQL', lines: ['Язык запроса не задаёт границу'], tone: 'red'},
    {label: 'Критерий', title: 'Что должно commit / rollback вместе?', lines: ['Граница бизнес-операции'], tone: 'green'},
  ], undefined, 'Исправление ответа'),

  q('17-question', '17', 'UUID или автоинкремент?'),
  s('17-size', '17', 'Размер и локальность ключа', 'columns', [
    {label: 'INTEGER / BIGINT', title: '4 / 8 bytes', lines: ['Компактный, последовательный', 'Sequence живёт в одной БД'], tone: 'green'},
    {label: 'UUID', title: '16 bytes', lines: ['Больше индекс и foreign keys', 'Случайный UUID хуже для locality'], tone: 'purple'},
  ], 'UUID = 128 bit = 16 bytes', 'Исправление ответа'),
  s('17-before-db', '17', 'ID можно получить до записи в БД', 'flow', [
    {title: 'Application', code: ['$id = Uuid::v7();'], tone: 'purple'},
    {title: 'Entity / Event', lines: ['ID уже известен'], tone: 'cyan'},
    {title: 'Database', lines: ['INSERT позже'], tone: 'green'},
  ], 'UUIDv7 — time-ordered идентификатор'),
  s('17-distributed', '17', 'Независимые генераторы не делят sequence', 'grid', [
    {title: 'Service A', code: ['0198…a1'], tone: 'purple'},
    {title: 'Service B', code: ['0198…f7'], tone: 'cyan'},
    {title: 'Offline client', code: ['0198…3c'], tone: 'amber'},
    {title: 'Merge', lines: ['Глобальная координация не нужна'], tone: 'green'},
  ]),

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
  s('18-forms', '18', 'Форма индекса — не новый access method', 'grid', [
    {title: 'Multicolumn', code: ['(tenant_id, created_at)'], tone: 'purple'},
    {title: 'INCLUDE', lines: ['covering index'], tone: 'cyan'},
    {title: 'Partial', code: ["WHERE status = 'active'"], tone: 'amber'},
  ], 'Сначала запрос и EXPLAIN, затем структура индекса', 'Уточнение ответа'),

  q('19-question', '19', 'Что такое чистая архитектура?'),
  s('19-rule', '19', 'Зависимости исходного кода направлены внутрь', 'stack', [
    {label: 'Внешние детали', title: 'Web · DB · Framework', lines: ['Могут зависеть от внутренних контрактов'], tone: 'cyan'},
    {label: 'Adapters', title: 'Controllers · gateways · presenters', tone: 'purple'},
    {label: 'Ядро', title: 'Business rules', lines: ['Не знает о внешних деталях'], tone: 'green'},
  ], 'Граница нужна ради направления зависимостей, а не ради папок'),

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

  s('21-direct', '21', 'Контроллер технически может вызвать репозиторий', 'flow', [
    {title: 'Controller', tone: 'purple'},
    {title: 'Repository', tone: 'cyan'},
    {title: 'Response', tone: 'green'},
  ], 'Плюс: меньше ceremony для простого чтения'),
  s('21-boundary', '21', 'Но единая application boundary удерживает правила', 'flow', [
    {title: 'HTTP · CLI · Consumer', tone: 'purple'},
    {title: 'Application Service', lines: ['authz · transaction · orchestration'], tone: 'amber'},
    {title: 'Repository', tone: 'cyan'},
  ], 'Это командное архитектурное решение, а не запрет Symfony'),

  s('22-entity', '22', 'Entity — не просто ORM-объект', 'stack', [
    {label: 'ENTITY', title: 'Identity + lifecycle + invariants', code: ['Order #42', 'status: Paid'], lines: ['Поведение защищает допустимые переходы'], tone: 'purple'},
  ]),
  s('22-dto', '22', 'DTO переносит данные через границу', 'flow', [
    {title: 'HTTP request', tone: 'purple'},
    {title: 'CreateOrderDto', code: ['customerId · items'], tone: 'cyan'},
    {title: 'Application', tone: 'green'},
  ], 'DTO не обязан иметь identity и lifecycle'),
  s('22-correction', '22', 'Не определяем тип по случайным признакам', 'columns', [
    {label: 'Entity', title: 'Не обязана быть mutable или ORM', lines: ['Главное — identity и lifecycle'], tone: 'purple'},
    {label: 'DTO', title: 'Не обязан быть readonly', lines: ['Главное — перенос данных'], tone: 'cyan'},
  ], undefined, 'Уточнение ответа'),

  q('23-question', '23', 'Как выделять модули, связывать их и деплоить?'),
  s('23-boundary', '23', 'Хорошая граница модуля', 'columns', [
    {label: 'Внутри', title: 'Высокая cohesion', lines: ['Связанные бизнес-правила рядом'], tone: 'purple'},
    {label: 'Снаружи', title: 'Низкая coupling', lines: ['Маленький стабильный контракт'], tone: 'cyan'},
  ]),
  s('23-deployment', '23', 'Логическая граница не диктует deployment', 'columns', [
    {title: 'Module', lines: ['Граница модели и ownership'], tone: 'purple'},
    {title: 'Microservice', lines: ['Независимый процесс и deployment'], tone: 'amber'},
  ], 'Module ≠ microservice', 'Уточнение ответа'),
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
    {title: 'DHLCarrier вместо Carrier', code: ['ship(Carrier $carrier)', '$carrier->deliver($parcel)'], lines: ['Клиентский код не ломается'], tone: 'green'},
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
    {card.code && <pre><code>{card.code.join('\n')}</code></pre>}
    {card.lines?.map((line) => <p key={line}>{line}</p>)}
  </article>
);

const EnumComparison = () => (
  <div className="enum-comparison">
    <article className="enum-card enum-card--string">
      <div className="enum-card__label">Открытая строка · weak mode</div>
      <h2>Пропускает лишнее</h2>
      <pre className="enum-card__definition"><code><span className="syntax-keyword">function</span> <span className="syntax-name">changeStatus</span>(<span className="syntax-type">string</span> <span className="syntax-variable">$status</span>): <span className="syntax-type">void</span> {'{}'}</code></pre>
      <div className="enum-examples">
        <div className="enum-example enum-example--warning">
          <code><span className="syntax-name">changeStatus</span>(<span className="syntax-number">0</span>);</code>
          <span><code><span className="syntax-variable">$status</span> === <span className="syntax-string">'0'</span></code></span>
        </div>
        <div className="enum-example enum-example--warning">
          <code><span className="syntax-name">changeStatus</span>(<span className="syntax-string">'canceled'</span>);</code>
          <span>опечатка принята</span>
        </div>
      </div>
    </article>

    <article className="enum-card enum-card--typed">
      <div className="enum-card__label">Закрытый тип</div>
      <h2>Типобезопасный набор</h2>
      <pre className="enum-card__definition"><code><span className="syntax-keyword">enum</span> <span className="syntax-type">OrderStatus</span>: <span className="syntax-type">string</span> {'{'}{`\n`}  <span className="syntax-keyword">case</span> <span className="syntax-name">Paid</span> = <span className="syntax-string">'paid'</span>;{`\n`}  <span className="syntax-keyword">case</span> <span className="syntax-name">Cancelled</span> = <span className="syntax-string">'cancelled'</span>;{`\n`}{'}'}</code></pre>
      <div className="enum-examples">
        <div className="enum-example enum-example--error">
          <code><span className="syntax-name">changeStatus</span>(<span className="syntax-number">0</span>);</code>
          <span>TypeError</span>
        </div>
        <div className="enum-example enum-example--error">
          <code><span className="syntax-type">OrderStatus</span>::<span className="syntax-name">from</span>(<span className="syntax-string">'canceled'</span>);</code>
          <span>ValueError</span>
        </div>
      </div>
    </article>
  </div>
);

const DiObjectGraph = () => (
  <div className="di-graph-layout">
    <pre className="di-source-code"><code><span className="syntax-keyword">final class</span> <span className="syntax-type">Checkout</span>{`\n`}{'{'}{`\n`}  <span className="syntax-keyword">public function</span> <span className="syntax-name">__construct</span>({`\n`}    <span className="syntax-keyword">private</span> <span className="syntax-type">PaymentGatewayInterface</span> <span className="syntax-variable">$gateway</span>,{`\n`}    <span className="syntax-keyword">private</span> <span className="syntax-type">LoggerInterface</span> <span className="syntax-variable">$logger</span>,{`\n`}  ) {'{}'}{`\n`}{'}'}</code></pre>

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
        <code><span className="syntax-keyword">new</span> <span className="syntax-type">Checkout</span>(<span className="syntax-variable">$gateway</span>, <span className="syntax-variable">$logger</span>)</code>
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
        <code><span className="syntax-keyword">return new</span> <span className="syntax-type">Checkout</span>({`\n`}  <span className="syntax-variable">$this</span>-&gt;<span className="syntax-name">getStripeGatewayService</span>(),{`\n`}  <span className="syntax-variable">$this</span>-&gt;<span className="syntax-name">getLoggerService</span>(),{`\n`});</code>
      </article>
      <div className="di-runtime-result">
        <strong>reuse</strong>
        <span>без повторного разбора definitions</span>
      </div>
    </section>
  </div>
);

const DecoratorCode = () => (
  <pre className="decorator-code"><code>
    <span><span className="syntax-keyword">final class</span> <span className="syntax-type">MetricsGateway</span> <span className="syntax-keyword">implements</span> <span className="syntax-type">PaymentGatewayInterface</span></span>
    <span>{'{'}</span>
    <span className="code-line--indent-1"><span className="syntax-keyword">public function</span> <span className="syntax-name">__construct</span>(</span>
    <span className="code-line--indent-2"><span className="syntax-keyword">private</span> <span className="syntax-type">PaymentGatewayInterface</span> <span className="syntax-variable">$inner</span>,</span>
    <span className="code-line--indent-2"><span className="syntax-keyword">private</span> <span className="syntax-type">Metrics</span> <span className="syntax-variable">$metrics</span>,</span>
    <span className="code-line--indent-1">) {'{}'}</span>
    <span className="code-line--indent-1"><span className="syntax-keyword">public function</span> <span className="syntax-name">pay</span>(<span className="syntax-type">Money</span> <span className="syntax-variable">$amount</span>): <span className="syntax-type">Receipt</span></span>
    <span className="code-line--indent-1">{'{'}</span>
    <span className="code-line--indent-2"><span className="syntax-variable">$this</span>-&gt;<span className="syntax-name">metrics</span>-&gt;<span className="syntax-name">start</span>(); <span className="syntax-comment">// до</span></span>
    <span className="code-line--indent-2"><span className="syntax-variable">$receipt</span> = <span className="syntax-variable">$this</span>-&gt;<span className="syntax-name">inner</span>-&gt;<span className="syntax-name">pay</span>(<span className="syntax-variable">$amount</span>); <span className="syntax-comment">// делегирование</span></span>
    <span className="code-line--indent-2"><span className="syntax-variable">$this</span>-&gt;<span className="syntax-name">metrics</span>-&gt;<span className="syntax-name">success</span>(); <span className="syntax-comment">// после</span></span>
    <span className="code-line--indent-2"><span className="syntax-keyword">return</span> <span className="syntax-variable">$receipt</span>;</span>
    <span className="code-line--indent-1">{'}'}</span>
    <span>{'}'}</span>
  </code></pre>
);

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
