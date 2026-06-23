import type { AnchorHTMLAttributes, ReactNode } from "react";

type HubLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Static export is served as plain files on CDN. next/link intercepts clicks and
 * expects RSC payloads; without server rewrites that navigation can stall on /.
 */
export function HubLink({ href, children, ...props }: HubLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
