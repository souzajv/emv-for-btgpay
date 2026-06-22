"use client";

import { useCallback, useEffect, useState } from "react";
import type { HubActivity, TrackProgress } from "@/domain/entities";
import { LocalStorageProgressStore } from "@/infrastructure/LocalStorageProgressStore";
import { PROGRESS_CHANGE_EVENT } from "@/application/progress/hubActivity";

export function useProgressSnapshot(trackSlug?: string) {
  const [mounted, setMounted] = useState(false);
  const [trackProgress, setTrackProgress] = useState<TrackProgress | null>(null);
  const [hubActivity, setHubActivity] = useState<HubActivity>({});

  const refresh = useCallback(() => {
    const store = new LocalStorageProgressStore();
    if (trackSlug) {
      setTrackProgress(store.getTrackProgress(trackSlug));
    }
    setHubActivity(store.getHubActivity());
    setMounted(true);
  }, [trackSlug]);

  useEffect(() => {
    refresh();

    const onChange = () => refresh();
    window.addEventListener(PROGRESS_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROGRESS_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return { mounted, trackProgress, hubActivity, refresh };
}

export function useAllTracksProgress(trackSlugs: string[]) {
  const [mounted, setMounted] = useState(false);
  const [bySlug, setBySlug] = useState<Record<string, TrackProgress>>({});

  const refresh = useCallback(() => {
    const store = new LocalStorageProgressStore();
    const next: Record<string, TrackProgress> = {};
    for (const slug of trackSlugs) {
      next[slug] = store.getTrackProgress(slug);
    }
    setBySlug(next);
    setMounted(true);
  }, [trackSlugs]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(PROGRESS_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROGRESS_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return { mounted, bySlug, refresh };
}
