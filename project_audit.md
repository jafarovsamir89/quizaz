# 🔍 Bilik Arena — Полный Аудит Проекта

> **Дата:** 15 мая 2026  
> **Версия:** MVP Pre-Beta  
> **Стек:** NestJS + Prisma + PostgreSQL / Vite + React + TypeScript

---

## Содержание

1. [Критические баги (блокеры)](#1-критические-баги-блокеры)
2. [Баги среднего приоритета](#2-баги-среднего-приоритета)
3. [Архитектурные проблемы](#3-архитектурные-проблемы)
4. [Безопасность](#4-безопасность)
5. [Дизайн и UX](#5-дизайн-и-ux)
6. [Недостающий функционал (что нужно сделать)](#6-недостающий-функционал)
7. [Инфраструктура и DevOps](#7-инфраструктура-и-devops)
8. [Контент и данные](#8-контент-и-данные)
9. [Производительность](#9-производительность)
10. [План приоритетов](#10-план-приоритетов)

---

## 1. Критические Баги (Блокеры)

### 1.1 🔴 SQL-инъекции в бекенде

**Файлы:** [games.service.ts](file:///c:/quizaz/backend/src/games/games.service.ts#L21-L30), [leaderboards.service.ts](file:///c:/quizaz/backend/src/leaderboards/leaderboards.service.ts#L76-L91), [questions.service.ts](file:///c:/quizaz/backend/src/questions/questions.service.ts#L46-L60)

Проект использует `$queryRawUnsafe` с конкатенацией пользовательских данных в SQL-запросы. Это **самая критическая уязвимость**:

```typescript
// games.service.ts:21-29 — categoryId и difficulty подставляются без параметризации
const whereStr = Object.entries(whereClause)
  .map(([k, v]) => `"${k}" = ${typeof v === 'string' ? `'${v}'` : v}`)
  .join(' AND ');
const questions = await this.prisma.$queryRawUnsafe(`
  SELECT ... FROM "Question" WHERE ${whereStr} ORDER BY RANDOM() LIMIT ${limit}
`);

// leaderboards.service.ts:90 — userId подставляется напрямую!
`...WHERE "userId" = '${userId}'`

// leaderboards.service.ts:46 — cityId подставляется без параметризации
if (cityId) whereClauses.push(`u."cityId" = ${cityId}`);
```

> [!CAUTION]
> Злоумышленник может выполнить произвольный SQL-запрос через `categoryId`, `userId`, `cityId`. Это позволяет читать, изменять и удалять любые данные в базе.

**Решение:** Использовать `$queryRaw` с параметризованными запросами или Prisma ORM-методы.

---

### 1.2 🔴 DuelGamePage: Stale Closure + Double Submit

**Файл:** [DuelGamePage.tsx](file:///c:/quizaz/frontend/src/pages/DuelGamePage.tsx#L46-L69)

В отличие от исправленного `SoloGamePage`, `DuelGamePage` **всё ещё** содержит баг stale closure в таймере (строка 36: `handleAnswer` захватывается замыканием) и не имеет `isAnsweringRef` для защиты от двойного клика.

```diff
- const handleAnswer = async (option: string | null, finalTime?: number) => {
-   if (feedback) return;  // ← Единственная защита. Не работает при быстром клике до обновления state
+ const handleAnswer = useCallback(async (...) => {
+   if (isAnsweringRef.current) return;
+   isAnsweringRef.current = true;
```

---

### 1.3 🔴 Mock-токены в продакшен-коде

**Файл:** [firebase.service.ts](file:///c:/quizaz/backend/src/auth/firebase.service.ts#L25-L35)

Бекенд принимает токены вида `dev-token-*` без какой-либо проверки. Если этот код попадёт в продакшен, **любой человек** может отправить `Authorization: Bearer dev-token-admin-hack` и получить доступ как этот пользователь.

```typescript
if (token.startsWith('dev-token-')) {
  const uid = token.split('dev-token-')[1];
  return { uid, ... } as any;  // ← Нет проверки NODE_ENV!
}
```

**Решение:** Обернуть в `if (process.env.NODE_ENV !== 'production')`.

---

### 1.4 🔴 Ответ на вопрос "после 10 секунд" засчитывается как правильный

**Файл:** [games.service.ts](file:///c:/quizaz/backend/src/games/games.service.ts#L79)

```typescript
const isCorrect = question.correctOption === selectedOption && timeSpentMs <= 10000;
```

Если `timeSpentMs === 10000` (таймер кончился), ответ засчитывается как верный при правильном варианте. Но на фронтенде при истечении времени отправляется `selectedOption: 'none'` — это правильно. **Однако** клиент может отправить правильный ответ с `timeSpentMs: 9999` через DevTools. Нужна серверная валидация по `startTime`.

---

## 2. Баги Среднего Приоритета

### 2.1 🟡 DuelWaitingPage показывает неправильный счёт

**Файл:** [DuelWaitingPage.tsx](file:///c:/quizaz/frontend/src/pages/DuelWaitingPage.tsx#L38)

```typescript
{results?.initiatorScore || results?.opponentScore || 0}
```

Здесь нет учёта роли пользователя. Если пользователь — opponent, он увидит `initiatorScore` (счёт соперника), а не свой.

---

### 2.2 🟡 Нет обработки ошибок API на фронтенде

Почти все страницы вызывают API без отображения ошибки пользователю. Если сервер вернёт ошибку (500, 401, 409), пользователь увидит пустой экран или зависание.

**Затронутые страницы:** HomePage, SoloSetupPage, DuelsPage, LeaderboardsPage, ProfilePage.

---

### 2.3 🟡 Level-формула некорректна в транзакции

**Файл:** [games.service.ts](file:///c:/quizaz/backend/src/games/games.service.ts#L158)

```typescript
level: { set: Math.floor((xpEarned + ((await tx.user.findUnique({ where: { id: userId } }))?.xp || 0)) / 1000) + 1 },
```

Здесь выполняется `await` **внутри** объекта `data` метода `update`. Вложенный запрос выполняется **до** обновления XP (строка 156: `xp: { increment: xpEarned }`), что создаёт race condition. Level вычисляется на основе **старого** XP, а не нового.

---

### 2.4 🟡 Вопросы дуэли не перемешиваются корректно

**Файл:** [duels.service.ts](file:///c:/quizaz/backend/src/duels/duels.service.ts#L74)

```typescript
const sortedQuestions = duel.questionIds.map((id) => questions.find((q) => q.id === id));
```

`questions.find()` вернёт `undefined`, если вопрос был удалён/деактивирован после создания дуэли. Это приведёт к `null`-элементам в массиве и крашу фронтенда.

---

### 2.5 🟡 `correctOption` утекает на клиент в Solo Mode

**Файл:** [games.service.ts](file:///c:/quizaz/backend/src/games/games.service.ts#L49-L52)

```typescript
questions: questions.map((q) => {
  const { correctOption, ...rest } = q;
  return rest;
});
```

`$queryRawUnsafe` возвращает поля из `SELECT`, в котором `correctOption` **не запрашивается**. Однако в `questions.service.ts:55` используется `SELECT *` — в том запросе correctOption **утекает**. Непоследовательность — потенциальная дыра.

---

### 2.6 🟡 SoloGamePage: таймер продолжает тикать после навигации

Если пользователь нажмёт "назад" в браузере во время игры, таймер продолжит работать и вызовет `handleAnswer` на уже несуществующем компоненте. Нет cleanup при unmount для async-операций.

---

### 2.7 🟡 `PATCH /profile/me` принимает `any` без валидации

**Файл:** [users.controller.ts](file:///c:/quizaz/backend/src/users/users.controller.ts#L18)

```typescript
@Patch('me')
updateMe(@GetUser() user: User, @Body() updateData: any) {
```

Нет DTO-валидации. Хотя `UsersService.update` фильтрует опасные поля (`balanceCoins`, `xp`, `isAdmin`), это хрупкая защита — новые поля в схеме автоматически станут доступны для обновления.

---

## 3. Архитектурные Проблемы

### 3.1 Tailwind установлен как зависимость, но не настроен

**Файл:** [package.json](file:///c:/quizaz/frontend/package.json#L20)

Пакет `tailwind-merge` установлен, но Tailwind CSS **не настроен** (нет `tailwind.config.*`, нет `@tailwind` директив). Все страницы (DuelGamePage, DuelResultPage, DuelWaitingPage) используют Tailwind-классы (`flex-1`, `p-6`, `text-2xl`, `grid-cols-2`), которые работают только благодаря моему полифилу в `index.css`. **Это хрупкое решение.**

> [!IMPORTANT]
> Нужно принять решение: либо установить Tailwind полноценно, либо переписать все оставшиеся страницы на inline styles.

---

### 3.2 Непоследовательный стиль: половина страниц — inline styles, половина — Tailwind

Страницы `HomePage`, `SoloGamePage`, `SoloResultPage`, `CitySelectionPage`, `SoloSetupPage`, `ProfilePage`, `LeaderboardsPage`, `DuelsPage` переписаны на inline styles.

Страницы **DuelGamePage**, **DuelResultPage**, **DuelWaitingPage** **всё ещё** используют Tailwind-классы. Код неоднороден.

---

### 3.3 `cities` и `categories` лежат в AppController, а не в отдельном модуле

**Файл:** [app.controller.ts](file:///c:/quizaz/backend/src/app.controller.ts#L13-L23)

Эндпоинты `/cities` и `/categories` размещены в корневом контроллере без сервисного слоя. Нарушает принцип SRP и затрудняет тестирование.

---

### 3.4 Нет DTO/валидации для большинства эндпоинтов

Почти все Body-параметры в контроллерах принимаются как скалярные `@Body('field')` значения или `any`. Нет class-validator DTO для: `startSolo`, `submitAnswer`, `findOrCreate`, `sync`. `ValidationPipe` настроен в `main.ts`, но бесполезен без DTO.

---

### 3.5 Нет глобальной обработки ошибок

Нет `ExceptionFilter` для логирования ошибок. Если Prisma бросит unexpected error, клиент получит сырой стек-трейс с деталями базы данных.

---

## 4. Безопасность

| Проблема | Серьёзность | Файл |
|----------|-------------|------|
| SQL-инъекция через `$queryRawUnsafe` | 🔴 Критическая | games.service, leaderboards.service |
| Mock-токены без проверки `NODE_ENV` | 🔴 Критическая | firebase.service.ts |
| `CORS` разрешён для всех origin'ов (`enableCors()`) | 🟡 Средняя | main.ts |
| `GET /duels/:id` не проверяет принадлежность к дуэли | 🟡 Средняя | duels.controller.ts:23 |
| `PATCH /profile/me` принимает `any` | 🟡 Средняя | users.controller.ts |
| Нет rate-limiting | 🟡 Средняя | main.ts |
| `.env` файл не добавлен в `.gitignore` | 🟡 Средняя | .env |
| `$queryRawUnsafe` с `SELECT *` может утечь `correctOption` | 🟡 Средняя | questions.service.ts:55 |
| Нет HTTPS в продакшене | 🟡 Средняя | Инфраструктура |

---

## 5. Дизайн и UX

### 5.1 Что работает хорошо ✅
- Тёмная тема с gold/blue/violet акцентами
- Десктопная "рамка телефона" с glow-эффектом
- Glassmorphism-карточки
- Анимации появления (fade-in)
- Шрифт Outfit с правильными весами

### 5.2 Что нужно улучшить ⚠️

| Проблема | Описание |
|----------|----------|
| **Нет логотипа** | На splash-экране и в навбаре — только текст "Bilik Arena" |
| **Нет иконок PWA** | `pwa-192x192.png` и `pwa-512x512.png` не существуют (vite.config ссылается на них) |
| **Нет favicon** | Стандартный Vite favicon |
| **Нет звуковых эффектов** | Нет звука при правильном/неправильном ответе, нет тика таймера |
| **Нет вибрации** | На мобильных нет haptic feedback |
| **Empty state на HomePage** | Секция "Reytinq Cədvəli" показывает заглушку вместо реальных топ-3 |
| **Нет скелетонов загрузки** | При загрузке данных пользователь видит пустоту, а не skeleton |
| **Нет анимации переходов** | Между страницами нет slide/fade transition |
| **Нет pull-to-refresh** | На мобильных нет возможности обновить данные жестом |
| **Не отображаются аватары** | DiceBear URL генерируется, но нигде не используется в UI |

---

## 6. Недостающий Функционал

### 6.1 🔴 Необходимо для Closed Beta

| Функция | Статус | Описание |
|---------|--------|----------|
| **Firebase Production Auth** | ❌ Не настроен | Реальные Firebase ключи не добавлены |
| **Google Sign-In** | ❌ Только mock | `linkWithCredential` не реализован |
| **Объяснение ответа** | ❌ Не показывается | Бекенд возвращает `explanationAz`, но фронтенд его игнорирует |
| **История игр** | ❌ Нет UI | Нет страницы для просмотра прошлых сессий |
| **Статистика профиля** | ❌ Базовая | Нет сыгранных игр, точности, streak |
| **Редактирование никнейма** | ❌ Нет UI | Эндпоинт есть, UI нет |
| **Уведомления** | ❌ Нет | Нет push/in-app уведомлений о завершении дуэли |
| **Оффлайн-режим** | ❌ Нет | PWA shell настроен, но нет service worker кеширования |
| **Ошибка при нет интернета** | ❌ Нет | Приложение крашится молча |

### 6.2 🟡 Нужно для Public Launch

| Функция | Описание |
|---------|----------|
| **Магазин (Shop)** | Покупка подсказок, бустеров, скинов |
| **Daily Tournament** | Ежедневный турнир с таймером и общим лидербордом |
| **Система подсказок** | 50/50, пропуск, подсказка от аудитории |
| **Достижения/Бейджи** | Разблокируемые ачивки за milestones |
| **Streak система** | Бонус за ежедневные игры подряд |
| **Реферальная система** | Пригласи друга — получи монеты |
| **Admin Panel** | UI для управления вопросами, юзерами, репортами |
| **Мультиязычность** | Поддержка русского, английского (i18n) |
| **Поддержка изображений** | Вопросы с картинками (флаги, карты, фото) |
| **Живой PvP (Socket.io)** | Синхронный дуэль в реальном времени |
| **Реклама (Rewarded Ads)** | Просмотр рекламы за монеты |

---

## 7. Инфраструктура и DevOps

| Проблема | Статус |
|----------|--------|
| **PostgreSQL** | Портативная версия в `c:\quizaz\pgsql\` — не для продакшена |
| **Нет Docker** | Отсутствует `docker-compose.yml` для локальной разработки |
| **Нет CI/CD** | Нет GitHub Actions, нет автотестов на push |
| **Нет staging-среды** | Всё тестируется только локально |
| **Нет бекапов базы** | Нет скрипта/cron для pg_dump |
| **Нет мониторинга** | Нет health-check endpoint для внешнего мониторинга (есть `/health`, но нет alerting) |
| **Нет логирования** | Нет Winston/Pino, ошибки теряются |
| **Seed не идемпотентен** | При повторном запуске `seed.ts` создаст дубликаты категорий (upsert только для городов) |
| **Нет `.env.example`** | Разработчику непонятно, какие переменные нужны для бекенда |

---

## 8. Контент и Данные

| Проблема | Описание |
|----------|----------|
| **203 вопроса** | Недостаточно для retention. Минимум 500-1000 для MVP |
| **Нет explanationAz** | Большинство вопросов без объяснения |
| **Неравномерное распределение** | Некоторые категории могут иметь 5 вопросов, другие 50 |
| **Нет уровней сложности** | Все вопросы вперемешку по difficulty (1-3), но UI не использует это |
| **Нет валидации уникальности** | Одинаковые вопросы могут дублироваться в seed |
| **11 городов** | Достаточно для старта, но нет регионального деления |

---

## 9. Производительность

| Проблема | Влияние |
|----------|---------|
| `ORDER BY RANDOM()` в PostgreSQL | O(n) full table scan на каждый запрос — медленно при 10k+ вопросов |
| Нет кеширования лидербордов | Каждый запрос — тяжёлый `GROUP BY` + `SUM` по всей таблице |
| Нет пагинации в `getMyDuels` | Возвращает ВСЕ дуэли пользователя за всё время |
| Нет пагинации в `findAll` вопросов | Admin-запрос вернёт ВСЕ вопросы |
| Firebase SDK загружается даже в mock-mode | ~200KB лишнего JavaScript |
| `tailwind-merge` в зависимостях | ~15KB лишнего JS (не используется) |
| Нет lazy loading для страниц | Весь бандл загружается сразу |

---

## 10. План Приоритетов

### 🔴 Phase 1: Security Hardening (до закрытой беты)
1. Заменить все `$queryRawUnsafe` на параметризованные запросы
2. Добавить `NODE_ENV` проверку для mock-токенов
3. Ограничить CORS конкретными origin'ами
4. Добавить rate-limiting (`@nestjs/throttler`)
5. Добавить DTO-валидацию для всех эндпоинтов

### 🟡 Phase 2: Bug Fixes (неделя 1)
1. Исправить DuelGamePage (stale closure + double click)
2. Исправить DuelWaitingPage (роль пользователя)
3. Исправить level-формулу в транзакции
4. Добавить null-check для deleted questions в дуэлях
5. Добавить глобальный error handling на фронтенде
6. Унифицировать стиль страниц (inline styles для всех)

### 🟢 Phase 3: UX Polish (неделя 2)
1. Добавить skeleton-загрузки
2. Добавить звуковые эффекты
3. Показывать `explanationAz` после ответа
4. Создать PWA-иконки и favicon
5. Добавить реальный топ-3 на HomePage
6. Добавить статистику в профиль

### 🔵 Phase 4: Features (неделя 3-4)
1. Firebase Production Auth + Google Sign-In
2. История игр
3. Admin Panel
4. 500+ вопросов
5. Docker-compose для разработки
6. CI/CD pipeline
