// Muxes the per-scene narration onto the recorded video at the exact offsets
// captured in timeline.json, then encodes the final MP4.
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "out");
const audioDir = path.join(__dirname, "audio");
const video = path.join(outDir, "tour.webm");
const timeline = JSON.parse(fs.readFileSync(path.join(outDir, "timeline.json"), "utf8"));
const finalMp4 = path.join(outDir, "gamru-platform-tour.mp4");

const entries = timeline.entries;

const args = ["-y", "-i", video];
entries.forEach((_, k) => {
  args.push("-i", path.join(audioDir, `scene-${String(k).padStart(2, "0")}.wav`));
});

// Delay each narration clip to its scene offset, then mix them into one track.
const delays = entries
  .map((e, k) => `[${k + 1}:a]adelay=${Math.max(0, Math.round(e.narrationDelayMs))}:all=1[a${k}]`)
  .join(";");
const mixIns = entries.map((_, k) => `[a${k}]`).join("");
const filter = `${delays};${mixIns}amix=inputs=${entries.length}:normalize=0:dropout_transition=0[mix]`;

args.push(
  "-filter_complex", filter,
  "-map", "0:v:0",
  "-map", "[mix]",
  "-c:v", "libx264",
  "-preset", "veryfast",
  "-crf", "23",
  "-pix_fmt", "yuv420p",
  "-r", "30",
  "-c:a", "aac",
  "-b:a", "192k",
  "-movflags", "+faststart",
  finalMp4
);

console.log(`ffmpeg: ${ffmpegPath}`);
console.log(`Muxing ${entries.length} narration clips onto video...`);
const res = spawnSync(ffmpegPath, args, { stdio: ["ignore", "inherit", "inherit"] });
if (res.status !== 0) {
  console.error("ffmpeg failed with status", res.status);
  process.exit(res.status || 1);
}
const mb = (fs.statSync(finalMp4).size / 1048576).toFixed(1);
console.log(`\nDONE -> ${finalMp4}  (${mb} MB)`);
