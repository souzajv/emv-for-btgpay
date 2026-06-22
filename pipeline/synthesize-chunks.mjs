/**
 * Síntese acadêmica PT-BR a partir de raw + chunk atual.
 * Saída: bodyMd (estudo), btgpayNote, verification (estruturado).
 * Uso: node synthesize-chunks.mjs [--wave=1|2|3] [--id=chunk-id] [--dry-run]
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "fs";
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
const TRACKS_DIR = join(ROOT, "content", "tracks");
const META_DIR = join(ROOT, "content", "_meta");
const QUEUE_PATH = join(META_DIR, "synthesis-queue.json");

const BOILERPLATE_RE =
  /©\s*\d{4}.*EMVCo|All rights reserved|www\.\s*emvco|Page \d+\s*\/\s*\d+|EMV ®/i;

const BTGPAY_CONTEXT = {
  seguranca:
    "No BtgPay, o app Flutter permanece fora do boundary criptográfico: PIN, chaves e ARQC são responsabilidade do SDK/kernel certificado. O time mobile integra APIs de alto nível e garante que logs e UI não exponham dados sensíveis.",
  certificacao:
    "Certificações L1/L2/L3 e programas de bandeira impactam diretamente o cronograma do POS mobile BtgPay. Alterações no fluxo de pagamento ou no bridge nativo podem exigir reteste em laboratório aprovado.",
  contactless:
    "Tap to Mobile e contactless exigem NFC estável, UX clara em caso de timeout ou anticolisão, e suporte a CDCVM quando o valor exigir verificação no dispositivo.",
  fundamentos:
    "Fundamentos EMV orientam decisões de produto no BtgPay: CP vs CNP, fluxo chip/contactless e papéis de emissor, adquirente e terminal (incluindo smartphone como POI).",
  default:
    "Este conteúdo subsidia decisões técnicas do time BtgPay mobile: integração Flutter, SDK de pagamentos e conformidade com especificações EMV e requisitos do adquirente.",
};

function getBtgContext(category) {
  return BTGPAY_CONTEXT[category] ?? BTGPAY_CONTEXT.default;
}

function isBoilerplate(text) {
  return BOILERPLATE_RE.test(text);
}

function stripLegacyBlocks(body) {
  if (!body) return "";
  if (body.includes("### Resumo acadêmico")) {
    const resumo = body.split("### Resumo acadêmico")[1]?.split("### Detalhes técnicos")[0] ?? "";
    const paragraphs = resumo.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    for (const p of paragraphs) {
      if (p.length > 30 && p.length < 900 && !isBoilerplate(p) && !p.includes("Esta seção aborda")) {
        return p;
      }
    }
    return "";
  }
  return body.split(/\n\n+/).find((p) => p.length > 30 && !isBoilerplate(p)) ?? "";
}

function extractBullets(text) {
  const bullets = [];
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if ((t.startsWith("•") || t.startsWith("-") || t.startsWith("*")) && !isBoilerplate(t)) {
      bullets.push(t.replace(/^[•\-*]\s*/, ""));
    } else if (/^\[\d+\.\d+\]/.test(t)) {
      bullets.push(t);
    } else if (/^\d+(\.\d+)+\s+[A-Z]/.test(t) && !isBoilerplate(t)) {
      bullets.push(t);
    }
  }
  return [...new Set(bullets)].slice(0, 20);
}

function extractRequirements(text) {
  return [...new Set([...text.matchAll(/\[\d+\.\d+\][^\n]*/g)].map((m) => m[0].trim()))].slice(0, 12);
}

