/**
 * Síntese acadêmica PT-BR a partir de raw + chunk atual.
 * Saída: bodyMd (estudo), btgpayNote, verification (estruturado).
 * Uso: node synthesize-chunks.mjs [--wave=1|2|3] [--id=chunk-id] [--tracks-only] [--dry-run]
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
  collectTrackChunkIds,
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
const ENRICHMENTS_PATH = join(META_DIR, "track-section-enrichments.json");

const BOILERPLATE_RE =
  /©\s*\d{4}.*EMVCo|All rights reserved|www\.\s*emvco|Page \d+\s*\/\s*\d+|EMV ®/i;

const EN_STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has", "are",
  "was", "were", "will", "can", "should", "must", "before", "after", "when",
  "which", "their", "they", "assesses", "testing", "exploring",
]);

const PT_STOP = new Set([
  "que", "para", "com", "uma", "dos", "das", "não", "são", "como", "mais",
  "pelo", "pela", "deve", "pode", "este", "esta", "seu", "sua", "nos", "nas",
]);

const EMV_TERMS = [
  "ARQC", "TC", "AAC", "CDCVM", "AID", "TVR", "TAC", "DE 55", "kernel",
  "NFC", "ISO 14443", "ISO 7816", "Play Integrity", "DeviceCheck", "DUKPT",
  "SoftPOS", "CPoC", "PCI PTS", "floor limit", "torn transaction", "GENERATE AC",
  "GPO", "CVM", "PAN", "3DS", "L1", "L2", "L3", "EMVCo",
];

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

function loadEnrichments() {
  if (!existsSync(ENRICHMENTS_PATH)) return {};
  return loadJson(ENRICHMENTS_PATH);
}

function getBtgContext(category) {
  return BTGPAY_CONTEXT[category] ?? BTGPAY_CONTEXT.default;
}

function isBoilerplate(text) {
  return BOILERPLATE_RE.test(text);
}

function isMostlyEnglish(text) {
  if (!text || text.length < 25) return false;
  if (/[áàâãéêíóôõúç]/i.test(text)) return false;
  const words = text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  if (words.length === 0) return false;
  let en = 0;
  let pt = 0;
  for (const w of words) {
    if (EN_STOP.has(w)) en++;
    if (PT_STOP.has(w)) pt++;
  }
  if (/\b(the|and|should|assesses|testing|before exploring|level \d)\b/i.test(text)) {
    en += 4;
  }
  if (/\b(que|para|com|não|são|deve|transação|cartão|terminal)\b/i.test(text)) {
    pt += 3;
  }
  return en > pt && en >= 2;
}

function stripLegacyBlocks(body) {
  if (!body) return "";
  if (body.includes("### Resumo acadêmico")) {
    const resumo = body.split("### Resumo acadêmico")[1]?.split("### Detalhes técnicos")[0] ?? "";
    const paragraphs = resumo.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    for (const p of paragraphs) {
      if (
        p.length > 30 &&
        p.length < 900 &&
        !isBoilerplate(p) &&
        !p.includes("Esta seção aborda") &&
        !isMostlyEnglish(p)
      ) {
        return p;
      }
    }
    return "";
  }
  const first = body.split(/\n\n+/).find((p) => p.length > 30 && !isBoilerplate(p) && !isMostlyEnglish(p));
  return first ?? "";
}

function extractBullets(text) {
  const bullets = [];
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if ((t.startsWith("•") || t.startsWith("-") || t.startsWith("*")) && !isBoilerplate(t)) {
      const content = t.replace(/^[•\-*]\s*/, "");
      if (!isMostlyEnglish(content)) bullets.push(content);
    } else if (/^\[\d+\.\d+\]/.test(t)) {
      bullets.push(t);
    }
  }
  return [...new Set(bullets)].slice(0, 20);
}

function extractRequirements(text) {
  return [...new Set([...text.matchAll(/\[\d+\.\d+\][^\n]*/g)].map((m) => m[0].trim()))].slice(0, 8);
}

