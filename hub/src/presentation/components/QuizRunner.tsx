"use client";

import { useCallback, useEffect, useState } from "react";
import { HubLink } from "@/presentation/components/HubLink";
import type { QuizLevel, QuizQuestion } from "@/domain/entities";
import { drawQuizBatch, getSourceLink } from "@/application/quiz/DrawQuizBatch";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { BrutalButton } from "./BrutalButton";
import { BrutalCard } from "./BrutalCard";

interface QuizRunnerProps {
  level: QuizLevel;
  questions: QuizQuestion[];
}

export function QuizRunner({ level, questions }: QuizRunnerProps) {
  const [batch, setBatch] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const startSession = useCallback(() => {
    const store = new LocalStorageProgressStore();
    const allIds = questions.map((q) => q.id);
    const { questionIds, newState } = drawQuizBatch({
      level,
      allQuestionIds: allIds,
      existingState: store.getDeckState(level),
    });
    store.saveDeckState(newState);
    store.recordQuizView(level);
    const batchQuestions = questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as QuizQuestion[];
    setBatch(batchQuestions);
    setCurrent(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  }, [level, questions]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const q = batch[current];

  const submitAnswer = () => {
    if (selected === null || !q) return;
    const correct = selected === q.correctIndex;
    if (correct) setScore((s) => s + 1);
    setShowResult(true);
  };

  const next = () => {
    if (current + 1 >= batch.length) {
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setShowResult(false);
  };

  if (!q && !finished) {
    return <p className="font-mono text-sm">Carregando quiz...</p>;
  }

  if (finished) {
    return (
      <BrutalCard>
        <h2 className="text-2xl font-extrabold">Sessão concluída</h2>
        <p className="mt-4 text-muted">
          Você acertou <strong>{score}</strong> de <strong>{batch.length}</strong> perguntas.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
          <button
            type="button"
            onClick={startSession}
            className="w-full sm:w-auto font-mono text-xs tracking-widest px-4 sm:px-7 py-3.5 bg-accent text-accent-foreground border-2 border-ink shadow-brutal rounded-sm"
          >
            NOVA SESSÃO (10)
          </button>
          <BrutalButton href="/quiz/" variant="secondary">
            TROCAR NÍVEL
          </BrutalButton>
        </div>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard>
      <div className="font-mono text-xs tracking-widest text-muted mb-4" aria-live="polite">
        PERGUNTA {current + 1} / {batch.length} · NÍVEL {level.toUpperCase()}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold leading-snug break-words">{q.prompt}</h2>
      <fieldset className="mt-8 space-y-3">
        <legend className="sr-only">Opções de resposta</legend>
        {q.options.map((opt, i) => (
          <label
            key={i}
            className={`flex items-start gap-3 border-2 border-ink p-3 sm:p-4 rounded-sm cursor-pointer transition-colors ${
              selected === i ? "bg-highlight" : "bg-paper hover:bg-accent/30"
            } ${showResult && i === q.correctIndex ? "ring-2 ring-success" : ""}`}
          >
            <input
              type="radio"
              name="answer"
              value={i}
              checked={selected === i}
              onChange={() => !showResult && setSelected(i)}
              disabled={showResult}
              className="mt-1 shrink-0"
            />
            <span className="break-words min-w-0 text-sm sm:text-base">{opt}</span>
          </label>
        ))}
      </fieldset>

      {!showResult ? (
        <button
          type="button"
          onClick={submitAnswer}
          disabled={selected === null}
          className="mt-8 w-full sm:w-auto font-mono text-xs tracking-widest px-4 sm:px-7 py-3.5 bg-accent text-accent-foreground border-2 border-ink shadow-brutal rounded-sm disabled:opacity-40"
        >
          CONFIRMAR
        </button>
      ) : (
        <div className="mt-8 space-y-4" role="status">
          <p
            className={`font-mono text-sm ${
              selected === q.correctIndex ? "text-success" : "text-error"
            }`}
          >
            {selected === q.correctIndex ? "Correto!" : "Incorreto."} {q.explanation}
          </p>
          <HubLink
            href={getSourceLink(q.sourceChunkId, q.anchorId)}
            className="font-mono text-xs tracking-widest underline underline-offset-4 inline-block"
          >
            VER NO MATERIAL FONTE
          </HubLink>
          <div>
            <button
              type="button"
              onClick={next}
              className="w-full sm:w-auto font-mono text-xs tracking-widest px-4 sm:px-7 py-3.5 bg-highlight border-2 border-ink shadow-brutal rounded-sm"
            >
              {current + 1 >= batch.length ? "FINALIZAR" : "PRÓXIMA"}
            </button>
          </div>
        </div>
      )}
    </BrutalCard>
  );
}
