import type { LearningTrack } from "@/domain/entities";
import type { TrackProgress } from "@/domain/entities";
import { getTargetChunkId } from "@/application/progress/progress";

export function findLatestTrackAccess(
  tracks: LearningTrack[],
  progressBySlug: Record<string, TrackProgress>
): { track: LearningTrack; at: string } | null {
  let best: { track: LearningTrack; at: string } | null = null;

  for (const track of tracks) {
    const progress = progressBySlug[track.slug];
    const at = progress?.lastAccessedAt;
    if (!at) continue;
    if (!best || new Date(at).getTime() > new Date(best.at).getTime()) {
      best = { track, at };
    }
  }

  return best;
}

export function buildContinueHref(
  track: LearningTrack,
  progress: TrackProgress
): string {
  const moduleId = progress.lastVisitedModule ?? track.modules[0]?.id;
  const mod = track.modules.find((m) => m.id === moduleId) ?? track.modules[0];
  if (!mod) return `/trilhas/${track.slug}/`;

  const chunkId = progress.lastVisitedChunkId
    ? mod.chunkIds.includes(progress.lastVisitedChunkId)
      ? progress.lastVisitedChunkId
      : getTargetChunkId(mod, progress, mod.id)
    : getTargetChunkId(mod, progress, mod.id);

  const chunksParam = mod.chunkIds.join(",");
  const sectionsParam =
    mod.sectionAnchorIds && mod.sectionAnchorIds.length > 0
      ? `&sections=${mod.sectionAnchorIds.join(",")}`
      : "";

  return `/material/${chunkId || mod.chunkIds[0]}/?track=${track.slug}&module=${mod.id}&chunks=${chunksParam}${sectionsParam}`;
}

export function getModuleTitle(track: LearningTrack, moduleId?: string): string {
  if (!moduleId) return "";
  return track.modules.find((m) => m.id === moduleId)?.title ?? "";
}
