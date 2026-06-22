import type { ModuleProgress, TrackModule, TrackProgress } from "@/domain/entities";

export function emptyTrackProgress(): TrackProgress {
  return { moduleProgress: {} };
}

export function normalizeTrackProgress(raw: unknown): TrackProgress {
  if (!raw || typeof raw !== "object") return emptyTrackProgress();
  const obj = raw as Record<string, unknown>;
  if (obj.moduleProgress && typeof obj.moduleProgress === "object") {
    return {
      moduleProgress: obj.moduleProgress as Record<string, ModuleProgress>,
      lastVisitedModule:
        typeof obj.lastVisitedModule === "string" ? obj.lastVisitedModule : undefined,
    };
  }
  return emptyTrackProgress();
}

function getModuleState(
  progress: TrackProgress,
  moduleId: string
): ModuleProgress {
  return progress.moduleProgress[moduleId] ?? { visitedChunkIds: [], completed: false };
}

export function getModuleReadCount(
  module: TrackModule,
  progress: TrackProgress,
  moduleId: string
): number {
  const state = getModuleState(progress, moduleId);
  return module.chunkIds.filter((id) => state.visitedChunkIds.includes(id)).length;
}

export function getModulePercent(
  module: TrackModule,
  progress: TrackProgress,
  moduleId: string
): number {
  const state = getModuleState(progress, moduleId);
  if (state.completed) return 100;
  if (module.chunkIds.length === 0) return 0;

  const visitedCount = getModuleReadCount(module, progress, moduleId);
  if (visitedCount === 0) return 0;

  const visitCap =
    module.chunkIds.length === 1
      ? 50
      : Math.round(((module.chunkIds.length - 1) / module.chunkIds.length) * 100);

  return Math.min(
    visitCap,
    Math.round((visitedCount / module.chunkIds.length) * visitCap)
  );
}

export function isModuleComplete(
  progress: TrackProgress,
  moduleId: string
): boolean {
  return getModuleState(progress, moduleId).completed;
}

export function getTrackPercent(
  modules: TrackModule[],
  progress: TrackProgress
): number {
  if (modules.length === 0) return 0;
  const completed = modules.filter((m) => isModuleComplete(progress, m.id)).length;
  return Math.round((completed / modules.length) * 100);
}

export function getTargetChunkId(
  module: TrackModule,
  progress: TrackProgress,
  moduleId: string
): string {
  const state = getModuleState(progress, moduleId);
  const unread = module.chunkIds.find((id) => !state.visitedChunkIds.includes(id));
  return unread ?? module.chunkIds[0] ?? "";
}

export interface VisitModuleChunkInput {
  trackSlug: string;
  moduleId: string;
  chunkId: string;
  module: TrackModule;
  trackProgress: TrackProgress;
}

export function visitModuleChunk(input: VisitModuleChunkInput): TrackProgress {
  const { trackSlug, moduleId, chunkId, module, trackProgress } = input;
  const state = getModuleState(trackProgress, moduleId);
  const visitedChunkIds = state.visitedChunkIds.includes(chunkId)
    ? state.visitedChunkIds
    : [...state.visitedChunkIds, chunkId];

  const next: TrackProgress = {
    ...trackProgress,
    lastVisitedModule: moduleId,
    moduleProgress: {
      ...trackProgress.moduleProgress,
      [moduleId]: {
        ...state,
        visitedChunkIds,
        completed: state.completed,
      },
    },
  };

  return next;
}

export interface CompleteModuleInput {
  moduleId: string;
  module: TrackModule;
  trackProgress: TrackProgress;
}

export function completeModule(input: CompleteModuleInput): TrackProgress {
  const { moduleId, module, trackProgress } = input;
  const state = getModuleState(trackProgress, moduleId);

  const next: TrackProgress = {
    ...trackProgress,
    moduleProgress: {
      ...trackProgress.moduleProgress,
      [moduleId]: {
        visitedChunkIds: [...new Set([...state.visitedChunkIds, ...module.chunkIds])],
        completed: true,
      },
    },
  };

  return next;
}

