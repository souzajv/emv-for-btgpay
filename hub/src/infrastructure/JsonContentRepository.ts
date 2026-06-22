import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import type { ContentRepository } from "@/domain/ports";
import type { ContentChunk, LearningTrack } from "@/domain/entities";
import { z } from "zod";

const SectionVerificationSchema = z.object({
  evidence: z.string(),
  sourceRel: z.string(),
  status: z.enum(["OK", "GAP"]),
});

const ContentSectionSchema = z.object({
  anchorId: z.string(),
  heading: z.string(),
  bodyMd: z.string(),
  btgpayNote: z.string().optional(),
  verification: SectionVerificationSchema.optional(),
});

export const ContentChunkSchema = z.object({
  id: z.string(),
  sourceUrl: z.string(),
  sourceType: z.enum(["web", "pdf"]),
  category: z.string(),
  title: z.string(),
  sections: z.array(ContentSectionSchema),
  btgpayRelevance: z.enum(["alta", "media", "baixa"]),
  scrapedAt: z.string(),
});

const TrackModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  chunkIds: z.array(z.string()),
  sectionAnchorIds: z.array(z.string()).optional(),
  estimatedMinutes: z.number(),
});

const LearningTrackSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  modules: z.array(TrackModuleSchema),
  estimatedMinutes: z.number(),
});

function getContentDir(): string {
  return join(process.cwd(), "..", "content");
}

function isChunkFile(filename: string): boolean {
  return (
    filename.endsWith(".json") &&
    !filename.startsWith("_") &&
    !filename.endsWith(".schema.json")
  );
}

export class JsonContentRepository implements ContentRepository {
  private chunksCache: ContentChunk[] | null = null;
  private tracksCache: LearningTrack[] | null = null;

  async getAllChunks(): Promise<ContentChunk[]> {
    if (this.chunksCache) return this.chunksCache;

    const chunksDir = join(getContentDir(), "chunks");
    if (!existsSync(chunksDir)) {
      this.chunksCache = [];
      return [];
    }

    const files = readdirSync(chunksDir).filter(isChunkFile);
    const chunks: ContentChunk[] = [];

    for (const file of files) {
      try {
        const raw = JSON.parse(readFileSync(join(chunksDir, file), "utf-8"));
        const result = ContentChunkSchema.safeParse(raw);
        if (result.success) {
          chunks.push(result.data);
        } else if (process.env.NODE_ENV === "development") {
          console.warn(`[chunks] skip ${file}:`, result.error.issues[0]?.message);
        }
      } catch {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[chunks] skip ${file}: invalid JSON`);
        }
      }
    }

    this.chunksCache = chunks;
    return chunks;
  }

  async getChunkById(id: string): Promise<ContentChunk | null> {
    const chunks = await this.getAllChunks();
    return chunks.find((c) => c.id === id) ?? null;
  }

  async getAllTracks(): Promise<LearningTrack[]> {
    if (this.tracksCache) return this.tracksCache;

    const tracksDir = join(getContentDir(), "tracks");
    if (!existsSync(tracksDir)) {
      this.tracksCache = [];
      return [];
    }

    const files = readdirSync(tracksDir).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_")
    );
    const tracks: LearningTrack[] = [];

    for (const file of files) {
      const raw = JSON.parse(readFileSync(join(tracksDir, file), "utf-8"));
      tracks.push(LearningTrackSchema.parse(raw));
    }

    this.tracksCache = tracks.sort((a, b) => a.order - b.order);
    return this.tracksCache;
  }

  async getTrackBySlug(slug: string): Promise<LearningTrack | null> {
    const tracks = await this.getAllTracks();
    return tracks.find((t) => t.slug === slug) ?? null;
  }
}
