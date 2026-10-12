"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/", "Records"],
  ["/providers", "Providers"],
  ["/market", "Market"],
  ["/plan", "Setup Planner"],
  ["/ask", "Ask"],
  ["/submit", "Submit evidence"],
  ["/method", "Method and API"],
] as const;

export default function NavLinks() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/gcc") : path.startsWith(href));
  return (
    <nav aria-label="Main">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
