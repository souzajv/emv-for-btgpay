"use client";

import Link from "next/link";
import type { QuizLevel } from "@/domain/entities";
import { formatAccessLabel } from "@/application/dates/formatAccessLabel";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { useProgressSnapshot } from "@/presentation/hooks/useProgressSnapshot";
import { AccessBadge } from "./AccessBadge";
import { BrutalCard } from "./BrutalCard";

interface QuizLevelCardProps {
  id: QuizLevel;
  title: string;
  desc: string;
}

export function QuizLevelCard({ id, title, desc }: QuizLevelCardProps) {
  const { mounted } = useProgressSnapshot();
  const store = new LocalStorageProgressStore();
  const deck = mounted ? store.getDeckState(id) : null;
  const lastAt = deck?.lastSessionAt;
  const remaining = deck?.queue.length ?? 0;
  const cycle = deck?.cycle ?? 0;

  return (
    <Link
      href={`/quiz/${id}/`}
      className="block"
      onClick={() => store.recordQuizView(id)}
    >
      <BrutalCard className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-highlight/20 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">{title}</h2>
            {mounted && lastAt && (
              <AccessBadge
                label={formatAccessLabel(lastAt)}
                variant="date"
                accessedAt={lastAt}
              />
            )}
            {mounted && cycle > 1 && (
              <AccessBadge label={`Ciclo ${cycle}`} variant="in-progress" />
            )}
          </div>
          <p className="text-sm text-muted">{desc}</p>
          {mounted && deck && remaining > 0 && remaining < 50 && (
            <p className="mt-2 font-mono text-[10px] tracking-widest text-muted">
              {remaining} perguntas restantes neste ciclo
            </p>
          )}
        </div>
        <span className="font-mono text-xs tracking-widest shrink-0 sm:text-right">
          10 perguntas →
        </span>
      </BrutalCard>
    </Link>
  );
}
