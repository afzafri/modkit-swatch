"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { X, Beaker } from "lucide-react";
import type { PaintMatch, Filters } from "@/types/paint";
import type { MetallicSignal } from "@/lib/colorMath";
import FilterBar from "./FilterBar";
import ResultsList from "./ResultsList";

type Props = {
  visible: boolean;
  hex: string | null;
  metallicSignal: MetallicSignal;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  filterOptions: { brands: string[]; finishes: string[]; types: string[] };
  results: PaintMatch[];
  onAssign: (paint: PaintMatch) => void;
  assignedPaintKey: string | null;
  hasAssignment: boolean;
  onDismiss: () => void;
  onClearMetallic: () => void;
};

export default function MobileBottomSheet({
  visible,
  hex,
  metallicSignal,
  filters,
  onFiltersChange,
  filterOptions,
  results,
  onAssign,
  assignedPaintKey,
  hasAssignment,
  onDismiss,
  onClearMetallic,
}: Props) {
  const [rendered, setRendered] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const closingRef = useRef(false);

  // Step 1: mount the DOM when visible
  useEffect(() => {
    if (visible && !rendered && !closingRef.current) {
      setSlideIn(false);
      setRendered(true);
    }
    if (!visible && rendered && !closingRef.current) {
      setSlideIn(false);
      setRendered(false);
    }
  }, [visible, rendered]);

  // Step 2: after mount, trigger slide-in on next paint
  useEffect(() => {
    if (rendered && !slideIn && !closingRef.current) {
      // Double RAF to guarantee the browser has painted the off-screen position
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setSlideIn(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [rendered, slideIn]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setSlideIn(false);
    setTimeout(() => {
      setRendered(false);
      closingRef.current = false;
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleAssign = useCallback((paint: PaintMatch) => {
    onAssign(paint);
    close();
  }, [onAssign, close]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setDragY(dy);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 120) {
      close();
    }
    setDragY(0);
  }, [dragY, close]);

  if (!rendered || !hex) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
        style={{ backgroundColor: slideIn ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)" }}
        onClick={close}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl h-[50vh] flex flex-col"
        style={{
          transform: isDragging
            ? `translateY(${dragY}px)`
            : slideIn
              ? "translateY(0)"
              : "translateY(100%)",
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: hex }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {hasAssignment ? "Change Paint" : "Choose a Paint"}
            </p>
            <p className="text-xs font-mono text-slate-400">{hex.toUpperCase()}</p>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metallic hint */}
        {metallicSignal !== "none" && (
          <div className={`flex items-center gap-2 text-xs px-4 py-2 ${
            metallicSignal === "high" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"
          }`}>
            <span className="flex-1">
              {metallicSignal === "high"
                ? "Reflective surface detected. Showing metallic paints."
                : "Possible metallic surface."}
            </span>
            <button onClick={onClearMetallic} className="text-current opacity-50">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mix shortcut */}
        <div className="px-4 pt-2">
          <Link
            href={`/mix?target=${encodeURIComponent(hex)}`}
            onClick={close}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 bg-sky-50 active:bg-sky-500 active:text-white px-2.5 py-1.5 rounded-md border border-sky-100 transition-colors"
          >
            <Beaker className="w-3 h-3" />
            Mix this color
          </Link>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-slate-100">
          <FilterBar
            filters={filters}
            onChange={onFiltersChange}
            brands={filterOptions.brands}
            finishes={filterOptions.finishes}
            types={filterOptions.types}
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <ResultsList
            results={results}
            onAssign={handleAssign}
            assignedPaintKey={assignedPaintKey}
          />
        </div>
      </div>
    </>
  );
}
