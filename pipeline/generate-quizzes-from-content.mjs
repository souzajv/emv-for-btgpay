/**
 * Gera quizzes a partir do conteúdo sintetizado dos chunks.
 * Substitui generate-quizzes.mjs para alinhamento com material real.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadAllChunks } from "./lib/chunk-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dirname, "..", "content", "chunks");
const QUIZZES_DIR = join(__dirname, "..", "content", "quizzes");

const DISTRACTORS_GENERIC = [
  "O Flutter implementa o kernel EMV internamente",
  "Certificação EMV é opcional para Tap to Mobile",
  "PAN em claro pode ser logado para debug",
  "CNP e CP usam o mesmo fluxo criptográfico no chip",
];

function stripMd(body) {
  return body
    .replace(/###[^\n]*/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function extractFacts(section) {
  const body = section.bodyMd ?? "";
  const facts = [];
  const bullets = body.match(/^- (.+)$/gm) ?? [];
  for (const b of bullets) {
    const text = b.replace(/^- /, "").trim();
    if (text.length > 25 && text.length < 220 && !text.startsWith("**")) facts.push(text);
  }
  const reqs = body.match(/\[\d+\.\d+\][^\n]*/g) ?? [];
  for (const r of reqs) facts.push(r.trim());
  const sentences = body.match(/[^.!?]{30,}[.!?]/g) ?? [];
  for (const s of sentences.slice(0, 4)) {
    const t = s.trim();
    if (!t.includes("Conteúdo sobre **")) facts.push(t);
  }
  if (section.btgpayNote) {
    const noteSentences = section.btgpayNote.match(/[^.!?]{30,}[.!?]/g) ?? [];
    for (const s of noteSentences.slice(0, 1)) facts.push(s.trim());
  }
  return facts;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(level, index, chunk, section, fact) {
  const difficulty = level === "junior" ? 1 : level === "pleno" ? 2 : 3;
  const heading = section.heading || chunk.title;
  const shortFact = fact.length > 120 ? fact.slice(0, 117) + "…" : fact;

  let prompt;
  if (level === "junior") {
    prompt = `No material "${chunk.title}" (${heading}), qual afirmação está correta?`;
  } else if (level === "pleno") {
    prompt = `Considerando "${heading}" em ${chunk.title}: qual opção reflete o conteúdo técnico?`;
  } else {
    prompt = `[Cenário BtgPay] Sobre "${heading}": qual decisão está alinhada ao material e à conformidade EMV?`;
  }

  const correct = shortFact;
  const pool = shuffle([
    ...DISTRACTORS_GENERIC,
    "Requisito não documentado na fonte EMV",
    "Processamento de PIN no widget TextField do Flutter",
  ]).filter((d) => d !== correct);
  const options = shuffle([correct, ...pool.slice(0, 3)]).slice(0, 4);
  let correctIndex = options.indexOf(correct);
  if (correctIndex < 0) {
    options[0] = correct;
    correctIndex = 0;
  }

  return {
    id: `${level}-${String(index + 1).padStart(3, "0")}`,
    level,
    difficulty,
    prompt,
    options,
    correctIndex,
    explanation: `Consulte a seção "${heading}" no material (âncora ${section.anchorId}).`,
    sourceChunkId: chunk.id,
    anchorId: section.anchorId,
  };
}

function collectCandidates(chunks, level) {
  const relevanceOrder = { alta: 0, media: 1, baixa: 2 };
  const sorted = [...chunks].sort(
    (a, b) =>
      (relevanceOrder[a.btgpayRelevance] ?? 3) - (relevanceOrder[b.btgpayRelevance] ?? 3)
  );

  const candidates = [];
  for (const chunk of sorted) {
    for (const section of chunk.sections ?? []) {
      const facts = extractFacts(section);
      const take = level === "junior" ? 2 : level === "pleno" ? 1 : 1;
      for (const fact of facts.slice(0, take)) {
        candidates.push({ chunk, section, fact });
      }
    }
  }
  return candidates;
}

function fillToFifty(level, questions, chunks) {
  const seen = new Set(questions.map((q) => q.prompt));
  let i = questions.length;
  const candidates = collectCandidates(chunks, level);

  while (questions.length < 50 && candidates.length > 0) {
    const c = candidates[i % candidates.length];
    const q = buildQuestion(level, questions.length, c.chunk, c.section, c.fact);
    if (!seen.has(q.prompt)) {
      questions.push(q);
      seen.add(q.prompt);
    }
    i++;
    if (i > 500) break;
  }

  while (questions.length < 50) {
    const c = candidates[questions.length % candidates.length];
    const q = buildQuestion(level, questions.length, c.chunk, c.section, c.fact);
    q.prompt = `[Revisão ${questions.length + 1}] ${q.prompt}`;
    q.id = `${level}-${String(questions.length + 1).padStart(3, "0")}`;
    questions.push(q);
  }

  return questions.slice(0, 50);
}

function main() {
  mkdirSync(QUIZZES_DIR, { recursive: true });
  const chunks = loadAllChunks(CHUNKS_DIR);

  for (const level of ["junior", "pleno", "senior"]) {
    const candidates = collectCandidates(chunks, level);
    const questions = [];
    for (let i = 0; i < Math.min(50, candidates.length); i++) {
      const c = candidates[i];
      questions.push(buildQuestion(level, i, c.chunk, c.section, c.fact));
    }
    const final = fillToFifty(level, questions, chunks);

    writeFileSync(
      join(QUIZZES_DIR, `${level}.json`),
      JSON.stringify({ level, questions: final }, null, 2)
    );
    console.log(`Generated ${final.length} questions for ${level}`);
  }
}

main();
