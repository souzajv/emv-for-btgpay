import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

export const SEED_RAW_HINTS = {
  "seguranca-terminal": "EMV-Acquirer-and-Terminal-Security-Guidelines",
  "tap-to-mobile-guidelines": "TapToMobile-Guidelines",
  "contactless-tap-mobile": "TapToMobile-Guidelines",
  "certificacao-l1-l2": "what-is-level-3-terminal-integration-testing",
  "certificacao-niveis-payfelix": "payfelix",
  "fundamentos-emv-chip": "emv-contact-chip",
  "fundamentos-cnp-cp": "not-present",
  "btgpay-flutter-pratica": "TapToMobile-Guidelines",
};

export function walkJsonFiles(dir) {
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

export function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function normalizeSourceKey(url = "") {
  return url
    .toLowerCase()
    .replace(/^file:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findRawFilesForChunk(chunk, allRawPaths) {
  const hints = [
    SEED_RAW_HINTS[chunk.id],
    normalizeSourceKey(chunk.sourceUrl),
    basename(chunk.sourceUrl || "").replace(/\.pdf$/i, ""),
    chunk.id,
  ].filter(Boolean);

  const matches = allRawPaths.filter((path) => {
    const name = basename(path).toLowerCase();
    return hints.some((h) => {
      const norm = String(h).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return norm.length > 3 && name.includes(norm);
    });
  });

  if (matches.length > 0) return [...new Set(matches)];

  const urlKey = normalizeSourceKey(chunk.sourceUrl);
  if (urlKey.length > 8) {
    const fuzzy = allRawPaths.filter((p) =>
      basename(p).toLowerCase().includes(urlKey.slice(0, 20))
    );
    if (fuzzy.length) return [fuzzy[0]];
  }

  return [];
}

export function loadAllChunks(chunksDir) {
  if (!existsSync(chunksDir)) return [];
  return readdirSync(chunksDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => loadJson(join(chunksDir, f)))
    .filter((c) => c.id && c.sections);
}

export function collectTrackChunkIds(tracksDir) {
  const ids = new Set();
  if (!existsSync(tracksDir)) return ids;
  for (const file of readdirSync(tracksDir)) {
    if (!file.endsWith(".json")) continue;
    const track = loadJson(join(tracksDir, file));
    for (const mod of track.modules ?? []) {
      for (const id of mod.chunkIds ?? []) ids.add(id);
    }
  }
  return ids;
}

export function mergeRawText(rawPaths, root) {
  const parts = [];
  for (const path of rawPaths) {
    try {
      const raw = loadJson(path);
      for (const sec of raw.sections ?? []) {
        if (sec.bodyMd) parts.push(sec.bodyMd);
      }
    } catch {
      /* skip */
    }
  }
  return parts.join("\n\n");
}

export function relPath(abs, root) {
  return abs.replace(root + "\\", "").replace(root + "/", "").replace(/\\/g, "/");
}
