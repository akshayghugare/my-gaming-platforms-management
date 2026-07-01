# cloudRead.md — Gamru Service Platform & Gamify Engage Consumer

> One document covering both repos in `C:\sdlc\`:
> - **`gamru/`** — the **service platform** (back-office CRM + gamification engine that other platforms consume).
> - **`sdlcgames/`** — a **consumer platform** (a gaming product called *Gamify Engage*) that integrates with Gamru to power its XP / levels / ranks / rewards / leaderboards.
>
> The doc is split into three parts:
> 1. **Project A — Gamru** (backend + frontend features).
> 2. **Project B — Gamify Engage (sdlcgames)** (backend + frontend features, and exactly how it talks to Gamru today).
> 3. **Multi-Client Architecture for Gamru** — design + implementation plan that turns Gamru into a proper multi-tenant *service product* so any platform (Gamify Engage today, others tomorrow) can plug in, and so the Gamru admin UI shows **which client is using which service**.

---

## Table of Contents

1. [The big picture (system topology)](#1-the-big-picture-system-topology)
2. [Project A — Gamru](#2-project-a--gamru)
   - 2.1 [Backend (`gamru-backend`)](#21-gamru-backend-gamru-backend)
   - 2.2 [Frontend (`gamru-frontend`)](#22-gamru-frontend-gamru-frontend)
3. [Project B — Gamify Engage (`sdlcgames`)](#3-project-b--gamify-engage-sdlcgames)
   - 3.1 [Backend (`my-game-platform-backend`)](#31-gamify-engage-backend)
   - 3.2 [Frontend (`my-game-platform-frontend`)](#32-gamify-engage-frontend)
   - 3.3 [Today's integration with Gamru](#33-todays-integration-with-gamru)
4. [Multi-Client Architecture — turning Gamru into a service product](#4-multi-client-architecture--turning-gamru-into-a-service-product)
   - 4.1 [Why this is needed](#41-why-this-is-needed)
   - 4.2 [The `Client` model — the new tenant primitive](#42-the-client-model--the-new-tenant-primitive)
   - 4.3 [Per-client authentication](#43-per-client-authentication)
   - 4.4 [Data scoping — which tables carry `client_id`](#44-data-scoping--which-tables-carry-client_id)
   - 4.5 [New service-product endpoints](#45-new-service-product-endpoints)
   - 4.6 [Admin UI: the "Clients" area in Gamru](#46-admin-ui-the-clients-area-in-gamru)
   - 4.7 [Implementation steps (migration path)](#47-implementation-steps-migration-path)
   - 4.8 [Integrator guide — how a new platform plugs into Gamru](#48-integrator-guide--how-a-new-platform-plugs-into-gamru)

---

## 1. The big picture (system topology)

```
                                 ┌────────────────────────────────────┐
                                 │      Gamru (the service product)   │
                                 │                                    │
                                 │   gamru-backend   :5000  /api      │
                                 │   gamru-frontend  :5173            │
                                 │                                    │
                                 │   Owns: rank ladder, missions,     │
                                 │         campaigns, segments,       │
                                 │         media, catalogs, players,  │
                                 │         and the XP idempotency     │
                                 │         ledger.                    │
                                 └────────────────────────────────────┘
                                       ▲                ▲
                              x-client-key /   admin UI (operators
                              client_secret    of each consuming
                                  (S2S)        platform OR Gamru ops)
                                       │                │
       ┌───────────────────────────────┴────┐  ┌────────┴────────────┐
       │                                    │  │                     │
       │  Gamify Engage (sdlcgames)         │  │  Other client       │
       │                                    │  │  platform (future)  │
       │  my-game-platform-backend  :5001   │  │                     │
       │  my-game-platform-frontend :5174   │  │                     │
       │                                    │  │                     │
       │  Owns: auth, game activity, local  │  │                     │
       │        missions, notifications,    │  │                     │
       │        websocket, leaderboard.     │  │                     │
       │                                    │  │                     │
       │  Pushes activity → Gamru.          │  │                     │
       │  Reads gamification ← Gamru.       │  │                     │
       └────────────────────────────────────┘  └─────────────────────┘
```

Key idea: **Gamru is the source of truth for the *gamification curve* and the *CRM rules*.** Each consuming platform keeps its own auth + gameplay locally, but defers level / rank / XP / rewards / campaigns to Gamru.

---

## 2. Project A — Gamru

> `C:\sdlc\gamru\` — see [CLAUDE.md](gamru/CLAUDE.md) for the canonical project guide. This section catalogs every feature.

### 2.1 Gamru Backend (`gamru-backend`)

**Stack:** Node 18+, TypeScript, Express 4, Sequelize 6 (PostgreSQL), JWT auth, Joi validation, Multer uploads, Nodemailer, Swagger UI. Deployed to **Render** via `render.yaml`.

**Architecture pattern (per domain):**

```
Route  ──>  Controller  ──>  Service  ──>  Repository  ──>  Sequelize Model
            (HTTP only)      (business)    (DB access)      (table mapping)
