import { Reveal } from "./Reveal";

interface SectionHeadProps {
  tag: string;
  title: string;
  subtitle?: string;
  intro?: string;
}

export function SectionHead({ tag, title, subtitle, intro }: SectionHeadProps) {
  return (
    <Reveal className="mb-14">
      <div className="font-mono text-xs tracking-widest mb-4 flex items-center gap-2">
        <span className="w-8 h-px bg-ink" aria-hidden />
        {tag}
      </div>
      <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
      {intro && (
        <p className="mt-5 max-w-2xl text-sm md:text-base text-muted leading-relaxed">
          {intro}
        </p>
      )}
    </Reveal>
  );
}
