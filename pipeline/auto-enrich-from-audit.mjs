/**
 * Gera enrichments PT para seções thin/english a partir do audit.
 * Escreve/atualiza content/_meta/section-enrichments.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  walkJsonFiles,
  loadJson,
  findRawFilesForChunk,
  mergeRawText,
} from "./lib/chunk-source.mjs";
import { buildPtFromEnglishRaw } from "./lib/pt-from-english.mjs";
import { getCuratedSection } from "./lib/curated-sections.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "content", "raw");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const META_DIR = join(ROOT, "content", "_meta");
const AUDIT_PATH = join(META_DIR, "chunk-audit-report.json");
const OUT_PATH = join(META_DIR, "section-enrichments.json");

function main() {
  if (!existsSync(AUDIT_PATH)) {
    console.error("Rode audit-all-chunks.mjs primeiro.");
    process.exit(1);
  }

  const audit = loadJson(AUDIT_PATH);
  const existing = existsSync(OUT_PATH) ? loadJson(OUT_PATH) : {};
  const allRaw = walkJsonFiles(RAW_DIR);
  let added = 0;

  for (const fail of audit.failures ?? []) {
    const { chunkId, anchorId, heading, status } = fail;

    const curated = getCuratedSection(chunkId, anchorId);
    if (curated) {
      if (!existing[chunkId]) existing[chunkId] = {};
      existing[chunkId][anchorId] = curated;
      added++;
      console.log(`* curated ${chunkId}/${anchorId}`);
      continue;
    }

    if (existing[chunkId]?.[anchorId] && status !== "english") continue;

    const chunkPath = join(CHUNKS_DIR, `${chunkId}.json`);
    if (!existsSync(chunkPath)) continue;
    const chunk = loadJson(chunkPath);
    const section = chunk.sections.find((s) => s.anchorId === anchorId);
    const rawPaths = findRawFilesForChunk(chunk, allRaw);
    const rawText = mergeRawText(rawPaths, ROOT) || section?.bodyMd || "";

    const text = buildPtFromEnglishRaw(
      rawText,
      heading || section?.heading || chunk.title,
      chunk.category
    );

    if (!text || text.length < 120) continue;

    if (!existing[chunkId]) existing[chunkId] = {};
    existing[chunkId][anchorId] = text;
    added++;
    console.log(`+ ${chunkId}/${anchorId} (${status})`);
  }

  mkdirSync(META_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
  console.log(`Enrichments: ${added} novos em ${OUT_PATH}`);
}

main();
