"use client";

import { useState } from "react";
import { X, ClipboardCopy, Check } from "lucide-react";
import type { PaintWithLab } from "@/types/paint";

type Props = {
  palette: PaintWithLab[];
  onRemove: (brand: string, code: string) => void;
};

function capitalize(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

export default function Palette({ palette, onRemove }: Props) {
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const text = palette
      .map((p) => `${p.brand} ${p.code} — ${p.name} (${capitalize(p.finish)} ${capitalize(p.type)})`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (palette.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
          Your Palette
          <span className="font-sans text-xs font-normal text-slate-400 ml-1.5">
            {palette.length} {palette.length === 1 ? "paint" : "paints"}
          </span>
        </h3>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <ClipboardCopy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-2.5 flex flex-wrap gap-1.5">
        {palette.map((p) => (
          <div
            key={`${p.brand}-${p.code}`}
            className="group flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg text-xs bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div
              className="w-5 h-5 rounded-md shrink-0 shadow-inner"
              style={{ backgroundColor: p.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
            />
            <span className="font-medium text-slate-700 whitespace-nowrap">{p.code}</span>
            <button
              onClick={() => onRemove(p.brand, p.code)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
              title="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
