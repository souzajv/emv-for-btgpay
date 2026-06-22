/**
 * Valida sourceChunkId + anchorId de cada pergunta do quiz.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadAllChunks } from "./lib/chunk-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const QUIZZES_DIR = join(ROOT, "content", "quizzes");

function main() {
  const chunks = loadAllChunks(CHUNKS_DIR);
  const chunkMap = new Map(chunks.map((c) => [c.id, c]));
  const errors = [];

  for (const level of ["junior", "pleno", "senior"]) {
    const path = join(QUIZZES_DIR, `${level}.json`);
    if (!existsSync(path)) {
      errors.push(`Missing ${level}.json`);
      continue;
    }
    const data = JSON.parse(readFileSync(path, "utf-8"));
    const seenIds = new Set();
    for (const q of data.questions ?? []) {
      if (seenIds.has(q.id)) errors.push(`${level}: duplicate id ${q.id}`);
      seenIds.add(q.id);

      const chunk = chunkMap.get(q.sourceChunkId);
      if (!chunk) {
        errors.push(`${level} ${q.id}: unknown chunk ${q.sourceChunkId}`);
        continue;
      }
      const anchor = chunk.sections?.some((s) => s.anchorId === q.anchorId);
      if (!anchor) {
        errors.push(
          `${level} ${q.id}: anchor ${q.anchorId} not in chunk ${q.sourceChunkId}`
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("Quiz anchors OK");
}

main();
