"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BrutalButton } from "./BrutalButton";
import { ProgressBar } from "./ProgressBar";
import {
  useModuleProgress,
  type ModuleProgressContext,
} from "@/presentation/hooks/useModuleProgress";
import type { TrackModule } from "@/domain/entities";
import { getTrackPercent } from "@/application/progress/progress";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { useEffect, useState } from "react";

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
  const [percent, setPercent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const store = new LocalStorageProgressStore();
    const progress = store.getTrackProgress(trackSlug);
    setPercent(getTrackPercent(modules, progress));
    setMounted(true);
  }, [trackSlug, moduleCount, modules]);

  if (!mounted) return null;

  return (
    <div className="mb-10">
      <ProgressBar value={percent} label="Progresso da trilha" />
    </div>
  );
}

function MaterialReader() {
  const { visited, modulePercent, moduleCompleted, showModuleBar } =
    useMaterialProgress();

  return (
    <div className="mb-8 p-4 border-2 border-ink bg-highlight/30 rounded-sm">
      {visited && !moduleCompleted && (
        <p className="font-mono text-xs tracking-widest text-muted mb-2">
          Material em leitura
        </p>
      )}
      {moduleCompleted && (
        <p className="font-mono text-xs tracking-widest text-success mb-2">
          Módulo concluído
        </p>
      )}
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
