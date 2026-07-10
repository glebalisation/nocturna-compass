# Nocturna Compass (v2)

Nightlife discovery & intelligence platform для електронної сцени Лос-Анджелеса.
Next.js 15 (App Router) + Supabase + Vercel Cron.

## Що вже працює

| Модуль | Статус |
|---|---|
| Головна, Tonight in LA, This Weekend, Event Directory | ✅ з фільтрами (genre / neighborhood / free) |
| SEO-сторінки івентів зі schema.org MusicEvent (JSON-LD) | ✅ |
| SEO-сторінки районів (`/la/downtown-la` тощо) | ✅ 8 районів |
| Submit Event → черга модерації | ✅ |
| Admin: черга, approve / feature / reject / duplicate, лічильники | ✅ пароль через `ADMIN_PASSWORD` |
| Newsletter signup → Supabase + (опційно) Resend audience | ✅ |
| Автозбір івентів (cron кожні 6 год): JSON-LD + ICS парсери | ✅ generic; RA/Dice/Eventbrite — заглушки під адаптери |
| Дедуплікація (fingerprint: title+date+venue, unique index) | ✅ |
| Sitemap, robots, канонічні мета | ✅ |
| Demo-режим без Supabase (сайт працює одразу) | ✅ |

## Запуск локально

```bash
npm install
cp .env.example .env.local   # можна лишити порожнім — буде demo-режим
npm run dev                  # http://localhost:3000
```

## Деплой (30 хв)

**1. Supabase**
- Створи проєкт → SQL Editor → встав увесь `supabase/schema.sql` → Run.
- Settings → API: скопіюй `URL`, `anon key`, `service_role key`.

**2. Vercel**
- Імпортуй репозиторій → додай env-змінні з `.env.example`.
- `ADMIN_PASSWORD` — вигадай сильний.
- `CRON_SECRET` — Vercel згенерує сам (Settings → Cron Jobs), крон уже описаний у `vercel.json`.

**3. Resend (опційно, для розсилки)**
- Створи Audience → додай `RESEND_API_KEY` і `RESEND_AUDIENCE_ID`.
- Щотижневий гайд надсилається через Resend Broadcasts на цю аудиторію (підписники дублюються в таблиці `subscribers` — база лишається твоєю).

**4. Джерела автозбору**
Додай рядки в таблицю `sources` (Supabase → Table Editor):
```sql
insert into sources (name, url, kind) values
  ('Venue X calendar', 'https://venue-x.com/events', 'jsonld'),
  ('Promoter Y ics',   'https://promoter-y.com/events.ics', 'ics');
```
Кожні 6 годин крон збирає нові івенти → усі падають у статус `needs_review` → ти публікуєш вручну в `/admin`. **Ніщо не публікується автоматично.**

⚠️ Для Resident Advisor / Dice / Eventbrite / Instagram скрапінг HTML порушує їхні ToS — використовуй офіційні API/партнерки; місця під адаптери позначені в `app/api/cron/collect/route.ts`.

## Структура

```
app/
  page.tsx                 головна
  tonight/  weekend/       ключові SEO-сторінки
  events/   events/[slug]  каталог + сторінки івентів (JSON-LD)
  la/[neighborhood]/       8 районних SEO-сторінок
  map/  submit/            мапа-індекс, форма промоутерів
  admin/                   модерація (middleware-захист)
  api/subscribe            підписка (+Resend)
  api/submit-event         прийом заявок
  api/cron/collect         автозбір
  api/admin/*              логін, модерація
lib/                       supabase-клієнти, дедуп, типи, data layer
supabase/schema.sql        уся БД: таблиці, RLS, тригери, сіди
```

## Наступні релізи (за пріоритетом)
1. Реальні фото івентів (Supabase Storage) + завантаження в submit-формі
2. Інтерактивна мапа (MapLibre + координати venue)
3. Exit-intent попап підписки
4. User accounts (Supabase Auth): збережені івенти, follow жанрів
5. AI-нормалізація зібраних івентів (Anthropic API: жанри, лайнап, район з опису)
6. Promoter dashboard + featured placements (монетизація)


---

## v2 — щоденний збір, п'ятнична розсилка, growth loop

### Автоматика (Vercel Cron, час у UTC)
| Крон | Розклад | LA-час |
|---|---|---|
| `/api/cron/collect` | `0 9 * * *` | 2:00 AM (PDT; взимку 1:00 — за потреби зміни на `0 10`) |
| `/api/cron/newsletter` | `0 18 * * 5` | П'ятниця 11:00 AM (PDT) |

### Джерела: що реально працює і як
| Джерело | Тип | Статус |
|---|---|---|
| **19hz.info LA** | `19hz` (HTML-парсер) | ✅ найкраще безкоштовне джерело андеграунду. Ввічливість: напиши 19hzinfo@gmail.com |
| **DoLA / DICE / Shotgun / Eventbrite сторінки / сайти venue** | `jsonld` | ✅ generic-парсер schema.org — просто додавай URL сторінок з івентами в `sources` |
| **iCal-календарі venue/промоутерів** | `ics` | ✅ |
| **EDMTrain** | `edmtrain` (офіційний API) | ⚠️ вимкнено. ToS забороняє комбінувати їхні дані з іншими джерелами в конкурентному сервісі — спершу письмовий дозвіл api@edmtrain.com, потім `EDMTRAIN_ENABLED=true` |
| **Resident Advisor** | `ra` (неофіційний GraphQL) | ⚠️ вимкнено. Публічного API нема; вмикай (`RA_ENABLED=true`) лише з дозволом partners@ra.co або свідомо приймаючи ризик |
| **Facebook events** | `facebook` | ✅ легально через Graph API для сторінок, якими керуєш / які дали доступ (`FB_ACCESS_TOKEN`, url = page id). Чужі сторінки — через Apify (`APIFY_TOKEN` + `APIFY_FB_ACTOR`, url = повний лінк) |
| **Instagram** | — | ручний ввід / submissions (Graph API читає лише авторизовані акаунти) |

**Пайплайн:** collector → нормалізація → **merge/dedupe** (та сама назва+дата+venue, або той самий ticket-URL, або дуже схожа назва → зливаємо, source-лінки зберігаються всі) → статус `needs_review` → ти публікуєш в `/admin`. Автопублікації нема. Минулі івенти архівуються автоматично.

### П'ятнична розсилка
Збирається автоматично з опублікованих івентів вікенду: Top 5 → best underground (warehouse) → best free → best afterhours → best house → best techno → лінк на календар. Надсилається через Resend Broadcasts, випуск архівується в таблиці `newsletters`. Open/click rate — у дашборді Resend.

### Growth loop
Після підписки юзер бачить "Invite 3 friends → private picks / guestlist drops / secret events" з персональним лінком `/?ref=CODE`. Реферали рахуються в `subscribers.referral_count` — видача нагород поки ручна (видно в Supabase, сортуй за referral_count).

### Підписка v2
Email + телефон (опційно) + жанри + райони (включно з Koreatown і Long Beach) + згода на розсилку + окрема згода на SMS. Все зберігається в `subscribers` — **база тусовщиків твоя**, Resend лише дублює для відправки.

### Міграція
Онови БД: виконай `supabase/migration-002-v2.sql` у SQL Editor (після базового schema.sql).

### SMS
Поле телефону і згода вже збираються. Відправка SMS — наступний крок (Twilio/Telnyx), список для розсилки: `select phone from subscribers where sms_consent and phone is not null`.
