import { isMostlyEnglish } from "./language-audit.mjs";
import { stripPedagogicalWrapper } from "./text-utils.mjs";

export { stripPedagogicalWrapper } from "./text-utils.mjs";

const LEVEL_CERT_PT = {
  1: {
    Purpose:
      "A certificação Level 1 (TIP) valida aspectos físicos e elétricos do terminal e a comunicação com cartões EMV (chip ou NFC).",
    Responsibilities:
      "O fabricante do hardware ou módulo NFC é responsável pelo Level 1 e pela homologação em laboratório acreditado.",
    Testing:
      "Testes cobrem especificações elétricas, protocolo RF (ISO 14443) ou contato (ISO 7816), anticolisão e leitura de cartão.",
    Outcome:
      "Aprovação L1 indica conformidade de hardware; o produto pode avançar para certificação Level 2 do kernel EMV.",
  },
  2: {
    Purpose:
      "A certificação Level 2 (KIP) valida o kernel EMV: seleção de AID, CVM, cryptograma (ARQC/TC/AAC) e regras de transação.",
    Responsibilities:
      "Fornecedores de kernel ou integradores de software certificam o componente EMV que roda no terminal ou no SDK mobile.",
    Testing:
      "Cenários incluem leitura de cartão, processamento offline/online, tipos de cartão e operações criptográficas exigidas pelo padrão.",
    Outcome:
      "Kernel aprovado em L2 pode ser integrado a aplicações de pagamento sujeitas ao Level 3.",
  },
  3: {
    Purpose:
      "A certificação Level 3 (AIP) valida a integração ponta a ponta entre aplicação de pagamento, kernel, host do adquirente e bandeiras.",
    Responsibilities:
      "Adquirente, processador ou ISV responsável pela aplicação conduz testes de integração com o terminal homologado.",
    Testing:
      "Fluxo completo: inserção ou tap, autorização, DE 55 (TLV EMV), ISO 8583, estorno e reconciliação conforme roteiros da bandeira.",
    Outcome:
      "Terminal e aplicação prontos para produção com interoperabilidade EMV nas redes acordadas.",
  },
};

const HEADING_INTROS = [
  {
    test: /what are emv.*specification/i,
    text: "As especificações EMV definem interoperabilidade global entre cartões, terminais e redes de pagamento. Qualquer emissor ou adquirente pode adotá-las e esperar comportamento consistente entre países e bandeiras.",
  },
  {
    test: /level 1.*approval|level 1.*testing|what are emv level 1/i,
    text: "O Level 1 EMVCo cobre conformidade física e de protocolo do ponto de interação (POI), incluindo leitores contactless e com chip.",
  },
  {
    test: /level 2|kernel integration/i,
    text: "O Level 2 certifica o kernel EMV e componentes de software que processam transações com cartão no terminal.",
  },
  {
    test: /level 3|terminal integration/i,
    text: "O Level 3 valida a integração da solução de pagamento com processadores, host e esquemas de bandeira em cenários reais.",
  },
  {
    test: /contactless|contact-less/i,
    text: "Pagamentos contactless EMV usam NFC (ISO 14443) com tempos de transação curtos, limites sem contato e regras de CVM/CDCVM definidas pela bandeira.",
  },
  {
    test: /mobile|tap to mobile|softpos|cpoc/i,
    text: "Soluções mobile e SoftPOS executam EMV em smartphones (COTS) com requisitos adicionais de segurança, attestation e homologação CPoC ou equivalente.",
  },
  {
    test: /3-?d secure|3ds/i,
    text: "EMV 3-D Secure autentica o portador em transações remotas (CNP), reduzindo fraude em e-commerce e complementando regras de liability shift.",
  },
  {
    test: /security|segurança|pci/i,
    text: "Diretrizes de segurança EMV e PCI definem boundary criptográfico, gestão de chaves e proteção de PIN e dados sensíveis no terminal.",
  },
  {
    test: /laboratory|lab.*recognition|qualification/i,
    text: "Laboratórios e provedores de teste EMVCo seguem processos formais de qualificação antes de executar certificações oficiais.",
  },
  {
    test: /trademark|registered|approved/i,
    text: "Programas de registro e trademark EMVCo identificam produtos e entidades aprovados no ecossistema de pagamentos.",
  },
];

function detectLevel(heading, text) {
  const h = `${heading} ${text}`;
  const m = h.match(/level\s*(\d)|l(\d)\b|tip|kip|aip/i);
  if (m) {
    const n = m[1] || m[2];
    if (n) return Number(n);
    if (/tip/i.test(h)) return 1;
    if (/kip/i.test(h)) return 2;
    if (/aip/i.test(h)) return 3;
  }
  return null;
}

