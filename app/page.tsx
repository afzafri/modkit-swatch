"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Github, Paintbrush, ChevronRight } from "lucide-react";
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
    return (paintsData as Array<Record<string, unknown>>).map((p) => ({
      brand: p.brand as string,
      code: p.code as string,
      name: p.name as string,
      hex: p.hex as string,
      finish: p.finish as string,
      type: p.type as string,
      suitableFor: (p.suitableFor as { airbrush: boolean; handPainting: boolean }) || { airbrush: true, handPainting: false },
      lab: hexToLab(p.hex as string),
    }));
  }, []);

  const filterOptions = useMemo(() => extractFilterOptions(paints), [paints]);

  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    brand: "All",
    finish: "All",
    type: "All",
  });
  const [excludeClear, setExcludeClear] = useState(true);
  const [palette, setPalette] = useState<PaintWithLab[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPalette(loadPalette());
    setMounted(true);
  }, []);

  const results = useMemo<PaintMatch[]>(() => {
    if (!pickedColor) return [];
    return matchPaints(pickedColor, paints, filters, 10, excludeClear);
  }, [pickedColor, paints, filters, excludeClear]);

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
    <div className="min-h-screen bg-slate-50 selection:bg-sky-100 selection:text-sky-900 flex flex-col text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-lg shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                ModKit Swatch
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                Gunpla &amp; Model Kit Paint Matcher
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-medium">
              <Paintbrush className="w-3.5 h-3.5 text-sky-500" />
              {paints.length} paints
            </span>
            <a
              href="https://github.com/afzafri/modkit-swatch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-900 transition-colors"
              title="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-8 pb-16">
        {/* Hero tagline */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Find the perfect paint for your next build.
          </h2>
          <p className="text-sm text-slate-500 max-w-xl">
            Whether you&apos;re building Gunpla, military armor, or any scale model, just upload a reference photo, sample any color, and instantly get ranked paint recommendations across {filterOptions.brands.length} brands.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <span className="text-slate-600 font-medium">Upload photo</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Pick a color</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Get matches</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left panel — Canvas */}
          <div className="w-full lg:w-[55%] self-start">
            <ImageCanvas onColorPick={setPickedColor} />
          </div>

          {/* Right panel — Results */}
          <div className="w-full lg:w-[45%] flex flex-col gap-4">
            <Palette palette={palette} onRemove={removeFromPalette} />
            <ColorSwatch hex={pickedColor} />

            {pickedColor && (
              <>
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  brands={filterOptions.brands}
                  finishes={filterOptions.finishes}
                  types={filterOptions.types}
                  excludeClear={excludeClear}
                  onExcludeClearChange={setExcludeClear}
                />
                <div className="flex flex-col min-h-0 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                      Closest Matches
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                      By similarity
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-[60vh] pr-1">
                    <ResultsList
                      results={results}
                      onAddToPalette={addToPalette}
                      paletteKeys={paletteKeys}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-14 pt-8 border-t border-slate-200/60">
          <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200/60">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Disclaimer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paint matches are approximations based on digital color comparison (CIE2000 Delta E). Actual paint colors may vary due to monitor calibration, lighting conditions, paint batch differences, surface preparation, and application method. Always test paints on a sample before committing to your build.
            </p>
          </div>
        </div>
      </main>

      {/* SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Color Science, Not Guessing
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Uses CIE2000 Delta E, the industry standard for perceptual color difference, to rank paint matches by how close they actually look to the human eye.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                All Major Hobby Brands
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Search across Mr. Color, Tamiya, Gaianotes, Jumpwind, Hobby Mio, Sunin7, QNC and more. Lacquer, acrylic, water-based. Filter by brand, finish, and paint type.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                No Signup, Fully Free
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Everything runs in your browser. No uploads to any server, no account required. Perfect for Gundam model kit builders and hobbyists. Just open, pick, and build.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Supported Paint Brands
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {filterOptions.brands.map((brand) => (
                <span key={brand} className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-500">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm" style={{ fontFamily: "var(--font-display)" }}>
            <img src="/logo.png" alt="" className="w-4 h-4 rounded" />
            ModKit Swatch
          </div>
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} &middot; Built for the Gunpla &amp; scale model community.
          </p>
        </div>
      </footer>
    </div>
  );
}
