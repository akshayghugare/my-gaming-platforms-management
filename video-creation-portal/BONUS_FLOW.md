# Bonuses — SDLCGames ⇄ GAMRU flow, end to end

A bonus reward channel that runs **alongside** GAMRU's existing `player_rewards`.
Bonuses are **defined on the games platform (SDLCGames)** but **triggered by GAMRU
rank/level progression**. It mirrors the [mission](MISSIONS_GAMANZA_FLOW.md) and
[campaign](CAMPAIGN_FLOW.md) bridges, but inverts ownership: the **reward effect
lives on SDLCGames**, GAMRU only stores a pointer.

**Nothing existing was removed — this is purely additive.**

```
 ADMIN (operator)                                      PLAYER (end customer)
 SDLCGames /admin/bonuses ─┐ create bonus               ┌─ SDLCGames /rewards + /deposit
   (Bonus Management)      │ copy bonus UUID            │   (claim → wallet RM/BM)
                           ▼                            ▲
 GAMRU Ranks wizard ──paste UUID into level/rank──┐    │ profile read triggers grant
   (Bonus IDs field)                              │    │
                                                  ▼    │
 GAMRU  ──POST /players/by-email (existing)──►  SDLCGames profile.service
   gamification.levels[].bonusIds                  └─► reconcileBonusGrants (fire-and-forget)
   gamification.ranks[].data.bonus_ids                  user_bonuses (PENDING) + notification
```

