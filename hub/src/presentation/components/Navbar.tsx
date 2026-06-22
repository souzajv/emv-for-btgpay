import Link from "next/link";
import { Droplets } from "lucide-react";

const NAV = [
  { label: "TRILHAS", href: "/trilhas/" },
  { label: "QUIZ", href: "/quiz/" },
  { label: "SOBRE", href: "/sobre/" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-paper/90 backdrop-blur-md border-b-2 border-ink">
      <nav
        className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
        aria-label="Principal"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <Droplets className="w-5 h-5 text-accent" aria-hidden />
          <span className="font-mono font-semibold tracking-widest">BTGPAY</span>
          <span className="hidden sm:inline font-mono text-xs text-muted">
            EMV learning hub
          </span>
        </Link>
        <div className="flex items-center gap-5 md:gap-7">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="font-mono text-xs tracking-widest text-muted hover:text-ink hover:underline underline-offset-4 transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
