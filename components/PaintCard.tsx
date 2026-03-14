"use client";

import { useState } from "react";
import { getContrastColor } from "@/lib/colorMath";
import type { PaintMatch } from "@/types/paint";

type Props = {
  paint: PaintMatch;
  onAddToPalette: (paint: PaintMatch) => void;
  isInPalette: boolean;
};

function getDeltaEColor(de: number): string {
  if (de < 3) return "text-green-600 bg-green-50 border-green-200";
  if (de <= 6) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function capitalize(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

function getPaintImagePath(brand: string, code: string): string {
  const slug = brand.toLowerCase().replace(/[\s.]+/g, "-");
  return `/paints/${slug}/${code}.jpg`;
}

export default function PaintCard({
  paint,
  onAddToPalette,
  isInPalette,
}: Props) {
  const textColor = getContrastColor(paint.hex);
  const imagePath = getPaintImagePath(paint.brand, paint.code);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-stretch rounded-lg border border-zinc-200 overflow-hidden bg-white hover:shadow-sm transition-shadow">
      {/* Paint image */}
      <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden bg-white border-r border-zinc-200">
        {!imgError ? (
          <img
            src={imagePath}
            alt={`${paint.brand} ${paint.code}`}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: paint.hex }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 px-3 py-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-zinc-900 truncate">
            {paint.brand} {paint.code}
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: paint.hex, color: textColor }}
          >
            {paint.hex}
          </span>
          <span
            className={`text-xs font-mono px-1.5 py-0.5 rounded border ${getDeltaEColor(paint.deltaE)}`}
            title="ΔE < 2 = near identical, ΔE < 5 = good match, ΔE > 6 = noticeable difference"
          >
            ΔE {paint.deltaE.toFixed(1)}
          </span>
        </div>
        <p className="text-xs text-zinc-500 truncate">{paint.name}</p>
        <div className="flex gap-1.5 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
            {capitalize(paint.finish)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
            {capitalize(paint.type)}
          </span>
        </div>
      </div>

      {/* Add to palette */}
      <button
        onClick={() => onAddToPalette(paint)}
        disabled={isInPalette}
        className={`px-3 flex items-center justify-center border-l border-zinc-200 transition-colors ${
          isInPalette
            ? "text-green-500 bg-green-50 cursor-default"
            : "text-zinc-400 hover:text-blue-500 hover:bg-blue-50"
        }`}
        title={isInPalette ? "Already in palette" : "Add to palette"}
      >
        {isInPalette ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
