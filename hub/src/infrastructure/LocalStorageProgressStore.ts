import type { HubActivity, HubActivityEntry, QuizDeckState, QuizLevel, TrackModule, TrackProgress } from "@/domain/entities";
import {
  completeModule,
  emptyTrackProgress,
  normalizeTrackProgress,
  visitModuleChunk,
} from "@/application/progress/progress";
import {
  buildMaterialActivity,
  buildQuizActivity,
  buildTrackActivity,
  HUB_ACTIVITY_KEY,
  normalizeHubActivity,
  notifyProgressChange,
  recordHubActivity,
} from "@/application/progress/hubActivity";
import type { ProgressStore } from "@/domain/ports";

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
    notifyProgressChange();
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
    notifyProgressChange();
  }

  getHubActivity(): HubActivity {
    if (!this.storage) return {};
    const raw = this.storage.getItem(HUB_ACTIVITY_KEY);
    if (!raw) return {};
    try {
      return normalizeHubActivity(JSON.parse(raw));
    } catch {
      return {};
    }
  }

  saveHubActivity(activity: HubActivity): void {
    if (!this.storage) return;
    this.storage.setItem(HUB_ACTIVITY_KEY, JSON.stringify(activity));
    notifyProgressChange();
  }

  recordActivity(entry: HubActivityEntry): void {
    this.saveHubActivity(recordHubActivity(entry));
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
    this.recordActivity(
      buildMaterialActivity({ trackSlug, moduleId, chunkId })
    );
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
    this.recordActivity(
      buildMaterialActivity({
        trackSlug,
        moduleId,
        chunkId: module.chunkIds[0],
      })
    );
    return next;
  }

  recordTrackView(trackSlug: string): void {
    this.recordActivity(buildTrackActivity(trackSlug));
  }

  recordQuizView(level: QuizLevel): void {
    this.recordActivity(buildQuizActivity(level));
  }

  recordMaterialView(chunkId: string, trackSlug?: string, moduleId?: string): void {
    this.recordActivity(buildMaterialActivity({ chunkId, trackSlug, moduleId }));
  }
}
