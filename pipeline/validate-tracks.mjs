import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dirname, "..", "content", "chunks");
const TRACKS_DIR = join(__dirname, "..", "content", "tracks");

function loadChunkIds() {
  if (!existsSync(CHUNKS_DIR)) return new Set();
  const ids = new Set();
  for (const file of readdirSync(CHUNKS_DIR)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    try {
      const raw = JSON.parse(readFileSync(join(CHUNKS_DIR, file), "utf-8"));
      if (raw.id) ids.add(raw.id);
    } catch {
      /* skip */
    }
  }
  return ids;
}

function main() {
  const chunkIds = loadChunkIds();
  const orphans = [];

  if (!existsSync(TRACKS_DIR)) {
    console.log("No tracks directory");
    process.exit(0);
  }

  for (const file of readdirSync(TRACKS_DIR).filter((f) => f.endsWith(".json"))) {
    const track = JSON.parse(readFileSync(join(TRACKS_DIR, file), "utf-8"));
    for (const mod of track.modules ?? []) {
      for (const chunkId of mod.chunkIds ?? []) {
        if (!chunkIds.has(chunkId)) {
          orphans.push({ track: track.slug, module: mod.id, chunkId });
        }
      }
    }
  }

  if (orphans.length > 0) {
    console.error("Orphan chunkIds in tracks:");
    for (const o of orphans) {
      console.error(`  ${o.track} / ${o.module}: ${o.chunkId}`);
    }
    process.exit(1);
  }

  console.log("All track chunkIds valid.");
}

main();
