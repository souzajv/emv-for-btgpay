import type { QuizDeckState, QuizLevel } from "@/domain/entities";
import { shuffle } from "@/domain/utils";

const BATCH_SIZE = 10;

export interface DrawQuizBatchInput {
  level: QuizLevel;
  allQuestionIds: string[];
  existingState: QuizDeckState | null;
}

export interface DrawQuizBatchResult {
  questionIds: string[];
  newState: QuizDeckState;
}

export function drawQuizBatch(input: DrawQuizBatchInput): DrawQuizBatchResult {
  const { level, allQuestionIds, existingState } = input;

  let queue = existingState?.queue ?? [];
  let cycle = existingState?.cycle ?? 1;

  if (queue.length === 0) {
    queue = shuffle(allQuestionIds);
    if (existingState && existingState.cycle > 0) {
      cycle = existingState.cycle + 1;
    }
  }

  const batch: string[] = [];
  let remaining = [...queue];

  while (batch.length < BATCH_SIZE && remaining.length > 0) {
    batch.push(remaining.shift()!);
  }

  if (batch.length < BATCH_SIZE) {
    const reshuffled = shuffle(allQuestionIds);
    for (const id of reshuffled) {
      if (batch.length >= BATCH_SIZE) break;
      if (!batch.includes(id)) batch.push(id);
    }
    remaining = reshuffled.filter((id) => !batch.includes(id));
    cycle += 1;
  }

  return {
    questionIds: batch,
    newState: {
      level,
      queue: remaining,
      cycle,
      lastSessionAt: new Date().toISOString(),
    },
  };
}

export function getSourceLink(chunkId: string, anchorId: string): string {
  return `/material/${chunkId}/#${anchorId}`;
}
