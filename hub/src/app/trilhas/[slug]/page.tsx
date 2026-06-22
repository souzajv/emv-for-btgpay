import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contentRepo } from "@/infrastructure";
import { BrutalButton } from "@/presentation/components/BrutalButton";
import { SectionHead } from "@/presentation/components/SectionHead";
import { TrackModuleCard } from "@/presentation/components/TrackModuleCard";
import { TrackProgressHeader } from "@/presentation/components/MaterialReader";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tracks = await contentRepo.getAllTracks();
  return tracks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const track = await contentRepo.getTrackBySlug(slug);
  return { title: track?.title ?? "Trilha" };
}

export default async function TrackPage({ params }: Props) {
  const { slug } = await params;
  const track = await contentRepo.getTrackBySlug(slug);
  if (!track) notFound();

  const allChunks = await contentRepo.getAllChunks();
  const chunkMap = new Map(allChunks.map((c) => [c.id, c]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <SectionHead
        tag={`TRILHA ${String(track.order).padStart(2, "0")}`}
        title={track.title}
        intro={track.description}
      />
      <p className="font-mono text-xs text-muted mb-6">
        {track.estimatedMinutes} min estimados · {track.modules.length} módulos
      </p>
      <TrackProgressHeader
        trackSlug={track.slug}
        moduleCount={track.modules.length}
        modules={track.modules}
      />
      <ol className="space-y-6">
        {track.modules.map((mod, i) => {
          const chunks = mod.chunkIds
            .map((id) => chunkMap.get(id))
            .filter(Boolean)
            .map((c) => ({ id: c!.id, title: c!.title }));

          return (
            <li key={mod.id}>
              <TrackModuleCard
                module={mod}
                index={i}
                trackSlug={track.slug}
                chunks={chunks}
              />
            </li>
          );
        })}
      </ol>
      <div className="mt-12 flex gap-4">
        <BrutalButton href="/trilhas/" variant="secondary">
          VOLTAR ÀS TRILHAS
        </BrutalButton>
        <BrutalButton href="/quiz/">TESTAR NO QUIZ</BrutalButton>
      </div>
    </div>
  );
}
