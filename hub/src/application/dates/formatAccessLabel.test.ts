import { describe, expect, it, vi } from "vitest";
import { formatAccessLabel, isAccessToday } from "@/application/dates/formatAccessLabel";

describe("formatAccessLabel", () => {
  const now = new Date("2026-06-22T15:00:00");

  it('returns "Hoje" for same calendar day', () => {
    expect(formatAccessLabel("2026-06-22T08:30:00", now)).toBe("Hoje");
  });

  it('returns "Ontem" for previous day', () => {
    expect(formatAccessLabel("2026-06-21T22:00:00", now)).toBe("Ontem");
  });

  it("returns short date for older access", () => {
    const label = formatAccessLabel("2026-05-10T12:00:00", now);
    expect(label).toMatch(/10/);
    expect(label).not.toBe("Hoje");
  });

  it("includes year when different from now", () => {
    const label = formatAccessLabel("2025-01-05T12:00:00", now);
    expect(label).toMatch(/2025/);
  });
});

describe("isAccessToday", () => {
  it("detects today", () => {
    const now = new Date("2026-06-22T12:00:00");
    expect(isAccessToday("2026-06-22T01:00:00", now)).toBe(true);
  });
});

describe("progress timestamps", () => {
  it("visitModuleChunk sets lastAccessedAt and module lastVisitedAt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00Z"));

    const { visitModuleChunk, emptyTrackProgress } = await import(
      "@/application/progress/progress"
    );

    const mod = {
      id: "mod-1",
      title: "T",
      summary: "S",
      chunkIds: ["c1"],
      estimatedMinutes: 5,
    };

    const next = visitModuleChunk({
      trackSlug: "t",
      moduleId: "mod-1",
      chunkId: "c1",
      module: mod,
      trackProgress: emptyTrackProgress(),
    });

    expect(next.lastAccessedAt).toBe("2026-06-22T10:00:00.000Z");
    expect(next.moduleProgress["mod-1"].lastVisitedAt).toBe("2026-06-22T10:00:00.000Z");

    vi.useRealTimers();
  });
});
