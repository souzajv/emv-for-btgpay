import { JsonContentRepository } from "@/infrastructure/JsonContentRepository";
import { JsonQuizRepository } from "@/infrastructure/JsonQuizRepository";

export const contentRepo = new JsonContentRepository();
export const quizRepo = new JsonQuizRepository();
