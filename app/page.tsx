"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import paintsData from "@/data/paints.json";
import { hexToLab } from "@/lib/colorMath";
import { matchPaints, extractFilterOptions } from "@/lib/matcher";
import type { PaintWithLab, PaintMatch, Filters } from "@/types/paint";
import ImageCanvas from "@/components/ImageCanvas";
import ColorSwatch from "@/components/ColorSwatch";
import FilterBar from "@/components/FilterBar";
import ResultsList from "@/components/ResultsList";
import Palette from "@/components/Palette";

const PALETTE_KEY = "gpm_palette";

function loadPalette(): PaintWithLab[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePalette(palette: PaintWithLab[]) {
  localStorage.setItem(PALETTE_KEY, JSON.stringify(palette));
}

export default function Home() {
  const paints = useMemo<PaintWithLab[]>(() => {
    return (paintsData as Array<Record<string, string>>).map((p) => ({
      brand: p.brand,
      code: p.code,
      name: p.name,
      hex: p.hex,
      finish: p.finish,
      type: p.type,
      lab: hexToLab(p.hex),
    }));
  }, []);

  const filterOptions = useMemo(() => extractFilterOptions(paints), [paints]);

  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    brand: "All",
    finish: "All",
    type: "All",
  });
  const [palette, setPalette] = useState<PaintWithLab[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPalette(loadPalette());
    setMounted(true);
  }, []);

  const results = useMemo<PaintMatch[]>(() => {
    if (!pickedColor) return [];
    return matchPaints(pickedColor, paints, filters);
  }, [pickedColor, paints, filters]);

  const paletteKeys = useMemo(
    () => new Set(palette.map((p) => `${p.brand}-${p.code}`)),
    [palette]
  );

  const addToPalette = useCallback(
    (paint: PaintMatch) => {
      const key = `${paint.brand}-${paint.code}`;
      if (paletteKeys.has(key)) return;
      const { deltaE: _, ...paintWithLab } = paint;
      const next = [...palette, paintWithLab];
      setPalette(next);
      savePalette(next);
    },
    [palette, paletteKeys]
  );

  const removeFromPalette = useCallback(
    (brand: string, code: string) => {
      const next = palette.filter(
        (p) => !(p.brand === brand && p.code === code)
      );
      setPalette(next);
      savePalette(next);
    },
    [palette]
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
          <div>
            <h1 className="text-lg font-bold text-zinc-900 leading-tight">
              ModKit Swatch
            </h1>
            <p className="text-xs text-zinc-400">
              Gunpla Paint Color Matcher
            </p>
          </div>
          <span className="ml-auto text-xs text-zinc-400 font-mono">
            {paints.length} paints
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel — Canvas */}
          <div className="w-full lg:w-[55%]">
            <ImageCanvas onColorPick={setPickedColor} />
          </div>

          {/* Right panel — Results */}
          <div className="w-full lg:w-[45%] flex flex-col gap-4">
            <ColorSwatch hex={pickedColor} />

            {pickedColor && (
              <>
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  brands={filterOptions.brands}
                  finishes={filterOptions.finishes}
                  types={filterOptions.types}
                />
                <div>
                  <h2 className="text-sm font-semibold text-zinc-700 mb-2">
                    Top Matches
                  </h2>
                  <ResultsList
                    results={results}
                    onAddToPalette={addToPalette}
                    paletteKeys={paletteKeys}
                  />
                </div>
              </>
            )}

            <Palette palette={palette} onRemove={removeFromPalette} />
          </div>
        </div>
      </main>
    </div>
  );
}
