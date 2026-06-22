import type { HubActivity, HubActivityEntry, QuizLevel } from "@/domain/entities";

export const HUB_ACTIVITY_KEY = "emv-hub-activity";
export const PROGRESS_CHANGE_EVENT = "emv-hub-progress";

export function emptyHubActivity(): HubActivity {
  return {};
}

export function normalizeHubActivity(raw: unknown): HubActivity {
  if (!raw || typeof raw !== "object") return emptyHubActivity();
  const obj = raw as Record<string, unknown>;
  const last = obj.last;
  if (!last || typeof last !== "object") return emptyHubActivity();
  const entry = last as Record<string, unknown>;
  if (typeof entry.accessedAt !== "string") return emptyHubActivity();

  const kind = entry.kind;
  if (kind !== "material" && kind !== "quiz" && kind !== "track") {
    return emptyHubActivity();
  }

  return {
    last: {
      kind,
      accessedAt: entry.accessedAt,
      trackSlug: typeof entry.trackSlug === "string" ? entry.trackSlug : undefined,
      moduleId: typeof entry.moduleId === "string" ? entry.moduleId : undefined,
      chunkId: typeof entry.chunkId === "string" ? entry.chunkId : undefined,
      quizLevel:
        entry.quizLevel === "junior" ||
        entry.quizLevel === "pleno" ||
        entry.quizLevel === "senior"
          ? entry.quizLevel
          : undefined,
    },
  };
}

export function recordHubActivity(entry: HubActivityEntry): HubActivity {
  return { last: entry };
}

export function buildMaterialActivity(input: {
  trackSlug?: string;
  moduleId?: string;
  chunkId: string;
  at?: string;
}): HubActivityEntry {
  return {
    kind: "material",
    trackSlug: input.trackSlug,
    moduleId: input.moduleId,
    chunkId: input.chunkId,
    accessedAt: input.at ?? new Date().toISOString(),
  };
}

export function buildQuizActivity(level: QuizLevel, at?: string): HubActivityEntry {
  return {
    kind: "quiz",
    quizLevel: level,
    accessedAt: at ?? new Date().toISOString(),
  };
}

export function buildTrackActivity(trackSlug: string, at?: string): HubActivityEntry {
  return {
    kind: "track",
    trackSlug,
    accessedAt: at ?? new Date().toISOString(),
  };
}

export function notifyProgressChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRESS_CHANGE_EVENT));
  }
}
