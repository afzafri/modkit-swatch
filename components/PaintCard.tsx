"use client";

import { useState } from "react";
import { Check, Wind, PenLine } from "lucide-react";
import { getContrastColor } from "@/lib/colorMath";
import type { PaintMatch } from "@/types/paint";

type Props = {
  paint: PaintMatch;
  rank: number;
  onAssign: (paint: PaintMatch) => void;
  isAssigned: boolean;
};

function getMatchLabel(de: number): string {
  if (de < 2) return "Excellent";
  if (de < 5) return "Good";
  if (de < 10) return "Fair";
  return "Rough";
}

function capitalize(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

function getPaintImagePath(brand: string, code: string): string {
  const slug = brand.toLowerCase().replace(/[\s.]+/g, "-");
  return `/paints/${slug}/${code}.jpg`;
}

export default function PaintCard({ paint, rank, onAssign, isAssigned }: Props) {
  const textColor = getContrastColor(paint.hex);
  const imagePath = getPaintImagePath(paint.brand, paint.code);
  const [imgError, setImgError] = useState(false);
  const matchLabel = getMatchLabel(paint.deltaE);

  return (
    <div className="flex items-center rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all">
      {/* Paint image */}
      <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden bg-white border-r border-slate-100">
        {!imgError ? (
          <img
            src={imagePath}
            alt={`${paint.brand} ${paint.code}`}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: paint.hex }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 px-3 py-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-900 truncate">
            {paint.brand} {paint.code}
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0"
            style={{ backgroundColor: paint.hex, color: textColor }}
          >
            {paint.hex}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{paint.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
            {capitalize(paint.finish)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
            {capitalize(paint.type)}
          </span>
          {paint.suitableFor?.airbrush && (
            <span className="relative group/tip" title="Suitable for airbrush">
              <Wind className="w-3 h-3 text-slate-400" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium bg-slate-900 text-white rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                Airbrush
              </span>
            </span>
          )}
          {paint.suitableFor?.handPainting && (
            <span className="relative group/tip" title="Suitable for hand painting">
              <PenLine className="w-3 h-3 text-slate-400" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium bg-slate-900 text-white rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                Hand painting
              </span>
            </span>
          )}
          <span
            className="text-[10px] ml-auto text-slate-400 font-mono"
            title={`ΔE ${paint.deltaE.toFixed(1)}, ${matchLabel} match`}
          >
            {matchLabel}
          </span>
        </div>
      </div>

      {/* Assign button */}
      <button
        onClick={() => onAssign(paint)}
        disabled={isAssigned}
        className={`px-3 flex items-center justify-center border-l transition-colors shrink-0 self-stretch ${
          isAssigned
            ? "text-emerald-500 bg-emerald-50/50 border-emerald-100"
            : "text-sky-600 hover:bg-sky-50 border-slate-100"
        }`}
        title={isAssigned ? "Assigned to this marker" : "Use this paint"}
      >
        {isAssigned ? (
          <Check className="w-4 h-4" />
        ) : (
          <span className="text-[10px] font-semibold">Use</span>
        )}
      </button>
    </div>
  );
}
