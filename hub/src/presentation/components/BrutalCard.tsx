import { cn } from "@/presentation/lib/cn";

interface BrutalCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function BrutalCard({ children, className, hover = true }: BrutalCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-ink bg-paper p-6 md:p-8 shadow-brutal rounded-sm",
        hover && "hover:-translate-y-0.5 transition-transform",
        className
      )}
    >
      {children}
    </div>
  );
}
