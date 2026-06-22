import type {
  ContentChunk,
  LearningTrack,
  QuizDeckState,
  QuizLevel,
  QuizQuestion,
  TrackModule,
  TrackProgress,
} from "./entities";

export interface ContentRepository {
  getAllChunks(): Promise<ContentChunk[]>;
  getChunkById(id: string): Promise<ContentChunk | null>;
  getAllTracks(): Promise<LearningTrack[]>;
  getTrackBySlug(slug: string): Promise<LearningTrack | null>;
}

export interface QuizRepository {
  getQuestionsByLevel(level: QuizLevel): Promise<QuizQuestion[]>;
  getQuestionById(id: string): Promise<QuizQuestion | null>;
}

export interface ProgressStore {
  getDeckState(level: QuizLevel): QuizDeckState | null;
  saveDeckState(state: QuizDeckState): void;
  getTrackProgress(slug: string): TrackProgress;
  saveTrackProgress(slug: string, progress: TrackProgress): void;
  visitChunkInModule(
    trackSlug: string,
    moduleId: string,
    chunkId: string,
    module: TrackModule
  ): TrackProgress;
  completeModuleInTrack(
    trackSlug: string,
    moduleId: string,
    module: TrackModule
  ): TrackProgress;
}
