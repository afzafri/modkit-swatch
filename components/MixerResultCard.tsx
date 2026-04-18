"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";
import { getContrastColor } from "@/lib/colorMath";
import type { PaintMatch } from "@/types/paint";

type Props = {
  targetHex: string;
  mixedHex: string | null;
  deltaE: number | null;
  closest: PaintMatch | null;
  canSave: boolean;
  onSave: () => void;
};

function getMatchLabel(de: number): string {
  if (de < 2) return "Excellent";
  if (de < 5) return "Good";
  if (de < 10) return "Fair";
  return "Rough";
}


export default function MixerResultCard({ targetHex, mixedHex, deltaE, closest, canSave, onSave }: Props) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm">
      <div className="grid grid-cols-2">
        <div className="px-4 py-4 border-r border-slate-100" style={{ backgroundColor: targetHex }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest opacity-70" style={{ color: getContrastColor(targetHex) }}>
            Target
          </div>
          <div className="text-base font-mono font-semibold mt-1" style={{ color: getContrastColor(targetHex) }}>
            {targetHex.toUpperCase()}
          </div>
        </div>
        <div className="px-4 py-4" style={{ backgroundColor: mixedHex ?? "#f1f5f9" }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest opacity-70" style={{ color: mixedHex ? getContrastColor(mixedHex) : "#94a3b8" }}>
            Mix result
          </div>
          <div className="text-base font-mono font-semibold mt-1" style={{ color: mixedHex ? getContrastColor(mixedHex) : "#94a3b8" }}>
            {mixedHex ? mixedHex.toUpperCase() : "—"}
          </div>
        </div>
      </div>

      {mixedHex && deltaE != null && (
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Match</span>
          <span className="text-sm font-semibold text-slate-900 tabular-nums">ΔE {deltaE.toFixed(1)}</span>
          <span className="text-xs text-slate-500">{getMatchLabel(deltaE)}</span>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            {saved ? <Check className="w-3 h-3 text-emerald-500" /> : <Save className="w-3 h-3" />}
            {saved ? "Saved" : "Save recipe"}
          </button>
        </div>
      )}

      {closest && mixedHex && deltaE != null && closest.deltaE < deltaE && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-amber-50 flex items-center gap-2">
          <div
            className="w-5 h-5 rounded shrink-0 border border-amber-200"
            style={{ backgroundColor: closest.hex }}
          />
          <p className="text-[11px] text-amber-700 leading-snug flex-1 min-w-0">
            <strong>{closest.brand} {closest.code}</strong> already matches at ΔE {closest.deltaE.toFixed(1)} — you may not need to mix.
          </p>
        </div>
      )}

      {closest && mixedHex && deltaE != null && closest.deltaE >= deltaE && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider shrink-0">Closest single</span>
          <div
            className="w-4 h-4 rounded shrink-0 border border-slate-200"
            style={{ backgroundColor: closest.hex }}
          />
          <span className="text-[11px] text-slate-700 truncate flex-1 min-w-0">
            {closest.brand} {closest.code}
          </span>
          <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
            ΔE {closest.deltaE.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
