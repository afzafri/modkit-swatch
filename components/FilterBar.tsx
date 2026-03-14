"use client";

import type { Filters } from "@/types/paint";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  brands: string[];
  finishes: string[];
  types: string[];
};

function capitalize(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

export default function FilterBar({
  filters,
  onChange,
  brands,
  finishes,
  types,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={filters.brand}
        onChange={(e) => onChange({ ...filters, brand: e.target.value })}
        className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="All">All Brands</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        value={filters.finish}
        onChange={(e) => onChange({ ...filters, finish: e.target.value })}
        className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="All">All Finishes</option>
        {finishes.map((f) => (
          <option key={f} value={f}>
            {capitalize(f)}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="All">All Types</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {capitalize(t)}
          </option>
        ))}
      </select>
    </div>
  );
}
