"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import paintsData from "@/data/paints.json";
import { hexToLab } from "@/lib/colorMath";
import type { MetallicSignal } from "@/lib/colorMath";
import { matchPaints, extractFilterOptions } from "@/lib/matcher";
import type { PaintWithLab, PaintMatch, Filters, Marker } from "@/types/paint";
import ImageCanvas from "@/components/ImageCanvas";
import ColorSwatch from "@/components/ColorSwatch";
import FilterBar from "@/components/FilterBar";
import ResultsList from "@/components/ResultsList";
import AssignmentsPanel from "@/components/AssignmentsPanel";
import MobileBottomSheet from "@/components/MobileBottomSheet";

const MARKERS_KEY = "modkitswatch_markers";

function loadMarkers(): Marker[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(MARKERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMarkers(markers: Marker[]) {
  localStorage.setItem(MARKERS_KEY, JSON.stringify(markers));
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

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [nextMarkerId, setNextMarkerId] = useState(1);
  const [metallicOnly, setMetallicOnly] = useState(false);
  const [metallicSignal, setMetallicSignal] = useState<MetallicSignal>("none");
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    brand: "All",
    finish: "All",
    type: "All",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadMarkers();
    setMarkers(loaded);
    if (loaded.length > 0) {
      const maxId = Math.max(...loaded.map((m) => m.id));
      setNextMarkerId(maxId + 1);
      setActiveMarkerId(loaded[loaded.length - 1].id);
    }
    setMounted(true);
  }, []);

  const activeMarker = useMemo(
    () => markers.find((m) => m.id === activeMarkerId) ?? null,
    [markers, activeMarkerId]
  );

  const pickedColor = activeMarker?.hex ?? null;

  const results = useMemo<PaintMatch[]>(() => {
    if (!pickedColor) return [];
    return matchPaints(pickedColor, paints, filters, 10, true, metallicOnly);
  }, [pickedColor, paints, filters, metallicOnly]);

  const handleColorPick = useCallback(
    (hex: string, signal: MetallicSignal, x: number, y: number, action: "new" | "reselect") => {
      setMetallicSignal(signal);
      if (signal === "high") {
        setMetallicOnly(true);
      } else if (signal === "none") {
        setMetallicOnly(false);
      }

      if (action === "new") {
        // Remove any unassigned markers before adding new one
        const cleaned = markers.filter((m) => m.assignedPaint !== null);
        const newMarker: Marker = { id: nextMarkerId, x, y, hex, assignedPaint: null };
        const updated = [...cleaned, newMarker];
        setMarkers(updated);
        setActiveMarkerId(nextMarkerId);
        setNextMarkerId(nextMarkerId + 1);
        saveMarkers(updated);
      } else {
        // reselect: update active marker position and color
        const updated = markers.map((m) =>
          m.id === activeMarkerId ? { ...m, x, y, hex, assignedPaint: null } : m
        );
        setMarkers(updated);
        saveMarkers(updated);
      }

      // Show bottom sheet on mobile
      if (window.innerWidth < 1024) {
        setShowMobileSheet(true);
      }
    },
    [markers, activeMarkerId, nextMarkerId]
  );

  const assignPaint = useCallback(
    (paint: PaintMatch) => {
      if (!activeMarkerId) return;
      const updated = markers.map((m) =>
        m.id === activeMarkerId ? { ...m, assignedPaint: paint } : m
      );
      setMarkers(updated);
      saveMarkers(updated);
    },
    [markers, activeMarkerId]
  );

  const removeMarker = useCallback(
    (id: number) => {
      const updated = markers.filter((m) => m.id !== id);
      setMarkers(updated);
      saveMarkers(updated);
      if (activeMarkerId === id) {
        setActiveMarkerId(updated.length > 0 ? updated[updated.length - 1].id : null);
      }
    },
    [markers, activeMarkerId]
  );

  const selectMarker = useCallback((id: number) => {
    setActiveMarkerId(id);
  }, []);

  const clearAllMarkers = useCallback(() => {
    setMarkers([]);
    setActiveMarkerId(null);
    setNextMarkerId(1);
    saveMarkers([]);
  }, []);

  const assignedPaintKey = activeMarker?.assignedPaint
    ? `${activeMarker.assignedPaint.brand}-${activeMarker.assignedPaint.code}`
    : null;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-sky-100 selection:text-sky-900 flex flex-col text-slate-800">
      <SiteHeader paintCount={paints.length} />

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
          <span className="text-slate-600 font-medium">Pick colors</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Assign paints</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left panel */}
          <div className="w-full lg:w-[55%] self-start flex flex-col gap-4">
            <ImageCanvas
              markers={markers}
              activeMarkerId={activeMarkerId}
              onColorPick={handleColorPick}
              onSelectMarker={selectMarker}
              onRemoveMarker={removeMarker}
            />
            <AssignmentsPanel
              markers={markers}
              activeMarkerId={activeMarkerId}
              onSelectMarker={selectMarker}
              onRemoveMarker={removeMarker}
              onClearAll={clearAllMarkers}
            />
          </div>

          {/* Right panel (desktop only) */}
          <div className="hidden lg:flex w-full lg:w-[45%] flex-col gap-4">
            <ColorSwatch hex={pickedColor} />

            {/* Metallic detection hint */}
            {pickedColor && metallicSignal !== "none" && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                metallicSignal === "high"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                <span className="flex-1">
                  {metallicSignal === "high"
                    ? "Reflective surface detected. Showing metallic paints."
                    : "Possible metallic surface."}
                </span>
                <button
                  onClick={() => { setMetallicSignal("none"); setMetallicOnly(false); }}
                  className="text-current opacity-50 hover:opacity-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {pickedColor && (
              <>
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  brands={filterOptions.brands}
                  finishes={filterOptions.finishes}
                  types={filterOptions.types}
                />
                <div className="flex flex-col min-h-0 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                      {activeMarker?.assignedPaint ? "Change Paint" : "Choose a Paint"}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                      Marker #{activeMarker?.id}
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-[60vh] pr-1">
                    <ResultsList
                      results={results}
                      onAssign={assignPaint}
                      assignedPaintKey={assignedPaintKey}
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
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              This is an independent hobby project and is not affiliated with, endorsed by, or sponsored by any paint manufacturer or model kit brand mentioned on this site. All product names, logos, and brands are the property of their respective owners.
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

      {/* Mobile bottom sheet for paint selection */}
      <MobileBottomSheet
        visible={showMobileSheet}
        hex={pickedColor}
        metallicSignal={metallicSignal}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        results={results}
        onAssign={assignPaint}
        assignedPaintKey={assignedPaintKey}
        hasAssignment={!!activeMarker?.assignedPaint}
        onDismiss={() => setShowMobileSheet(false)}
        onClearMetallic={() => { setMetallicSignal("none"); setMetallicOnly(false); }}
      />

      <SiteFooter />
    </div>
  );
}
