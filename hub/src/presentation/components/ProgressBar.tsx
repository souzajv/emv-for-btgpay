import { cn } from "@/presentation/lib/cn";

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  label,
  className,
  size = "md",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-xs text-muted">{label}</span>
          <span className="font-mono text-xs font-semibold">{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full border-2 border-ink bg-paper overflow-hidden",
          size === "sm" ? "h-2" : "h-3"
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `Progresso ${clamped}%`}
      >
        <div
          className="h-full bg-accent transition-[width] duration-500 ease-reveal"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
