"use client";

import { HubLink } from "@/presentation/components/HubLink";
import { useEffect, useState } from "react";
import type { LearningTrack } from "@/domain/entities";
import { formatAccessLabel } from "@/application/dates/formatAccessLabel";
import {
  getTrackPercent,
  isModuleComplete,
} from "@/application/progress/progress";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { useProgressSnapshot } from "@/presentation/hooks/useProgressSnapshot";
import { AccessBadge } from "./AccessBadge";
import { BrutalCard } from "./BrutalCard";
import { ProgressBar } from "./ProgressBar";

interface TrackProgressCardProps {
  track: LearningTrack;
}

export function TrackProgressCard({ track }: TrackProgressCardProps) {
  const { mounted, trackProgress, hubActivity } = useProgressSnapshot(track.slug);
  const [isLatestHub, setIsLatestHub] = useState(false);

  const percent = trackProgress ? getTrackPercent(track.modules, trackProgress) : 0;
  const lastAt = trackProgress?.lastAccessedAt;
  const completedCount = trackProgress
    ? track.modules.filter((m) => isModuleComplete(trackProgress, m.id)).length
    : 0;

  useEffect(() => {
    if (!hubActivity.last) {
      setIsLatestHub(false);
      return;
    }
    const last = hubActivity.last;
    setIsLatestHub(
      (last.kind === "material" && last.trackSlug === track.slug) ||
        (last.kind === "track" && last.trackSlug === track.slug)
    );
  }, [hubActivity, track.slug]);

  const handleOpen = () => {
    const store = new LocalStorageProgressStore();
    store.recordTrackView(track.slug);
  };

  return (
    <HubLink
      href={`/trilhas/${track.slug}/`}
      className="block h-full"
      onClick={handleOpen}
    >
      <BrutalCard className="h-full hover:bg-highlight/20 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="font-mono text-xs text-muted">
            Trilha {track.order} · {track.estimatedMinutes} min
          </div>
          {mounted && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {isLatestHub && (
                <AccessBadge label="Último acesso" variant="last-module" />
              )}
              {lastAt && (
                <AccessBadge
                  label={formatAccessLabel(lastAt)}
                  variant="date"
                  accessedAt={lastAt}
                />
              )}
              {percent === 100 && (
                <AccessBadge label="Concluída" variant="completed" />
              )}
            </div>
          )}
        </div>
        <h3 className="mt-4 text-xl font-bold">{track.title}</h3>
        <p className="mt-2 text-sm text-muted">{track.description}</p>
        {mounted && (
          <div className="mt-4">
            <ProgressBar value={percent} label="Progresso da trilha" size="sm" />
            {completedCount > 0 && completedCount < track.modules.length && (
              <p className="mt-2 font-mono text-[10px] tracking-widest text-muted">
                {completedCount} de {track.modules.length} módulos concluídos
              </p>
            )}
          </div>
        )}
        <p className="mt-4 font-mono text-xs tracking-widest">
          {track.modules.length} módulos
        </p>
      </BrutalCard>
    </HubLink>
  );
}
