"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrackModule } from "@/domain/entities";
import {
  getModulePercent,
  isModuleComplete,
} from "@/application/progress/progress";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";

export interface ModuleProgressContext {
  trackSlug?: string;
  moduleId?: string;
  module?: TrackModule;
}

function resolveFromUrl(
  trackContext?: ModuleProgressContext
): ModuleProgressContext {
  let module = trackContext?.module;
  let trackSlug = trackContext?.trackSlug;
  let moduleId = trackContext?.moduleId;

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    trackSlug = trackSlug ?? params.get("track") ?? undefined;
    moduleId = moduleId ?? params.get("module") ?? undefined;
    const chunksParam = params.get("chunks");
    if (!module && chunksParam && moduleId) {
      module = {
        id: moduleId,
        title: "",
        summary: "",
        chunkIds: chunksParam.split(",").filter(Boolean),
        estimatedMinutes: 0,
      };
    }
  }

  return { trackSlug, moduleId, module };
}

export function useModuleProgress(
  chunkId: string,
  trackContext?: ModuleProgressContext
) {
  const [visited, setVisited] = useState(false);
  const [modulePercent, setModulePercent] = useState(0);
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [showModuleBar, setShowModuleBar] = useState(false);
  const [ctx, setCtx] = useState<ModuleProgressContext>({});

  useEffect(() => {
    const resolved = resolveFromUrl(trackContext);
    setCtx(resolved);

    const { trackSlug, moduleId, module } = resolved;
    const store = new LocalStorageProgressStore();

    if (trackSlug && moduleId && module && module.chunkIds.length > 0) {
      const progress = store.visitChunkInModule(trackSlug, moduleId, chunkId, module);
      const state = progress.moduleProgress[moduleId];
      setVisited(state?.visitedChunkIds.includes(chunkId) ?? false);
      setModulePercent(getModulePercent(module, progress, moduleId));
      setModuleCompleted(isModuleComplete(progress, moduleId));
      setShowModuleBar(true);
    }
  }, [chunkId, trackContext]);

  const handleComplete = useCallback(() => {
    const { trackSlug, moduleId, module } = ctx;
    if (!trackSlug || !moduleId || !module) return;

    const store = new LocalStorageProgressStore();
    const progress = store.completeModuleInTrack(trackSlug, moduleId, module);
    setModulePercent(getModulePercent(module, progress, moduleId));
    setModuleCompleted(true);
  }, [ctx]);

  const hasTrackContext = Boolean(
    showModuleBar && ctx.trackSlug && ctx.moduleId && ctx.module
  );

  return {
    visited,
    modulePercent,
    moduleCompleted,
    showModuleBar,
    hasTrackContext,
    handleComplete,
  };
}
