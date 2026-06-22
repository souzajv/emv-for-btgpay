"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TrackModule } from "@/domain/entities";
import {
  getModulePercent,
  getTargetChunkId,
} from "@/application/progress/progress";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { BrutalCard } from "./BrutalCard";
import { ProgressBar } from "./ProgressBar";

export interface ModuleChunkInfo {
  id: string;
  title: string;
}

interface TrackModuleCardProps {
  module: TrackModule;
  index: number;
  trackSlug: string;
  chunks: ModuleChunkInfo[];
}

export function TrackModuleCard({
  module,
  index,
  trackSlug,
  chunks,
}: TrackModuleCardProps) {
  const [percent, setPercent] = useState(0);
  const [targetId, setTargetId] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const store = new LocalStorageProgressStore();
    const progress = store.getTrackProgress(trackSlug);
    setPercent(getModulePercent(module, progress, module.id));
    setTargetId(getTargetChunkId(module, progress, module.id));
    setMounted(true);
  }, [trackSlug, module]);

  const chunksParam = module.chunkIds.join(",");
  const sectionsParam =
    module.sectionAnchorIds && module.sectionAnchorIds.length > 0
      ? `&sections=${module.sectionAnchorIds.join(",")}`
      : "";
  const href = `/material/${targetId || module.chunkIds[0]}/?track=${trackSlug}&module=${module.id}&chunks=${chunksParam}${sectionsParam}`;
  const primaryTitle = chunks[0]?.title ?? "Material";

  return (
    <Link
      href={href}
      className="block group"
      aria-label={`Módulo ${index + 1}: ${module.title}. Ler ${primaryTitle}`}
    >
      <BrutalCard className="h-full group-hover:bg-highlight/20 transition-colors cursor-pointer">
        <div className="font-mono text-xs text-muted">Módulo {index + 1}</div>
        <h2 className="text-xl font-bold mt-2">{module.title}</h2>
        <p className="text-sm text-muted mt-2">{module.summary}</p>
        {mounted && (
          <div className="mt-4">
            <ProgressBar value={percent} label="Progresso do módulo" size="sm" />
          </div>
        )}
        <p className="mt-4 font-mono text-xs tracking-widest text-ink group-hover:underline underline-offset-4">
          Ler material: {primaryTitle}
        </p>
        {chunks.length > 1 && (
          <p className="mt-1 font-mono text-xs text-muted">
            {chunks.length} materiais neste módulo
          </p>
        )}
      </BrutalCard>
    </Link>
  );
}
