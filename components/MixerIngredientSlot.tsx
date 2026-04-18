"use client";

import { useState } from "react";
import { X, Repeat } from "lucide-react";
import { getContrastColor } from "@/lib/colorMath";
import type { MixIngredient } from "@/types/paint";

type Props = {
  ingredient: MixIngredient;
  percent: number;
  onPartsChange: (parts: number) => void;
  onRemove: () => void;
  onReplace: () => void;
};

function getPaintImagePath(brand: string, code: string): string {
  const slug = brand.toLowerCase().replace(/[\s.]+/g, "-");
  return `/paints/${slug}/${code}.jpg`;
}

export default function MixerIngredientSlot({ ingredient, percent, onPartsChange, onRemove, onReplace }: Props) {
  const [imgError, setImgError] = useState(false);
  const textColor = getContrastColor(ingredient.hex);

  return (
    <div className="flex flex-col rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={onReplace}
          className="w-14 h-14 shrink-0 flex items-center justify-center overflow-hidden bg-white border-r border-slate-100 relative group"
          title="Swap this ingredient"
        >
          {!imgError ? (
            <img src={getPaintImagePath(ingredient.brand, ingredient.code)} alt="" className="w-full h-full object-contain" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: ingredient.hex }} />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Repeat className="w-4 h-4 text-white" />
          </div>
        </button>

        <div className="flex-1 px-3 py-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 truncate">{ingredient.brand} {ingredient.code}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0" style={{ backgroundColor: ingredient.hex, color: textColor }}>
              {ingredient.hex.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{ingredient.name}</p>
        </div>

        <button
          onClick={onRemove}
          className="px-3 self-stretch flex items-center text-slate-300 hover:text-red-500 transition-colors border-l border-slate-100"
          title="Remove ingredient"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={ingredient.parts}
          onChange={(e) => onPartsChange(parseInt(e.target.value, 10))}
          className="flex-1 accent-sky-500 h-1.5"
          style={{ accentColor: ingredient.hex }}
        />
        <span className="text-xs font-mono text-slate-600 tabular-nums w-20 text-right">
          <span className="font-semibold">{ingredient.parts}</span>
          <span className="text-slate-400"> part{ingredient.parts === 1 ? "" : "s"}</span>
        </span>
        <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums w-11 text-right">
          {percent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
