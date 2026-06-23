import { HubLink } from "@/presentation/components/HubLink";

const NAV = [
  { label: "TRILHAS", href: "/trilhas/" },
  { label: "QUIZ", href: "/quiz/" },
  { label: "SOBRE", href: "/sobre/" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-paper/90 backdrop-blur-md border-b-2 border-ink">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2"
        aria-label="Principal"
      >
        <HubLink href="/" className="flex items-center gap-2 group min-w-0">
          <span className="font-mono font-semibold tracking-widest shrink-0">BTGPAY</span>
          <span className="hidden sm:inline font-mono text-xs text-muted truncate">
            Hub de estudo EMV
          </span>
        </HubLink>
        <div className="flex items-center gap-2 sm:gap-5 md:gap-7 shrink-0">
          {NAV.map((n) => (
            <HubLink
              key={n.label}
              href={n.href}
              className="font-mono text-[10px] sm:text-xs tracking-widest text-muted hover:text-ink hover:underline underline-offset-4 transition-colors"
            >
              {n.label}
            </HubLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
