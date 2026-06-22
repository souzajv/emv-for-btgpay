"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BrutalButton } from "./BrutalButton";
import { ProgressBar } from "./ProgressBar";
import { AccessBadge } from "./AccessBadge";
import { formatAccessLabel } from "@/application/dates/formatAccessLabel";
import {
  useModuleProgress,
  type ModuleProgressContext,
} from "@/presentation/hooks/useModuleProgress";
import type { TrackModule } from "@/domain/entities";
import { getTrackPercent } from "@/application/progress/progress";
import { useProgressSnapshot } from "@/presentation/hooks/useProgressSnapshot";

type ProgressState = ReturnType<typeof useModuleProgress>;

const MaterialProgressContext = createContext<ProgressState | null>(null);

function useMaterialProgress() {
  const ctx = useContext(MaterialProgressContext);
  if (!ctx) throw new Error("useMaterialProgress must be used within MaterialPageShell");
  return ctx;
}

interface MaterialPageShellProps {
  chunkId: string;
  children: ReactNode;
}

export function MaterialPageShell({ chunkId, children }: MaterialPageShellProps) {
  const progress = useModuleProgress(chunkId);
  return (
    <MaterialProgressContext.Provider value={progress}>
      <MaterialReader />
      {children}
      <MaterialFooter />
    </MaterialProgressContext.Provider>
  );
}

interface TrackProgressHeaderProps {
  trackSlug: string;
  moduleCount: number;
  modules: TrackModule[];
}

export function TrackProgressHeader({
  trackSlug,
  moduleCount,
  modules,
}: TrackProgressHeaderProps) {
  const { mounted, trackProgress } = useProgressSnapshot(trackSlug);

  if (!mounted || !trackProgress) return null;

  const percent = getTrackPercent(modules, trackProgress);
  const lastAt = trackProgress.lastAccessedAt;

  return (
    <div className="mb-10 space-y-3">
      {lastAt && (
        <AccessBadge
          label={`Trilha acessada · ${formatAccessLabel(lastAt)}`}
          variant="date"
          accessedAt={lastAt}
        />
      )}
      <ProgressBar value={percent} label="Progresso da trilha" />
    </div>
  );
}

function MaterialReader() {
  const { visited, modulePercent, moduleCompleted, showModuleBar, ctx } =
    useMaterialProgress();
  const { trackProgress } = useProgressSnapshot(ctx.trackSlug);
  const moduleLastAt =
    ctx.moduleId && trackProgress
      ? trackProgress.moduleProgress[ctx.moduleId]?.lastVisitedAt
      : undefined;

  return (
    <div className="mb-8 p-4 border-2 border-ink bg-highlight/30 rounded-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {moduleLastAt && (
          <AccessBadge
            label={formatAccessLabel(moduleLastAt)}
            variant="date"
            accessedAt={moduleLastAt}
          />
        )}
        {visited && !moduleCompleted && (
          <AccessBadge label="Em leitura" variant="in-progress" />
        )}
        {moduleCompleted && (
          <AccessBadge label="Módulo concluído" variant="completed" />
        )}
      </div>
      {showModuleBar && (
        <ProgressBar
          value={modulePercent}
          label="Progresso do módulo"
          size="sm"
        />
      )}
    </div>
  );
}

function MaterialFooter() {
  const { moduleCompleted, hasTrackContext, handleComplete } = useMaterialProgress();

  return (
    <div className="mt-12 flex flex-wrap gap-4">
      <BrutalButton href="/trilhas/" variant="secondary">
        VOLTAR ÀS TRILHAS
      </BrutalButton>
      {hasTrackContext && !moduleCompleted && (
        <BrutalButton type="button" variant="primary" onClick={handleComplete}>
          Concluir módulo
        </BrutalButton>
      )}
    </div>
  );
}

export type { ModuleProgressContext };
