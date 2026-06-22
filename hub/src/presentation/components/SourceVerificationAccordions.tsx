import type { TrackVerificationGroup } from "@/application/content/verificationTree";

interface SourceVerificationAccordionsProps {
  tracks: TrackVerificationGroup[];
}

function StatusBadge({ status }: { status: "OK" | "GAP" }) {
  return (
    <span
      className={
        status === "OK"
          ? "font-mono text-xs px-2 py-0.5 border border-ink bg-success/20 text-ink"
          : "font-mono text-xs px-2 py-0.5 border border-ink bg-amber-200 text-ink"
      }
    >
      {status}
    </span>
  );
}

export function SourceVerificationAccordions({
  tracks,
}: SourceVerificationAccordionsProps) {
  const tracksWithItems = tracks.filter((t) =>
    t.modules.some((m) => m.items.length > 0)
  );

  if (tracksWithItems.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        Nenhuma validação de fonte disponível ainda.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {tracksWithItems.map((track) => (
        <details
          key={track.trackSlug}
          className="border-2 border-ink bg-highlight/10 rounded-sm group"
        >
          <summary className="cursor-pointer px-4 py-3 font-bold list-none flex items-center justify-between hover:bg-highlight/20">
            <span>{track.trackTitle}</span>
            <span className="font-mono text-xs text-muted group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="border-t-2 border-ink px-2 pb-2">
            {track.modules
              .filter((m) => m.items.length > 0)
              .map((mod) => (
                <details
                  key={mod.moduleId}
                  className="mt-2 border-2 border-ink/60 rounded-sm"
                >
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold list-none hover:bg-highlight/10">
                    {mod.moduleTitle}
                    <span className="ml-2 font-mono text-xs text-muted">
                      ({mod.items.length})
                    </span>
                  </summary>
                  <ul className="border-t border-ink/40 divide-y divide-ink/20">
                    {mod.items.map((item) => (
                      <li key={`${item.chunkId}-${item.anchorId}`} className="p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold">{item.sectionHeading}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-muted text-xs mb-1">
                          Material: {item.chunkTitle}
                        </p>
                        <p className="mb-2">
                          <span className="font-mono text-xs text-muted">Evidência: </span>
                          {item.evidence}
                        </p>
                        <code className="block text-xs bg-highlight/40 border border-ink px-2 py-1 break-all">
                          {item.sourceRel}
                        </code>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
          </div>
        </details>
      ))}
    </div>
  );
}
