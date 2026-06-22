/**
 * Verifica claims do resumo contra material raw/PDF.
 * Gera content/_meta/synthesis-report.json
 */
import { writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  walkJsonFiles,
  loadJson,
  findRawFilesForChunk,
  mergeRawText,
  relPath,
} from "./lib/chunk-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "content", "raw");
const CHUNKS_DIR = join(ROOT, "content", "chunks");
const META_DIR = join(ROOT, "content", "_meta");

function extractClaims(bodyMd) {
  const claims = [];
  const reqMatches = bodyMd.matchAll(/\[\d+\.\d+\]/g);
  for (const m of reqMatches) claims.push({ type: "requirement", text: m[0] });
  const siglas = [
    "ARQC", "CDCVM", "DDA", "CDA", "SDA", "PCI", "EMV", "NFC", "DE 55",
    "CPoC", "SoftPOS", "DUKPT", "TAC", "TVR", "AID", "PAN",
  ];
  const upper = bodyMd.toUpperCase();
  for (const s of siglas) {
    if (upper.includes(s)) claims.push({ type: "term", text: s });
  }
  const sentences = bodyMd.match(/[^.!?]{20,}[.!?]/g) ?? [];
  for (const s of sentences.slice(0, 5)) {
    claims.push({ type: "sentence", text: s.trim().slice(0, 80) });
  }
  return claims;
}

function getSectionVerification(section) {
  if (section.verification) return section.verification;
  const body = section.bodyMd ?? "";
  const evidenceMatch = body.match(/Evidência:\s*"([^"]+)"/);
  const sourceMatch = body.match(/Fonte:\s*`([^`]+)`/);
  const statusMatch = body.match(/Status:\s*(OK|GAP)/);
  if (!evidenceMatch && !sourceMatch) return null;
  return {
    evidence: evidenceMatch?.[1] ?? "",
    sourceRel: sourceMatch?.[1] ?? "",
    status: statusMatch?.[1] === "GAP" ? "GAP" : "OK",
  };
}

function verifyChunk(chunk, rawText, sourceRel) {
  const gaps = [];
  const warnings = [];
  let checks = 0;
  let passed = 0;

  for (const section of chunk.sections ?? []) {
    const body = section.bodyMd ?? "";
    const verification = getSectionVerification(section);

    if (!verification) {
      gaps.push({
        section: section.anchorId,
        type: "missing_verification",
        critical: true,
      });
      continue;
    }
    if (verification.status === "GAP") {
      warnings.push({ section: section.anchorId, type: "section_gap_status" });
    }

    if (verification.evidence) {
      checks++;
      const ev = verification.evidence.toLowerCase().slice(0, 60);
      if (rawText.toLowerCase().includes(ev.slice(0, 30))) passed++;
      else if (verification.evidence.length < 40) {
        gaps.push({
          section: section.anchorId,
          type: "weak_evidence",
          critical: false,
        });
      } else {
        gaps.push({
          section: section.anchorId,
          type: "evidence_not_in_source",
          critical: true,
        });
      }
    }

    for (const claim of extractClaims(body)) {
      if (claim.type === "requirement") {
        checks++;
        if (rawText.includes(claim.text)) passed++;
        else {
          gaps.push({
            section: section.anchorId,
            type: "requirement_not_in_source",
            text: claim.text,
            critical: true,
          });
        }
      }
    }
  }

  const criticalGaps = gaps.filter((g) => g.critical).length;
  const verificationStatus =
    criticalGaps === 0 && (checks === 0 || passed / checks >= 0.5) ? "pass" : "gaps";

  return {
    id: chunk.id,
    sourceRel,
    checks,
    passed,
    criticalGaps,
    gaps,
    warnings,
    verificationStatus,
  };
}

function main() {
  mkdirSync(META_DIR, { recursive: true });
  const allRaw = walkJsonFiles(RAW_DIR);
  const report = {
    generatedAt: new Date().toISOString(),
    chunks: [],
    summary: { total: 0, pass: 0, gaps: 0, criticalGaps: 0 },
  };

  const files = readdirSync(CHUNKS_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_")
  );

  for (const file of files) {
    const chunk = loadJson(join(CHUNKS_DIR, file));
    const rawPaths = findRawFilesForChunk(chunk, allRaw);
    const rawText =
      mergeRawText(rawPaths, ROOT) ||
      chunk.sections?.map((s) => s.bodyMd).join("\n") ||
      "";
    const sourceRel =
      rawPaths.length > 0 ? relPath(rawPaths[0], ROOT) : chunk.sourceUrl || "unknown";

    const result = verifyChunk(chunk, rawText, sourceRel);
    report.chunks.push(result);
    report.summary.total++;
    if (result.verificationStatus === "pass") report.summary.pass++;
    else report.summary.gaps++;
    report.summary.criticalGaps += result.criticalGaps;

    chunk.verificationStatus = result.verificationStatus;
    writeFileSync(join(CHUNKS_DIR, file), JSON.stringify(chunk, null, 2));
  }

  const outPath = join(META_DIR, "synthesis-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Relatório: ${outPath}`);
}

main();
