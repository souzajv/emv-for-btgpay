/**
 * Audita idioma e profundidade de TODAS as seções de TODOS os chunks.
 * Gera content/_meta/chunk-audit-report.json
 */
import { writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadJson } from "./lib/chunk-source.mjs";
import {
  englishRatio,
  classifySectionBody,
  hasEnglishProse,
} from "./lib/language-audit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const META_DIR = join(ROOT, "content", "_meta");

function main() {
  mkdirSync(META_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    summary: { ok: 0, thin: 0, english: 0, total: 0, chunks: 0 },
    chunks: [],
    failures: [],
  };

  const files = readdirSync(CHUNKS_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_")
  );

  for (const file of files) {
    const chunk = loadJson(join(CHUNKS_DIR, file));
    const chunkReport = {
      chunkId: chunk.id,
      title: chunk.title,
      category: chunk.category,
      sections: [],
    };

    for (const section of chunk.sections ?? []) {
      const body = section.bodyMd ?? "";
      const enR = englishRatio(body);
      const status = classifySectionBody(body, enR);
      const englishProse = hasEnglishProse(body);

      const entry = {
        anchorId: section.anchorId,
        heading: section.heading,
        bodyChars: body.length,
        englishRatio: Math.round(enR * 100) / 100,
        englishProse,
        status: englishProse && status === "ok" ? "english" : status,
      };

      chunkReport.sections.push(entry);
      report.summary.total++;
      report.summary[entry.status]++;

      if (entry.status !== "ok") {
        report.failures.push({
          chunkId: chunk.id,
          anchorId: section.anchorId,
          heading: section.heading,
          status: entry.status,
          bodyChars: body.length,
        });
      }
    }

    report.summary.chunks++;
    report.chunks.push(chunkReport);
  }

  const outPath = join(META_DIR, "chunk-audit-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.failures.length) {
    console.log(`Falhas: ${report.failures.length} (ver ${outPath})`);
  } else {
    console.log("Todos os chunks passaram no audit de idioma.");
  }
}

main();
