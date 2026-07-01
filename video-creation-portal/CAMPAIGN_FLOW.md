# Campaigns — Gamanza-style flow, end to end

Modelled on Gamanza Engage's CRM. GAMRU is the operator console + the delivery
engine; the games platform (sdlcgames) is the consumer that shows on-site
messages to the player. **Nothing existing was removed — this is additive.**

```
 ADMIN (operator)                       PLAYER (end customer)
 gamru-frontend  ─┐ authoring             ┌─ my-game-platform-frontend
                  ▼                        ▼   (Inbox page)
 gamru-backend  ──── delivers ────► player_campaign_history (inbox)
 (DELIVERY ENGINE +        ▲                 ▲
  source of truth)         │ events          │ list / read / click
                  my-game-platform-backend ──┘
                  (registration / deposit / login → /api/integration/events)
```

## What changed (was broken → now real)

Before, a campaign was just a DB row and creating one wrote **fake** analytics
(3 random `pl_xxx` players). Now:

- A campaign carries a **template** + **channel** and can be **executed**.
- **Send Now** resolves the segment to real players, renders the template,
  enforces consent + frequency caps + unsubscribes, and **delivers**.
- **Event triggers** (registration / first deposit / login) fire the matching
  campaign for that one player automatically.
- Delivery writes a real **inbox row** the player reads in the games platform.
- Analytics (Sent / Delivered / Opened / Clicked) are now produced by **real**
  deliveries and real opens — no fabricated numbers.

---

## 1. Author a campaign in GAMRU (the admin)

First create the building blocks (existing screens):

| Screen | What you set |
|---|---|
| `CRM → Templates → Create` | A message on a **channel** (On-site / In-app / Email / SMS / Web push) with a **subject** + **body**. Body supports tokens: `{{name}}`, `{{first_name}}`, `{{level}}`, `{{rank}}`, `{{tokens}}`, `{{xp}}`. |
| `CRM → Segments → Create` | A rule tree (e.g. `tags contains depositor`) — resolves to real players. |
| `CRM → Frequency Caps` (optional) | Max messages per channel per day/week/month. |

Then `CRM → Campaigns → Create` (wizard):

| Step | What you set |
|---|---|
| **Details** | Name, tags, description |
| **Trigger & Message** | **Trigger** (Scheduled - Now, or Event: Registration / First Deposit / Login), **Channel**, and the **Template** to deliver |
| **Period** | Start / end dates |
| **Select Segment** | The audience (a real segment) — leave empty to target all players |
| **Target Group** | Free-text notes |

---

## 2. Send it

- **Manual:** Campaign list → row menu → **Send now**
  → `POST /api/campaigns/send/:id`.
- **Automatic (event trigger):** the games platform pushes
  `USER_REGISTERED` / `DEPOSIT_MADE` to `POST /api/integration/events`; GAMRU
  fires any ACTIVE campaign whose trigger matches, for that player.

### The engine (`modules/campaign/service/campaign-delivery.service.ts`)

For each player in the audience:

1. **Consent** — skip if `consents.email/sms/push === false` (on-site/in-app
   are not consent-gated).
2. **Unsubscribe** — skip if an `unsubscribe_reports` row exists for that channel.
3. **Frequency cap** — skip if deliveries in the period ≥ the channel's cap.
4. **Render** the template with the player's data.
5. **Deliver** — write a `player_campaign_history` (inbox) row; for
   email/SMS/web-push also call the provider **stub adapter** (logs today — swap
   in SendGrid / Routee / OneSignal later).
6. **Record analytics** — real `SENT` + `DELIVERED` events.

`/send` returns a summary: `{ audience, sent, suppressed, reasons }`.

---

## 3. The player sees it (sdlcgames)

- Sidebar **Inbox** (`/inbox`) lists delivered messages with an unread badge.
- Opening a message marks it read → `PATCH /api/inbox/:id/read` →
  GAMRU records a real **OPEN**.
- The CTA records a **CLICK**; **Unsubscribe** writes the opt-out.
- The games backend proxies these to GAMRU `/api/inbox/*` over
  `x-client-auth-key`, resolving the player by the logged-in user's email
  (same contract as missions). GAMRU down → empty inbox, never a broken page.

