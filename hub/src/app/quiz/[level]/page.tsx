import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { quizRepo } from "@/infrastructure";
import type { QuizLevel } from "@/domain/entities";
import { QuizRunner } from "@/presentation/components/QuizRunner";
import { SectionHead } from "@/presentation/components/SectionHead";

interface Props {
  params: Promise<{ level: string }>;
}

const VALID: QuizLevel[] = ["junior", "pleno", "senior"];

export function generateStaticParams() {
  return VALID.map((level) => ({ level }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level } = await params;
  return { title: `Quiz ${level}` };
}

export default async function QuizLevelPage({ params }: Props) {
  const { level } = await params;
  if (!VALID.includes(level as QuizLevel)) notFound();

  const questions = await quizRepo.getQuestionsByLevel(level as QuizLevel);
  const titles = { junior: "Júnior", pleno: "Pleno", senior: "Sênior" };

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <SectionHead tag="QUIZ" title={`Nível ${titles[level as QuizLevel]}`} />
      <QuizRunner level={level as QuizLevel} questions={questions} />
    </div>
  );
}
