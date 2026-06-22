/**
 * Fila de síntese por ondas para o agente emv-content-synthesizer.
 * Uso: node batch-synthesize.mjs [--init]
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  collectTrackChunkIds,
  loadAllChunks,
} from "./lib/chunk-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const TRACKS_DIR = join(ROOT, "content", "tracks");
const META_DIR = join(ROOT, "content", "_meta");
const QUEUE_PATH = join(META_DIR, "synthesis-queue.json");

function buildWaves(chunks, trackIds) {
  const wave1 = chunks.filter((c) => trackIds.has(c.id)).map((c) => c.id);
  const wave1Set = new Set(wave1);
  const wave2 = chunks
    .filter((c) => !wave1Set.has(c.id) && c.btgpayRelevance === "alta")
    .map((c) => c.id);
  const wave2Set = new Set([...wave1, ...wave2]);
  const wave3 = chunks.filter((c) => !wave2Set.has(c.id)).map((c) => c.id);

  return { wave1, wave2, wave3 };
}

function main() {
  mkdirSync(META_DIR, { recursive: true });
  const chunks = loadAllChunks(CHUNKS_DIR);
  const trackIds = collectTrackChunkIds(TRACKS_DIR);
  const waves = buildWaves(chunks, trackIds);

  let existing = {};
  if (existsSync(QUEUE_PATH)) {
    try {
      existing = JSON.parse(readFileSync(QUEUE_PATH, "utf-8"));
    } catch {
      existing = {};
    }
  }

  const statusOf = (id) => existing.items?.[id]?.status ?? "pending";

  const items = {};
  for (const id of [...waves.wave1, ...waves.wave2, ...waves.wave3]) {
    items[id] = {
      status: statusOf(id),
      wave: waves.wave1.includes(id) ? 1 : waves.wave2.includes(id) ? 2 : 3,
    };
  }

  const queue = {
    updatedAt: new Date().toISOString(),
    total: chunks.length,
    waves: {
      1: { label: "trilhas", ids: waves.wave1, count: waves.wave1.length },
      2: { label: "alta", ids: waves.wave2, count: waves.wave2.length },
      3: { label: "restante", ids: waves.wave3, count: waves.wave3.length },
    },
    items,
  };

  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log(`Fila: ${QUEUE_PATH}`);
  console.log(`Onda 1 (trilhas): ${waves.wave1.length}`);
  console.log(`Onda 2 (alta): ${waves.wave2.length}`);
  console.log(`Onda 3 (restante): ${waves.wave3.length}`);
  console.log(`Total: ${chunks.length}`);
}

main();
