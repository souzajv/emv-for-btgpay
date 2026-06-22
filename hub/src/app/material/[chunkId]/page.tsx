import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contentRepo } from "@/infrastructure";
import { MaterialPageShell } from "@/presentation/components/MaterialReader";
import { MaterialContent } from "@/presentation/components/MaterialContent";

interface Props {
  params: Promise<{ chunkId: string }>;
}

export async function generateStaticParams() {
  const chunks = await contentRepo.getAllChunks();
  return chunks.map((c) => ({ chunkId: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chunkId } = await params;
  const chunk = await contentRepo.getChunkById(chunkId);
  return { title: chunk?.title ?? "Material" };
}

export default async function MaterialPage({ params }: Props) {
  const { chunkId } = await params;
  const chunk = await contentRepo.getChunkById(chunkId);
  if (!chunk) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <MaterialPageShell chunkId={chunkId}>
        <div className="font-mono text-xs tracking-widest text-muted mb-4">
          {chunk.category.toUpperCase()} · {chunk.sourceType.toUpperCase()}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">{chunk.title}</h1>
        <div className="mt-10">
          <MaterialContent sections={chunk.sections} />
        </div>
      </MaterialPageShell>
    </div>
  );
}
