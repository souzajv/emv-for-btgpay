import { HubLink } from "@/presentation/components/HubLink";
import { cn } from "@/presentation/lib/cn";

const baseClass =
  "font-mono text-xs tracking-widest px-7 py-3.5 border-2 border-ink rounded-sm transition-all inline-block";

const variantClass = {
  primary:
    "bg-accent text-accent-foreground shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm",
  secondary: "bg-paper text-ink hover:bg-highlight",
};

type BrutalButtonProps =
  | {
      href: string;
      children: React.ReactNode;
      variant?: "primary" | "secondary";
      className?: string;
      onClick?: never;
      type?: never;
    }
  | {
      href?: never;
      children: React.ReactNode;
      variant?: "primary" | "secondary";
      className?: string;
      onClick: () => void;
      type?: "button" | "submit";
    };

export function BrutalButton(props: BrutalButtonProps) {
  const variant = props.variant ?? "primary";
  const className = cn(baseClass, variantClass[variant], props.className);

  if ("href" in props && props.href) {
    return (
      <HubLink href={props.href} className={className}>
        {props.children}
      </HubLink>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      className={className}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