function scoreParagraph(paragraph, heading, anchorId) {
  const tokens = `${heading} ${anchorId}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  const text = paragraph.toLowerCase();
  return tokens.reduce((n, t) => n + (text.includes(t) ? 1 : 0), 0);
}

function pickRelevantParagraphs(rawText, heading, anchorId, limit = 8) {
  return rawText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 80 && !isBoilerplate(p))
    .map((p) => ({ p, score: scoreParagraph(p, heading, anchorId) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

function firstSentences(text, max = 2) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences
    .filter((s) => !isBoilerplate(s))
    .slice(0, max)
    .join(" ")
    .trim();
}

function buildStudyBody(heading, seedPt, relevantParas, requirements, bullets) {
  const parts = [];

  if (seedPt && seedPt.length > 40 && !seedPt.includes("Esta seção aborda")) {
    parts.push(seedPt);
  }

  for (const para of relevantParas.slice(0, 3)) {
    const snippet = firstSentences(para, 3);
    if (snippet.length > 80 && !parts.some((p) => p.includes(snippet.slice(0, 40)))) {
      parts.push(snippet);
    }
  }

  if (parts.length === 0 && relevantParas[0]) {
    parts.push(firstSentences(relevantParas[0], 4));
  }

  const detailLines = [];
  if (requirements.length) {
    detailLines.push("**Requisitos na fonte:**");
    for (const r of requirements) detailLines.push(`- ${r}`);
  }
  const usefulBullets = bullets.filter((b) => b.length > 20 && !isBoilerplate(b));
  if (usefulBullets.length) {
    if (detailLines.length) detailLines.push("");
    detailLines.push("**Pontos técnicos:**");
    for (const b of usefulBullets.slice(0, 12)) detailLines.push(`- ${b}`);
  }

  const prose = parts.join("\n\n");
  if (detailLines.length) {
    return prose ? `${prose}\n\n${detailLines.join("\n")}` : detailLines.join("\n");
  }
  return prose || `Conteúdo sobre **${heading}** conforme documentação EMV aplicável.`;
}

function pickEvidence(relevantParas, pool, seedPt) {
  for (const p of relevantParas) {
    if (!isBoilerplate(p) && p.length >= 40) return p;
  }
  if (seedPt && seedPt.length >= 40 && !isBoilerplate(seedPt)) return seedPt;
  const cleaned = pool
    .split(/\n\n+/)
    .find((p) => p.length >= 40 && !isBoilerplate(p));
  return cleaned ?? pool.slice(0, 400);
}

function buildVerification(evidence, sourceRel) {
  const ev = evidence.slice(0, 200).replace(/\s+/g, " ").trim();
  const status = ev.length >= 40 && !isBoilerplate(ev) ? "OK" : "GAP";
  return {
    evidence: ev + (evidence.length > 200 ? "…" : ""),
    sourceRel,
    status,
  };
}

function synthesizeSection(section, rawText, sourceRel, category) {
  const heading = section.heading || "Conteúdo";
  const anchorId = section.anchorId || "sec";
  const seedPt = stripLegacyBlocks(section.bodyMd || "");

  const relevant = pickRelevantParagraphs(rawText, heading, anchorId);
  const pool = relevant.join("\n\n") || rawText;
  const bullets = extractBullets(pool);
  const requirements = extractRequirements(pool);
  const evidence = pickEvidence(relevant, pool, seedPt);

  return {
    anchorId,
    heading,
    bodyMd: buildStudyBody(heading, seedPt, relevant, requirements, bullets),
    btgpayNote: getBtgContext(category),
    verification: buildVerification(evidence, sourceRel),
  };
}

function synthesizeChunk(chunk, rawPaths) {
  const rawText = mergeRawText(rawPaths, ROOT) || chunk.sections.map((s) => s.bodyMd).join("\n\n");
  const sourceRel =
    rawPaths.length > 0 ? relPath(rawPaths[0], ROOT) : chunk.sourceUrl || "chunk-local";

  const sections = chunk.sections.map((sec) =>
    synthesizeSection(sec, rawText, sourceRel, chunk.category)
  );

  if (sections.length === 0 && rawText.length > 100) {
    sections.push(
      synthesizeSection(
        { anchorId: "introducao", heading: chunk.title, bodyMd: "" },
        rawText,
        sourceRel,
        chunk.category
      )
    );
  }

  return {
    ...chunk,
    sections,
    synthesizedAt: new Date().toISOString(),
    synthesisLocale: "pt-BR",
    verificationStatus: "pending",
    synthesizedFrom: rawPaths.map((p) => relPath(p, ROOT)),
  };
}

function getWaveIds(wave) {
  if (!existsSync(QUEUE_PATH)) return null;
  const queue = loadJson(QUEUE_PATH);
  return queue.waves?.[wave]?.ids ?? null;
}

function updateQueueStatus(ids, status) {
  if (!existsSync(QUEUE_PATH)) return;
  const queue = loadJson(QUEUE_PATH);
  for (const id of ids) {
    if (queue.items?.[id]) queue.items[id].status = status;
  }
  queue.updatedAt = new Date().toISOString();
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyId = process.argv.find((a) => a.startsWith("--id="))?.split("=")[1];
  const waveArg = process.argv.find((a) => a.startsWith("--wave="))?.split("=")[1];

  mkdirSync(META_DIR, { recursive: true });
  const allRaw = walkJsonFiles(RAW_DIR);

  let targetIds = null;
  if (onlyId) targetIds = new Set([onlyId]);
  else if (waveArg) targetIds = new Set(getWaveIds(waveArg) ?? []);

  const files = readdirSync(CHUNKS_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_")
  );

  let count = 0;
  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    if (targetIds && !targetIds.has(id)) continue;

    const chunkPath = join(CHUNKS_DIR, file);
    const chunk = loadJson(chunkPath);
    const rawPaths = findRawFilesForChunk(chunk, allRaw);
    const synthesized = synthesizeChunk(chunk, rawPaths);

    if (!dryRun) {
      writeFileSync(chunkPath, JSON.stringify(synthesized, null, 2));
      count++;
    }
  }

  if (!dryRun && targetIds) {
    updateQueueStatus([...targetIds], "synthesized");
  } else if (!dryRun && !onlyId && !waveArg) {
    updateQueueStatus(
      files.map((f) => f.replace(/\.json$/, "")),
      "synthesized"
    );
    count = files.length;
  }

  console.log(dryRun ? `(dry-run) ${files.length} chunks` : `Synthesized ${count} chunks`);
}

main();
