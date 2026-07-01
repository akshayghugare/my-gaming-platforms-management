// One command to rule them all:
//   1. start the 4 dev servers (skips any already running)
//   2. wait until every server is healthy
//   3. narrate (if audio missing) -> record -> assemble  => out/gamru-platform-tour.mp4
//   4. stop only the servers this script started
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const logDir = path.join(__dirname, "out");
fs.mkdirSync(logDir, { recursive: true });

const SERVERS = [
  { name: "gamru-backend",  cwd: "c:/sdlc/gamru/gamru-backend",                   health: "http://localhost:5000/api/health" },
  { name: "games-backend",  cwd: "c:/sdlc/sdlcgames/my-game-platform-backend",    health: "http://localhost:5001/api/health" },
  { name: "gamru-frontend", cwd: "c:/sdlc/gamru/gamru-frontend",                  health: "http://localhost:5173" },
  { name: "games-frontend", cwd: "c:/sdlc/sdlcgames/my-game-platform-frontend",   health: "http://localhost:5174" },
];

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function waitHealthy(url, label, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp(url)) return true;
    await sleep(1500);
  }
  throw new Error(`Timed out waiting for ${label} (${url})`);
}

const started = []; // { name, child } that we spawned and must clean up

function run(label, cmd, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true, cwd: __dirname, ...opts });
  if (res.status !== 0) throw new Error(`${label} failed (exit ${res.status})`);
}

function cleanup() {
  for (const s of started) {
    try {
      // npm spawns a node child tree on Windows — kill the whole tree.
      spawnSync("taskkill", ["/pid", String(s.child.pid), "/T", "/F"], { stdio: "ignore", shell: true });
      console.log(`■ stopped ${s.name}`);
    } catch {}
  }
}

try {
  // 1 + 2. bring up the stack
  console.log("=== Bringing up the stack ===");
  for (const s of SERVERS) {
    if (await isUp(s.health)) {
      console.log(`✔ ${s.name} already running`);
      continue;
    }
    console.log(`… starting ${s.name}`);
    const out = fs.openSync(path.join(logDir, `server-${s.name}.log`), "a");
    const child = spawn("npm", ["run", "dev"], {
      cwd: s.cwd,
      shell: true,
      detached: false,
      stdio: ["ignore", out, out],
    });
    started.push({ name: s.name, child });
  }
  for (const s of SERVERS) {
    await waitHealthy(s.health, s.name);
    console.log(`✔ ${s.name} healthy`);
  }

  // 3. build the video
  console.log("\n=== Building the video ===");
  if (!fs.existsSync(path.join(__dirname, "audio", "durations.json"))) {
    run("narrate (SAPI)", "powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "narrate.ps1"]);
  } else {
    console.log("▶ narrate: skipped (audio already generated — delete audio/ to regenerate)");
  }
  run("record (Playwright)", "node", ["record.mjs"]);
  run("assemble (ffmpeg)", "node", ["assemble.mjs"]);

  console.log("\n✅ All done → out/gamru-platform-tour.mp4");
} catch (err) {
  console.error("\n❌ " + err.message);
  process.exitCode = 1;
} finally {
  cleanup();
}
