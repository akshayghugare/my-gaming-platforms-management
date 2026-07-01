// Best-fit assembly for the truncated re-recording (page@<hash>.webm).
// Same offset/mux logic as assemble.mjs, but:
//   - input is the new (unfinalized, ~7.5 min) webm instead of tour.webm
//   - narration clips whose offset lands past the video's end are dropped
//   - -shortest clamps the result to the video length so no trailing audio
//     extends the picture.
// The video has no duration metadata, so we pass the measured length in ms.
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "out");
const audioDir = path.join(__dirname, "audio");
const video = path.join(outDir, "page@55d7d777902188602b5920959059d299.webm");
const timeline = JSON.parse(fs.readFileSync(path.join(outDir, "timeline.json"), "utf8"));
const finalMp4 = path.join(outDir, "gamru-tour-page.mp4");

// True video length (11210 frames @ 25 fps) — measured by full decode.
const VIDEO_MS = 448400;

// Keep only narration clips that actually start within the recorded video.
const kept = timeline.entries
  .map((e, k) => ({ e, k })) // preserve original index -> scene-{k}.wav mapping
  .filter(({ e }) => Math.round(e.narrationDelayMs) < VIDEO_MS);

console.log(
  `Keeping ${kept.length}/${timeline.entries.length} narration clips that fall within ` +
  `${(VIDEO_MS / 1000).toFixed(1)}s of video (dropping ${timeline.entries.length - kept.length} past the cutoff).`
);

const args = ["-y", "-i", video];
kept.forEach(({ k }) => {
  args.push("-i", path.join(audioDir, `scene-${String(k).padStart(2, "0")}.wav`));
});

// Each narration input is ffmpeg input index 1..N; delay it to its scene offset, then mix.
const delays = kept
  .map(({ e }, i) => `[${i + 1}:a]adelay=${Math.max(0, Math.round(e.narrationDelayMs))}:all=1[a${i}]`)
  .join(";");
const mixIns = kept.map((_, i) => `[a${i}]`).join("");
const filter = `${delays};${mixIns}amix=inputs=${kept.length}:normalize=0:dropout_transition=0[mix]`;

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
  "-shortest",
  "-movflags", "+faststart",
  finalMp4
);

console.log(`ffmpeg: ${ffmpegPath}`);
console.log(`Muxing ${kept.length} narration clips onto the new recording...`);
const res = spawnSync(ffmpegPath, args, { stdio: ["ignore", "inherit", "inherit"] });
if (res.status !== 0) {
  console.error("ffmpeg failed with status", res.status);
  process.exit(res.status || 1);
}
const mb = (fs.statSync(finalMp4).size / 1048576).toFixed(1);
console.log(`\nDONE -> ${finalMp4}  (${mb} MB)`);
