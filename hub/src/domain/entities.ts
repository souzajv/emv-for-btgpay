export type SourceType = "web" | "pdf";
export type BtgPayRelevance = "alta" | "media" | "baixa";
export type QuizLevel = "junior" | "pleno" | "senior";

export interface SectionVerification {
  evidence: string;
  sourceRel: string;
  status: "OK" | "GAP";
}

export interface ContentSection {
  anchorId: string;
  heading: string;
  bodyMd: string;
  btgpayNote?: string;
  verification?: SectionVerification;
}

export interface ContentChunk {
  id: string;
  sourceUrl: string;
  sourceType: SourceType;
  category: string;
  title: string;
  sections: ContentSection[];
  btgpayRelevance: BtgPayRelevance;
  scrapedAt: string;
}

export interface TrackModule {
  id: string;
  title: string;
  summary: string;
  chunkIds: string[];
  sectionAnchorIds?: string[];
  estimatedMinutes: number;
}

export interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  modules: TrackModule[];
  estimatedMinutes: number;
}

export interface QuizQuestion {
  id: string;
  level: QuizLevel;
  difficulty: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceChunkId: string;
  anchorId: string;
}

export interface QuizSession {
  level: QuizLevel;
  questionIds: string[];
  answers: Record<string, number>;
  completedAt?: string;
}

export interface QuizDeckState {
  level: QuizLevel;
  queue: string[];
  cycle: number;
  lastSessionAt?: string;
}

export interface ModuleProgress {
  visitedChunkIds: string[];
  completed: boolean;
}

export interface HubProgress {
  readChunkIds: string[];
}

export interface TrackProgress {
  moduleProgress: Record<string, ModuleProgress>;
  lastVisitedModule?: string;
}
