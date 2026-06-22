import type { ProgressStore } from "@/domain/ports";
import type { QuizDeckState, QuizLevel, TrackModule, TrackProgress } from "@/domain/entities";
import {
  completeModule,
  emptyTrackProgress,
  normalizeTrackProgress,
  visitModuleChunk,
} from "@/application/progress/progress";

const DECK_PREFIX = "emv-hub-deck-";
const TRACK_PREFIX = "emv-hub-track-";

export class LocalStorageProgressStore implements ProgressStore {
  private storage: Storage | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.storage = window.localStorage;
    }
  }

  getDeckState(level: QuizLevel): QuizDeckState | null {
    if (!this.storage) return null;
    const raw = this.storage.getItem(`${DECK_PREFIX}${level}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as QuizDeckState;
    } catch {
      return null;
    }
  }

  saveDeckState(state: QuizDeckState): void {
    if (!this.storage) return;
    this.storage.setItem(`${DECK_PREFIX}${state.level}`, JSON.stringify(state));
  }

  getTrackProgress(slug: string): TrackProgress {
    if (!this.storage) return emptyTrackProgress();
    const raw = this.storage.getItem(`${TRACK_PREFIX}${slug}`);
    if (!raw) return emptyTrackProgress();
    try {
      return normalizeTrackProgress(JSON.parse(raw));
    } catch {
      return emptyTrackProgress();
    }
  }

  saveTrackProgress(slug: string, progress: TrackProgress): void {
    if (!this.storage) return;
    this.storage.setItem(`${TRACK_PREFIX}${slug}`, JSON.stringify(progress));
  }

  visitChunkInModule(
    trackSlug: string,
    moduleId: string,
    chunkId: string,
    module: TrackModule
  ): TrackProgress {
    const current = this.getTrackProgress(trackSlug);
    const next = visitModuleChunk({
      trackSlug,
      moduleId,
      chunkId,
      module,
      trackProgress: current,
    });
    this.saveTrackProgress(trackSlug, next);
    return next;
  }

  completeModuleInTrack(
    trackSlug: string,
    moduleId: string,
    module: TrackModule
  ): TrackProgress {
    const current = this.getTrackProgress(trackSlug);
    const next = completeModule({ moduleId, module, trackProgress: current });
    this.saveTrackProgress(trackSlug, next);
    return next;
  }
}
