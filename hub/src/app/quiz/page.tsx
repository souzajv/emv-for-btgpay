import type { Metadata } from "next";
import Link from "next/link";
import { BrutalCard } from "@/presentation/components/BrutalCard";
import { SectionHead } from "@/presentation/components/SectionHead";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Quiz EMV por nível. 10 perguntas por sessão, sem repetição até completar o ciclo.",
};

const LEVELS = [
  {
    id: "junior",
    title: "Júnior",
    desc: "Conceitos base: EMV, chip, CP/CNP, contactless intro.",
  },
  {
    id: "pleno",
    title: "Pleno",
    desc: "Kernel, DE 55, CDCVM, PCI e integração SDK.",
  },
  {
    id: "senior",
    title: "Sênior",
    desc: "Arquitetura, certificação, estorno, observabilidade e riscos.",
  },
] as const;

export default function QuizPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <SectionHead
        tag="QUIZ"
        title="Validar conhecimento"
        intro="Cada sessão tem 10 perguntas. Você só verá a mesma pergunta novamente após completar todas do nível (50 por nível)."
      />
      <div className="space-y-4">
        {LEVELS.map((level) => (
          <Link key={level.id} href={`/quiz/${level.id}/`}>
            <BrutalCard className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{level.title}</h2>
                <p className="text-sm text-muted mt-1">{level.desc}</p>
              </div>
              <span className="font-mono text-xs tracking-widest">10 perguntas →</span>
            </BrutalCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
