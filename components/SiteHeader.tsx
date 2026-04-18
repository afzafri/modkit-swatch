"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Paintbrush } from "lucide-react";

type Props = {
  paintCount?: number;
};

export default function SiteHeader({ paintCount }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Matcher" },
    { href: "/mix", label: "Mixer" },
    { href: "/paints", label: "Browse Paints" },
  ];

  return (
    <header className="bg-white border-b border-slate-200/80">
      <div className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-lg shadow-sm" />
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight block" style={{ fontFamily: "var(--font-display)" }}>
                ModKit Swatch
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase block">
                Gunpla &amp; Model Kit Paint Matcher
              </span>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm px-1 pb-1 transition-colors ${
                  pathname === href
                    ? "text-slate-900 font-medium border-b-2 border-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile nav */}
          <nav className="flex sm:hidden items-center gap-3">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs px-1 pb-1 transition-colors ${
                  pathname === href
                    ? "text-slate-900 font-medium border-b-2 border-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {paintCount != null && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-medium">
              <Paintbrush className="w-3.5 h-3.5 text-sky-500" />
              {paintCount} paints
            </span>
          )}
          <a
            href="https://github.com/afzafri/modkit-swatch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-900 transition-colors"
            title="View on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
