"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X, Search, ArrowLeft } from "lucide-react";
import FilterBar from "./FilterBar";
import { getContrastColor } from "@/lib/colorMath";
import type { PaintWithLab, Filters } from "@/types/paint";

type Props = {
  visible: boolean;
  paints: PaintWithLab[];
  filterOptions: { brands: string[]; finishes: string[]; types: string[] };
  excludeKeys: string[];
  onSelect: (paint: PaintWithLab) => void;
  onDismiss: () => void;
  title?: string;
};

function getPaintImagePath(brand: string, code: string): string {
  const slug = brand.toLowerCase().replace(/[\s.]+/g, "-");
  return `/paints/${slug}/${code}.jpg`;
}

function PickerRow({ paint, onSelect }: { paint: PaintWithLab; onSelect: () => void }) {
  const [imgError, setImgError] = useState(false);
  const textColor = getContrastColor(paint.hex);
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 text-left transition-all overflow-hidden"
    >
      <div className="w-14 h-14 shrink-0 flex items-center justify-center overflow-hidden bg-white border-r border-slate-100">
        {!imgError ? (
          <img src={getPaintImagePath(paint.brand, paint.code)} alt="" className="w-full h-full object-contain" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: paint.hex }} />
        )}
      </div>
      <div className="flex-1 px-3 py-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-900 truncate">{paint.brand} {paint.code}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0" style={{ backgroundColor: paint.hex, color: textColor }}>
            {paint.hex.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{paint.name}</p>
      </div>
    </button>
  );
}

export default function MixerIngredientPicker({
  visible,
  paints,
  filterOptions,
  excludeKeys,
  onSelect,
  onDismiss,
  title = "Add ingredient",
}: Props) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ brand: "All", finish: "All", type: "All" });

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setFilters({ brand: "All", finish: "All", type: "All" });
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const excludeSet = new Set(excludeKeys);
    return paints.filter((p) => {
      const key = `${p.brand}-${p.code}`;
      if (excludeSet.has(key)) return false;
      if (filters.brand !== "All" && p.brand !== filters.brand) return false;
      if (filters.finish !== "All" && p.finish !== filters.finish) return false;
      if (filters.type !== "All" && p.type !== filters.type) return false;
      if (q) {
        const hay = `${p.brand} ${p.code} ${p.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).slice(0, 200);
  }, [paints, search, filters, excludeKeys]);

  const handleSelect = useCallback((p: PaintWithLab) => {
    onSelect(p);
    onDismiss();
  }, [onSelect, onDismiss]);

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onDismiss} />
      <div className="fixed inset-x-0 bottom-0 top-auto z-[70] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden h-[85vh] lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:top-8 lg:bottom-8 lg:h-auto lg:w-[620px] lg:rounded-2xl">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
          <button
            onClick={onDismiss}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors p-1.5 -ml-1"
            title="Back to mixer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium lg:hidden">Back</span>
          </button>
          <h2 className="text-sm font-semibold text-slate-900 flex-1" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 p-1" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, or code"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            />
          </div>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            brands={filterOptions.brands}
            finishes={filterOptions.finishes}
            types={filterOptions.types}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400">No paints match these filters</div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((p) => (
                <PickerRow key={`${p.brand}-${p.code}`} paint={p} onSelect={() => handleSelect(p)} />
              ))}
            </div>
          )}
        </div>

        {filtered.length >= 200 && (
          <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Showing first 200 — refine search to narrow
          </div>
        )}
      </div>
    </>
  );
}
