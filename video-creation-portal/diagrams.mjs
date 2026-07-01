// Self-contained, animated HTML diagram scenes for the walkthrough.
// Each entry is a COMPLETE html document string. record.mjs renders a "diagram"
// scene by calling page.setContent(DIAGRAMS[scene.diagram]) instead of navigating
// to a live app route, then overlays the same caption used everywhere else.
//
// Visual language (matches the caption overlay):
//   GAMRU  = blue  (#3b82f6)   ·  SDLC Games = purple (#a855f7)
//   Hamara / external = teal (#2dd4bf)  ·  Database = amber (#f59e0b)
// Flowing dashed connectors + staggered fade-ins read as "API / data flow".

const GAMRU = "#3b82f6";
const GAMES = "#a855f7";
const EXT = "#2dd4bf";
const DB = "#f59e0b";

// Shared chrome: dark radial bg, kicker + title header, and a canvas area that
// stops above the bottom caption band (~150px).
function shell(kicker, title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html,body { width:1600px; height:900px; overflow:hidden;
    font-family: Inter, "Segoe UI", system-ui, sans-serif;
    background:
      radial-gradient(1200px 700px at 20% -10%, rgba(59,130,246,.16), transparent 60%),
      radial-gradient(1100px 700px at 90% 0%, rgba(168,85,247,.16), transparent 60%),
      #020617;
    color:#e2e8f0; }
  .wrap { position:absolute; inset:0; padding:54px 70px 200px; display:flex; flex-direction:column; }
  .kicker { color:#94a3b8; font-size:15px; font-weight:700; letter-spacing:.32em; text-transform:uppercase; }
  .title { font-size:40px; font-weight:800; margin-top:10px;
    background:linear-gradient(90deg,#fff,#cbd5e1); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .canvas { flex:1; display:flex; align-items:center; justify-content:center; margin-top:26px; }
  /* nodes */
  .node { border-radius:18px; padding:20px 24px; min-width:200px; background:rgba(15,23,42,.78);
    border:1px solid rgba(148,163,184,.22); box-shadow:0 18px 50px rgba(0,0,0,.5);
    animation:rise .6s both; }
  .node .nt { font-size:13px; letter-spacing:.16em; text-transform:uppercase; font-weight:800; opacity:.9; }
  .node .nh { font-size:23px; font-weight:800; margin:6px 0 4px; }
  .node .nd { font-size:15px; line-height:1.5; color:#cbd5e1; }
  .node .nb { display:inline-block; font-size:12px; font-weight:700; padding:3px 10px; border-radius:999px; margin-top:10px; }
  .gamru { border-color:${GAMRU}66; box-shadow:0 0 0 1px ${GAMRU}22, 0 18px 50px rgba(0,0,0,.5); }
  .gamru .nt,.gamru .nh { color:${GAMRU}; } .gamru .nb { background:${GAMRU}22; color:${GAMRU}; }
  .games { border-color:${GAMES}66; } .games .nt,.games .nh { color:${GAMES}; } .games .nb { background:${GAMES}22; color:${GAMES}; }
  .ext { border-color:${EXT}66; } .ext .nt,.ext .nh { color:${EXT}; } .ext .nb { background:${EXT}22; color:${EXT}; }
  .db  { border-color:${DB}66; }  .db .nt,.db .nh { color:${DB}; }   .db .nb  { background:${DB}22; color:${DB}; }
  .col { display:flex; flex-direction:column; gap:18px; }
  .row { display:flex; align-items:center; justify-content:center; gap:0; }
  .stack { display:flex; flex-direction:column; gap:22px; align-items:stretch; }
  /* flowing connectors */
  .arrow { position:relative; height:4px; min-width:70px; flex:0 0 auto; align-self:center;
    background-image:linear-gradient(90deg,#475569 0 55%, transparent 55% 100%);
    background-size:22px 4px; border-radius:4px; animation:flow 1.1s linear infinite; }
  .arrow.v { width:4px; min-width:4px; height:64px;
    background-image:linear-gradient(180deg,#475569 0 55%, transparent 55% 100%);
    background-size:4px 22px; animation:flowv 1.1s linear infinite; }
  .arrow::after { content:""; position:absolute; right:-2px; top:-5px; border-left:11px solid #64748b;
    border-top:7px solid transparent; border-bottom:7px solid transparent; }
  .arrow.v::after { right:-5px; top:auto; bottom:-2px; border-left:7px solid transparent;
    border-right:7px solid transparent; border-top:11px solid #64748b; border-bottom:0; }
  .arrow.blue { background-image:linear-gradient(90deg,${GAMRU} 0 55%, transparent 55% 100%); background-size:22px 4px; }
  .arrow.blue::after { border-left-color:${GAMRU}; }
  .arrow.purple { background-image:linear-gradient(90deg,${GAMES} 0 55%, transparent 55% 100%); background-size:22px 4px; }
  .arrow.purple::after { border-left-color:${GAMES}; }
  .lbl { position:absolute; top:-26px; left:50%; transform:translateX(-50%); white-space:nowrap;
    font-size:12.5px; font-weight:700; color:#cbd5e1; background:rgba(2,6,23,.85); padding:3px 9px; border-radius:7px;
    border:1px solid rgba(148,163,184,.2); }
  .lbl.b { bottom:-26px; top:auto; }
  .step { display:flex; align-items:center; gap:14px; animation:rise .6s both; }
  .chip { flex:0 0 auto; width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:18px; color:#020617; }
  .steptxt { font-size:18px; line-height:1.45; } .steptxt b { color:#fff; }
  @keyframes flow { to { background-position:22px 0; } }
  @keyframes flowv { to { background-position:0 22px; } }
  @keyframes rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  ${[...Array(12)].map((_,i)=>`.d${i}{animation-delay:${i*.18}s}`).join("")}
  </style></head><body><div class="wrap">
    <div class="kicker">${kicker}</div><div class="title">${title}</div>
    <div class="canvas">${body}</div>
  </div></body></html>`;
}

const node = (cls, tag, head, desc, badge, dn = 0) =>
  `<div class="node ${cls} d${dn}"><div class="nt">${tag}</div><div class="nh">${head}</div>
   <div class="nd">${desc}</div>${badge ? `<div class="nb">${badge}</div>` : ""}</div>`;
const arr = (dir = "h", cls = "", lbl = "", lblPos = "") =>
  `<div class="arrow ${dir === "v" ? "v" : ""} ${cls}">${lbl ? `<div class="lbl ${lblPos}">${lbl}</div>` : ""}</div>`;
const stepRow = (n, color, html, dn) =>
  `<div class="step d${dn}"><div class="chip" style="background:${color}">${n}</div><div class="steptxt">${html}</div></div>`;

// ---------------------------------------------------------------------------

export const DIAGRAMS = {
  // 1. System architecture — two platforms, the integration API, Hamara, widgets.
  arch: shell("System Architecture", "Two platforms, one engagement engine", `
    <div class="row" style="gap:0; align-items:stretch">
      <div class="col" style="justify-content:center">
        ${node("gamru", "Admin · :5173 / :5000", "GAMRU Engage", "React admin console + Express/Sequelize API. Authors missions, ranks, tournaments, campaigns, rewards, bonuses, widgets.", "SOURCE OF TRUTH", 0)}
        ${node("db", "PostgreSQL", "GAMRU database", "missions · tournaments · ranks · campaigns · mission_participants · tournament_scores · player_rewards", "", 1)}
      </div>
      <div class="col" style="justify-content:center; padding:0 8px">
        ${arr("h", "blue", "POST /players/by-email", "")}
        ${arr("h", "purple", "events · /api/activity", "b")}
      </div>
      <div class="col" style="justify-content:center">
        ${node("games", "Player · :5174 / :5001", "SDLC Games (Gamify Engage)", "React player app + Express/Sequelize API. Thin consumer — forwards gameplay events, mirrors what GAMRU returns.", "CONSUMER", 2)}
        ${node("db", "PostgreSQL", "Games database", "users · wallets (RM/BM) · bonuses · user_missions / user_tournaments (read-through cache)", "", 3)}
      </div>
      <div class="col" style="justify-content:center; padding:0 8px">${arr("h", "", "profile sync", "")}</div>
      <div class="col" style="justify-content:center">
        ${node("ext", "External · :5000", "Hamara Engage", "Owns XP · level · rank · coins · streak. Player addressed by external_id; safe fallback if down.", "GAMIFICATION DATA", 4)}
        ${node("ext", "Embeddable", "Widgets &amp; iFrames", "/widget/:type + embed.js drop-in SDK — 9 interactive widgets, clientAuth validated.", "ANY SITE", 5)}
      </div>
    </div>`),

  // 2. Auth / JWT
  auth: shell("Authentication", "JWT sign-in, roles & sessions", `
    <div class="row">
      ${node("games", "1 · Browser", "Login form", "Email + password. GAMRU obfuscates the password with a shared secret before it leaves the page.", "", 0)}
      ${arr("h", "blue", "POST /api/auth/login")}
      ${node("gamru", "2 · Backend", "Verify &amp; sign", "bcrypt checks the hash, then issues a signed JWT access token + refresh token.", "jsonwebtoken", 2)}
      ${arr("h", "blue", "Bearer token")}
      ${node("games", "3 · Client", "Session + guards", "Token stored in sessionStorage; axios injects it. ProtectedRoute / AdminRoute / RBAC gate every page; 401 refreshes once then clears.", "", 4)}
    </div>`),

  // 3. Mission flow
  mission: shell("Mission Flow · GAMRU owns progress", "From authoring to claimed reward", `
    <div class="stack" style="max-width:1180px">
      ${stepRow("1", GAMRU, "Operator authors a <b>Mission</b> in GAMRU (event, target, reward) and sets it ACTIVE — stored in the <b>missions</b> table.", 0)}
      ${stepRow("2", GAMES, "Player app pulls the global catalog via <b>POST /players/by-email</b> (clientAuth) and the player taps <b>Join</b>.", 1)}
      ${stepRow("3", GAMES, "Player plays a game; the round fires <b>POST /api/activity</b> (WAGER / WIN …) up to GAMRU.", 2)}
      ${stepRow("4", GAMRU, "GAMRU's <b>mission-progress engine</b> matches the event, advances <b>mission_participants</b> (idempotent on event_id), flips IN&nbsp;PROGRESS → <b>COMPLETED</b>.", 3)}
      ${stepRow("5", GAMRU, "Player clicks <b>Claim</b> → <b>grantMissionReward</b> writes a row in the <b>player_rewards</b> ledger; mission → CLAIMED.", 4)}
      ${stepRow("6", GAMES, "Reward surfaces in the player's Rewards & wallet — and in the operator's per-player Gamification tab. <b>One loop, two views.</b>", 5)}
    </div>`),

  // 4. Tournament flow
  tournament: shell("Tournament Flow", "Compete, rank, settle, claim", `
    <div class="row">
      ${node("gamru", "Author", "Create tournament", "Window, eligible games, prize pool. ACTIVE = live for players.", "", 0)}
      ${arr("h", "purple", "join · score")}
      ${node("games", "Play", "Player competes", "Each scored round posts to /api/tournaments/:id/score → updates tournament_scores (plays, rank).", "", 2)}
      ${arr("h", "blue", "on end")}
      ${node("gamru", "Settle", "Rank & prizes", "GAMRU ranks the board and settles the pool 50 / 30 / 20 to the top three.", "AUTO", 4)}
      ${arr("h", "blue", "claim")}
      ${node("gamru", "Claim", "Prize → ledger", "Winner claims → player_rewards row (no local wallet payout).", "", 6)}
    </div>`),

  // 5. Campaign → inbox
  campaign: shell("Campaign Flow · CRM delivery engine", "Author → deliver → on-site inbox → analytics", `
    <div class="stack" style="max-width:1200px">
      ${stepRow("1", GAMRU, "Build a <b>Template</b> (channel + tokens), a <b>Segment</b> (rule tree → real players) and a <b>Campaign</b> (trigger + channel + template).", 0)}
      ${stepRow("2", GAMRU, "<b>Send Now</b> — or an event (<b>Registration / First Deposit / Login</b>) pushed from the games platform fires the matching campaign.", 1)}
      ${stepRow("3", GAMRU, "<b>Delivery engine</b> per player: consent → unsubscribe → frequency-cap → render template → write an inbox row → record SENT / DELIVERED.", 2)}
      ${stepRow("4", GAMES, "The message lands in the player's on-site <b>Inbox</b> (unread badge). Opening it = <b>OPEN</b>; the CTA = <b>CLICK</b> — both flow back as analytics.", 3)}
      ${stepRow("5", GAMRU, "<b>CRM → Analytics</b> shows real Sent / Delivered / Opened / Clicked — feeding the next campaign's targeting.", 4)}
    </div>`),

  // 6. Bonus RM/BM pointer pattern
  bonus: shell("Bonus Flow · the pointer pattern", "Defined on Games, triggered by GAMRU progression", `
    <div class="stack" style="max-width:1200px">
      ${stepRow("1", GAMES, "Operator defines a <b>Bonus</b> on the games platform (amount + <b>RM</b> Real-Money / <b>BM</b> Bonus-Money) and copies its <b>Bonus ID</b>.", 0)}
      ${stepRow("2", GAMRU, "That ID is <b>pinned to a Level or Rank</b> in GAMRU's Ranks wizard — GAMRU only stores a pointer, it never calls the games API to grant.", 1)}
      ${stepRow("3", GAMRU, "The bonus IDs ride the existing <b>POST /players/by-email</b> payload (levels[].bonusIds, ranks[].bonus_ids).", 2)}
      ${stepRow("4", GAMES, "On profile read, <b>reconcileBonusGrants</b> grants every reached level/rank bonus once (idempotent) → user_bonuses <b>PENDING</b> + notification.", 3)}
      ${stepRow("5", GAMES, "Player <b>Claims</b> in Rewards → credits the wallet: <b>RM → real_money, BM → bonus_money</b>, keeping balance = RM + BM.", 4)}
      ${stepRow("6", GAMRU, "A mirror (GET /bonuses/catalog + POST /user-bonuses/record) lets operators see every bonus & claim back in GAMRU → <b>Gamification → Bonuses</b>.", 5)}
    </div>`),

  // 7. Widget / iframe
  widget: shell("Widget & iFrame System", "Author once, embed anywhere", `
    <div class="row">
      ${node("gamru", "Author", "Widget Setup", "Pick a client + type, theme it, copy the iframe or embed.js snippet. 9 page widgets + compact stats widgets.", "", 0)}
      ${arr("h", "purple", "&lt;script embed.js&gt;")}
      ${node("games", "Embed", "Drop-in SDK", "embed.js scans .gamification_widget divs and injects auto-resizing iframes to /widget/:type.", "", 2)}
      ${arr("h", "blue", "validate")}
      ${node("gamru", "Gate", "clientAuth + checks", "GET /widget/validate: auth key, client, status, expiry, allowed-domains. Data via POST /players/by-email.", "SECURE", 4)}
      ${arr("h", "blue", "interactive")}
      ${node("gamru", "Play", "Inside the iframe", "Mission / bundle / tournament widgets join, progress & claim — even nest the real game — all over GAMRU's clientAuth API.", "", 6)}
    </div>`),

  // 8. Generic event/data-flow loop
  dataflow: shell("Data Flow · every feature, end to end", "User action becomes synchronized data", `
    <div class="row" style="flex-wrap:wrap; max-width:1320px; gap:0">
      ${node("games", "Player", "User action", "Tap, play, deposit", "", 0)}${arr("h","purple")}
      ${node("games", "Client", "Frontend", "React + axios", "", 1)}${arr("h","purple")}
      ${node("games", "Server", "Backend", "Express service", "", 2)}${arr("h","blue", "event / by-email")}
      ${node("gamru", "Engine", "Business logic", "Match · advance · settle", "", 4)}${arr("h","blue")}
      ${node("db", "Store", "Database", "participants · scores · rewards", "", 5)}
    </div>
    <div class="row" style="margin-top:30px">
      ${node("ext", "Events", "Integration", "Idempotent, fire-and-forget, safe fallback if a side is down", "RESILIENT", 6)}
      ${arr("h","blue","snapshot back")}
      ${node("games", "Result", "UI update", "Progress, rewards & wallet refresh — auto-polled and toasted", "", 8)}
    </div>`),
};

export const DIAGRAM_IDS = Object.keys(DIAGRAMS);
