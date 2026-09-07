# Визуальный план вопроса 13 — «Как работают Unit of Work, persist, flush и clear?»

Статус: `APPROVED`  
Сложность: `L`  
Бюджет реализации после принятия: `40–60 минут`  
Shorts: `да — полноценный самостоятельный технический фрагмент`

## Источники и границы

- Учебный индекс: `questions.txt`, пункт 22.
- Транскрипт: `transcription.txt`, фрагмент `35:08–37:41`.
- Предварительные границы:
  - `35:08–35:16` — продолжается проблема связи;
  - `35:16–36:04` — вопрос интервьюера не сохранился в аудио/STT полностью;
  - `36:04–36:33` — Unit of Work и `persist()`;
  - `36:33–36:58` — `flush()` и change sets;
  - `36:58–37:32` — `clear()`, identity map и long-running batches;
  - с `37:32` начинается следующий вопрос.
- Технические источники:
  - [Doctrine ORM — Architecture](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/architecture.html);
  - [Doctrine ORM — Working with Objects](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/working-with-objects.html);
  - [Doctrine ORM — Batch Processing](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/batch-processing.html);
  - [Doctrine ORM — UnitOfWork Internals](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/unitofwork.html).
- Ремонт пропавшего голоса интервьюера выполняется отдельно от графики.
  Вопрос показывается обычной карточкой.

## Аудит содержания

| Тезис | Где прозвучал | Оценка | Действие на экране |
|---|---|---|---|
| Doctrine отслеживает состояние entities | 36:04–36:14 | корректно | показать Unit of Work и entity states |
| `persist()` добавляет новую entity в Unit of Work | 36:14–36:19 | корректно в общих чертах | показать NEW → MANAGED/scheduled |
| При `persist()` Doctrine может сходить за sequence ID | 36:19–36:33 | зависит от generator strategy; на ID нельзя полагаться до successful flush | уточнить без глубокого разбора генераторов |
| `flush()` считает изменения и пишет их одной транзакцией | 36:33–36:58 | корректное ядро, порядок/число SQL не гарантированы | показать change sets → SQL → transaction |
| `flush()` очищает Unit of Work | 36:44–36:58 | вводит в заблуждение: entities остаются managed и в identity map | явно исправить `flush() ≠ clear()` |
| `clear()` очищает identity map | 36:58–37:07 | корректно; точнее — detaches all entities | показать переход MANAGED → DETACHED |
| `clear()` полезен в long-running обработке для памяти | 37:07–37:41 | корректно | показать batch loop `flush(); clear();` |

### Что добавляем и исправляем

- `persist()` не выполняет немедленный `INSERT`; новая entity становится
  managed и будет синхронизирована при `flush()`.
- ID может появиться до `flush()`; после успешного `flush()` он гарантирован.
  Точный момент зависит от generator strategy, поэтому на ID нельзя
  рассчитывать после одного `persist()`.
- `flush()` вычисляет изменения и синхронизирует managed/new/removed entities с
  БД, но identity map остаётся; это не эквивалент `clear()`.
- В `onFlush` рассчитанный change set читается через
  `getEntityChangeSet()`. Если listener создаёт новую mapped entity, одного
  `persist()` недостаточно: её change set надо вычислить явно.
- `clear()` отсоединяет все entities от EntityManager, поэтому последующие
  изменения этих объектов уже не попадут в БД автоматически.

### Намеренно не показываем

- Внутренний commit order и редко используемые entity states.
- Различия sequence/identity/custom ID generators — оставляем только безопасное
  правило о generated ID.
- Cascade persist, orphanRemoval и partial clear.
- Следующий вопрос о частоте `flush()` — это отдельная редакционная единица.
- Монтажные сокращения повреждённого участка.

## Задача визуализации

Показать жизненный цикл одной entity и убрать ключевое смешение: `flush()`
пишет изменения, `clear()` отсоединяет объекты и освобождает identity map.

## Состояния и тайминг