The **grant + claim + wallet** effect uses the "pointer pattern" (GAMRU ships bonus ids
in the player payload SDLCGames already pulls). On top of that, GAMRU keeps a **mirror**
of the bonus channel for operator visibility (added 2026-06-23): a `bonuses` snapshot
table (synced FROM SDLCGames when a rank pins an id) and a `user_bonuses` ledger (written
when a player claims). See [§8 GAMRU mirror](#8-gamru-side-mirror-bonuses--user_bonuses).

---

## 1. Define a bonus on SDLCGames (the admin)

`Sidebar → Bonus Management` (`/admin/bonuses`, ADMIN-only). Create a bonus:

| Field | Meaning |
|---|---|
| **Bonus name** | e.g. "Level Reward" |
| **Bonus type** | extensible string, default `BONUS_CASH` |
| **Amount** | numeric value credited on claim |
| **Amount type** | **RM** = Real Money, **BM** = Bonus Money — which wallet bucket the claim credits |
| **Status** | `ACTIVE` / `INACTIVE` (only ACTIVE bonuses are ever granted) |
| **Description** | optional notes |

Each row shows a **Bonus ID** with a copy button — copy it for the next step.

Example catalog:

| Bonus Name | Type | Amount | Amount Type |
|---|---|---|---|
| Welcome Bonus | BONUS_CASH | 100 | BM |
| Level Reward | BONUS_CASH | 500 | RM |
| Rank Reward | BONUS_CASH | 1000 | BM |

---

## 2. Pin the bonus to a Level / Rank in GAMRU

`Gamification → Ranks → Create/Edit`:

- **Per level:** the *Levels & XP Ranges* grid has a **Bonus IDs** column — paste one
  or more SDLCGames bonus UUIDs (comma-separated). Reaching that level grants them.
- **Rank-wide:** the *Rank Rewards* step has a **Bonus IDs** field — paste UUIDs
  (comma-separated). Granted only after **all levels in the rank are completed**
  (the player reaches the rank's top level).

Stored as `data.levels[].bonus_ids` and `data.bonus_ids`. Delivered to SDLCGames inside
the existing `POST /players/by-email` payload (`gamification.levels[].bonusIds`,
`gamification.ranks[]`). No new GAMRU→games API.

---

## 3. The player earns it (SDLCGames)

On every profile read (`GET /api/profile` → `profile.service.getProfile`),
`reconcileBonusGrants(userId, { levels, ranks, currentLevel })` runs fire-and-forget:

- **Levels reached** — every level `<= currentLevel` grants its `bonusIds`.
- **Ranks completed** — a rank bonus is granted only once the player has completed
  **every level in the rank**, i.e. `currentLevel >= the rank's TOP level` (its highest
  level in the ladder); then it grants the rank's `bonusIds`. So the rank reward's Claim
  button only appears after all of that rank's levels are done.
- Each grant is **idempotent** (unique `(user_id, bonus_id, source_type, source_id)`):
  a typo'd / inactive id is skipped silently, and repeated reads never double-grant.
- A `REWARD_UNLOCKED` notification is pushed for each new grant.

The grant lands in `user_bonuses` as **PENDING**.

---

## 4. The player claims it → wallet (SDLCGames)

Bonus grants surface **merged into the existing Rewards page** (`/rewards`) ahead of the
GAMRU reward rows, carrying `is_bonus: true`, and PENDING shows as `IN_PROGRESS` so the
**Claim** button lights up (the sidebar "Rewards" badge counts them too).

Claiming routes to `POST /api/bonuses/:id/claim` (`claimBonus`), which runs in a
transaction with a locked row reload:

- **RM** bonus → `wallet.real_money`; **BM** bonus → `wallet.bonus_money`.
- `wallet.balance` is re-summed as the invariant **`balance = real_money + bonus_money`**.
- The grant flips PENDING → **CLAIMED** (`claimed_at` set). A second claim is rejected (409).

The wallet card on `/deposit` shows the **Real Money** + **Bonus Money** split alongside
the total. Deposits and tournament-prize claims credit **Real Money** (keeping the invariant).

---

## 5. Status semantics

```
Bonus:      ACTIVE | INACTIVE
UserBonus:  PENDING → CLAIMED | EXPIRED      (shown as IN_PROGRESS | CLAIMED in Rewards)
Notification: reuses the REWARD_UNLOCKED type
```

---

## 6. Run it

```bash
# SDLCGames backend — create the new tables + wallet columns (one-time)
cd sdlcgames/my-game-platform-backend && npm run db:migrate   # 20260623000001..03
# optional: seed sample bonuses with fixed UUIDs for testing
npx sequelize-cli db:seed --seed 20260623000001-seed-bonuses.js
npm run dev

cd sdlcgames/my-game-platform-frontend && npm run dev

# GAMRU — no migration needed (bonus ids live in the existing data JSONB)
cd gamru/gamru-backend && npm run dev
cd gamru/gamru-frontend && npm run dev
```

## 7. Test it (step by step)

1. **Bonus:** SDLCGames → log in as ADMIN → `/admin/bonuses` → create "Level Reward",
   BONUS_CASH, 500, **RM**, ACTIVE. Copy its UUID. Create "Welcome Bonus", 100, **BM**.
2. **Pin it:** GAMRU → Gamification → Ranks → edit a rank → paste the UUID into a level's
   **Bonus IDs** column (and/or the rank-wide **Bonus IDs** field). Save.
3. **Earn:** SDLCGames → log in as a player who has reached that level/rank → open the
   Dashboard/Profile (triggers the reconcile). A `REWARD_UNLOCKED` notification appears and
   the **Rewards** page shows the bonus row as IN_PROGRESS.
4. **Claim:** click **Claim** → an RM bonus increments **Real Money**, a BM bonus increments
   **Bonus Money**, and the total **balance = RM + BM** (see the `/deposit` wallet card). The
   row flips to CLAIMED; clicking Claim again is rejected.
5. **Idempotency:** refresh the profile repeatedly → no duplicate rows, no duplicate
   notifications.

---

## 8. GAMRU-side mirror (`bonuses` + `user_bonuses`)

So operators can **see all bonuses and all claimed user-bonuses inside GAMRU**, GAMRU keeps
a two-table mirror of the SDLCGames channel. This is the only place GAMRU talks to SDLCGames
over HTTP — and it is non-authoritative (the wallet credit still happens on SDLCGames).

**`bonuses` (snapshot, has a `source` field).** When a rank is created/updated with bonus
ids (per-level `data.levels[].bonus_ids` or rank-wide `data.bonus_ids`), the gamification
controller fires `syncRankBonuses(data)` (fire-and-forget). For each id it calls SDLCGames
`GET /api/bonuses/catalog/:id` and upserts a snapshot row
(`external_bonus_id`, `bonus_name`, `bonus_type`, `amount`, `amount_type`, `status`,
`source='SDLCGAMES'`, `synced_at`). Base URL = `GAMES_PLATFORM_BACKEND_URL`
(default `http://localhost:5001/api`). Unknown ids / games-down are skipped and retried on
the next rank save.

**`user_bonuses` (ledger, has `user_id` + `source`).** When a player claims on SDLCGames,
`bonus.controller.claimMyBonus` fire-and-forget calls GAMRU
`POST /api/user-bonuses/record` (clientAuth, `x-client-auth-key`). GAMRU `recordUserBonusClaim`
inserts a row (`user_id`, `email`, `external_bonus_id`, `bonus_name`, `source_type`,
`source_id`, `amount`, `amount_type`, `status='CLAIMED'`, `source='SDLCGAMES'`, `claimed_at`)
and also upserts the `bonuses` snapshot from the same payload (so the catalog row exists even
if the rank-sync never ran).

**View:** GAMRU → `Gamification → Bonuses` (`/gamification/bonuses`) shows both tables.
**List APIs (admin JWT):** `GET /api/bonuses`, `GET /api/user-bonuses`.
Migration `0035-create-bonus-tables.js` (run `npm run db:migrate` in `gamru-backend`).

**Deployment (IMPORTANT — empty `bonuses` table in production):** the snapshot sync
only works if GAMRU can reach the games backend. Set **`GAMES_PLATFORM_BACKEND_URL`** on
the deployed GAMRU service (Render dashboard / `render.yaml`) to the games backend's PUBLIC
url including `/api`, e.g. `https://my-game-platform-backend.onrender.com/api`. If it's
unset it falls back to `http://localhost:5001/api` (nothing on Render) and the table stays
empty. The sync now logs each attempt — look for `[bonus-sync] GET <url> …` /
`[bonus-sync] synced N/M …` in the GAMRU logs to confirm the resolved URL and result.
On free-tier the games service may cold-start; if the first sync misses, just re-save the
rank (it re-syncs) or raise `GAMES_PLATFORM_TIMEOUT_MS`.

```
 GAMRU rank save (bonus ids) ──GET /api/bonuses/catalog/:id──► SDLCGames → upsert gamru.bonuses
 SDLCGames player claim ───────POST /api/user-bonuses/record──► GAMRU  → insert gamru.user_bonuses
```

---

## Files added / changed

**SDLCGames backend**
- `modules/bonus/` (new) — `bonus.model`, `user-bonus.model` + repositories;
  `service/bonus.service.ts` (CRUD + `catalogBonuses`), `service/bonus.engine.ts`
  (reconcile/grant/claim/listUserBonusRows/pendingBonusCount); `controller/bonus.controller.ts`
  (+`catalog`/`catalogOne` public; claim mirrors to GAMRU)
- `route/bonus.routes.ts` (new, +public `GET /catalog[/:id]`) + mount in `route/index.ts`
- `utils/gamruService.ts` (+`gamru.bonuses.recordClaim`)
- `migrations/20260623000001-create-bonuses.js`, `..02-create-user-bonuses.js`,
  `..03-add-wallet-money-split.js`; `seeders/20260623000001-seed-bonuses.js`
- `config/associations.ts` (+Bonus/UserBonus)
- `modules/wallet/model/wallet.model.ts` (+`real_money`,`bonus_money`),
  `modules/wallet/service/wallet.service.ts` (deposit credits RM, invariant; view exposes RM/BM)
- `modules/profile/service/profile.service.ts` (fire-and-forget reconcile)
- `modules/reward/controller/reward.controller.ts` (merge bonus rows into `/rewards` + pending count; tournament claim credits RM)
- `utils/gamruService.ts` (+`bonusIds` on `GamruLevelTier`, new `GamruRankTier`)

**SDLCGames frontend**
- `pages/admin/Bonuses.tsx` (new), `routes/AdminRoute.tsx` (new), `routes/PageRoutes.tsx`
  (+`/admin/bonuses`), `layout/DashboardLayout.tsx` (admin nav link)
- `pages/Rewards.tsx` (claim routes by `is_bonus`), `pages/Deposit.tsx` (RM/BM card)
- `services/endpoints.ts` (`endpoints.bonuses.*`), `types/index.ts` (`Bonus`, `Wallet`/`UserReward`/`AuthUser` extras)

**GAMRU backend**
- `modules/integration/service/gam.engine.ts` (`LevelRung.bonusIds`, `loadLadder` carries `bonus_ids`)
- `validations/gamification.validation.ts` (`rankLevelSchema.bonus_ids`)
- `modules/bonus/` (new) — `bonus.model` (snapshot) + `user-bonus.model` (ledger) + repositories;
  `service/bonus-sync.service.ts` (fetch from SDLCGames + upsert + record-claim);
  `controller/bonus.controller.ts` (list + S2S record)
- `route/bonus.routes.ts` (new — `/bonuses`, `/user-bonuses`) + mount in `route/index.ts`
- `migrations/0035-create-bonus-tables.js`
- `modules/gamification/shared/gamification.controller.ts` (+`syncBonusesFromRankData` option fires `syncRankBonuses`);
  `route/gamification.routes.ts` (enables it for ranks)
- env: `GAMES_PLATFORM_BACKEND_URL` (default `http://localhost:5001/api`)

**GAMRU frontend**
- `components/gamification/fields.tsx` (`RankLevel.bonus_ids` + LevelsEditor "Bonus IDs" column)
- `pages/gamification/ranks/steps.tsx` (rank-wide "Bonus IDs" field)
- `pages/gamification/bonuses/BonusesView.tsx` (new — view synced bonuses + user bonuses),
  `routes/PageRoutes.tsx` (+`/gamification/bonuses`), `components/Sidebar.tsx` (nav link)