export function translateStructuredBullet(line, heading = "") {
  const cleaned = line
    .replace(/^[-*•]\s*/, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
  const m = cleaned.match(/\*\*(Purpose|Responsibilities|Testing|Outcome):\*\*\s*(.+)/i);
  if (!m) return isMostlyEnglish(cleaned) ? null : cleaned;

  const field = m[1];
  const level = detectLevel(heading, cleaned);
  if (level && LEVEL_CERT_PT[level]?.[field]) {
    return LEVEL_CERT_PT[level][field];
  }

  const fieldPt = {
    Purpose: "Objetivo",
    Responsibilities: "Responsáveis",
    Testing: "Testes",
    Outcome: "Resultado",
  }[field];

  const snippet = m[2].slice(0, 120).replace(/\s+/g, " ");
  return `${fieldPt}: conforme a fonte, ${snippet.toLowerCase()}… (consulte documento oficial para texto integral).`;
}

export function headingIntroPt(heading, category = "") {
  for (const { test, text } of HEADING_INTROS) {
    if (test.test(heading)) return text;
  }
  if (category === "certificacao") {
    return "Este material descreve processos de certificação e homologação EMV relevantes para terminais e soluções mobile.";
  }
  if (category === "fundamentos") {
    return "Fundamentos do padrão EMV aplicados a cartão presente, contactless e integração com POS mobile.";
  }
  return `Resumo em português sobre **${heading.replace(/\?+$/, "")}**, com base na documentação oficial indexada neste hub.`;
}

export function extractEmvTerms(text) {
  const terms = [
    "ARQC", "CDCVM", "AID", "TVR", "TAC", "DE 55", "kernel", "NFC",
    "ISO 14443", "ISO 7816", "Play Integrity", "DeviceCheck", "DUKPT",
    "SoftPOS", "CPoC", "PCI PTS", "EMVCo", "L1", "L2", "L3", "CVM",
    "GPO", "PAN", "3DS", "floor limit", "GENERATE AC",
  ];
  const upper = text.toUpperCase();
  return terms.filter((t) => upper.includes(t.toUpperCase())).slice(0, 6);
}

export function buildPtFromEnglishRaw(rawText, heading, category) {
  const parts = [];
  const intro = headingIntroPt(heading, category);
  if (intro) parts.push(intro);

  const bullets = [];
  for (const line of rawText.split(/\n/)) {
    const t = line.trim();
    if (!t) continue;
    const translated = translateStructuredBullet(t, heading);
    if (translated && !bullets.includes(translated)) bullets.push(translated);
  }

  const terms = extractEmvTerms(rawText);
  if (terms.length) {
    bullets.push(
      `Termos técnicos na fonte: ${terms.join(", ")}. Siglas EMV são mantidas conforme glossário do hub.`
    );
  }

  if (bullets.length) {
    parts.push("**Pontos técnicos:**");
    for (const b of bullets.slice(0, 8)) parts.push(`- ${b}`);
  }

  return parts.join("\n\n");
}

export function sanitizeBodyMd(bodyMd, heading, category, rawText = "") {
  if (!bodyMd) bodyMd = "";

  const paragraphs = [];
  const bulletLines = [];
  let inBullets = false;

  for (const block of bodyMd.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("**Pontos técnicos:**") || trimmed.startsWith("**Requisitos")) {
      inBullets = true;
      const lines = trimmed.split(/\n/);
      const header = lines[0];
      bulletLines.push(header);
      for (const line of lines.slice(1)) {
        const t = line.trim();
        if (!t) continue;
        if (/^!\[/.test(t.replace(/^[-*•]\s*/, ""))) continue;
        const translated = translateStructuredBullet(t, heading);
        if (translated) bulletLines.push(`- ${translated}`);
        else if (!isMostlyEnglish(t.replace(/^[-*•]\s*/, ""))) bulletLines.push(line);
      }
      continue;
    }

    inBullets = false;
    const cleaned = stripPedagogicalWrapper(trimmed);
    if (!cleaned) continue;
    if (isMostlyEnglish(cleaned)) continue;
    if (!paragraphs.some((p) => p.includes(cleaned.slice(0, 40)))) {
      paragraphs.push(cleaned);
    }
  }

  let result = paragraphs.join("\n\n");
  if (bulletLines.length > 1) {
    result = result
      ? `${result}\n\n${bulletLines.join("\n")}`
      : bulletLines.join("\n");
  }

  if (
    result.length < 280 ||
    isMostlyEnglish(result) ||
    (result.match(EN_FALLBACK_RE) && result.length < 400)
  ) {
    const fallback = buildPtFromEnglishRaw(rawText || bodyMd, heading, category);
    if (fallback.length > result.length) result = fallback;
  }

  return result.trim() || headingIntroPt(heading, category);
}

const EN_FALLBACK_RE = /\b(the|and|should|designed to)\b/i;
