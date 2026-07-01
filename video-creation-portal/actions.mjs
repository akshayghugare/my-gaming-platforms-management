// Real end-to-end action functions used by the recorder.
// Every action is best-effort (never throws out) but aims to actually succeed
// so the video shows genuine create / update / claim / play / earn flows.
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BASE = { gamru: "http://localhost:5173", games: "http://localhost:5174" };
// admin@test.com / 123456 is the working account on BOTH platforms (the old
// tourdemo.* demo accounts no longer exist). On the games side it is an ADMIN,
// so it can also demo the ADMIN-only Bonus Management page.
const CREDS = {
  gamru: { email: "admin@test.com", password: "test@123" },
  games: { email: "admin@test.com", password: "123456" },
};

// A stable-ish unique suffix so repeated runs don't collide.
export const RUN_TAG = String(Math.floor(Date.now() / 1000)).slice(-5);
export const MISSION_NAME = `Daily Wager Challenge ${RUN_TAG}`;
export const PRODUCT_NAME = `Bonus Coin Pack ${RUN_TAG}`;
export const USER_NAME = `Demo Player ${RUN_TAG}`;

async function gotoToast(page) {
  // returns the most recent toast text, if any
  return (await page.locator(".Toastify__toast-body, .Toastify__toast").first().textContent({ timeout: 1500 }).catch(() => "")) || "";
}