```

- Controllers stay thin (`utils/responseHandler.ts` wraps every reply).
- Services hold rules; throw `AppError(status, msg)` and let `middlewares/error.middleware.ts` shape the response.
- Repositories extend `core/models/base.repository.ts`.
- Models use `underscored: true` (snake_case columns).

**All routes** mounted under `/api/*` in [`gamru-backend/src/app.ts`](gamru/gamru-backend/src/app.ts):

```
/api/health                /api/docs (Swagger)
/api/auth                  /api/users        /api/user-log     /api/roles
/api/system-settings       /api/tags-gamification
/api/media-database        /api/casino-catalog   /api/sport-catalog
/api/gamification          /api/campaigns        /api/segments
/api/templates             /api/custom-triggers  /api/frequency-caps
/api/unsubscribe-reports   /api/player-data      /api/players
/api/analytics             /api/integration
/uploads                   (static files)
```

#### 2.1.1 Module catalog (backend)

| # | Module | Purpose | Key models | Notable logic |
|---|---|---|---|---|
| 1 | **auth** | Register / login / reset password | uses `User` | JWT access + refresh; bcrypt; email OTP via `templates/`. |
| 2 | **user** | Dashboard operator accounts | `User` (role: USER \| ADMIN, status, 2FA, theme, tokens) | `/me` endpoints; admin can list/update/delete. |
| 3 | **user-log** | Admin audit trail | `UserLog` (user_id, action, detail) | ADMIN-only CRUD. |
| 4 | **role** | RBAC role catalog | `Role` (name, status) | Currently a config table; `User.role` stays an enum. |
| 5 | **system-settings** | Global config + integrations | `SystemSetting` (panel/key/value JSONB), `AccountStatus`, `PaymentMethod`, `Language`, **`OAuthClient`**, **`Webhook`** | Key/value store with `(panel, key)` UNIQUE; OAuthClient & Webhook rows exist but **are not yet wired to auth/event delivery** — they are the seed for §4 multi-client design. |
| 6 | **gamification-tag** | Tag catalog used by gamification entities | `GamificationTag` | Plain CRUD. |
| 7 | **media-database** | Asset library | `MediaDatabase` (category, file_path, mime, size) | Multer to `uploads/`; categories: banners, booster-images, email-templates-assets, mission-bundles, mission-banner, template. |
| 8 | **casino-catalog** | Casino game/provider/category metadata | `CasinoGame` (with `device_support` JSONB), `CasinoProvider`, `CasinoCategory` | Hierarchical CRUD. |
| 9 | **sport-catalog** | Sportsbook metadata | `Sport`, `SportTeam`, `SportTournament`, `SportMarket` | Hierarchy: Sport → Team / Tournament → Market. |
| 10 | **gamification** | Unified engine for 12 feature types | `GamificationEntity` + 12 specialized tables (missions, mission_bundles, ranks, token_rules_casino/sports, xp_point_rules_casino/sports, player_categories, reward_shop, prizeshark_catalog, purchase_feed, tournaments) | Each row carries `data` JSONB blob so UI wizards evolve without migrations. Ranks validate continuity on create. |
| 11 | **player** | End-customer profile + history | `Player` (rich JSONB: consents, personalization, player_data, custom_data, transactional_data; plus `gamification_active`, `level`, `max_level`, `xp_points`, `xp_to_next`, `rank_name`, `tokens`), `PlayerReward`, `PlayerLog`, `PlayerCampaignHistory` | `POST /player/by-email` and `POST /player/by-email/add-xp` are the public-ish read/write endpoints external platforms use today. |
| 12 | **player-data** | Custom-attribute schema (definitions only) | `PlayerData` (name, data_type, data_option, is_custom) | Defines the *shape* of `Player.player_data` JSONB. |
| 13 | **campaign** | Marketing campaigns | `Campaign` (status: IN_DESIGN \| SENT \| SCHEDULED \| PAUSED \| ARCHIVED; trigger_config / target_group JSONB) | References segments + triggers. Archive/restore. |
| 14 | **segment** | Audience targeting | `Segment` (type: DYNAMIC \| STATIC; content JSONB; cached `player_count`, `last_counted_at`) | DYNAMIC = criteria evaluated at send time. STATIC = fixed player list. |
| 15 | **template** | Message templates | `Template` (channel: EMAIL \| SMS \| ONSITE \| WEBPUSH \| INAPP; multi-language; test_recipients) | Archive/restore. |
| 16 | **custom-trigger** | Event-rule builder | `CustomTrigger` (status, builder JSONB) | Rule trees in JSONB avoid migrations. |
| 17 | **frequency-cap** | Throttle messages per player/channel | `FrequencyCap` (channel, period: PER_DAY \| PER_WEEK \| PER_MONTH, limit) | Enforced at send time. |
| 18 | **unsubscribe-report** | Opt-out audit log | `UnsubscribeReport` (player_id, channel, reason, unsubscribed_at) | Append-only. |
| 19 | **analytics** | Campaign delivery metrics | `CampaignAnalytics`, `CampaignHistory` | Per-channel counters: sent/delivered/opened/clicked. |
| 20 | **integration** | Inbound sync from external platforms (the **today** multi-client surface) | `ExternalAccount` (origin, external_id, player_id, email) + `GamXpTransaction` (UNIQUE `event_id` idempotency ledger) | Engine in [`gam.engine.ts`](gamru/gamru-backend/src/modules/integration/service/gam.engine.ts) loads ACTIVE ranks → builds ladder rungs (`xp_start → xp_end`) → resolves a player's level/rank from XP total → returns rewarded rungs crossed. `applyEvent` in [`integration.service.ts`](gamru/gamru-backend/src/modules/integration/service/integration.service.ts) is the single inbound handler: `USER_REGISTERED` links the external user to a Player (by email); `XP_AWARDED` accumulates XP, recomputes level/rank, auto-grants per-level rewards, writes to the ledger; `LEVEL_UP`/`RANK_UP` are audit-only (Gamru recomputes anyway). |

#### 2.1.2 Auth model (today)

- **Operator/admin** routes → `Authorization: Bearer <JWT>` (validated by [`middlewares/auth.middleware.ts`](gamru/gamru-backend/src/middlewares/auth.middleware.ts)). Roles checked by `role.middleware.ts`.
- **Service-to-service** routes (just `POST /api/integration/events` today) → `x-service-key: <SERVICE_SHARED_KEY>` (validated by [`middlewares/serviceAuth.middleware.ts`](gamru/gamru-backend/src/middlewares/serviceAuth.middleware.ts)). **This is a single shared secret across all consuming platforms today — §4 fixes that.**
- **Two "open" endpoints** that external services rely on without auth: `POST /api/players/by-email` and `POST /api/players/by-email/add-xp`. They use email as the player key. **§4 puts these behind per-client auth too.**

#### 2.1.3 Migration set (table inventory)

`src/migrations/0001 … 0021`:

```
0001 roles                       0012 gamification feature tables (×12)
0002 users                       0013 media_database
0003 user_logs                   0014 player_data
0004 segments                    0015 casino_catalog_tables
0005 templates                   0016 sport_catalog_tables
0006 campaigns                   0017 system_settings_tables
0007 campaign_analytics          0018 unsubscribe_reports
0008 campaign_history            0019 user profile field additions
0009 frequency_caps              0020 players_tables
0010 custom_triggers             0021 integration_tables (external_accounts + gam_xp_transactions)
0011 gamification_tags
```

The §4 multi-client work adds `0022_clients_table.js` + `0023_add_client_id_columns.js`.

#### 2.1.4 Environment variables

| Var | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | HTTP port (default 5000) |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | PostgreSQL connection |
| `DB_SSL` | auto-on for non-localhost |
| `JWT_ACCESS_SECRET` `JWT_REFRESH_SECRET` | JWT signing |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `1d` |
| `MAIL_HOST` `MAIL_PORT` `MAIL_USER` `MAIL_PASS` `MAIL_FROM` | Nodemailer SMTP |
| `SERVICE_SHARED_KEY` | **Today:** single shared key for `x-service-key`. **After §4:** kept only as a legacy fallback; per-client keys take over. |
| `UPLOAD_DIR` | Multer destination (default `uploads/`) |

#### 2.1.5 Scripts

```bash
npm run dev                 # ts-node-dev (live reload, :5000)
npm run build               # tsc + copy src/templates → dist/templates
npm start                   # node dist/server.js
npm run db:migrate          # apply pending migrations
npm run db:migrate:undo     # revert last
npm run db:seed             # run all seeders
npm run lint                # eslint src --ext .ts
```

---

### 2.2 Gamru Frontend (`gamru-frontend`)

**Stack:** React 18 + TS (strict) + Vite 5 + Tailwind 3 + react-router 6 + axios + Context API (Auth, Theme) + react-toastify + lucide-react. Deployed to **Netlify** via `netlify.toml`.

**Path alias:** `@/` → `src/` (see `vite.config.ts`).

#### 2.2.1 Routing tree ([`src/routes/PageRoutes.tsx`](gamru/gamru-frontend/src/routes/PageRoutes.tsx))

```
Public  : /login   /reset-password   /unauthorized   /  → /login
Protected:
  /dashboard                       Welcome hero + quick-access tiles + calendar
  /profile                         Self-service profile + 2FA + theme
  /documentation                   In-app feature docs
  /players          /players/:id   Player list + drilldown
  /crm/*
      campaigns                    list/create/edit/archive + analytics tab
      analytics                    campaigns metrics + history
      segments                     dynamic + static
      templates                    multi-channel, multi-language
      custom-triggers              JSONB rule builder
      frequency-cap                rate limits
      unsubscribe-reports          opt-out audit
      player-data                  custom-attribute schema
  /gamification/*
      missions / mission-bundles
      ranks                        (THE rank ladder Gamru exposes to all clients)
      token-rules-casino / token-rules-sports
      xp-point-rules-casino / xp-point-rules-sports
      player-categories
      reward-shop / prizeshark-catalog / purchase-feed
      tournaments
  /settings/*
      users / user-logs / roles
      system-settings              Core / Gamification / CRM / Missions / Platform Integration / Widgets panels
      tags-gamification / tags-crm
      media-database
      casino-catalog / sports-catalog
      http-debugger-console        in-app REST tester
404     : *
```

#### 2.2.2 Auth flow (client side)

1. `Login` posts to `/api/auth/login`; receives access token + user.
2. `AuthContext` stores token + expiry in `sessionStorage`.
3. [`src/services/api.ts`](gamru/gamru-frontend/src/services/api.ts) injects `Authorization: Bearer <token>` while not expired.
4. `ProtectedRoute` redirects unauthenticated users to `/login`.
5. A `401` clears `sessionStorage`.

#### 2.2.3 Services

| Service file | Calls |
|---|---|
| `services/api.ts` | Central axios instance + generic `apiService.{get,post,put,patch,delete}` |
| `services/systemSettings.service.ts` | Settings, account-statuses, payment-methods, languages, **oauth-clients**, **webhooks** |
| `services/gamification.api.ts` | Factory for each of the 12 gamification feature CRUDs |
| `services/casinoCatalog.api.ts` | Casino games / providers / categories |
| `services/sportCatalog.api.ts` | Sports, teams, tournaments, markets |

#### 2.2.4 Settings → Platform Integration (today's seed for multi-client)

The **System Settings → Platform Integration** panel already shows:

- **OAuth Clients** — list with `name`, `description`, `client_id`. Add/delete only (no secret rotation yet). **The rows exist but nothing in the backend uses them for auth.**
- **Webhooks** — list with `name`, `url`, `is_enabled`. Add/delete only. **No event-fanout wired up yet.**
- **Operators Platform API** — placeholder text for an "operator-side integration" surface.

§4 turns this panel into a real **Clients** management area.

#### 2.2.5 Env

| Var | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:5000/api`) |

---

## 3. Project B — Gamify Engage (`sdlcgames`)

> `C:\sdlc\sdlcgames\` — see [CLAUDE.md](sdlcgames/CLAUDE.md). This is the **example consumer** of Gamru. In code, Gamru is referenced as **"Hamara Engage"**.

| Folder | Stack | Dev port |
|---|---|---|
| `my-game-platform-backend`  | Node + Express + TS + Sequelize (Postgres) | `5001` (`/api`) |
| `my-game-platform-frontend` | React 18 + Vite + TS + Tailwind | `5174` |
| Gamru (external)            | REST API at `http://localhost:5000/api`     | `5000` |

### 3.1 Gamify Engage backend

`src/app.ts` mounts:

```
/api/auth          /api/users        /api/profile
/api/activity      /api/missions     /api/rewards
/api/leaderboard   /api/notifications
/api/config        /api/...          (route/misc.routes.ts)
```

| Module | Purpose | Hits Gamru? |
|---|---|---|
| **auth** | Local register / login / refresh / reset / `/auth/me`. JWT (15m access, 7-day refresh) with reuse detection. | ✅ On `register`: calls `hamaraEngage.users.add()` to create the mirror Gamru `User`/`Player`, then fires `USER_REGISTERED` to `/api/integration/events`. |
| **user** | Local user CRUD (admin) | ❌ No mirroring back to Gamru on update (intentional). |
| **activity** | Records gameplay/bets with idempotency (`idempotency_key`). Types: `GAME_PLAY`, `BET_PLACE`. Returns XP breakdown (base + streak bonus + daily bonus) + Gamru gamification snapshot. | ✅ Calls `POST /api/players/by-email/add-xp` for every recorded activity. |
| **profile** | Returns `GamificationProfile` = local `User` + Gamru gamification (xpTotal, level, rank, coins, streak, progress, next_rank, levels, ranks, logs). Has graceful degradation to zeroed values when Gamru is unreachable. | ✅ Calls `POST /api/players/by-email`. |
| **mission** | LOCAL missions (`Mission` + `UserMission`). Seeded on registration; progresses on `ACTIVITY_RECORDED`/`XP_AWARDED` events; emits `MISSION_PROGRESS`/`MISSION_COMPLETED`. | ❌ Local; reads but doesn't write to Gamru. |
| **reward** | LOCAL rewards (`Reward` + `UserReward`). Unlocks on `RANK_UP`. Hourly cron sweeps expired rewards. | ❌ Local. |
| **leaderboard** | Real-time leaderboard (global / weekly / monthly) computed from local activity. Broadcasts top 20 over WebSocket on each XP award. | ❌ Local. |
| **level** | Read-only level tiers (caches Gamru's level definitions). | Implicit via profile cache. |
| **rank** | Read-only rank tiers. | Implicit via profile cache. |
| **xp** | XP rules + admin grant. **`xp.engine.ts` is a no-op stub now** — all XP persistence happens in Gamru. | ✅ Admin grant pushes to Gamru. |
| **notification** | `Notification` table; in-app inbox + WS push (`notification:new`). | ❌ Local. |
| **audit** | `AuditLog` for compliance; logs Gamru outages. | ❌ Local. |
| **achievement** | Achievement catalog + user achievement state. | Local; consumes Gamru events. |

**Auxiliary subsystems:**

- **`src/events/`** — In-process EventEmitter pub/sub. Events: `USER_REGISTERED`, `ACTIVITY_RECORDED`, `XP_AWARDED`, `LEVEL_UP`, `RANK_UP`, `MISSION_PROGRESS`, `MISSION_COMPLETED`, `REWARD_GRANTED`, `STREAK_UPDATED`. Handlers registered once at boot in `registerHandlers.ts`.
- **`src/realtime/socket.ts`** — Socket.IO server; JWT handshake; rooms `user:${userId}`, `lb:${board}`. Emits `notification:new`, `level:up`, `rank:up`, `xp:awarded`, `mission:progress`, `mission:completed`, `reward:granted`, `leaderboard:update`.
- **`src/jobs/index.ts`** — cron jobs (hourly reward expiry sweep).
- **`src/integration/hamaraSync.ts`** — fire-and-forget one-way push of events to Gamru.
- **`src/utils/hamaraEngageService.ts`** — typed REST client (`hamaraEngage.users.add`, `hamaraEngage.players.getById`, etc.) wrapping `fetch` with `x-service-key` header.

**Env vars:**

| Var | Purpose |
|---|---|
| `JWT_ACCESS_SECRET` `JWT_REFRESH_SECRET` | Local JWT (≥ 32 chars in prod; service exits if missing) |
| `DB_*` `DB_SSL` `NODE_ENV` | Local Postgres |
| `HAMARA_ENGAGE_BACKEND` | Gamru base URL (default `http://localhost:5000/api`) |
| `SERVICE_SHARED_KEY` | Today: must match Gamru's `SERVICE_SHARED_KEY`. **After §4:** replaced with `CLIENT_ID` + `CLIENT_SECRET`. |

### 3.2 Gamify Engage frontend

| Page | Purpose |
|---|---|
| `pages/Login.tsx`, `Register.tsx` | Local auth. |
| `pages/Dashboard.tsx` | Stat cards (XP/level/rank/coins), mini-game (wheel/bet sim), XP & mission progress. |
| `pages/Profile.tsx` | Level progress bar, rank info, next-rank target, level roadmap, audit logs. |
| `pages/Missions.tsx` | Mission list (LOCKED/IN_PROGRESS/COMPLETED/CLAIMED). Claim flow. |
| `pages/Rewards.tsx` | Reward catalog + claimed inventory. |
| `pages/Leaderboard.tsx` | Global / weekly / monthly. Subscribes to `leaderboard:update`. |
| `pages/RankProgress.tsx` | Visual roadmap of all level bands. |
| `pages/GameHistory.tsx` | Paginated activity log. |
| `pages/Notifications.tsx` | Inbox + mark-as-read. |

**Services:**

- `services/api.ts` — axios; injects local Bearer token; transparent 401 refresh; unwraps `res.data` envelope.
- `services/endpoints.ts` — **centralised typed API surface** (`endpoints.profile.get()`, `endpoints.activity.record(...)`). All pages call through here.

**Contexts:**

- `AuthContext` — token, user, login/logout.
- `SocketContext` — WS connection; exposes `on(event, cb)` helper + global toast listeners.

**Important:** the frontend **never** talks to Gamru directly. All Gamru calls are proxied through `my-game-platform-backend`. This is intentional — Gamru remains a back-of-house service.

### 3.3 Today's integration with Gamru

#### Registration flow

1. User submits register form → `POST /api/auth/register` on Gamify Engage backend.
2. Gamify Engage creates the local `User` row, hashes password, issues JWT.
3. Gamify Engage calls `hamaraEngage.users.add()` → `POST /api/users/add` on Gamru → creates the mirror Gamru `User` (which also seeds a `Player` and an `ExternalAccount` mapping by email).
4. Gamify Engage fires `USER_REGISTERED` via `syncToHamara()` → `POST /api/integration/events` on Gamru with `origin: "gamify"`. Gamru records the event in `gam_xp_transactions` (idempotent on `event_id`).

#### Activity / XP flow

1. User plays a game → `POST /api/activity` on Gamify Engage backend (with `idempotencyKey`).
2. Gamify Engage stores activity log (idempotent), emits local `ACTIVITY_RECORDED` event.
3. Gamify Engage calls `hamaraAddXpPoints(email, amount)` → `POST /api/players/by-email/add-xp` on Gamru.
4. Gamru applies the delta in [`integration.service.ts → applyXpToPlayer`](gamru/gamru-backend/src/modules/integration/service/integration.service.ts): updates `Player.xp_points`, recomputes level / rank / xp_to_next via `gam.engine.ts`, auto-grants any per-level rewards crossed.
5. Gamru responds with the updated player snapshot.
6. Gamify Engage extracts the new totals, returns them to the frontend, and the frontend renders the XP toast + level-up animation + WS leaderboard refresh.

#### Profile read flow

1. Frontend hits `GET /api/profile` on Gamify Engage.
2. Gamify Engage calls `hamaraUserProfileData(email)` → `POST /api/players/by-email` on Gamru.
3. Gamru returns the player with nested `gamification` object: `progress`, `next_rank`, `levels[]`, `ranks[]`, `logs[]`, `xp_history[]`.
4. Gamify Engage `profile.service.ts` reshapes into the `GamificationProfile` contract its frontend depends on. If Gamru is down → safe zeros (dashboard still renders).

#### Service-to-service auth (today)

- All inbound Gamru-side hits from Gamify Engage carry `x-service-key: $SERVICE_SHARED_KEY`.
- Both sides share the same secret via env var.
- Inbound origin is logged as the string `"gamify"` (hardcoded by [`hamaraSync.ts:44`](sdlcgames/my-game-platform-backend/src/integration/hamaraSync.ts#L44)).

This works for one consumer. It does **not** scale to many. That is what §4 fixes.

---

## 4. Multi-Client Architecture — turning Gamru into a service product

> **Status: implemented.** Everything below is wired into the codebase:
> Client model + migrations (`0022`, `0023`), `clientAuth` middleware,
> CRUD routes under `/api/clients`, S2S scopes on integration & player
> by-email routes, automatic `client_id` stamping on every inbound write,
> seeder for the legacy Gamify Engage tenant, and a full admin UI at
> `/clients` (list + detail with Overview/Players/Events/Settings tabs).
> The sections that follow describe the architecture; see
> [§4.7 implementation steps](#47-implementation-steps-migration-path)
> for the exact file map.

### 4.1 Why this is needed

Today's posture (recap):

- **One** `SERVICE_SHARED_KEY` for all consuming platforms. Any service that holds it can write any data.
- **One** `origin` string (`"gamify"`) on `ExternalAccount`. Useful as a seed of identity, but no DB constraint links it to a row, no auth ties to it, no admin UI surfaces it.
- **No `client_id` on Players, GamXpTransaction, or any operational table.** Gamru cannot answer "how many players is *Platform X* sending us?" or "show me the campaigns that belong to *Platform X*".
- **OAuthClient** and **Webhook** tables exist but are not enforced anywhere.

The goals of the redesign:

1. **Identify** every external platform Gamru serves (a *client*).
2. **Authenticate** each client independently (rotatable per-client secret, scoped permissions).
3. **Tag** every piece of data Gamru receives or stores on behalf of a client with `client_id`.
4. **Show** in the Gamru admin UI exactly **which client is using which Gamru service**, with usage numbers and last-seen timestamps.
5. **Document** an integrator-facing flow so a new platform team can plug in by following a recipe.

Treat this as Gamru becoming a **B2B gamification-as-a-service** product — Gamify Engage is the first customer.

### 4.2 The `Client` model — the new tenant primitive

We promote the existing `OAuthClient` row from "config-only" to "the tenant of record". New name (within Gamru's domain language): **Client**.

A *Client* represents one consuming platform (e.g. "Gamify Engage", "Acme Casino", "Foo Sports"). It carries:

```ts
// gamru-backend/src/modules/client/model/client.model.ts (NEW)
class Client extends Model {
  id: string                    // UUID PK
  name: string                  // "Gamify Engage"
  slug: string                  // "gamify-engage"  — short identifier used as the value of "origin" on every event
  description: string | null
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED"

  client_id: string             // public; UNIQUE; sent in x-client-id header
  client_secret_hash: string    // bcrypt(client_secret); the plaintext is only shown once at issue time
  service_scopes: string[]      // ["xp.write", "players.read", "events.write", "campaigns.read", …]

  webhook_url: string | null    // optional outbound callback URL
  webhook_secret_hash: string | null
  ip_allowlist: string[] | null // optional CIDRs

  contact_email: string | null
  rate_limit_per_minute: number // default 600

  last_seen_at: Date | null     // updated by serviceAuth middleware on each hit
  last_seen_ip: string | null

  created_by: string | null     // Gamru admin User who created this
  created_at, updated_at
}
```

Migration `0022_clients_table.js` creates the table. We **keep** `OAuthClient` (existing CRUD already shipped) but mark it deprecated — the new flow uses `Client`. Alternatively, alter `oauth_clients` in place; pick whichever path is less disruptive to data already loaded.

### 4.3 Per-client authentication

Replace the shared `x-service-key` with a per-client credential pair.

**Headers sent by every consuming platform:**

```
x-client-id:      <Client.client_id>          (public)
x-client-secret:  <plaintext secret issued once>   (kept by the consumer)
```

**New middleware** `middlewares/clientAuth.middleware.ts`:

```ts
export const clientAuth = (requiredScope?: string): RequestHandler =>
  async (req, res, next) => {
    const id     = req.header("x-client-id");
    const secret = req.header("x-client-secret");
    if (!id || !secret) return res.status(401).json({ message: "Missing client credentials" });

    const client = await Client.findOne({ where: { client_id: id, status: "ACTIVE" } });
    if (!client || !(await bcrypt.compare(secret, client.client_secret_hash)))
      return res.status(401).json({ message: "Invalid client credentials" });

    if (requiredScope && !client.service_scopes.includes(requiredScope))
      return res.status(403).json({ message: `Scope ${requiredScope} not granted` });

    if (client.ip_allowlist?.length) {
      const ip = req.ip;
      if (!client.ip_allowlist.some((cidr) => cidrMatch(ip, cidr)))
        return res.status(403).json({ message: "IP not allowed" });
    }

    // attach + update last-seen
    (req as any).client = client;
    await client.update({ last_seen_at: new Date(), last_seen_ip: req.ip });

    next();
  };
```

**Backward compatibility:** keep `serviceAuth` (the old shared-key middleware) for one release as a fallback so existing Gamify Engage deploys don't break. Log a deprecation warning whenever it fires. Remove in the next major version.

**Wire-up:** every service-to-service route adds `clientAuth("<scope>")`.

```ts
// route/integration.routes.ts (AFTER)
router.post("/events",            clientAuth("events.write"),    validate(syncEventSchema), receiveEvent);
router.post("/players/by-email",  clientAuth("players.read"),    validate(...),             findByEmail);
router.post("/players/by-email/add-xp", clientAuth("xp.write"),  validate(...),             addXpByEmail);
// …also: /api/users/add gets clientAuth("users.write") for the mirror-user creation flow
```

The scopes give us granularity: a read-only analytics-style client can hold `players.read` without `xp.write`.

### 4.4 Data scoping — which tables carry `client_id`

Two tiers. **Tier 1 is mandatory** for "show which client uses which service". **Tier 2 is optional** depending on whether you also want per-client *data isolation* (separate campaigns / segments per client).

#### Tier 1 — Operational data (must carry `client_id`)

These are the rows the integration surface writes/reads on a client's behalf:

| Table | Column to add | Why |
|---|---|---|
| `external_accounts` | `client_id` (FK → clients.id) | Drop the freeform `origin` string; replace with FK. `(client_id, external_id)` becomes the new UNIQUE. |
| `gam_xp_transactions` | `client_id` (nullable until backfill) | Lets us count XP events per client and graph traffic. |
| `players` | `client_id` (nullable) | The owning client of the player. Multiple clients sharing one Player by email is allowed — the Player is the canonical end-user, `client_id` just records who introduced them. (If you want strict isolation, make this required and unique on `(client_id, email)` instead.) |
| `player_logs` | `client_id` (nullable) | So the Player activity stream can be filtered per-client. |

Migration `0023_add_client_id_columns.js` adds these columns, plus backfill logic that maps the existing `origin = "gamify"` to whichever `Client` row represents Gamify Engage. Update repositories to set `client_id = req.client.id` on every write inside the integration controllers.

#### Tier 2 — Operator-authored data (optional `client_id`)

If you want different clients to author their own campaigns / segments / templates / etc. independently:

```
campaigns, segments, templates, custom_triggers, frequency_caps,
gamification_entity (+ the 12 specialized tables), gamification_tags,
unsubscribe_reports, system_settings, media_database
```

Two implementation patterns — pick one:

1. **Shared catalog with `client_id` for visibility** — add nullable `client_id`; `NULL` = "owned by Gamru ops, visible to every client" (the default), non-null = "owned by client X, hidden from others". Cheap. Good first step.
2. **Strict row-level scoping** — make `client_id` required on every row; every repository query is filtered with `where client_id = req.client.id`. Heavier — affects every list/search/paginate query. Recommend deferring until you have a second paying client.

For the first iteration, **do Tier 1 only**. That answers the "show which client uses Gamru" question and keeps the rest single-tenant for operators. You can promote individual tables to Tier 2 incrementally.

### 4.5 New service-product endpoints

#### 4.5.1 Client onboarding (admin-only, JWT-protected)

```
POST   /api/clients                          create a new client; returns { client_id, client_secret }
                                             (secret shown ONCE only)
GET    /api/clients/paginate                 list clients with usage stats
GET    /api/clients/:id                      detail incl. usage snapshot
PUT    /api/clients/:id                      update name / scopes / webhook / ip_allowlist / status
POST   /api/clients/:id/rotate-secret        rotate; returns the new plaintext secret
POST   /api/clients/:id/suspend              status = SUSPENDED (blocks auth without deleting)
POST   /api/clients/:id/restore              status = ACTIVE
DELETE /api/clients/:id                      hard delete (use suspend instead in practice)

GET    /api/clients/:id/usage?from&to        usage timeseries: events/day, players_seen, xp_total
GET    /api/clients/:id/events?limit&offset  recent gam_xp_transactions for that client
GET    /api/clients/:id/players?…            players linked through this client
```

Module layout (mirrors the existing layered convention):

```
gamru-backend/src/modules/client/
├── controller/client.controller.ts
├── service/client.service.ts
├── model/
│   ├── client.model.ts
│   └── client.repository.ts
```

Route mount in `app.ts`: `app.use("/api/clients", clientsRouter)`.

#### 4.5.2 Client self-service endpoints (called by the consuming platform)

These already exist; they just gain `clientAuth(scope)`:

```
POST /api/integration/events            xp/level/rank events             [events.write]
POST /api/players/by-email              read or create-on-miss player    [players.read]
POST /api/players/by-email/add-xp       add XP to player                 [xp.write]
POST /api/users/add                     mirror-create user (registration)[users.write]
```

#### 4.5.3 Outbound webhooks (new — replaces the dormant `Webhook` table)

When Gamru wants to notify the consumer (e.g. a campaign was delivered, a manual reward was granted), POST to `Client.webhook_url` with HMAC signature `x-gamru-signature: sha256=<hex>` using `Client.webhook_secret_hash`. Events to fan out:

- `player.reward.granted` — a manual or auto reward was granted to a player you own
- `player.level.changed` — a level changed (so consumer can update its local cache)
- `campaign.message.sent` — a campaign message was sent to one of your players
- `player.unsubscribed` — opt-out happened on a channel

A small dispatcher in `src/jobs/webhookDispatcher.ts` reads a `webhook_deliveries` queue table with retries + dead-letter.

### 4.6 Admin UI: the "Clients" area in Gamru

Add a top-level entry in [`gamru-frontend/src/routes/PageRoutes.tsx`](gamru/gamru-frontend/src/routes/PageRoutes.tsx) and the sidebar:

```
/clients                       List all clients (table)
/clients/new                   Create new client (returns secret in modal)
/clients/:id                   Detail tabs: Overview · Players · Events · Webhooks · Settings
```

**`/clients` (list):**

| Status | Name | Slug | Players | Events (30d) | Last seen | Scopes | Actions |
|---|---|---|---|---|---|---|---|
| ● ACTIVE | Gamify Engage | gamify-engage | 12,481 | 384,201 | 2 min ago | xp.write, players.read, events.write, users.write | View / Suspend / Rotate secret |
| ● ACTIVE | Acme Casino | acme-casino | 7 | 0 | never | xp.write | View / Suspend |
| ◌ SUSPENDED | Foo Sports | foo-sports | 3,002 | 110,452 | 7 days ago | events.write | View / Restore |

**`/clients/:id` (detail):**

- **Overview** — name/slug/status, contact email, scopes, IP allowlist, rate limit, last-seen IP + time, created date, sparkline of events/day for 30 days, totals (players_seen, events, xp_awarded).
- **Players** — server-driven paginated table of `Players` linked through this client (`external_accounts.client_id = :id`). Columns: email, name, level, xp, last activity. Each row links to existing `/players/:id`.
- **Events** — server-driven paginated table of `gam_xp_transactions` for this client. Columns: time, event_type, external_id → player, amount, balance_after, meta (expandable JSON viewer). Useful for debugging integration issues.
- **Webhooks** — webhook URL + secret + delivery log (last 100 attempts, status, retry count).
- **Settings** — edit scopes, IP allowlist, rate limit, webhook URL; rotate secret (confirm modal, reveal once).

**"Create client" flow:**

1. Admin fills name + slug + scopes.
2. Backend generates `client_id` (e.g. `cl_live_<random>`) and a plaintext `client_secret` (one-time-display).
3. UI shows a modal: *"Save this secret now — you won't see it again. Show your integration team how to send it as `x-client-secret`."* Plus a copyable curl snippet.

**Top-level dashboard widget:** on `/dashboard`, add a "Service clients" card: count of active clients, total events in last 24h, top client by event volume, any clients with `last_seen_at` older than threshold.

**Promotes existing pages:**

- The current **System Settings → Platform Integration → OAuth Clients** panel becomes a redirect to `/clients`.
- The current **Webhooks** sub-panel folds into `/clients/:id/webhooks`.

### 4.7 Implementation steps (migration path)

Below is the **actual file map of what was implemented** (delivered in this iteration), in roll-out order:

1. **DB migrations** *(shipped)*
   - [`migrations/0022-create-clients-table.js`](gamru/gamru-backend/src/migrations/0022-create-clients-table.js) — creates the `clients` table with status ENUM, `client_id` UNIQUE, bcrypt secret hash, `service_scopes` array, `ip_allowlist`, rate limit, webhook fields, `last_seen_at`/`last_seen_ip`.
   - [`migrations/0023-add-client-id-to-integration.js`](gamru/gamru-backend/src/migrations/0023-add-client-id-to-integration.js) — adds nullable `client_id` FK on `external_accounts`, `gam_xp_transactions`, `players`, `player_logs`, plus per-table indexes.
   - A future `0024_drop_origin_from_external_accounts.js` can drop the legacy `origin` column once no readers depend on it.

2. **Backend module** *(shipped)*
   - [`modules/client/model/client.model.ts`](gamru/gamru-backend/src/modules/client/model/client.model.ts) — Sequelize model with `defaultScope` excluding secret hashes (a `"withSecret"` scope is used only by `clientAuth`).
   - [`modules/client/model/client.repository.ts`](gamru/gamru-backend/src/modules/client/model/client.repository.ts) — extends `BaseRepository`; adds `findByClientId`, `findBySlug`, `findByClientIdWithSecret`.
   - [`modules/client/service/client.service.ts`](gamru/gamru-backend/src/modules/client/service/client.service.ts) — credential issuance, rotation, scope validation, pagination with usage join, usage timeseries, recent-events query, linked-players query.
   - [`modules/client/controller/client.controller.ts`](gamru/gamru-backend/src/modules/client/controller/client.controller.ts) — thin HTTP layer; surfaces the one-time plaintext secret in the create + rotate responses.
   - [`validations/client.validation.ts`](gamru/gamru-backend/src/validations/client.validation.ts) — Joi schemas.
   - [`route/client.routes.ts`](gamru/gamru-backend/src/route/client.routes.ts) — admin (JWT + role `ADMIN`) routes: list/get/create/update/suspend/restore/delete/rotate-secret/usage/events/players.
   - [`middlewares/clientAuth.middleware.ts`](gamru/gamru-backend/src/middlewares/clientAuth.middleware.ts) — `x-client-id` + `x-client-secret` auth with scope checks, IP allowlist, `last_seen_at` bookkeeping, and a **legacy `x-service-key` fallback** that resolves the seeded `gamify-engage` slug so existing consumers don't break.
   - [`seeders/0002-default-clients.js`](gamru/gamru-backend/src/seeders/0002-default-clients.js) — idempotently inserts the Gamify Engage tenant, hashes `SERVICE_SHARED_KEY` as the initial secret, and backfills `client_id` on existing rows whose `origin = "gamify"`.

3. **Scope wire-up** *(shipped)* — these S2S routes now require an authenticated client with the named scope:

   | Route | Required scope |
   |---|---|
   | `POST /api/integration/events` | `events.write` |
   | `POST /api/players/by-email` | `players.read` |
   | `POST /api/players/by-email/add-xp` | `xp.write` |

   The legacy `x-service-key` continues to work for one release via the fallback branch in `clientAuth`. Remove `middlewares/serviceAuth.middleware.ts` in the next major version once all integrators are migrated.

4. **Repository writes** *(shipped)*
   - `Client` is threaded into [`integration.service.ts`](gamru/gamru-backend/src/modules/integration/service/integration.service.ts) (`applyEvent`, `applyXpToPlayer`, `resolvePlayer`, `grantLevelRewards`). Every new `ExternalAccount`, `GamXpTransaction`, `PlayerLog`, and Player attribution stamp records `client_id`. First-writer-wins on `Player.client_id` so two clients can't fight over the same player.
   - [`player.controller.ts`](gamru/gamru-backend/src/modules/player/controller/player.controller.ts) → [`player.service.ts`](gamru/gamru-backend/src/modules/player/service/player.service.ts) — `addPlayerXpByEmail` now reads `req.client` via `getRequestClient` and stamps it on the `PlayerLog` plus forwards it to `applyXpToPlayer`.

5. **Admin endpoints + Swagger** *(shipped)*
   - `/api/clients/*` mounted in [`route/index.ts`](gamru/gamru-backend/src/route/index.ts).
   - [`docs/swagger.js`](gamru/gamru-backend/src/docs/swagger.js) — registers the new tag, recognises `__requiresClientAuth` / `__requiredScope` annotations, and adds `clientId`/`clientSecret` security schemes so the docs reflect the new auth model.
   - [`config/associations.ts`](gamru/gamru-backend/src/config/associations.ts) — Client `hasMany` Players, ExternalAccounts, GamXpTransactions, PlayerLogs.

6. **Frontend** *(shipped)*
   - [`types/client.types.ts`](gamru/gamru-frontend/src/types/client.types.ts) — DTOs aligned with backend responses.
   - [`services/client.api.ts`](gamru/gamru-frontend/src/services/client.api.ts) — typed wrapper around `/api/clients`.
   - [`pages/clients/ClientList.tsx`](gamru/gamru-frontend/src/pages/clients/ClientList.tsx) — table with status pill, scope tags, live player + event counts, last-seen timestamp + IP, search + status filter, inline actions (View / Rotate / Suspend / Restore / Delete).
   - [`pages/clients/CreateClientModal.tsx`](gamru/gamru-frontend/src/pages/clients/CreateClientModal.tsx) — create form with scope checkboxes, slug auto-derivation, rate-limit + webhook + IP allowlist fields.
   - [`pages/clients/ShowSecretModal.tsx`](gamru/gamru-frontend/src/pages/clients/ShowSecretModal.tsx) — one-time secret reveal with copy buttons and a ready-to-paste curl snippet.
   - [`pages/clients/ClientDetail.tsx`](gamru/gamru-frontend/src/pages/clients/ClientDetail.tsx) — tabbed detail page: **Overview** (totals + 30-day events bar chart + auth/scopes/webhook/IP/rate-limit summary), **Players** (everyone introduced through this client → links to `/players/:id`), **Events** (paginated `gam_xp_transactions` with row-click meta JSON expand), **Settings** (edit + save).
   - [`routes/PageRoutes.tsx`](gamru/gamru-frontend/src/routes/PageRoutes.tsx) — `/clients` and `/clients/:id` registered.
   - [`components/Sidebar.tsx`](gamru/gamru-frontend/src/components/Sidebar.tsx) — top-level "Clients" link under Overview, between Players and the Workspace section.

7. **Gamify Engage consumer migration** *(documented; not yet applied)* — when ready to retire `x-service-key`, update `sdlcgames/my-game-platform-backend/src/config/env.ts` to read `GAMRU_CLIENT_ID` + `GAMRU_CLIENT_SECRET` and pass them as headers in [`utils/hamaraEngageService.ts`](sdlcgames/my-game-platform-backend/src/utils/hamaraEngageService.ts) and [`integration/hamaraSync.ts`](sdlcgames/my-game-platform-backend/src/integration/hamaraSync.ts). Drop the hardcoded `origin: "gamify"`. The backward-compat fallback in `clientAuth` means no Gamru-side change is required to make the migration possible — the consumer side can move at its own pace.

8. **Verification** *(shipped)* — `npx tsc --noEmit` is green on both `gamru-backend` and `gamru-frontend`; `npm run lint` is clean on the new files.

### 4.8 Integrator guide — how a new platform plugs into Gamru

This is the content you publish to the platform team that wants to use Gamru. Put it in the frontend `Documentation` page and/or in a public docs site.

#### Step 1 — Get credentials

Ask the Gamru ops team to create a Client for your platform. You'll receive:

- `CLIENT_ID` — public identifier (e.g. `cl_live_acme_casino_…`)
- `CLIENT_SECRET` — shown **once**; store in your secrets manager
- `GAMRU_BASE_URL` — typically `https://gamru.example.com/api`
- Scopes you have been granted, e.g. `["xp.write", "players.read", "events.write", "users.write"]`

#### Step 2 — Configure your backend

Set in your environment:

```env
GAMRU_BASE_URL=https://gamru.example.com/api
GAMRU_CLIENT_ID=cl_live_acme_casino_xxxxxxxx
GAMRU_CLIENT_SECRET=…
GAMRU_TIMEOUT_MS=5000
```

Build a tiny HTTP wrapper (you can copy [`sdlcgames/my-game-platform-backend/src/utils/hamaraEngageService.ts`](sdlcgames/my-game-platform-backend/src/utils/hamaraEngageService.ts) and rename — it already handles every Gamru endpoint your consumer will need). Headers on every S2S call:

```http
Content-Type:   application/json
x-client-id:    $GAMRU_CLIENT_ID
x-client-secret:$GAMRU_CLIENT_SECRET
```

#### Step 3 — Register your users into Gamru

When a user signs up on your platform:

```http
POST $GAMRU_BASE_URL/users/add
{
  "first_name": "Ada",
  "last_name":  "Lovelace",
  "email":      "ada@example.com",
  "mobile":     "+1…",
  "password":   "<a random one Gamru never has to validate>",
  "username":   "ada",
  "role":       "USER",
  "status":     "ACTIVE"
}
```

Gamru creates the mirror `User` + a `Player`. You then push the registration event so Gamru can build the audit ledger:

```http
POST $GAMRU_BASE_URL/integration/events
{
  "event_id":    "<UUIDv4 stable per-event>",
  "event_type":  "USER_REGISTERED",
  "external_id": "<your local user id>",
  "email":       "ada@example.com"
}
```

#### Step 4 — Push XP whenever something happens in your platform

For each rewardable user action (game played, bet placed, level mission cleared, etc.):

```http
POST $GAMRU_BASE_URL/players/by-email/add-xp
{
  "email":  "ada@example.com",
  "amount": 25
}
```

Response gives you the new totals:

```json
{
  "success": true,
  "data": {
    "id": "…",
    "email": "ada@example.com",
    "xp_points": 1825,
    "level": 6,
    "max_level": 10,
    "xp_to_next": 175,
    "rank_name": "Silver II",
    "tokens": 12
  }
}
```

For audit/idempotency, also push the matching ledger event:

```http
POST $GAMRU_BASE_URL/integration/events
{
  "event_id":    "<UUIDv4 unique per action>",
  "event_type":  "XP_AWARDED",
  "external_id": "<your local user id>",
  "amount":      25,
  "meta":        { "source": "game-play", "game_id": "slot-42" }
}
```

If a network retry causes the same `event_id` to arrive twice, Gamru's UNIQUE constraint in `gam_xp_transactions.event_id` rejects the duplicate — you can safely retry.

#### Step 5 — Read the gamification profile for your UI

```http
POST $GAMRU_BASE_URL/players/by-email
{ "email": "ada@example.com" }
```

The response includes a nested `gamification` object with `progress`, `next_rank`, `levels[]`, `ranks[]`, `logs[]`, `xp_history[]`. Use it to render your profile / progress bar / rank roadmap.

**Graceful degradation:** Gamru is *authoritative* but it must not block your gameplay. Wrap every Gamru call with a short timeout (`5s`) and fall back to zeros / cached values if it errors. See [`profile.service.ts`](sdlcgames/my-game-platform-backend/src/modules/profile) for a worked example.

#### Step 6 — Optional: receive outbound webhooks

Give Gamru a webhook URL. You'll receive POSTs like:

```http
POST https://your-platform.example.com/gamru-webhooks
x-gamru-event:     player.reward.granted
x-gamru-signature: sha256=…
x-gamru-client-id: cl_live_acme_casino_…

{
  "event_id": "evt_…",
  "event_type": "player.reward.granted",
  "data": { "player_email": "ada@example.com", "reward_label": "Level 5 – bonus 100", "granted_at": "2026-05-21T08:14:00Z" }
}
```

Verify `x-gamru-signature` against your stored webhook secret before trusting the body.

#### Step 7 — Verify in the Gamru dashboard

Log in to the Gamru frontend as an admin and open **Clients → Your Platform**:

- Overview shows your last-seen time, scopes, today's event volume.
- Events tab shows every `gam_xp_transactions` row you've pushed.
- Players tab shows every Player linked to your `client_id`.

That tab answers the "which client is using Gamru, and for what?" question end to end.

---

## Quick reference — file pointers

| Concern | Path |
|---|---|
| Gamru project guide | [gamru/CLAUDE.md](gamru/CLAUDE.md) |
| Gamify Engage project guide | [sdlcgames/CLAUDE.md](sdlcgames/CLAUDE.md) |
| Gamru app entry | [gamru/gamru-backend/src/app.ts](gamru/gamru-backend/src/app.ts) |
| Gamru integration service | [gamru/gamru-backend/src/modules/integration/service/integration.service.ts](gamru/gamru-backend/src/modules/integration/service/integration.service.ts) |
| Gamru rank/level engine | [gamru/gamru-backend/src/modules/integration/service/gam.engine.ts](gamru/gamru-backend/src/modules/integration/service/gam.engine.ts) |
| Gamru shared-key middleware (legacy after §4) | [gamru/gamru-backend/src/middlewares/serviceAuth.middleware.ts](gamru/gamru-backend/src/middlewares/serviceAuth.middleware.ts) |
| Gamru ExternalAccount model | [gamru/gamru-backend/src/modules/integration/model/external-account.model.ts](gamru/gamru-backend/src/modules/integration/model/external-account.model.ts) |
| Gamru XP transaction ledger | [gamru/gamru-backend/src/modules/integration/model/gam-xp-transaction.model.ts](gamru/gamru-backend/src/modules/integration/model/gam-xp-transaction.model.ts) |
| Gamru OAuthClient (becomes Client) | [gamru/gamru-backend/src/modules/system-settings/model/oauth-client.model.ts](gamru/gamru-backend/src/modules/system-settings/model/oauth-client.model.ts) |
| Gamru frontend routes | [gamru/gamru-frontend/src/routes/PageRoutes.tsx](gamru/gamru-frontend/src/routes/PageRoutes.tsx) |
| Gamru frontend axios | [gamru/gamru-frontend/src/services/api.ts](gamru/gamru-frontend/src/services/api.ts) |
| Consumer's Gamru client lib (good copy/paste source) | [sdlcgames/my-game-platform-backend/src/utils/hamaraEngageService.ts](sdlcgames/my-game-platform-backend/src/utils/hamaraEngageService.ts) |
| Consumer's outbound sync | [sdlcgames/my-game-platform-backend/src/integration/hamaraSync.ts](sdlcgames/my-game-platform-backend/src/integration/hamaraSync.ts) |
| Consumer's frontend typed endpoints | [sdlcgames/my-game-platform-frontend/src/services/endpoints.ts](sdlcgames/my-game-platform-frontend/src/services/endpoints.ts) |
