"use client";

import type { PaintWithLab } from "@/types/paint";
import { getContrastColor } from "@/lib/colorMath";

type Props = {
  palette: PaintWithLab[];
  onRemove: (brand: string, code: string) => void;
};

function capitalize(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

export default function Palette({ palette, onRemove }: Props) {
  const handleExport = () => {
    const text = palette
      .map(
        (p) =>
          `${p.brand} ${p.code} — ${p.name} (${capitalize(p.finish)} ${capitalize(p.type)})`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  if (palette.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-700">
          Saved Palette ({palette.length})
        </h3>
        <button
          onClick={handleExport}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Copy to Clipboard
        </button>
      </div>
      <div className="p-2 flex flex-wrap gap-1.5">
        {palette.map((p) => (
          <div
            key={`${p.brand}-${p.code}`}
            className="group relative flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs"
          >
            <div
              className="w-5 h-5 rounded shrink-0"
              style={{ backgroundColor: p.hex }}
            />
            <span className="text-zinc-700 font-medium whitespace-nowrap">
              {p.brand} {p.code}
            </span>
            <button
              onClick={() => onRemove(p.brand, p.code)}
              className="text-zinc-300 hover:text-red-500 ml-0.5"
              title="Remove from palette"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
