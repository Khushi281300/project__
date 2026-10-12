import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/fraunces";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GCC Ledger", template: "%s · GCC Ledger" },
  description: "A source-backed record of who built which Global Capability Centre in India, where, and with whose help.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand"><span className="mark" aria-hidden="true" />GCC Ledger</Link>
            <NavLinks />
          </div>
        </header>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <footer className="site-footer">
          <div className="wrap">
            <span>Prototype. A small real sample with a source on every record, not the full market.</span>
            <span>Every status follows one published rule. <Link href="/method">Read the method</Link></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