| Состояние | Таймкод | Функция экрана | Паттерн |
|---|---|---|---|
| Базовый экран | `35:08–35:59` | не иллюстрировать технически разговор о связи | Base scene |
| 1. Вопрос | `35:59–36:04` | показать постановку вопроса | Question |
| 2. Unit of Work и persist | `36:04–36:33` | показать state transition без SQL | State flow |
| 3a. onFlush | `36:33–36:43` | показать реальный change set и его формат | Code + output |
| 3b. AuditLog в onFlush | `36:43–36:51` | показать `persist()` + `computeChangeSet()` | Code + steps |
| 3c. После flush | `36:51–36:58` | исправить смешение `flush()` и `clear()` | Before/after correction |
| 4a. clear | `36:58–37:07` | показать `MANAGED → DETACHED` | Code + state flow |
| 4b. clear в batch | `37:07–37:32` | показать освобождение Identity Map | Code + memory state |

```mermaid
flowchart LR
  B["Связь · базовый экран"] --> Q["1 · Вопрос"]
  Q --> P["2 · persist"]
  P --> F1["3a · onFlush"]
  F1 --> F2["3b · AuditLog"]
  F2 --> F3["3c · результат flush"]
  F3 --> C1["4a · clear"]
  C1 --> C2["4b · batch"]
```

## Состояние 1 — вопрос

### Wireframe 16:9

```text
┌──────────────────────────────────────────────────────────────┐
│ 13/32                                                        │
│ Как в Doctrine работают                                     │
│ Unit of Work, persist, flush и clear?                        │
├──────────────────────────────┬───────────────────────────────┤
│ Михаил · слушает             │ Интервьюер · говорит          │
└──────────────────────────────┴───────────────────────────────┘
```

### Wireframe 9:16

```text
┌──────────────────────────────┐
│ 13/32                        │
│ Unit of Work                │
│ persist · flush · clear     │
│ Как это работает?           │
├──────────────────────────────┤
│ Михаил        Интервьюер     │
└──────────────────────────────┘
```

## Состояние 2 — `persist()` регистрирует, но не пишет

### Wireframe 16:9

```text
┌──────────────────────────────────────────────────────────────┐
│ 13/32  Unit of Work · persist()                              │
├───────────────────────┬──────────────────────────────────────┤
│ $uow = $em->getUnitOfWork(); │ ENTITY STATE                  │
│ getEntityState($user)        │ NEW ─ persist($user) → MANAGED│
│   === STATE_NEW;             │ scheduled: INSERT             │
│ $em->persist($user);         │                               │
│ getEntityState($user)        │ SQL-запросов: 0               │
│   === STATE_MANAGED;         │ persist только регистрирует   │
├───────────────────────┴──────────────────────────────────────┤
│ ID может появиться до flush; после successful flush гарантирован│
├──────────────────────────────────────────────────────────────┤
│ Михаил · говорит                      Интервьюер · слушает  │
└──────────────────────────────────────────────────────────────┘
```

### Wireframe 9:16

```text
┌──────────────────────────────┐
│ 13/32 · persist()           │
├──────────────────────────────┤
│ getEntityState($user)       │
│   === STATE_NEW             │
│ persist($user)              │
│ getEntityState($user)       │
│   === STATE_MANAGED         │
├──────────────────────────────┤
│ NEW                        │
│  ↓ persist                 │
│ MANAGED · scheduled        │
├──────────────────────────────┤
│ SQL-запросов: 0            │
│ ID: гарантирован после flush│
├──────────────────────────────┤
│ Михаил        Интервьюер     │
└──────────────────────────────┘
```

## Состояние 3a — читаем change set в `onFlush`

### Wireframe 16:9

```text
┌──────────────────────────────────────────────────────────────┐
│ 13/32  onFlush: читаем рассчитанные изменения               │
├──────────────────────────────────────────────────────────────┤
│ $uow->getScheduledEntityUpdates() │ [                       │
│ $uow->getEntityChangeSet($entity) │  'email' => [           │
│                                   │   0 => old@example.com  │
│                                   │   1 => new@example.com  │
│                                   │  ]                      │
│                                   │ ]                       │
├──────────────────────────────────────────────────────────────┤
│ Михаил · говорит                      Интервьюер · слушает  │
└──────────────────────────────────────────────────────────────┘
```

### Wireframe 9:16

```text
┌──────────────────────────────┐
│ 13/32 · onFlush            │
├──────────────────────────────┤
│ getScheduledEntityUpdates()│
│ getEntityChangeSet()       │
├──────────────────────────────┤
│ email:                     │
│ 0 · old → old@example.com  │
│ 1 · new → new@example.com  │
├──────────────────────────────┤
│ Михаил        Интервьюер     │
└──────────────────────────────┘
```

