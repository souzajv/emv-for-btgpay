import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dirname, "..", "content", "chunks");

function sanitize(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/\s*—\s*/g, ": ")
    .replace(/\s*–\s*/g, ", ")
    .replace(/\s*→\s*/g, " ")
    .replace(/: +,/g, ",")
    .trim();
}

function walk(obj) {
  if (typeof obj === "string") return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = walk(v);
    }
    return out;
  }
  return obj;
}

function main() {
  if (!existsSync(CHUNKS_DIR)) return;

  const files = readdirSync(CHUNKS_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_")
  );

  for (const file of files) {
    const path = join(CHUNKS_DIR, file);
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    if (!raw.id) continue;
    const cleaned = walk(raw);
    writeFileSync(path, JSON.stringify(cleaned, null, 2) + "\n", "utf-8");
  }

  console.log(`Sanitized ${files.length} chunk files`);
}

main();
