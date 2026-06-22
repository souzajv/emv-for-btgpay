import { contentRepo } from "@/infrastructure";
import { BrutalButton } from "@/presentation/components/BrutalButton";
import { MarqueeStrip } from "@/presentation/components/MarqueeStrip";
import { Reveal } from "@/presentation/components/Reveal";
import { SectionHead } from "@/presentation/components/SectionHead";
import { TrackProgressCard } from "@/presentation/components/TrackProgressCard";

export default async function HomePage() {
  const tracks = await contentRepo.getAllTracks();

  return (
    <>
      <section className="relative min-h-[85vh] flex items-center grid-bg">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <Reveal>
            <div className="inline-flex items-center gap-3 font-mono text-xs tracking-widest border-2 border-ink bg-highlight px-4 py-2 mb-8 shadow-brutal-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" aria-hidden />
              PRÉ-CURSO EMV · TIME MOBILE FLUTTER
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              EMV para
              <br />
              <span className="text-accent" style={{ WebkitTextStroke: "2px #000" }}>
                BtgPay POS.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-8 max-w-xl text-sm md:text-base text-muted leading-relaxed">
              Hub interno de capacitação: trilhas curadas a partir de EMVCo, Stripe,
              PayFelix e documentos oficiais, com quiz por nível e link direto ao
              material fonte.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap gap-4">
              <BrutalButton href="/trilhas/">COMEÇAR TRILHAS</BrutalButton>
              <BrutalButton href="/quiz/" variant="secondary">
                FAZER QUIZ
              </BrutalButton>
            </div>
          </Reveal>
        </div>
      </section>

      <MarqueeStrip />

      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHead
            tag="01 / TRILHAS"
            title="Aprendizado em ordem"
            subtitle="Do chip ao Tap to Mobile"
            intro="Cinco trilhas sequenciais pensadas para o time frontend mobile antes do curso oficial."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, i) => (
              <Reveal key={track.id} delay={i * 80}>
                <TrackProgressCard track={track} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
