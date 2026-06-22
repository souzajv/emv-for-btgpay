import type { ContentSection, SectionVerification } from "@/domain/entities";

const BOILERPLATE_RE =
  /©\s*\d{4}.*EMVCo|All rights reserved|www\.\s*emvco|Page \d+\s*\/\s*\d+/i;

const FILLER_RE =
  /Esta seção aborda .+ no contexto das especificações e diretrizes EMV/i;

export function isBoilerplate(text: string): boolean {
  return BOILERPLATE_RE.test(text);
}

function splitLegacyBlock(body: string, heading: string): string {
  const idx = body.indexOf(heading);
  if (idx < 0) return "";
  const after = body.slice(idx + heading.length).trim();
  const next = after.search(/\n### /);
  return (next >= 0 ? after.slice(0, next) : after).trim();
}

function parseLegacyVerification(block: string): SectionVerification | undefined {
  const evidenceMatch = block.match(/Evidência:\s*"([^"]+)"/);
  const sourceMatch = block.match(/Fonte:\s*`([^`]+)`/);
  const statusMatch = block.match(/Status:\s*(OK|GAP)/);
  if (!evidenceMatch && !sourceMatch) return undefined;
  return {
    evidence: evidenceMatch?.[1] ?? "",
    sourceRel: sourceMatch?.[1] ?? "",
    status: statusMatch?.[1] === "GAP" ? "GAP" : "OK",
  };
}

function cleanStudyBody(text: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !FILLER_RE.test(p));

  const lines: string[] = [];
  for (const p of paragraphs) {
    if (p.startsWith("**Extrato estruturado da fonte:**")) continue;
    if (p.startsWith("- ") && isBoilerplate(p)) continue;
    const bulletLines = p.split("\n").filter((line) => {
      const t = line.trim();
      if (!t.startsWith("- ")) return true;
      return !isBoilerplate(t.slice(2));
    });
    const joined = bulletLines.join("\n").trim();
    if (joined.length > 0) lines.push(joined);
  }

  return lines.join("\n\n").trim();
}

export interface NormalizedSection {
  anchorId: string;
  heading: string;
  bodyMd: string;
  btgpayNote?: string;
  verification?: SectionVerification;
}

export function normalizeSection(section: ContentSection): NormalizedSection {
  if (section.verification || section.btgpayNote !== undefined) {
    return {
      anchorId: section.anchorId,
      heading: section.heading,
      bodyMd: cleanStudyBody(section.bodyMd),
      btgpayNote: section.btgpayNote,
      verification: section.verification,
    };
  }

  const body = section.bodyMd ?? "";
  if (!body.includes("### Resumo acadêmico")) {
    return {
      anchorId: section.anchorId,
      heading: section.heading,
      bodyMd: cleanStudyBody(body),
    };
  }

  const resumo = splitLegacyBlock(body, "### Resumo acadêmico");
  const detalhes = splitLegacyBlock(body, "### Detalhes técnicos");
  const btgpay = splitLegacyBlock(body, "### Contexto BtgPay");
  const verifBlock = splitLegacyBlock(body, "### Verificação na fonte");

  const studyParts = [cleanStudyBody(resumo)];
  if (detalhes && !detalhes.startsWith("**Extrato estruturado")) {
    const cleaned = cleanStudyBody(detalhes);
    if (cleaned.length > 40) studyParts.push(cleaned);
  }

  return {
    anchorId: section.anchorId,
    heading: section.heading,
    bodyMd: studyParts.filter(Boolean).join("\n\n"),
    btgpayNote: btgpay || undefined,
    verification: parseLegacyVerification(verifBlock),
  };
}
