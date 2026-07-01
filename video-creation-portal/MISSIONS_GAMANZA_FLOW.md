# Missions & Mission Bundles — Gamanza-style flow

This documents the missions feature added across the three apps, modelled on
Gamanza Engage. **Nothing existing was removed** — this is additive.

```
 ADMIN (operator)                PLAYER (end customer)
 gamru-frontend  ─┐                ┌─ my-game-platform-frontend
                  │ authoring      │   (Mission Bundles page)
                  ▼                ▼
 gamru-backend  ◄──── events ──── my-game-platform-backend
 (RULES ENGINE +        (wager / win / deposit / login …)
  source of truth)
```

- **gamru = Gamanza Engage** — operator console + the rules engine that owns
  mission definitions AND per-player progress.
- **my-game-platform = the operator's casino** — sends player events to gamru
  and renders the missions gamru returns.

---

## 1. Setup a mission in gamru (the admin)

`Gamification → Missions → Create` (multi-step wizard):

| Step | What you set |
|---|---|
| **Details** | Internal name, tags, description |
| **Objectives** | **Event** the mission listens to (Wager / Bet Count / Win / Deposit / Withdrawal / Login / KYC / Account Verification / Self-Assessment / Opt-In / Refer a Friend), **Measure** (Count = N times, Amount = sum), **Target**, optional sub-conditions **Game Category** and **Min Bet** |
| **Time Settings** | Lifetime or custom window |
| **Rewards** | Reward type (Bonus Cash / Free Spins / XP / Tokens) + amount — this is the "chest" |

`Gamification → Mission Bundles → Create`:

| Step | What you set |
|---|---|
| **Details** | Name, banner images (desktop = Large, mobile = Small) |
| **Settings** | **Periodicity** (Daily / Weekly / Monthly / Lifetime — controls reset), priority, dates |
| **Missions** | Comma-separated mission IDs that make up the bundle |
| **Eligibility** | All Players or a Segment |

Set **Status = ACTIVE** to make a mission/bundle live. The mission config is
stored in the existing `missions` / `mission_bundles` tables (JSONB `data`).

---

## 2. What the player does → which event fires

Events are pushed from the games platform to
`POST /api/integration/events` on gamru (fire-and-forget, idempotent on
`event_id`). Mapping:

| Player action (games platform) | Event pushed | Code |
|---|---|---|
| Plays a round with a bet | `WAGER` (+ counts for Bet Count) | `activity.service.ts` |
| Wins a round | `CASINO_WIN` | `activity.service.ts` |
| Deposits | `DEPOSIT_MADE` | `wallet.service.ts` (existing) |
| Logs in | `LOGIN` (once/day) | `auth.service.ts` |

Each event carries `meta` (`game_category`, `game_id`, `bet`) so the engine can
check sub-conditions. Withdrawal / KYC / Account-Verified / Self-Assessment /
Opt-In / Refer-a-Friend are accepted by the engine too — push them from the
matching place when you wire those features.

---

## 3. How gamru updates progress (the engine)

`gamru-backend` `mission.engine.ts`, called from `integration.service.applyEvent`:

1. Event arrives → deduped on `event_id` (so a replay never double-counts).
2. Engine loads ACTIVE missions + bundles, finds those whose objective `event`
   matches the inbound event_type.
3. For each, it finds/creates the player's row in **`player_mission_progress`**
   for the current period (`daily` → date, `weekly` → ISO week, `monthly` →
   month, else `lifetime`).
4. Checks sub-conditions (`game_category`, `game_id`, `min_bet`); if they pass,
   it adds the delta (`+1` for count, `+amount` for amount objectives).
5. When all objectives hit target → mission becomes **COMPLETED** and a log is
   written. Bundle progress (e.g. 4/9) is derived from its missions.

Mission state machine: `IN_PROGRESS → COMPLETED → CLAIMED` (`LOCKED`/`EXPIRED`
reserved).

---

## 4. How the player sees missions

Games platform `GET /api/mission-bundles` → proxies gamru
`POST /players/by-email` and returns `gamification.missions_view`. There is
ONE **Missions** tab in the sidebar (route `/mission-bundles`):

- **MISSIONS / HISTORY** sub-tabs at the top.
- Bundle cards with banner, periodicity badge, `completed/total` progress, and
  a 🎁 CLAIM pill when a chest is ready.
- Expand a bundle → mission **roadmap** (numbered Start→N steps, COMPLETED /
  GOING / LOCKED) + the bundle description.
- Click a mission → **objectives dialog** with a progress bar per objective
  (e.g. `3/3`, `2/5`) — the Gamanza "DAILY MISSIONS" pop-up — and Claim chest.
- The page **auto-refreshes every 10s and on window focus**, and **toasts**
  when a mission newly completes or a reward is claimed, so progress earned
  while playing shows up without a manual reload.

The old `/missions` (local-engine) page is no longer in the sidebar but its
route still resolves for back-compat.

---

## 5. Claiming the reward (the "CLAIM chest" action)

1. Player clicks **Claim chest** on a COMPLETED mission.
2. Games platform → `POST /api/mission-bundles/missions/:missionId/claim`.
3. → gamru `POST /players/:id/missions/:missionId/claim`.
4. gamru applies the reward (XP via the rank engine, tokens, or records
   bonus_cash/free_spins), writes a `player_rewards` row + audit log, and flips
   the mission to **CLAIMED**.

---

## 6. Run it

```bash
# gamru-backend — create the player-progress table (one-time)
cd gamru/gamru-backend && npm run db:migrate   # applies 0024-create-player-mission-progress
npm run dev

# games platform
cd sdlcgames/my-game-platform-backend && npm run dev
cd sdlcgames/my-game-platform-frontend && npm run dev
```

The games platform must have `GAMRU_CLIENT_AUTH_KEY` set (already required for
the existing deposit/XP sync).

---

## Files added / changed

**gamru-backend (engine + source of truth)**
- `modules/mission/model/player-mission-progress.model.ts` + `.repository.ts` (new)
- `modules/mission/service/mission.engine.ts` (new — matching, progress, claim, view)
- `migrations/0024-create-player-mission-progress.js` (new)
- `modules/integration/service/integration.service.ts` (+mission events, calls engine)
- `validations/integration.validation.ts` (accept new event types)
- `modules/player/service|controller`, `route/player.routes.ts` (mission view + claim endpoint)
- `config/syncDb.ts` (register model)

**gamru-frontend (admin authoring)**
- `pages/gamification/missions/steps.tsx` (full event catalog, measure, min-bet)
- `pages/gamification/missionBundles/steps.tsx` (periodicity)

**my-game-platform-backend (operator casino)**
- `integration/gamruSync.ts` (`syncMissionEvent` + event types)
- `modules/activity/service/activity.service.ts` (push WAGER/WIN)
- `modules/auth/service/auth.service.ts` (push LOGIN)
- `modules/gamru-mission/*` + `route/gamru-mission.routes.ts` (new — fetch view + claim)
- `utils/gamruService.ts` (mission view types + `claimMission`)

**my-game-platform-frontend (player)**
- `pages/MissionBundles.tsx` (new — bundle list / roadmap / objectives dialog)
- `services/endpoints.ts`, `types/index.ts`, `routes/PageRoutes.tsx`, `layout/DashboardLayout.tsx`
```
