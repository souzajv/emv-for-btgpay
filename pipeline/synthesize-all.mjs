/**
 * Re-sintetiza todos os chunks, audita, auto-enriquece falhas e repete até 0 english.
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadJson } from "./lib/chunk-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const META = join(__dirname, "..", "content", "_meta", "chunk-audit-report.json");

function run(script, args = []) {
  const r = spawnSync(process.execPath, [join(__dirname, script), ...args], {
    stdio: "inherit",
    cwd: __dirname,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const MAX_ROUNDS = 3;
for (let round = 1; round <= MAX_ROUNDS; round++) {
  console.log(`\n=== Rodada ${round}: synthesize all ===`);
  run("synthesize-chunks.mjs");
  run("audit-all-chunks.mjs");

  if (!existsSync(META)) break;
  const audit = loadJson(META);
  const english = audit.summary?.english ?? 0;
  const thin = audit.summary?.thin ?? 0;
  console.log(`english=${english} thin=${thin}`);

  if (english === 0 && thin === 0) break;
  if (round < MAX_ROUNDS) {
    console.log("\n=== auto-enrich ===");
    run("auto-enrich-from-audit.mjs");
  }
}

run("verify-chunk-claims.mjs");
run("generate-quizzes-from-content.mjs");
