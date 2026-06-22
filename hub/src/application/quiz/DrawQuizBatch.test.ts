import { describe, expect, it } from "vitest";
import { drawQuizBatch } from "./DrawQuizBatch";

const IDS = Array.from({ length: 50 }, (_, i) => `q-${i + 1}`);

describe("drawQuizBatch", () => {
  it("returns 10 unique questions from a fresh deck", () => {
    const result = drawQuizBatch({
      level: "junior",
      allQuestionIds: IDS,
      existingState: null,
    });
    expect(result.questionIds).toHaveLength(10);
    expect(new Set(result.questionIds).size).toBe(10);
    expect(result.newState.queue).toHaveLength(40);
  });

  it("does not repeat until queue is exhausted across 5 sessions", () => {
    let state = null;
    const seen = new Set<string>();

    for (let session = 0; session < 5; session++) {
      const result = drawQuizBatch({
        level: "junior",
        allQuestionIds: IDS,
        existingState: state,
      });
      state = result.newState;

      for (const id of result.questionIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }

    expect(seen.size).toBe(50);
  });

  it("starts new cycle after all questions seen", () => {
    let state = null;
    for (let i = 0; i < 5; i++) {
      const r = drawQuizBatch({ level: "pleno", allQuestionIds: IDS, existingState: state });
      state = r.newState;
    }
    expect(state!.queue.length).toBeLessThanOrEqual(50);
    const next = drawQuizBatch({ level: "pleno", allQuestionIds: IDS, existingState: state });
    expect(next.questionIds).toHaveLength(10);
  });
});