export async function gamruLogin(page) {
  await page.goto(BASE.gamru + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#login-email", CREDS.gamru.email).catch(() => {});
  await page.fill("#login-password", CREDS.gamru.password).catch(() => {});
  await page.click('button[type="submit"]').catch(() => {});
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
  await sleep(800);
}

export async function gamesLogin(page) {
  await page.goto(BASE.games + "/login", { waitUntil: "domcontentloaded" });
  // fields pre-fill with admin@test.com/123456; fill() select-all-replaces a
  // controlled React input, so it reliably overwrites.
  await page.fill('input[placeholder="Email"]', CREDS.games.email).catch(() => {});
  await page.fill('input[placeholder="Password"]', CREDS.games.password).catch(() => {});
  await page.click('button:has-text("Login")').catch(() => {});
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
  await sleep(800);
}

const clickNext = (page) =>
  page.getByRole("button", { name: /Next Step/i }).click({ timeout: 4000 }).catch(() => {});

// GAMRU wizard/modal fields render as  <div><label>Label</label><input/></div>
// with NO htmlFor/id. Scope through the wrapping div (robust against the
// required-field " *" span and future markup tweaks). `has-text` is substring,
// so labels carrying parenthetical examples still match by their leading words.
const lbl = (t) => `label:has-text(${JSON.stringify(t)})`;
const fillField = (scope, text, val) =>
  scope.locator(`div:has(> ${lbl(text)}) input`).first().fill(val).catch(() => {});
const selField = (scope, text, val) =>
  scope.locator(`div:has(> ${lbl(text)}) select`).first().selectOption(val).catch(() => {});
const areaField = (scope, text, val) =>
  scope.locator(`div:has(> ${lbl(text)}) textarea`).first().fill(val).catch(() => {});

// ---- GAMRU: create a mission through the 5-step wizard --------------------------
export async function createMission(page) {
  await page.goto(BASE.gamru + "/gamification/missions/create", { waitUntil: "domcontentloaded" });
  await sleep(1200);
  // Step 1 — details
  await fillField(page, "Internal name", MISSION_NAME);
  await selField(page, "Mission type / category", "Casino");
  await areaField(page, "Description", "Wager to earn XP and bonus cash. Created live in this demo.");
  await sleep(800);
  await clickNext(page);
  // Step 2 — objective
  await selField(page, "Event", "wager");
  await fillField(page, "Target Value", "100");
  await fillField(page, "Condition label", "Wager $100");
  await sleep(700);
  await clickNext(page);
  // Step 3 — time settings (defaults fine)
  await sleep(500);
  await clickNext(page);
  // Step 4 — rewards
  await selField(page, "Reward Type", "xp");
  await fillField(page, "Reward Amount", "50");
  await fillField(page, "Reward label", "50 XP Bonus");
  await sleep(700);
  await clickNext(page);
  // Step 5 — status + save
  await page.getByRole("button", { name: /^ACTIVE$/ }).click({ timeout: 3000 }).catch(() => {});
  await page.getByRole("button", { name: /^Save$/ }).click({ timeout: 4000 }).catch(() => {});
  await page.waitForURL("**/gamification/missions", { timeout: 15000 }).catch(() => {});
  await sleep(1800);
  return { url: page.url(), toast: await gotoToast(page) };
}

// ---- GAMRU: edit the mission we just created -----------------------------------
export async function editMission(page) {
  await page.goto(BASE.gamru + "/gamification/missions", { waitUntil: "domcontentloaded" });
  await sleep(1500);
  const row = page.locator(`tr:has-text("${MISSION_NAME}")`).first();
  // open the row's kebab (icon-only button, no accessible name) then Edit
  await row.locator("button:has(svg)").last().click({ timeout: 4000 }).catch(() => {});
  await sleep(500);
  await page.getByRole("button", { name: "Edit" }).click({ timeout: 3000 }).catch(() => {});
  await page.waitForURL("**/missions/create**", { timeout: 10000 }).catch(() => {}); // ?id=<id>, editing=true
  await sleep(1200);
  // quickest visible change: rewrite the description, then bump reward amount
  await areaField(page, "Description", "UPDATED: now worth more XP — edited live in this demo.");
  // walk Details -> Objectives -> Time -> Rewards (step 4) and bump amount
  await clickNext(page); await sleep(400);
  await clickNext(page); await sleep(400);
  await clickNext(page); await sleep(400);
  await fillField(page, "Reward Amount", "75");
  await clickNext(page); await sleep(400);
  await page.getByRole("button", { name: /^ACTIVE$/ }).click({ timeout: 3000 }).catch(() => {});
  await page.getByRole("button", { name: /^(Save|Update)$/ }).click({ timeout: 4000 }).catch(() => {});
  await page.waitForURL("**/gamification/missions", { timeout: 15000 }).catch(() => {});
  await sleep(1500);
  return { url: page.url(), toast: await gotoToast(page) };
}

// ---- GAMRU: create a reward-shop product ---------------------------------------
export async function createRewardProduct(page) {
  await page.goto(BASE.gamru + "/gamification/reward-shop/create", { waitUntil: "domcontentloaded" });
  await sleep(1200);
  // Step 1 — details
  await fillField(page, "Name", PRODUCT_NAME);
  await selField(page, "Category", "Product");
  await areaField(page, "Description", "A coin pack players can redeem with earned tokens.");
  await sleep(700);
  await clickNext(page);
  // Step 2 — type & price
  await selField(page, "Type", "Internal");
  await fillField(page, "Token Price", "100");
  await sleep(600);
  await clickNext(page);
  // Step 3 — settings
  await fillField(page, "Stock", "50");
  await selField(page, "Product Visibility", "Visible");
  await sleep(500);
  await clickNext(page);
  // Step 4 — eligibility (All Players default)
  await selField(page, "Eligibility", "All Players");
  await sleep(500);
  await clickNext(page);
  // Step 5 — status + save
  await page.getByRole("button", { name: /^ACTIVE$/ }).click({ timeout: 3000 }).catch(() => {});
  await page.getByRole("button", { name: /^Save$/ }).click({ timeout: 4000 }).catch(() => {});
  await page.waitForURL("**/gamification/reward-shop", { timeout: 15000 }).catch(() => {});
  await sleep(1800);
  return { url: page.url(), toast: await gotoToast(page) };
}

// ---- GAMRU: create a user via the modal on Settings > Users ---------------------
export async function createUser(page) {
  await page.goto(BASE.gamru + "/settings/users", { waitUntil: "domcontentloaded" });
  await sleep(1200);
  await page.getByRole("button", { name: /Create New User/i }).click({ timeout: 4000 }).catch(() => {});
  await sleep(900);
  const modal = page.locator('div:has(> h2:has-text("Create New User"))').last();
  await fillField(modal, "First Name", "Demo");
  await fillField(modal, "Last Name", `Player ${RUN_TAG}`);
  await fillField(modal, "Email", `demo.player.${RUN_TAG}@demo.com`);
  await fillField(modal, "Mobile", `90000${RUN_TAG}`);
  await fillField(modal, "Username", `demo${RUN_TAG}`);
  // role select — options load async from /roles; wait until a real option
  // (beyond the "Select Role" placeholder at index 0) exists, then pick it.
  const roleSel = modal.locator(`div:has(> ${lbl("Role")}) select`).first();
  for (let i = 0; i < 12; i++) {
    const n = await roleSel.locator("option").count().catch(() => 0);
    if (n > 1) break;
    await sleep(400);
  }
  // backend requires role === "USER" | "ADMIN"; pick USER by value, fall back to first real option
  await roleSel.selectOption("USER").catch(async () => {
    await roleSel.selectOption({ index: 1 }).catch(() => {});
  });
  await sleep(700);
  await modal.getByRole("button", { name: /^Save$/ }).click({ timeout: 4000 }).catch(() => {});
  await sleep(2000);
  return { toast: await gotoToast(page) };
}

// Delete confirmation is a Toastify toast with Yes/No buttons (DeleteRecord.tsx).
async function confirmDeleteYes(page) {
  await sleep(700);
  await page.getByRole("button", { name: /^Yes$/ }).click({ timeout: 3500 }).catch(async () => {
    await page.locator('.Toastify button:has-text("Yes")').first().click({ timeout: 2500 }).catch(() => {});
  });
  await sleep(1500);
}

// ---- GAMRU: delete the mission we created (completes Create→Update→Delete) ------
export async function deleteMission(page) {
  await page.goto(BASE.gamru + "/gamification/missions", { waitUntil: "domcontentloaded" });
  await sleep(1500);
  const row = page.locator(`tr:has-text("${MISSION_NAME}")`).first();
  await row.locator("button:has(svg)").last().click({ timeout: 4000 }).catch(() => {});
  await sleep(500);
  await page.getByRole("button", { name: /^Delete$/ }).click({ timeout: 3000 }).catch(() => {});
  await confirmDeleteYes(page);
  return { toast: await gotoToast(page) };
}

// ---- GAMRU: delete the reward product we created -------------------------------
export async function deleteRewardProduct(page) {
  await page.goto(BASE.gamru + "/gamification/reward-shop", { waitUntil: "domcontentloaded" });
  await sleep(1500);
  const row = page.locator(`tr:has-text("${PRODUCT_NAME}")`).first();
  await row.locator("button:has(svg)").last().click({ timeout: 4000 }).catch(() => {});
  await sleep(500);
  await page.getByRole("button", { name: /^Delete$/ }).click({ timeout: 3000 }).catch(() => {});
  await confirmDeleteYes(page);
  return { toast: await gotoToast(page) };
}

// ---- GAMRU: search for, then delete, the user we created (also shows filter) ----
export async function deleteUser(page) {
  await page.goto(BASE.gamru + "/settings/users", { waitUntil: "domcontentloaded" });
  await sleep(1400);
  await page.locator('input[placeholder*="Search"]').first().fill(`demo${RUN_TAG}`).catch(() => {});
  await sleep(1300);
  const row = page.locator(`tr:has-text("demo${RUN_TAG}")`).first();
  await row.getByRole("button", { name: /^Delete$/ }).click({ timeout: 4000 }).catch(async () => {
    await row.locator("button:has(svg)").last().click({ timeout: 2500 }).catch(() => {});
    await page.getByRole("button", { name: /^Delete$/ }).click({ timeout: 2500 }).catch(() => {});
  });
  await confirmDeleteYes(page);
  return { toast: await gotoToast(page) };
}

// ---- GAMRU: open the first player and show the Gamification (progress) tab ------
export async function openFirstPlayer(page) {
  await page.goto(BASE.gamru + "/players", { waitUntil: "domcontentloaded" });
  await sleep(1500);
  await page.locator("table tbody tr").first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForURL("**/players/**", { timeout: 8000 }).catch(() => {});
  await sleep(1200);
  // open the Gamification tab (per-player mission/tournament progress)
  await page.getByRole("button", { name: /Gamification/i }).click({ timeout: 3000 }).catch(async () => {
    await page.getByText(/Gamification/i).first().click({ timeout: 2000 }).catch(() => {});
  });
  await sleep(1300);
  return { url: page.url() };
}

// ---- GAMES: join the first available mission ------------------------------------
export async function joinMission(page) {
  await page.goto(BASE.games + "/missions", { waitUntil: "domcontentloaded" });
  await sleep(1500);
  // open first mission card (cards are <button class="... group ...">)
  await page.locator(".grid button.group, button.group").first().click({ timeout: 4000 }).catch(() => {});
  await sleep(900);
  await page.getByRole("button", { name: /Join Mission/i }).click({ timeout: 4000 }).catch(() => {});
  await sleep(1200);
  const toast = await gotoToast(page);
  // close the detail drawer via its Close button (Escape doesn't dismiss it)
  await page.getByRole("button", { name: "Close" }).click({ timeout: 2000 }).catch(() => {});
  await sleep(600);
  return { toast };
}

// ---- GAMES: actually play Click Storm and earn XP -------------------------------
export async function playClickStorm(page) {
  await page.goto(BASE.games + "/games/click-storm", { waitUntil: "domcontentloaded" });
  await sleep(1200);
  await page.getByRole("button", { name: /Start/i }).first().click({ timeout: 5000 }).catch(() => {});
  const end = Date.now() + 15500; // round is a fixed 15s timer
  while (Date.now() < end) {
    await page.locator('button[data-target="1"]').first().click({ timeout: 250 }).catch(() => {});
    await sleep(110);
  }
  await sleep(1800); // game auto-stops and awards XP (hits * 3)
  return { toast: await gotoToast(page) };
}

// ---- GAMES: deposit into the wallet (credits Real Money) ------------------------
export async function doDeposit(page) {
  await page.goto(BASE.games + "/deposit", { waitUntil: "domcontentloaded" });
  await sleep(1200);
  await page.locator("#amount").fill("50").catch(async () => {
    await page.getByRole("button", { name: /\+50/ }).click().catch(() => {});
  });
  await sleep(600);
  await page.locator('button[type="submit"]:has-text("Deposit"), button:has-text("Deposit")').first().click({ timeout: 4000 }).catch(() => {});
  await sleep(1500);
  return { toast: await gotoToast(page) };
}

export const BASES = BASE;