## Состояние 3b — новая entity внутри `onFlush`

Показываем воспроизводимый listener-кейс: создаём `AuditLog`, регистрируем его
через `persist()` и явно вызываем `computeChangeSet()` с metadata, чтобы mapped
changes новой entity вошли в текущий flush.

```php
$auditLog = AuditLog::from($entity, $changes);
$em->persist($auditLog);
$metadata = $em->getClassMetadata(AuditLog::class);
$uow->computeChangeSet(
    $metadata, $auditLog,
);
```

## Состояние 3c — результат `flush()`

- Крупное исправление: `Обработанные change sets очищены, но managed entities
  остаются`.
- Очищено: `entityChangeSets: []`, `scheduledUpdates: []`.
- Сохранено: `User#42: MANAGED`, `Identity Map: сохранена`.
- Вывод: `flush()` синхронизирует с БД, `clear()` отсоединяет объекты.

## Состояние 4a — `clear()` отсоединяет

### Wireframe 16:9

```text
┌──────────────────────────────────────────────────────────────┐
│ 13/32  clear() отсоединяет entities                          │
├──────────────────────────────┬───────────────────────────────┤
│ $em->contains($user); // true │ MANAGED                     │
│ $em->clear();                │          → DETACHED           │
│ $em->contains($user); // false│ Identity Map → empty        │
├──────────────────────────────────────────────────────────────┤
│ Михаил · говорит                      Интервьюер · слушает  │
└──────────────────────────────────────────────────────────────┘
```

### Wireframe 9:16

```text
┌──────────────────────────────┐
│ 13/32 · clear()             │
├──────────────────────────────┤
│ contains($user) // true    │
│ clear()                    │
│ contains($user) // false   │
├──────────────────────────────┤
│ MANAGED → DETACHED         │
│ Identity Map → empty       │
├──────────────────────────────┤
│ Михаил        Интервьюер     │
└──────────────────────────────┘
```

## Состояние 4b — long-running batch

```php
foreach ($rows as $i => $row) {
    process($row);
    if ($i % 100 === 0) {
        $em->flush();
        $em->clear();
    }
}
```

Рядом Identity Map проходит путь `100 managed entities → flush() → clear() →
empty`; это объясняет пользу для памяти без повторного разбора механики карты.

## Финальный экранный текст

| Элемент | Текст |
|---|---|
| persist | `NEW → MANAGED · SQL ещё нет` |
| onFlush | `getEntityChangeSet(): field => [0 => old, 1 => new]` |
| Audit listener | `persist($auditLog) + computeChangeSet(...)` |
| Исправление | `Change sets очищены, managed entities остаются` |
| clear | `Detach всех entities · очистить identity map` |
| Batch | `flush(); clear();` |

## Анимация

- В `persist()` entity перемещается из NEW в MANAGED, а SQL-индикатор остаётся
  пустым.
- В `flush()` последовательно показываются listener, создание `AuditLog` и
  итоговое состояние Unit of Work.
- В `clear()` карточки выходят из identity map и меняют статус на DETACHED.

## Shorts

- Хук: `persist, flush и clear — три разных действия`.
- Вертикальный порядок: вопрос → persist → flush → clear.
- Обязательно сохранить исправление про очищенные change sets и оставшиеся
  managed entities.
- Вторичный текст о generated ID можно убрать, если не помещается без уменьшения.

## Материалы и производство

- Нужны переиспользуемые state cards и identity-map container; уникальная
  иллюстрация не требуется.
- Код: реальные вызовы `getEntityState()`, `getEntityChangeSet()`,
  `computeChangeSet()`, `contains()` и compact batch loop.
- SVG: стрелки переходов состояния.
- Исправление на экране: `flush() ≠ clear(); entities остаются managed`.
- Ремонт звука выполняется отдельно и не маркируется на слайде.

## Ревью

- [x] Повреждение звука не влияет на экранную графику.
- [x] `persist`, `flush`, `clear` проверены по Doctrine Docs.
- [x] Существенная ошибка ответа вынесена в крупное исправление.
- [x] Следующий вопрос про частоту flush не смешан с этим.
- [x] 16:9 и 9:16 спроектированы отдельно.
- [ ] Точная формулировка и вход вопроса проверены по исходному видео.
- [x] Принято пользователем до начала кода.
