"use client";

import { HubLink } from "@/presentation/components/HubLink";
import type { TrackModule } from "@/domain/entities";
import { formatAccessLabel } from "@/application/dates/formatAccessLabel";
import {
  getModulePercent,
  getTargetChunkId,
  isModuleComplete,
} from "@/application/progress/progress";
import { useProgressSnapshot } from "@/presentation/hooks/useProgressSnapshot";
import { AccessBadge } from "./AccessBadge";
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
  const { mounted, trackProgress } = useProgressSnapshot(trackSlug);

  const progress = trackProgress ?? { moduleProgress: {} };
  const percent = getModulePercent(module, progress, module.id);
  const targetId = getTargetChunkId(module, progress, module.id);
  const completed = isModuleComplete(progress, module.id);
  const isLastVisited = progress.lastVisitedModule === module.id;
  const moduleLastAt = progress.moduleProgress[module.id]?.lastVisitedAt;

  const chunksParam = module.chunkIds.join(",");
  const sectionsParam =
    module.sectionAnchorIds && module.sectionAnchorIds.length > 0
      ? `&sections=${module.sectionAnchorIds.join(",")}`
      : "";
  const href = `/material/${targetId || module.chunkIds[0]}/?track=${trackSlug}&module=${module.id}&chunks=${chunksParam}${sectionsParam}`;
  const primaryTitle = chunks[0]?.title ?? "Material";

  return (
    <HubLink
      href={href}
      className="block group"
      aria-label={`Módulo ${index + 1}: ${module.title}. Ler ${primaryTitle}`}
    >
      <BrutalCard
        className={`h-full group-hover:bg-highlight/20 transition-colors cursor-pointer ${
          isLastVisited && mounted ? "ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono text-xs text-muted">Módulo {index + 1}</div>
          {mounted && (
            <div className="flex flex-wrap gap-1.5">
              {isLastVisited && (
                <AccessBadge label="Último módulo" variant="last-module" />
              )}
              {moduleLastAt && (
                <AccessBadge
                  label={formatAccessLabel(moduleLastAt)}
                  variant="date"
                  accessedAt={moduleLastAt}
                />
              )}
              {completed && (
                <AccessBadge label="Concluído" variant="completed" />
              )}
              {!completed && percent > 0 && (
                <AccessBadge label="Em andamento" variant="in-progress" />
              )}
            </div>
          )}
        </div>
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
    </HubLink>
  );
}
