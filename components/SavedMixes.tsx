"use client";

import { X } from "lucide-react";
import type { MixRecipe } from "@/types/paint";

type Props = {
  recipes: MixRecipe[];
  onLoad: (recipe: MixRecipe) => void;
  onDelete: (id: string) => void;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SavedMixes({ recipes, onLoad, onDelete }: Props) {
  if (recipes.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
          Saved recipes
          <span className="font-sans text-xs font-normal text-slate-400 ml-1.5">
            {recipes.length}
          </span>
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {recipes.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 group">
            <button onClick={() => onLoad(r)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <div className="flex gap-0.5 shrink-0">
                {r.targetHex ? (
                  <>
                    <div className="w-5 h-10 rounded-l-md" style={{ backgroundColor: r.targetHex }} title={`Target ${r.targetHex}`} />
                    <div className="w-5 h-10 rounded-r-md" style={{ backgroundColor: r.mixedHex }} title={`Mix ${r.mixedHex}`} />
                  </>
                ) : (
                  <div className="w-10 h-10 rounded-md" style={{ backgroundColor: r.mixedHex }} title={`Mix ${r.mixedHex}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-900 truncate">
                  {r.ingredients.map((i) => `${i.brand} ${i.code}`).join(" + ")}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {r.targetHex
                    ? `${r.targetHex.toUpperCase()} → ${r.mixedHex.toUpperCase()}`
                    : `Scratch mix · ${r.mixedHex.toUpperCase()}`}
                  {" · "}{formatDate(r.createdAt)}
                </div>
              </div>
            </button>
            <button
              onClick={() => onDelete(r.id)}
              className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1"
              title="Delete recipe"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
