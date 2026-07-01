// Records one continuous video touring every feature of both apps AND performing
// real actions (create/update mission & reward & user, join mission, play a game
// to earn XP, deposit), with caption overlays. Writes out/tour.webm and
// out/timeline.json (scene start offsets) for the audio muxing step.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as A from "./actions.mjs";
import { DIAGRAMS } from "./diagrams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
const scenes = readJson(path.join(__dirname, "scenes.json"));
const durations = readJson(path.join(__dirname, "audio", "durations.json"));

const BASE = A.BASES;
const W = 1600, H = 900;
const LEAD_MS = 350;    // beat after caption appears before narration starts
const TRAIL_MS = 1000;  // breathing room after narration ends
const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });
const sleep = A.sleep;

// Map scene.act ids to functions. Nav scenes use "none"/"scrollForm".
const ACTS = {
  none: async () => {},
  scrollForm: async (page) => {
    await page.mouse.wheel(0, 500).catch(() => {}); await sleep(1400);
    await page.mouse.wheel(0, 500).catch(() => {}); await sleep(1400);
    await page.mouse.wheel(0, -1000).catch(() => {}); await sleep(500);
  },
  gamruLogin: A.gamruLogin,
  gamesLogin: A.gamesLogin,
  createMission: A.createMission,
  editMission: A.editMission,
  createRewardProduct: A.createRewardProduct,
  createUser: A.createUser,
  deleteMission: A.deleteMission,
  deleteRewardProduct: A.deleteRewardProduct,
  deleteUser: A.deleteUser,
  openFirstPlayer: A.openFirstPlayer,
  joinMission: A.joinMission,
  playClickStorm: A.playClickStorm,
  doDeposit: A.doDeposit,
};

// ---- caption overlay (injected fresh; re-injectable during action scenes) ------
async function showCaption(page, scene, idx, total) {
  const appLabel =
    scene.app === "gamru" ? "GAMRU · ADMIN CONSOLE"
    : scene.app === "diagram" ? "ARCHITECTURE · DATA FLOW"
    : "GAMIFY ENGAGE · PLAYER PLATFORM";
  const accent =
    scene.app === "gamru" ? "#3b82f6"
    : scene.app === "diagram" ? "#2dd4bf"
    : "#a855f7";
  const badge = scene.action ? "● LIVE ACTION" : "";
  await page.evaluate(
    ({ title, narration, appLabel, accent, idx, total, badge }) => {
      document.getElementById("__tour_cap")?.remove();
      const wrap = document.createElement("div");
      wrap.id = "__tour_cap";
      wrap.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Inter,Segoe UI,system-ui,sans-serif;";
      wrap.innerHTML = `
        <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center">
          <div style="background:rgba(2,6,23,.82);border:1px solid ${accent}55;color:${accent};
               padding:7px 16px;border-radius:999px;font-size:12px;font-weight:700;
               letter-spacing:.14em;backdrop-filter:blur(6px);box-shadow:0 6px 24px rgba(0,0,0,.5)">
            ${appLabel} &nbsp;·&nbsp; ${idx + 1}/${total}
          </div>
          ${badge ? `<div style="background:#dc2626;color:#fff;padding:7px 14px;border-radius:999px;
               font-size:12px;font-weight:800;letter-spacing:.1em;box-shadow:0 6px 24px rgba(220,38,38,.5)">${badge}</div>` : ""}
        </div>
        <div style="position:absolute;left:50%;bottom:34px;transform:translateX(-50%);
             width:min(1180px,92vw);background:rgba(2,6,23,.9);
             border:1px solid rgba(148,163,184,.18);border-left:5px solid ${accent};
             border-radius:16px;padding:18px 26px;backdrop-filter:blur(10px);
             box-shadow:0 18px 60px rgba(0,0,0,.6)">
          <div style="color:${accent};font-size:20px;font-weight:800;margin-bottom:7px">${title}</div>
          <div style="color:#e2e8f0;font-size:16px;line-height:1.55">${narration}</div>
        </div>`;
      document.body.appendChild(wrap);
    },
    { title: scene.title, narration: scene.narration, appLabel, accent, idx, total, badge }
  );
}

// ---- main --------------------------------------------------------------------
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: outDir, size: { width: W, height: H } },
});
const page = await context.newPage();
page.setDefaultTimeout(20000);

const recStart = Date.now();
const timeline = [];
const total = scenes.length;

for (let i = 0; i < total; i++) {
  const scene = scenes[i];
  const durSec = Number(durations[scene.id] || 6);
  const windowMs = LEAD_MS + Math.round(durSec * 1000) + TRAIL_MS;
  const url = scene.path ? BASE[scene.app] + scene.path : "(act-driven)";
  process.stdout.write(`[${String(i + 1).padStart(2)}/${total}] ${scene.action ? "ACTION " : ""}${scene.id} -> ${url}\n`);

  const act = ACTS[scene.act || "none"];

  if (scene.action) {
    // Action scene: caption + narration play WHILE the real action runs.
    if (scene.path) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => {});
    }
    await sleep(700);
    await showCaption(page, scene, i, total).catch(() => {});
    const atMs = Date.now() - recStart;
    timeline.push({ id: scene.id, atMs, narrationDelayMs: atMs + LEAD_MS, durSec });

    // run the action; keep the caption alive across its internal navigations
    const actP = act(page).catch((e) => process.stdout.write(`   act warn: ${e.message}\n`));
    const reinjector = (async () => {
      const end = Date.now() + windowMs;
      while (Date.now() < end) {
        await sleep(1200);
        await showCaption(page, scene, i, total).catch(() => {});
      }
    })();
    await Promise.race([actP, sleep(windowMs)]);
    await actP;                       // ensure the action finished
    await reinjector.catch(() => {});
    await showCaption(page, scene, i, total).catch(() => {}); // final caption on result
    await sleep(1200);
  } else {
    // Nav / diagram scene: render the page (live route OR a self-contained HTML
    // diagram), run any light act, then caption + hold for the narration window.
    if (scene.app === "diagram") {
      const html = DIAGRAMS[scene.diagram];
      if (!html) process.stdout.write(`   diagram warn: unknown diagram "${scene.diagram}"\n`);
      await page
        .setContent(html || `<body style="background:#020617"></body>`, { waitUntil: "load" })
        .catch((e) => process.stdout.write(`   setContent warn: ${e.message}\n`));
    } else if (scene.path) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      } catch (e) {
        process.stdout.write(`   goto warn: ${e.message}\n`);
      }
    }
    await sleep(900);
    try { await act(page); } catch (e) { process.stdout.write(`   act warn: ${e.message}\n`); }
    await showCaption(page, scene, i, total).catch(() => {});
    const atMs = Date.now() - recStart;
    timeline.push({ id: scene.id, atMs, narrationDelayMs: atMs + LEAD_MS, durSec });
    await sleep(windowMs);
  }
}

const totalMs = Date.now() - recStart;
const video = page.video();
await context.close();
await browser.close();

const src = await video.path();
const dst = path.join(outDir, "tour.webm");
if (fs.existsSync(dst) && src !== dst) fs.rmSync(dst);
if (src !== dst) fs.renameSync(src, dst);

fs.writeFileSync(
  path.join(outDir, "timeline.json"),
  JSON.stringify({ totalMs, leadMs: LEAD_MS, entries: timeline }, null, 2)
);
process.stdout.write(`\nDONE. video=${dst}  totalMs=${totalMs} (${(totalMs / 60000).toFixed(1)} min)\n`);
