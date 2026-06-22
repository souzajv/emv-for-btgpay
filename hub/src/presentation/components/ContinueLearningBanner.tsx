"use client";

import Link from "next/link";
import type { LearningTrack } from "@/domain/entities";
import { formatAccessLabel } from "@/application/dates/formatAccessLabel";
import {
  buildContinueHref,
  findLatestTrackAccess,
  getModuleTitle,
} from "@/application/progress/continueLearning";
import { getTrackPercent } from "@/application/progress/progress";
import { useAllTracksProgress, useProgressSnapshot } from "@/presentation/hooks/useProgressSnapshot";
import { AccessBadge } from "./AccessBadge";
import { BrutalButton } from "./BrutalButton";
import { ProgressBar } from "./ProgressBar";

interface ContinueLearningBannerProps {
  tracks: LearningTrack[];
}

export function ContinueLearningBanner({ tracks }: ContinueLearningBannerProps) {
  const slugs = tracks.map((t) => t.slug);
  const { mounted, bySlug } = useAllTracksProgress(slugs);
  const { hubActivity } = useProgressSnapshot();

  if (!mounted) return null;

  const latest = findLatestTrackAccess(tracks, bySlug);
  const hubLast = hubActivity.last;

  if (!latest && !hubLast) return null;

  if (hubLast?.kind === "quiz" && hubLast.quizLevel) {
    const quizAt = hubLast.accessedAt;
    return (
      <div className="mb-10 p-5 border-2 border-ink bg-paper shadow-brutal">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <AccessBadge label="Último quiz" variant="continue" />
          <AccessBadge label={formatAccessLabel(quizAt)} variant="date" accessedAt={quizAt} />
        </div>
        <p className="text-sm text-muted mb-4">
          Retome o quiz de nível{" "}
          <span className="font-bold text-ink capitalize">{hubLast.quizLevel}</span>.
        </p>
        <BrutalButton href={`/quiz/${hubLast.quizLevel}/`} variant="primary">
          CONTINUAR QUIZ
        </BrutalButton>
      </div>
    );
  }

  if (!latest) return null;

  const { track, at } = latest;
  const progress = bySlug[track.slug];
  const percent = getTrackPercent(track.modules, progress);
  const moduleTitle = getModuleTitle(track, progress.lastVisitedModule);
  const href = buildContinueHref(track, progress);

  return (
    <div className="mb-10 p-5 border-2 border-ink bg-highlight/30 shadow-brutal">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <AccessBadge label="Continuar de onde parou" variant="continue" />
        <AccessBadge label={formatAccessLabel(at)} variant="date" accessedAt={at} />
      </div>
      <h2 className="text-lg font-bold">{track.title}</h2>
      {moduleTitle && (
        <p className="text-sm text-muted mt-1">
          Último módulo: <span className="text-ink font-medium">{moduleTitle}</span>
        </p>
      )}
      {percent > 0 && percent < 100 && (
        <div className="mt-4 max-w-md">
          <ProgressBar value={percent} label="Progresso da trilha" size="sm" />
        </div>
      )}
      <div className="mt-5">
        <BrutalButton href={href}>RETOMAR ESTUDO</BrutalButton>
      </div>
    </div>
  );
}

interface TrackListContinueHintProps {
  trackSlug: string;
  className?: string;
}

export function TrackListContinueHint({ trackSlug, className }: TrackListContinueHintProps) {
  const { mounted, hubActivity } = useProgressSnapshot();
  if (!mounted) return null;
  const last = hubActivity.last;
  if (last?.kind !== "material" || last.trackSlug !== trackSlug) return null;

  return (
    <Link
      href={`/trilhas/${trackSlug}/`}
      className={className}
    >
      <AccessBadge
        label={`Último acesso · ${formatAccessLabel(last.accessedAt)}`}
        variant="last-module"
        accessedAt={last.accessedAt}
      />
    </Link>
  );
}
