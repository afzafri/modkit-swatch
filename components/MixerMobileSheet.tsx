"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import type { PaintMatch, MixIngredient } from "@/types/paint";
import MixerResultCard from "./MixerResultCard";
import MixerIngredientSlot from "./MixerIngredientSlot";

type Props = {
  visible: boolean;
  targetHex: string | null;
  mixedHex: string | null;
  deltaE: number | null;
  closest: PaintMatch | null;
  ingredients: MixIngredient[];
  percentages: number[];
  maxIngredients: number;
  autoSeeded: boolean;
  onPartsChange: (index: number, parts: number) => void;
  onRemoveIngredient: (index: number) => void;
  onReplaceIngredient: (index: number) => void;
  onAddIngredient: () => void;
  onSave: () => void;
  canSave: boolean;
  onDismiss: () => void;
};

export default function MixerMobileSheet({
  visible,
  targetHex,
  mixedHex,
  deltaE,
  closest,
  ingredients,
  percentages,
  maxIngredients,
  autoSeeded,
  onPartsChange,
  onRemoveIngredient,
  onReplaceIngredient,
  onAddIngredient,
  onSave,
  canSave,
  onDismiss,
}: Props) {
  const [rendered, setRendered] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const closingRef = useRef(false);

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

  useEffect(() => {
    if (rendered && !slideIn && !closingRef.current) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setSlideIn(true));
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
    if (dragY > 120) close();
    setDragY(0);
  }, [dragY, close]);

  if (!rendered || !targetHex) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
        style={{ backgroundColor: slideIn ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)" }}
        onClick={close}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl h-[80vh] flex flex-col"
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              Mix a custom color
            </p>
            <p className="text-xs text-slate-400">Target {targetHex.toUpperCase()}</p>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          <MixerResultCard
            targetHex={targetHex}
            mixedHex={mixedHex}
            deltaE={deltaE}
            closest={closest}
            canSave={canSave}
            onSave={onSave}
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                Ingredients
              </h3>
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                {ingredients.length}/{maxIngredients} paints
              </span>
            </div>

            {autoSeeded && ingredients.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1.5 rounded-md">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="flex-1">Auto-suggested your top {ingredients.length} paint matches — tweak ratios or swap as needed.</span>
              </div>
            )}

            {ingredients.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-500 mb-3">No ingredients yet.</p>
                <button
                  onClick={onAddIngredient}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add first paint
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ingredients.map((ing, i) => (
                  <MixerIngredientSlot
                    key={`${ing.brand}-${ing.code}-${i}`}
                    ingredient={ing}
                    percent={percentages[i] ?? 0}
                    onPartsChange={(p) => onPartsChange(i, p)}
                    onRemove={() => onRemoveIngredient(i)}
                    onReplace={() => onReplaceIngredient(i)}
                  />
                ))}
              </div>
            )}

            {ingredients.length > 0 && ingredients.length < maxIngredients && (
              <button
                onClick={onAddIngredient}
                className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add ingredient
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
