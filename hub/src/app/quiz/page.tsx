import type { Metadata } from "next";
import { QuizLevelCard } from "@/presentation/components/QuizLevelCard";
import { SectionHead } from "@/presentation/components/SectionHead";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Quiz EMV por nível. 10 perguntas por sessão, sem repetição até completar o ciclo.",
};

const LEVELS = [
  {
    id: "junior" as const,
    title: "Júnior",
    desc: "Conceitos base: EMV, chip, CP/CNP, contactless intro.",
  },
  {
    id: "pleno" as const,
    title: "Pleno",
    desc: "Kernel, DE 55, CDCVM, PCI e integração SDK.",
  },
  {
    id: "senior" as const,
    title: "Sênior",
    desc: "Arquitetura, certificação, estorno, observabilidade e riscos.",
  },
];

export default function QuizPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <SectionHead
        tag="QUIZ"
        title="Validar conhecimento"
        intro="Cada sessão tem 10 perguntas. Você só verá a mesma pergunta novamente após completar todas do nível (50 por nível). Badges mostram quando você estudou pela última vez."
      />
      <div className="space-y-4">
        {LEVELS.map((level) => (
          <QuizLevelCard
            key={level.id}
            id={level.id}
            title={level.title}
            desc={level.desc}
          />
        ))}
      </div>
    </div>
  );
}