---

## 4. Analytics feedback loop

`CRM → Analytics` (Campaigns + History tabs) now reflect real deliveries and
engagement. Opens/clicks flow back from the inbox, so the numbers describe what
actually happened — which feeds the next campaign's targeting.

---

## 5. Run it

```bash
# gamru-backend — add the new columns (one-time)
cd gamru/gamru-backend && npm run db:migrate   # applies 0034-add-campaign-delivery
npm run dev

# games platform
cd sdlcgames/my-game-platform-backend && npm run dev   # needs GAMRU_CLIENT_AUTH_KEY
cd sdlcgames/my-game-platform-frontend && npm run dev
```

## 6. Test it (step by step)

1. **Template:** GAMRU → CRM → Templates → Create, channel **On-site**, body
   `Hi {{first_name}}, welcome 🎉`. Save.
2. **Segment:** CRM → Segments → Create, rule `tags contains depositor` (or any
   that matches a known player). Confirm the audience preview count > 0.
3. **Campaign:** CRM → Campaigns → Create — trigger **Scheduled - Now**,
   channel **On-site**, pick the template, pick the segment. Save.
4. **Send:** Campaign list → ⋮ → **Send now**. Toast shows
   `Campaign sent — N delivered, M suppressed`.
5. **Player:** log into the games platform as a player in that segment →
   **Inbox** shows the rendered message with an unread dot. Open it → dot clears.
6. **Analytics:** GAMRU → CRM → Analytics → Campaigns — On-site **Sent /
   Delivered** = N, **Opened** = 1 after you opened it.
7. **Event trigger:** create a campaign with trigger **Event: First Deposit** +
   an On-site template, leave it ACTIVE. Make a deposit on the games platform →
   the welcome message lands in that player's Inbox automatically.
8. **Caps/unsub:** set a frequency cap of 1/day on On-site and send twice — the
   2nd is suppressed (`reasons.frequency_cap`). Unsubscribe in the Inbox, send
   again — suppressed (`reasons.unsubscribed`).

---

## Files added / changed

**gamru-backend (engine + source of truth)**
- `migrations/0034-add-campaign-delivery.js` (new)
- `modules/campaign/model/campaign.model.ts` (+template_id, channel, schedule_at, last_run_at)
- `modules/player/model/player-campaign-history.model.ts` (+campaign_id, body, read_at — now the inbox)
- `modules/player/model/player.repository.ts` (unread count / scoped fetch / unreadOnly)
- `modules/campaign/service/campaign-delivery.service.ts` (new — the engine)
- `modules/campaign/service/inbox.service.ts` (new — player read side)
- `modules/campaign/controller/inbox.controller.ts` + `route/inbox.routes.ts` (new)
- `modules/campaign/{service,controller}` campaign.ts (+send, dropped fake analytics)
- `route/campaign.routes.ts` (+`/send/:id`), `route/index.ts` (mount `/inbox`)
- `validations/campaign.validation.ts` (+template_id, channel, schedule_at)
- `modules/integration/service/integration.service.ts` (fire triggers on register/deposit)
- `modules/analytics/service/analytics.service.ts` (removed the simulator)

**gamru-frontend (admin authoring)**
- `types/campaign.types.ts` (+channel/template_id + channel options)
- `pages/campaign/CreateCampaign.tsx` (channel + template step, summary)
- `pages/campaign/CampaignTableList.tsx` (Send now action)

**my-game-platform-backend (consumer)**
- `utils/gamruService.ts` (`gamru.inbox.*` + inbox types)
- `modules/inbox/controller/inbox.controller.ts` + `route/inbox.routes.ts` (new)
- `route/index.ts` (mount `/inbox`)

**my-game-platform-frontend (player)**
- `pages/Inbox.tsx` (new), `services/endpoints.ts` (`endpoints.inbox.*`),
  `types/index.ts` (InboxItem/InboxResponse), `routes/PageRoutes.tsx`,
  `layout/DashboardLayout.tsx` (sidebar link)
```
