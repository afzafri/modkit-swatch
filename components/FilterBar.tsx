"use client";

import type { Filters } from "@/types/paint";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  brands: string[];
  finishes: string[];
  types: string[];
  excludeClear: boolean;
  onExcludeClearChange: (v: boolean) => void;
};

function capitalize(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

export default function FilterBar({
  filters,
  onChange,
  brands,
  finishes,
  types,
  excludeClear,
  onExcludeClearChange,
}: Props) {
  const selectClass =
    "px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-200/80 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-colors appearance-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={filters.brand} onChange={(e) => onChange({ ...filters, brand: e.target.value })} className={selectClass}>
        <option value="All">All Brands</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <select value={filters.finish} onChange={(e) => onChange({ ...filters, finish: e.target.value })} className={selectClass}>
        <option value="All">All Finishes</option>
        {finishes.map((f) => <option key={f} value={f}>{capitalize(f)}</option>)}
      </select>
      <select value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })} className={selectClass}>
        <option value="All">All Types</option>
        {types.map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none ml-auto">
        <input type="checkbox" checked={excludeClear} onChange={(e) => onExcludeClearChange(e.target.checked)} className="rounded accent-sky-500" />
        Hide clears
      </label>
    </div>
  );
}
