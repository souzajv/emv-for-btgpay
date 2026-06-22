"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LearningTrack } from "@/domain/entities";
import { getTrackPercent } from "@/application/progress/progress";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { BrutalCard } from "./BrutalCard";
import { ProgressBar } from "./ProgressBar";

interface TrackProgressCardProps {
  track: LearningTrack;
}

export function TrackProgressCard({ track }: TrackProgressCardProps) {
  const [percent, setPercent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const store = new LocalStorageProgressStore();
    const progress = store.getTrackProgress(track.slug);
    setPercent(getTrackPercent(track.modules, progress));
    setMounted(true);
  }, [track]);

  return (
    <Link href={`/trilhas/${track.slug}/`} className="block h-full">
      <BrutalCard className="h-full hover:bg-highlight/20 transition-colors">
        <div className="font-mono text-xs text-muted">
          Trilha {track.order} · {track.estimatedMinutes} min
        </div>
        <h3 className="mt-4 text-xl font-bold">{track.title}</h3>
        <p className="mt-2 text-sm text-muted">{track.description}</p>
        {mounted && (
          <div className="mt-4">
            <ProgressBar value={percent} label="Progresso da trilha" size="sm" />
          </div>
        )}
        <p className="mt-4 font-mono text-xs tracking-widest">
          {track.modules.length} módulos
        </p>
      </BrutalCard>
    </Link>
  );
}
