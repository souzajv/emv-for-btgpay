import { stripPedagogicalWrapper } from "./text-utils.mjs";

const EN_STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has", "are",
  "was", "were", "will", "can", "should", "must", "before", "after", "when",
  "which", "their", "they", "assesses", "testing", "exploring", "designed",
  "ensures", "means", "focuses", "involves",
]);

const PT_STOP = new Set([
  "que", "para", "com", "uma", "dos", "das", "não", "são", "como", "mais",
  "pelo", "pela", "deve", "pode", "este", "esta", "seu", "sua", "nos", "nas",
  "segundo", "documentação", "certificação", "terminal", "transação",
]);

const EN_MARKERS =
  /\b(the|and|should|assesses|before exploring|designed to|ensures that|focuses on|this rigorous|for more information|\*\*purpose\*\*)\b/i;

export function isMostlyEnglish(text) {
  const cleaned = stripPedagogicalWrapper(text || "");
  if (!cleaned || cleaned.length < 25) return false;
  if (/[áàâãéêíóôõúç]/i.test(cleaned)) {
    const enHits = (cleaned.match(EN_MARKERS) ?? []).length;
    const words = cleaned.match(/[a-zA-Z]{3,}/g) ?? [];
    if (words.length > 0 && enHits / words.length > 0.08) return true;
    if (/\*\*Purpose:\*\*/i.test(cleaned)) return true;
    return false;
  }
  const words = cleaned.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  if (words.length === 0) return false;
  let en = 0;
  let pt = 0;
  for (const w of words) {
    if (EN_STOP.has(w)) en++;
    if (PT_STOP.has(w)) pt++;
  }
  if (EN_MARKERS.test(cleaned)) en += 4;
  if (/\b(que|para|com|não|são|deve|transação|cartão|terminal)\b/i.test(cleaned)) {
    pt += 3;
  }
  return en > pt && en >= 2;
}

export function englishRatio(text) {
  const cleaned = stripPedagogicalWrapper(text || "");
  if (!cleaned) return 0;
  const words = cleaned.match(/[a-zA-Z]{3,}/g) ?? [];
  if (words.length === 0) return 0;
  const enHits = (cleaned.match(EN_MARKERS) ?? []).length;
  const ptHits = (cleaned.match(/[áàâãéêíóôõúç]/gi) ?? []).length;
  if (hasEnglishProse(cleaned)) return Math.max(0.2, enHits / words.length);
  if (ptHits > 2) return Math.max(0, enHits / words.length - 0.05);
  return Math.min(1, enHits / Math.max(1, words.length) + (enHits > 2 ? 0.3 : 0));
}

export function classifySectionBody(bodyMd, englishR, minChars = 280) {
  if (englishR > 0.12 || hasEnglishProse(bodyMd)) return "english";
  if ((bodyMd ?? "").length < minChars) return "thin";
  return "ok";
}

export function hasEnglishProse(bodyMd) {
  if (!bodyMd) return false;
  const blocks = bodyMd.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split(/\n/).filter((l) => l.trim());
    for (const line of lines) {
      const t = stripPedagogicalWrapper(line.replace(/^[-*•]\s*/, "").trim());
      if (t.length > 40 && isMostlyEnglish(t)) return true;
    }
    const blockClean = stripPedagogicalWrapper(block);
    if (blockClean.length > 50 && !blockClean.startsWith("**") && isMostlyEnglish(blockClean)) {
      return true;
    }
  }
  return false;
}
