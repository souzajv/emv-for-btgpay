import { cn } from "@/presentation/lib/cn";
import { isAccessToday } from "@/application/dates/formatAccessLabel";

export type AccessBadgeVariant =
  | "date"
  | "continue"
  | "last-module"
  | "in-progress"
  | "completed";

interface AccessBadgeProps {
  label: string;
  variant?: AccessBadgeVariant;
  /** ISO timestamp para destacar "Hoje" visualmente */
  accessedAt?: string;
  className?: string;
}

const variantStyles: Record<AccessBadgeVariant, string> = {
  date: "bg-paper text-ink",
  continue: "bg-accent text-paper border-ink",
  "last-module": "bg-highlight text-ink",
  "in-progress": "bg-highlight/80 text-ink",
  completed: "bg-success/20 text-ink",
};

export function AccessBadge({
  label,
  variant = "date",
  accessedAt,
  className,
}: AccessBadgeProps) {
  const isToday = variant === "date" && isAccessToday(accessedAt);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs tracking-widest uppercase",
        "border-2 border-ink px-2 py-0.5 shadow-brutal-sm whitespace-nowrap",
        isToday ? "bg-highlight text-ink" : variantStyles[variant],
        className
      )}
    >
      {isToday && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink shrink-0"
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}
