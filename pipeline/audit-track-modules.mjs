/**
 * Audita profundidade e idioma das seções usadas nas trilhas.
 * Gera content/_meta/track-audit-report.json
 */
import { writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  walkJsonFiles,
  loadJson,
  findRawFilesForChunk,
  mergeRawText,
} from "./lib/chunk-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "content", "raw");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const TRACKS_DIR = join(ROOT, "content", "tracks");
const META_DIR = join(ROOT, "content", "_meta");

const EMV_TERMS = [
  "ARQC", "CDCVM", "AID", "TVR", "TAC", "DE 55", "kernel", "NFC", "PCI",
  "ISO 14443", "Play Integrity", "DeviceCheck", "DUKPT", "SoftPOS", "CPoC",
  "EMVCo", "L1", "L2", "L3", "CVM", "GPO", "PAN", "3DS",
];

const EN_MARKERS = /\b(the|and|should|assesses|testing|before exploring|level \d certification)\b/i;

function englishRatio(text) {
  if (!text) return 0;
  const words = text.match(/[a-zA-Z]{3,}/g) ?? [];
  if (words.length === 0) return 0;
  let en = 0;
  for (const w of words) {
    if (EN_MARKERS.test(w) || EN_MARKERS.test(text)) en++;
  }
  const enHits = (text.match(EN_MARKERS) ?? []).length;
  const ptHits = (text.match(/[áàâãéêíóôõúç]/gi) ?? []).length;
  if (ptHits > 2) return Math.max(0, enHits / words.length - 0.05);
  return Math.min(1, enHits / Math.max(1, words.length) + (enHits > 2 ? 0.3 : 0));
}

function termCoverage(rawText, bodyMd) {
  const rawUpper = rawText.toUpperCase();
  const bodyUpper = bodyMd.toUpperCase();
  const present = EMV_TERMS.filter(
    (t) => rawUpper.includes(t.toUpperCase()) && bodyUpper.includes(t.toUpperCase())
  );
  const missing = EMV_TERMS.filter(
    (t) => rawUpper.includes(t.toUpperCase()) && !bodyUpper.includes(t.toUpperCase())
  );
  const total = EMV_TERMS.filter((t) => rawUpper.includes(t.toUpperCase())).length;
  return {
    ratio: total ? present.length / total : 1,
    missing: missing.slice(0, 8),
  };
}

function classifySection(bodyMd, englishR, coverage) {
  if (englishR > 0.15) return "english";
  if (bodyMd.length < 350) return "thin";
  if (coverage.ratio < 0.4 && coverage.missing.length >= 2) return "missing_terms";
  return "ok";
}

function main() {
  mkdirSync(META_DIR, { recursive: true });
  const allRaw = walkJsonFiles(RAW_DIR);
  const chunkMap = new Map();
  for (const file of readdirSync(CHUNKS_DIR)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    const chunk = loadJson(join(CHUNKS_DIR, file));
    chunkMap.set(chunk.id, chunk);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: { ok: 0, thin: 0, english: 0, missing_terms: 0, total: 0 },
    modules: [],
  };

  for (const trackFile of readdirSync(TRACKS_DIR)) {
    if (!trackFile.endsWith(".json")) continue;
    const track = loadJson(join(TRACKS_DIR, trackFile));

    for (const mod of track.modules ?? []) {
      const modReport = {
        trackSlug: track.slug,
        trackTitle: track.title,
        moduleId: mod.id,
        moduleTitle: mod.title,
        sections: [],
      };

      for (const chunkId of mod.chunkIds ?? []) {
        const chunk = chunkMap.get(chunkId);
        if (!chunk) continue;
        const rawPaths = findRawFilesForChunk(chunk, allRaw);
        const rawText = mergeRawText(rawPaths, ROOT) || "";

        const anchorIds =
          mod.sectionAnchorIds?.length > 0
            ? mod.sectionAnchorIds
            : chunk.sections.map((s) => s.anchorId);

        for (const section of chunk.sections) {
          if (!anchorIds.includes(section.anchorId)) continue;
          const body = section.bodyMd ?? "";
          const enR = englishRatio(body);
          const coverage = termCoverage(rawText, body);
          const status = classifySection(body, enR, coverage);

          modReport.sections.push({
            chunkId,
            anchorId: section.anchorId,
            heading: section.heading,
            bodyChars: body.length,
            englishRatio: Math.round(enR * 100) / 100,
            termCoverage: Math.round(coverage.ratio * 100) / 100,
            missingTerms: coverage.missing,
            status,
          });

          report.summary.total++;
          report.summary[status]++;
        }
      }

      report.modules.push(modReport);
    }
  }

  const outPath = join(META_DIR, "track-audit-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Relatório: ${outPath}`);
}

main();
