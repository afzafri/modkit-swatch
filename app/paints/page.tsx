"use client";

import { useState, useMemo } from "react";
import { Search, Wind, PenLine } from "lucide-react";
import paintsData from "@/data/paints.json";
import { getContrastColor } from "@/lib/colorMath";
import { extractFilterOptions } from "@/lib/matcher";
import type { Paint } from "@/types/paint";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

function capitalize(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

function getPaintImagePath(brand: string, code: string): string {
  const slug = brand.toLowerCase().replace(/[\s.]+/g, "-");
  return `/paints/${slug}/${code}.jpg`;
}

export default function PaintsPage() {
  const paints = paintsData as Paint[];
  const filterOptions = useMemo(() => {
    const brands = Array.from(new Set(paints.map((p) => p.brand))).sort();
    const finishes = Array.from(new Set(paints.map((p) => p.finish))).sort();
    const types = Array.from(new Set(paints.map((p) => p.type))).sort();
    return { brands, finishes, types };
  }, [paints]);

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [finish, setFinish] = useState("All");
  const [type, setType] = useState("All");

  const filtered = useMemo(() => {
    return paints.filter((p) => {
      if (brand !== "All" && p.brand !== brand) return false;
      if (finish !== "All" && p.finish !== finish) return false;
      if (type !== "All" && p.type !== type) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [paints, brand, finish, type, search]);

  // Group by brand
  const grouped = useMemo(() => {
    const map = new Map<string, Paint[]>();
    for (const p of filtered) {
      const list = map.get(p.brand) || [];
      list.push(p);
      map.set(p.brand, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const selectClass =
    "px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-200/80 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-colors appearance-none";

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-sky-100 selection:text-sky-900 flex flex-col text-slate-800">
      <SiteHeader paintCount={paints.length} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-8 pb-16">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Paint Database
          </h1>
          <p className="text-sm text-slate-500">
            Browse all {paints.length} paints across {filterOptions.brands.length} brands. Filter by brand, finish, or type.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6 sticky top-0 z-20 bg-slate-50 py-3 -mx-6 px-6 border-b border-slate-200/60">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm bg-white border border-slate-200/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-colors"
            />
          </div>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={selectClass}>
            <option value="All">All Brands</option>
            {filterOptions.brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={finish} onChange={(e) => setFinish(e.target.value)} className={selectClass}>
            <option value="All">All Finishes</option>
            {filterOptions.finishes.map((f) => <option key={f} value={f}>{capitalize(f)}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            <option value="All">All Types</option>
            {filterOptions.types.map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
          </select>
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Paint grid */}
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No paints found matching your filters.
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([brandName, brandPaints]) => (
              <section key={brandName}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                    {brandName}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {brandPaints.length} paint{brandPaints.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {brandPaints.map((paint) => (
                    <PaintGridCard key={`${paint.brand}-${paint.code}`} paint={paint} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function PaintGridCard({ paint }: { paint: Paint }) {
  const [imgError, setImgError] = useState(false);
  const textColor = getContrastColor(paint.hex);
  const imagePath = getPaintImagePath(paint.brand, paint.code);
  const suitable = (paint as Record<string, unknown>).suitableFor as { airbrush?: boolean; handPainting?: boolean } | undefined;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all overflow-hidden group">
      {/* Color / Image area */}
      <div className="aspect-square relative overflow-hidden flex items-center justify-center bg-white">
        {!imgError ? (
          <img
            src={imagePath}
            alt={`${paint.brand} ${paint.code}`}
            className="w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: paint.hex }}>
            <span
              className="absolute bottom-2 left-2 text-[10px] font-mono opacity-70"
              style={{ color: textColor }}
            >
              {paint.hex}
            </span>
          </div>
        )}
        {/* Hex pill overlay */}
        {!imgError && (
          <span
            className="absolute bottom-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: paint.hex, color: textColor }}
          >
            {paint.hex}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900 truncate">{paint.code}</span>
          {suitable?.airbrush && (
            <span title="Airbrush"><Wind className="w-3 h-3 text-slate-400 shrink-0" /></span>
          )}
          {suitable?.handPainting && (
            <span title="Hand painting"><PenLine className="w-3 h-3 text-slate-400 shrink-0" /></span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{paint.name}</p>
        <div className="flex gap-1 mt-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
            {capitalize(paint.finish)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
            {capitalize(paint.type)}
          </span>
        </div>
      </div>
    </div>
  );
}
