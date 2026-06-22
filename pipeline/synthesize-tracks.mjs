/**
 * Re-sintetiza apenas os chunks usados nas trilhas de aprendizado.
 */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = join(__dirname, "synthesize-chunks.mjs");

const result = spawnSync(process.execPath, [script, "--tracks-only"], {
  stdio: "inherit",
  cwd: __dirname,
});

process.exit(result.status ?? 1);
