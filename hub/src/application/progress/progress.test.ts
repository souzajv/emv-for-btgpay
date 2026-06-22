import { describe, expect, it } from "vitest";
import { ContentChunkSchema } from "@/infrastructure/JsonContentRepository";
import {
  completeModule,
  emptyTrackProgress,
  getModulePercent,
  getTargetChunkId,
  getTrackPercent,
  isModuleComplete,
  visitModuleChunk,
} from "@/application/progress/progress";
import type { TrackModule } from "@/domain/entities";

describe("ContentChunkSchema", () => {
  it("rejects metadata without id", () => {
    const result = ContentChunkSchema.safeParse({
      kept: 108,
      demoted: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid chunk", () => {
    const result = ContentChunkSchema.safeParse({
      id: "test",
      sourceUrl: "https://example.com",
      sourceType: "web",
      category: "fundamentos",
      title: "Test",
      sections: [{ anchorId: "a", heading: "H", bodyMd: "body" }],
      btgpayRelevance: "alta",
      scrapedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("per-module progress (shared chunkIds)", () => {
  const sharedChunk = "seguranca-terminal";
  const modA: TrackModule = {
    id: "mod-ambiente",
    title: "Ambiente",
    summary: "S",
    chunkIds: [sharedChunk],
    estimatedMinutes: 10,
  };
  const modB: TrackModule = {
    id: "mod-pci",
    title: "PCI",
    summary: "S",
    chunkIds: [sharedChunk],
    estimatedMinutes: 10,
  };

  it("visiting chunk in modA does not complete modB", () => {
    let progress = emptyTrackProgress();
    progress = visitModuleChunk({
      trackSlug: "seguranca-terminal",
      moduleId: modA.id,
      chunkId: sharedChunk,
      module: modA,
      trackProgress: progress,
    });

    expect(getModulePercent(modA, progress, modA.id)).toBe(50);
    expect(getModulePercent(modB, progress, modB.id)).toBe(0);
    expect(isModuleComplete(progress, modA.id)).toBe(false);
    expect(isModuleComplete(progress, modB.id)).toBe(false);
  });

  it("module reaches 100% only after explicit complete", () => {
    let progress = visitModuleChunk({
      trackSlug: "test",
      moduleId: modA.id,
      chunkId: sharedChunk,
      module: modA,
      trackProgress: emptyTrackProgress(),
    });

    expect(getModulePercent(modA, progress, modA.id)).toBe(50);

    progress = completeModule({
      moduleId: modA.id,
      module: modA,
      trackProgress: progress,
    });

    expect(getModulePercent(modA, progress, modA.id)).toBe(100);
    expect(isModuleComplete(progress, modA.id)).toBe(true);
    expect(getModulePercent(modB, progress, modB.id)).toBe(0);
  });

  it("track percent counts only explicitly completed modules", () => {
    let progress = completeModule({
      moduleId: modA.id,
      module: modA,
      trackProgress: emptyTrackProgress(),
    });

    expect(getTrackPercent([modA, modB], progress)).toBe(50);
  });
});

describe("getTargetChunkId", () => {
  const module: TrackModule = {
    id: "m",
    title: "T",
    summary: "S",
    chunkIds: ["c1", "c2"],
    estimatedMinutes: 5,
  };

  it("returns first unread chunk in module scope", () => {
    const progress = visitModuleChunk({
      trackSlug: "t",
      moduleId: "m",
      chunkId: "c1",
      module,
      trackProgress: emptyTrackProgress(),
    });
    expect(getTargetChunkId(module, progress, "m")).toBe("c2");
  });

  it("returns first chunk when all visited", () => {
    let progress = emptyTrackProgress();
    for (const id of module.chunkIds) {
      progress = visitModuleChunk({
        trackSlug: "t",
        moduleId: "m",
        chunkId: id,
        module,
        trackProgress: progress,
      });
    }
    expect(getTargetChunkId(module, progress, "m")).toBe("c1");
  });
});

describe("getModulePercent", () => {
  it("calculates visit percent without auto-complete", () => {
    const mod: TrackModule = {
      id: "m",
      title: "T",
      summary: "S",
      chunkIds: ["a", "b"],
      estimatedMinutes: 5,
    };
    const progress = visitModuleChunk({
      trackSlug: "t",
      moduleId: "m",
      chunkId: "a",
      module: mod,
      trackProgress: emptyTrackProgress(),
    });
    expect(getModulePercent(mod, progress, "m")).toBe(25);
    expect(isModuleComplete(progress, "m")).toBe(false);
  });
});