function summarizeRequirementPt(req, max = 280) {
  const idMatch = req.match(/^\[(\d+\.\d+)\]/);
  const id = idMatch?.[1];
  if (isMostlyEnglish(req)) {
    const terms = [
      ...new Set(
        [...req.matchAll(/\b(PCI|EMV|PIN|PTS|terminal|kernel|acquirer|NFC|key)\b/gi)].map(
          (m) => m[0].toUpperCase()
        )
      ),
    ].slice(0, 4);
    const topic = terms.length ? terms.join(", ") : "conformidade do terminal";
    const base = id
      ? `[${id}] Requisito da fonte sobre ${topic}. Consulte o documento oficial EMV para o texto integral em inglês.`
      : `Requisito da fonte sobre ${topic}.`;
    return base.slice(0, max);
  }
  if (req.length > max) {
    const cut = req.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + "…";
  }
  return req;
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
    .filter((p) => p.length > 80 && !isBoilerplate(p) && !isMostlyEnglish(p))
    .map((p) => ({ p, score: scoreParagraph(p, heading, anchorId) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

function firstSentences(text, max = 2) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences
    .filter((s) => !isBoilerplate(s) && !isMostlyEnglish(s))
    .slice(0, max)
    .join(" ")
    .trim();
}

function buildPtBulletsFromRaw(rawText, heading) {
  const bullets = [];
  const upper = rawText.toUpperCase();
  const headingLower = heading.toLowerCase();

  const templates = [
    { term: "CDCVM", text: "CDCVM pode ser exigido em valores contactless acima do limite sem contato, usando verificação no dispositivo do portador." },
    { term: "ARQC", text: "ARQC (criptograma de autorização) é gerado pelo cartão ou kernel e enviado ao emissor para validação online." },
    { term: "ISO 14443", text: "ISO 14443 define o protocolo RF usado em pagamentos contactless no terminal." },
    { term: "PLAY INTEGRITY", text: "Play Integrity API (Android) é um mecanismo comum de attestation em soluções Tap to Mobile." },
    { term: "DEVICECHECK", text: "DeviceCheck e App Attest (iOS) suportam attestation e integridade do app em dispositivos Apple." },
    { term: "DE 55", text: "DE 55 transporta TLV EMV na mensagem de autorização ISO 8583 entre adquirente e emissor." },
    { term: "KERNEL", text: "O kernel EMV implementa regras de aplicação, CVM e geração de cryptograma no terminal." },
    { term: "DUKPT", text: "DUKPT é esquema comum de derivação de chaves para PIN pads e terminais criptográficos." },
    { term: "PCI PTS", text: "PCI PTS certifica dispositivos que processam PIN e dados sensíveis em ambiente controlado." },
    { term: "CPOC", text: "CPoC (Contactless Payment on COTS) permite SoftPOS em smartphone com requisitos de segurança específicos." },
  ];

  for (const { term, text } of templates) {
    if (upper.includes(term) && !bullets.includes(text)) {
      if (headingLower.includes("attestation") && term.includes("INTEGRITY")) bullets.push(text);
      else if (headingLower.includes("level") && term === "KERNEL") bullets.push(text);
      else if (headingLower.includes("contactless") || headingLower.includes("nfc")) {
        if (["ISO 14443", "CDCVM", "ARQC"].some((t) => term.includes(t))) bullets.push(text);
      } else if (headingLower.includes("segur") || headingLower.includes("pci")) {
        if (["PCI PTS", "DUKPT", "CPOC"].some((t) => term.includes(t))) bullets.push(text);
      } else if (bullets.length < 4) {
        bullets.push(text);
      }
    }
  }

  return bullets.slice(0, 6);
}

function buildStudyBody(heading, seedPt, relevantParas, requirements, bullets, rawText, isTrackChunk) {
  const parts = [];

  if (seedPt && seedPt.length > 40 && !seedPt.includes("Esta seção aborda") && !isMostlyEnglish(seedPt)) {
    parts.push(seedPt);
  }

  for (const para of relevantParas.slice(0, 3)) {
    const snippet = firstSentences(para, 3);
    if (
      snippet.length > 80 &&
      !isMostlyEnglish(snippet) &&
      !parts.some((p) => p.includes(snippet.slice(0, 40)))
    ) {
      parts.push(snippet);
    }
  }

  const detailLines = [];
  const summarizedReqs = requirements
    .map((r) => summarizeRequirementPt(r))
    .filter((r) => r.length > 20);
  if (summarizedReqs.length) {
    detailLines.push("**Requisitos na fonte:**");
    for (const r of summarizedReqs) detailLines.push(`- ${r}`);
  }

  let usefulBullets = bullets.filter(
    (b) => b.length > 20 && !isBoilerplate(b) && !isMostlyEnglish(b)
  );
  if (isTrackChunk) {
    usefulBullets = [...new Set([...usefulBullets, ...buildPtBulletsFromRaw(rawText, heading)])];
  }
  if (usefulBullets.length) {
    if (detailLines.length) detailLines.push("");
    detailLines.push("**Pontos técnicos:**");
    for (const b of usefulBullets.slice(0, 10)) detailLines.push(`- ${b}`);
  }

  const prose = parts.join("\n\n");
  if (detailLines.length) {
    return prose ? `${prose}\n\n${detailLines.join("\n")}` : detailLines.join("\n");
  }
  return prose || `Conteúdo sobre **${heading}** conforme documentação EMV aplicável.`;
}

function applyEnrichment(bodyMd, chunkId, anchorId, enrichments) {
  const extra = enrichments[chunkId]?.[anchorId];
  if (!extra) return bodyMd;
  if (bodyMd.includes(extra.slice(0, 60))) return bodyMd;
  return bodyMd ? `${bodyMd}\n\n${extra}` : extra;
}

function pickEvidence(relevantParas, pool, seedPt) {
  for (const p of relevantParas) {
    if (!isBoilerplate(p) && p.length >= 40 && !isMostlyEnglish(p)) return p;
  }
  if (seedPt && seedPt.length >= 40 && !isBoilerplate(seedPt) && !isMostlyEnglish(seedPt)) {
    return seedPt;
  }
  const cleaned = pool
    .split(/\n\n+/)
    .find((p) => p.length >= 40 && !isBoilerplate(p) && !isMostlyEnglish(p));
  return cleaned ?? (seedPt || pool.slice(0, 400));
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

function synthesizeSection(section, rawText, sourceRel, category, enrichments, isTrackChunk) {
  const heading = section.heading || "Conteúdo";
  const anchorId = section.anchorId || "sec";
  const seedPt = stripLegacyBlocks(section.bodyMd || "");

  const relevant = pickRelevantParagraphs(rawText, heading, anchorId);
  const pool = relevant.join("\n\n") || rawText;
  const bullets = extractBullets(pool);
  const requirements = extractRequirements(pool);
  const evidence = pickEvidence(relevant, pool, seedPt);

  let bodyMd = buildStudyBody(
    heading,
    seedPt,
    relevant,
    requirements,
    bullets,
    rawText,
    isTrackChunk
  );
  bodyMd = applyEnrichment(bodyMd, section.chunkId ?? "", anchorId, enrichments);

  return {
    anchorId,
    heading,
    bodyMd,
    btgpayNote: getBtgContext(category),
    verification: buildVerification(evidence, sourceRel),
  };
}

function synthesizeChunk(chunk, rawPaths, enrichments, trackChunkIds) {
  const rawText = mergeRawText(rawPaths, ROOT) || chunk.sections.map((s) => s.bodyMd).join("\n\n");
  const sourceRel =
    rawPaths.length > 0 ? relPath(rawPaths[0], ROOT) : chunk.sourceUrl || "chunk-local";
  const isTrackChunk = trackChunkIds.has(chunk.id);

  const sections = chunk.sections.map((sec) =>
    synthesizeSection(
      { ...sec, chunkId: chunk.id },
      rawText,
      sourceRel,
      chunk.category,
      enrichments,
      isTrackChunk
    )
  );

  if (sections.length === 0 && rawText.length > 100) {
    sections.push(
      synthesizeSection(
        { anchorId: "introducao", heading: chunk.title, bodyMd: "", chunkId: chunk.id },
        rawText,
        sourceRel,
        chunk.category,
        enrichments,
        isTrackChunk
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
  const tracksOnly = process.argv.includes("--tracks-only");
  const onlyId = process.argv.find((a) => a.startsWith("--id="))?.split("=")[1];
  const waveArg = process.argv.find((a) => a.startsWith("--wave="))?.split("=")[1];

  mkdirSync(META_DIR, { recursive: true });
  const allRaw = walkJsonFiles(RAW_DIR);
  const trackChunkIds = collectTrackChunkIds(TRACKS_DIR);
  const enrichments = loadEnrichments();

  let targetIds = null;
  if (onlyId) targetIds = new Set([onlyId]);
  else if (tracksOnly) targetIds = trackChunkIds;
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
    const synthesized = synthesizeChunk(chunk, rawPaths, enrichments, trackChunkIds);

    if (!dryRun) {
      writeFileSync(chunkPath, JSON.stringify(synthesized, null, 2));
      count++;
    }
  }

  if (!dryRun && targetIds && !tracksOnly) {
    updateQueueStatus([...targetIds], "synthesized");
  } else if (!dryRun && !onlyId && !waveArg && !tracksOnly) {
    updateQueueStatus(
      files.map((f) => f.replace(/\.json$/, "")),
      "synthesized"
    );
    count = files.length;
  }

  console.log(dryRun ? `(dry-run) ${files.length} chunks` : `Synthesized ${count} chunks`);
}

main();
