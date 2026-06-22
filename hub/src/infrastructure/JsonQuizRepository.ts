import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { QuizRepository } from "@/domain/ports";
import type { QuizLevel, QuizQuestion } from "@/domain/entities";
import { z } from "zod";

const QuizQuestionSchema = z.object({
  id: z.string(),
  level: z.enum(["junior", "pleno", "senior"]),
  difficulty: z.number(),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number(),
  explanation: z.string(),
  sourceChunkId: z.string(),
  anchorId: z.string(),
});

const QuizFileSchema = z.object({
  level: z.enum(["junior", "pleno", "senior"]),
  questions: z.array(QuizQuestionSchema),
});

function getQuizzesDir(): string {
  return join(process.cwd(), "..", "content", "quizzes");
}

export class JsonQuizRepository implements QuizRepository {
  private cache: Map<QuizLevel, QuizQuestion[]> = new Map();

  async getQuestionsByLevel(level: QuizLevel): Promise<QuizQuestion[]> {
    if (this.cache.has(level)) return this.cache.get(level)!;

    const filePath = join(getQuizzesDir(), `${level}.json`);
    if (!existsSync(filePath)) return [];

    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const parsed = QuizFileSchema.parse(raw);
    this.cache.set(level, parsed.questions);
    return parsed.questions;
  }

  async getQuestionById(id: string): Promise<QuizQuestion | null> {
    for (const level of ["junior", "pleno", "senior"] as QuizLevel[]) {
      const questions = await this.getQuestionsByLevel(level);
      const found = questions.find((q) => q.id === id);
      if (found) return found;
    }
    return null;
  }
}
