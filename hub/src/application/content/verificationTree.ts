import type { ContentSection, LearningTrack } from "@/domain/entities";
import { normalizeSection } from "@/application/content/normalizeSection";

export interface VerificationItem {
  chunkId: string;
  chunkTitle: string;
  anchorId: string;
  sectionHeading: string;
  evidence: string;
  sourceRel: string;
  status: "OK" | "GAP";
}

export interface ModuleVerificationGroup {
  moduleId: string;
  moduleTitle: string;
  items: VerificationItem[];
}

export interface TrackVerificationGroup {
  trackSlug: string;
  trackTitle: string;
  modules: ModuleVerificationGroup[];
}

export function filterSectionsByAnchors(
  sections: ContentSection[],
  anchorIds?: string[]
): ContentSection[] {
  if (!anchorIds || anchorIds.length === 0) return sections;
  const set = new Set(anchorIds);
  const filtered = sections.filter((s) => set.has(s.anchorId));
  return filtered.length > 0 ? filtered : sections;
}

export function resolveSectionAnchors(
  moduleSectionAnchorIds: string[] | undefined,
  chunkId: string,
  sections: ContentSection[]
): string[] | undefined {
  if (moduleSectionAnchorIds && moduleSectionAnchorIds.length > 0) {
    return moduleSectionAnchorIds;
  }
  return sections.map((s) => s.anchorId);
}

export function buildVerificationTree(
  tracks: LearningTrack[],
  chunksById: Map<string, { id: string; title: string; sections: ContentSection[] }>
): TrackVerificationGroup[] {
  return tracks.map((track) => ({
    trackSlug: track.slug,
    trackTitle: track.title,
    modules: track.modules.map((mod) => {
      const items: VerificationItem[] = [];

      for (const chunkId of mod.chunkIds) {
        const chunk = chunksById.get(chunkId);
        if (!chunk) continue;

        const anchorIds = resolveSectionAnchors(
          mod.sectionAnchorIds,
          chunkId,
          chunk.sections
        );
        const sections = filterSectionsByAnchors(chunk.sections, anchorIds);

        for (const section of sections) {
          const normalized = normalizeSection(section);
          if (!normalized.verification) continue;
          items.push({
            chunkId: chunk.id,
            chunkTitle: chunk.title,
            anchorId: section.anchorId,
            sectionHeading: section.heading,
            evidence: normalized.verification.evidence,
            sourceRel: normalized.verification.sourceRel,
            status: normalized.verification.status,
          });
        }
      }

      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        items,
      };
    }),
  }));
}
