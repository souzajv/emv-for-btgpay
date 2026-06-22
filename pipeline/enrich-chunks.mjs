/**
 * Enriquece chunks curados do HUB com conteúdo integral de content/raw e PDFs.
 * Preserva IDs e metadados; expande sections sem truncamento.
 *
 * Uso: node enrich-chunks.mjs [--dry-run] [--id=seguranca-terminal]
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { slugify } from "./lib/slugify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "content", "raw");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const TRACKS_DIR = join(ROOT, "content", "tracks");
const META_DIR = join(ROOT, "content", "_meta");

const SEED_RAW_HINTS = {
  "seguranca-terminal": "EMV-Acquirer-and-Terminal-Security-Guidelines",
  "tap-to-mobile-guidelines": "TapToMobile-Guidelines",
  "contactless-tap-mobile": "TapToMobile-Guidelines",
  "certificacao-l1-l2": "what-is-level-3-terminal-integration-testing",
  "certificacao-niveis-payfelix": "payfelix",
  "fundamentos-emv-chip": "emv-contact-chip",
  "fundamentos-cnp-cp": "not-present",
  "btgpay-flutter-pratica": "TapToMobile-Guidelines",
};

function walkJsonFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(full));
    } else if (entry.name.endsWith(".json") && !entry.name.startsWith("_")) {
      results.push(full);
    }
  }
  return results;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function collectTrackChunkIds() {
  const ids = new Set();
  if (!existsSync(TRACKS_DIR)) return ids;
  for (const file of readdirSync(TRACKS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const track = loadJson(join(TRACKS_DIR, file));
    for (const mod of track.modules ?? []) {
      for (const id of mod.chunkIds ?? []) ids.add(id);
    }
  }
  return ids;
}

function normalizeSourceKey(url = "") {
  return url
    .toLowerCase()
    .replace(/^file:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findRawFilesForChunk(chunk, allRawPaths) {
  const hints = [
    SEED_RAW_HINTS[chunk.id],
    normalizeSourceKey(chunk.sourceUrl),
    chunk.id,
  ].filter(Boolean);

  const matches = allRawPaths.filter((path) => {
    const name = basename(path).toLowerCase();
    return hints.some((h) => h && name.includes(String(h).toLowerCase().replace(/[^a-z0-9]+/g, "-")));
  });

  return [...new Set(matches)];
}

function dedupeSections(sections) {
  const seen = new Set();
  const out = [];
  for (const s of sections) {
    const key = s.bodyMd.slice(0, 200);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function splitBodyIntoSections(fullText) {
  const parts = fullText.split(/\n(?=\d+(?:\.\d+)+\s+[A-Z])/);
  const sections = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length < 80) continue;

    const headingMatch = trimmed.match(/^(\d+(?:\.\d+)*)\s+([^\n]+)/);
    const heading = headingMatch
      ? `${headingMatch[1]} ${headingMatch[2].trim()}`
      : trimmed.slice(0, 80).replace(/\n/g, " ");

    sections.push({
      anchorId: slugify(heading).slice(0, 48) || `sec-${sections.length}`,
      heading: heading.slice(0, 120),
      bodyMd: trimmed,
    });
  }

  return sections;
}

function mergeRawSections(rawPaths) {
  const merged = [];
  for (const path of rawPaths) {
    try {
      const raw = loadJson(path);
      for (const sec of raw.sections ?? []) {
        if (!sec.bodyMd || sec.bodyMd.length < 40) continue;
        merged.push({
          anchorId: sec.anchorId || slugify(sec.heading || "sec"),
          heading: sec.heading || "Conteúdo",
          bodyMd: sec.bodyMd,
        });
      }
    } catch {
      /* skip */
    }
  }

  const deduped = dedupeSections(merged);
  if (deduped.length <= 3) {
    const full = deduped.map((s) => s.bodyMd).join("\n\n");
    const split = splitBodyIntoSections(full);
    return split.length > 0 ? split : deduped;
  }
  return deduped;
}

function mapSeedAnchors(seedSections, enrichedSections) {
  if (!seedSections?.length) return enrichedSections;

  const keywords = seedSections.map((s) => ({
    anchorId: s.anchorId,
    heading: s.heading,
    bodyMd: s.bodyMd ?? "",
    tokens: `${s.heading} ${s.anchorId} ${s.bodyMd}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3),
  }));

  const buckets = keywords.map((k) => ({
    anchorId: k.anchorId,
    heading: k.heading,
    bodies: k.bodyMd ? [k.bodyMd] : [],
  }));

  for (const sec of enrichedSections) {
    const text = `${sec.heading} ${sec.bodyMd}`.toLowerCase();
    let best = 0;
    let bestIdx = 0;
    for (let i = 0; i < keywords.length; i++) {
      const score = keywords[i].tokens.reduce(
        (n, t) => n + (text.includes(t) ? 1 : 0),
        0
      );
      if (score > best) {
        best = score;
        bestIdx = i;
      }
    }
    buckets[bestIdx].bodies.push(sec.bodyMd);
  }

  return buckets.map((b) => ({
    anchorId: b.anchorId,
    heading: b.heading,
    bodyMd: [...new Set(b.bodies)].join("\n\n"),
  }));
}

function enrichChunk(chunk, rawPaths) {
  const enrichedSections = mergeRawSections(rawPaths);
  if (enrichedSections.length === 0) return null;

  const sections =
    chunk.sections?.length > 0
      ? mapSeedAnchors(chunk.sections, enrichedSections)
      : enrichedSections;

  const totalChars = sections.reduce((n, s) => n + s.bodyMd.length, 0);

  return {
    ...chunk,
    sections,
    scrapedAt: new Date().toISOString(),
    enrichedFrom: rawPaths.map((p) => p.replace(ROOT + "\\", "").replace(ROOT + "/", "")),
    enrichedChars: totalChars,
  };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyId = process.argv.find((a) => a.startsWith("--id="))?.split("=")[1];

  const trackIds = collectTrackChunkIds();
  const allRaw = walkJsonFiles(RAW_DIR);
  const report = [];

  mkdirSync(META_DIR, { recursive: true });

  for (const file of readdirSync(CHUNKS_DIR)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    const id = file.replace(/\.json$/, "");
    if (onlyId && id !== onlyId) continue;
    if (!trackIds.has(id) && !SEED_RAW_HINTS[id]) continue;

    const chunkPath = join(CHUNKS_DIR, file);
    const chunk = loadJson(chunkPath);
    const rawPaths = findRawFilesForChunk(chunk, allRaw);
    if (rawPaths.length === 0) {
      report.push({ id, status: "skipped", reason: "no raw match" });
      continue;
    }

    const enriched = enrichChunk(chunk, rawPaths);
    if (!enriched) {
      report.push({ id, status: "skipped", reason: "empty raw" });
      continue;
    }

    const before = chunk.sections?.reduce((n, s) => n + s.bodyMd.length, 0) ?? 0;
    if (!dryRun) {
      writeFileSync(chunkPath, JSON.stringify(enriched, null, 2));
    }
    report.push({
      id,
      status: dryRun ? "dry-run" : "enriched",
      rawFiles: rawPaths.length,
      charsBefore: before,
      charsAfter: enriched.enrichedChars,
      sections: enriched.sections.length,
    });
  }

  const reportPath = join(META_DIR, "enrich-report.json");
  if (!dryRun) writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  console.log(dryRun ? "(dry-run, nada gravado)" : `Relatório: ${reportPath}`);
}

main();
