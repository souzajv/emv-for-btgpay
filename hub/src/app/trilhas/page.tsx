import type { Metadata } from "next";
import { contentRepo } from "@/infrastructure";
import { Reveal } from "@/presentation/components/Reveal";
import { SectionHead } from "@/presentation/components/SectionHead";
import { TrackProgressCard } from "@/presentation/components/TrackProgressCard";

export const metadata: Metadata = {
  title: "Trilhas",
  description: "Trilhas de aprendizado EMV ordenadas para o time BtgPay.",
};

export default async function TrilhasPage() {
  const tracks = await contentRepo.getAllTracks();

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <SectionHead
        tag="TRILHAS"
        title="Todas as trilhas"
        intro="Complete na ordem sugerida para construir base sólida antes do curso EMV."
      />
      <ol className="space-y-6">
        {tracks.map((track, i) => (
          <Reveal key={track.id} delay={i * 60}>
            <li>
              <TrackProgressCard track={track} />
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
