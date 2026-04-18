"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, ChevronRight, Sparkles, Beaker } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import paintsData from "@/data/paints.json";
import { hexToLab, deltaE } from "@/lib/colorMath";
import { mixPaints, normalizeRatios } from "@/lib/mixer";
import { exportMix } from "@/lib/mixerExport";
import { matchPaints, extractFilterOptions } from "@/lib/matcher";
import type { PaintWithLab, PaintMatch, MixIngredient, MixRecipe } from "@/types/paint";
import MixerImagePicker from "@/components/MixerImagePicker";
import MixerIngredientSlot from "@/components/MixerIngredientSlot";
import MixerIngredientPicker from "@/components/MixerIngredientPicker";
import MixerResultCard from "@/components/MixerResultCard";
import MixerMobileSheet from "@/components/MixerMobileSheet";
import SavedMixes from "@/components/SavedMixes";

const MAX_INGREDIENTS = 4;
const MIXES_KEY = "modkitswatch_mixes";
const MAX_SAVED = 25;

function loadRecipes(): MixRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MIXES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecipes(recipes: MixRecipe[]) {
  try {
    localStorage.setItem(MIXES_KEY, JSON.stringify(recipes));
  } catch {}
}

type Marker = { x: number; y: number; hex: string };

export default function MixPage() {
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

  const [mounted, setMounted] = useState(false);
  const [targetHex, setTargetHex] = useState<string | null>(null);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [ingredients, setIngredients] = useState<MixIngredient[]>([]);
  const [ingredientsAutoSeeded, setIngredientsAutoSeeded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerReplaceIndex, setPickerReplaceIndex] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<MixRecipe[]>([]);
  const [repickMode, setRepickMode] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const seededTargetRef = useRef<string | null>(null);
  const imageElRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("target");
    if (t && /^#?[0-9a-fA-F]{6}$/.test(t)) {
      const normalized = t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`;
      setTargetHex(normalized);
      if (window.innerWidth < 1024) setShowMobileSheet(true);
    }
    setRecipes(loadRecipes());
    setMounted(true);
  }, []);

  // Auto-suggest top-2 ingredients when target changes (once per target)
  useEffect(() => {
    if (!targetHex) return;
    if (seededTargetRef.current === targetHex) return;
    if (ingredients.length > 0) {
      seededTargetRef.current = targetHex;
      return;
    }
    const top2 = matchPaints(targetHex, paints, { brand: "All", finish: "All", type: "All" }, 2);
    setIngredients(top2.map((p) => ({
      brand: p.brand,
      code: p.code,
      name: p.name,
      hex: p.hex,
      parts: 1,
    })));
    setIngredientsAutoSeeded(true);
    seededTargetRef.current = targetHex;
  }, [targetHex, paints, ingredients.length]);

  const mixedHex = useMemo(() => mixPaints(ingredients), [ingredients]);

  const targetLab = useMemo(() => targetHex ? hexToLab(targetHex) : null, [targetHex]);
  const mixedLab = useMemo(() => mixedHex ? hexToLab(mixedHex) : null, [mixedHex]);
  const currentDeltaE = useMemo(() => {
    if (!targetLab || !mixedLab) return null;
    return deltaE(targetLab, mixedLab);
  }, [targetLab, mixedLab]);

  const closestPaint = useMemo<PaintMatch | null>(() => {
    if (!mixedHex) return null;
    const top = matchPaints(mixedHex, paints, { brand: "All", finish: "All", type: "All" }, 1);
    return top[0] ?? null;
  }, [mixedHex, paints]);

  const percentages = useMemo(() => {
    const parts = ingredients.map((i) => i.parts);
    return normalizeRatios(parts).map((r) => r * 100);
  }, [ingredients]);

  const handleTargetChange = useCallback((hex: string, x: number, y: number) => {
    const lower = hex.toLowerCase();
    setTargetHex(lower);
    setMarker({ x, y, hex: lower });
    setRepickMode(false);
    // Reset ingredients so auto-seed re-runs for the new target
    setIngredients([]);
    seededTargetRef.current = null;
    if (window.innerWidth < 1024) setShowMobileSheet(true);
  }, []);

  const handleRequestRepick = useCallback(() => {
    setRepickMode(true);
    // On mobile, hide sheet so user can see the image to re-pick
    if (window.innerWidth < 1024) setShowMobileSheet(false);
  }, []);

  const handlePartsChange = useCallback((index: number, parts: number) => {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, parts } : ing));
    setIngredientsAutoSeeded(false);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    setIngredientsAutoSeeded(false);
  }, []);

  const openAddPicker = useCallback(() => {
    setPickerReplaceIndex(null);
    setPickerOpen(true);
  }, []);

  const openReplacePicker = useCallback((index: number) => {
    setPickerReplaceIndex(index);
    setPickerOpen(true);
  }, []);

  const handlePickIngredient = useCallback((paint: PaintWithLab) => {
    const newIngredient: MixIngredient = {
      brand: paint.brand,
      code: paint.code,
      name: paint.name,
      hex: paint.hex,
      parts: 1,
    };
    setIngredients((prev) => {
      if (pickerReplaceIndex != null) {
        return prev.map((ing, i) => i === pickerReplaceIndex ? { ...newIngredient, parts: ing.parts } : ing);
      }
      return [...prev, newIngredient];
    });
    setIngredientsAutoSeeded(false);
    setPickerOpen(false);
    setPickerReplaceIndex(null);
  }, [pickerReplaceIndex]);

  const excludeKeys = useMemo(() => {
    if (pickerReplaceIndex == null) {
      return ingredients.map((i) => `${i.brand}-${i.code}`);
    }
    return ingredients
      .filter((_, idx) => idx !== pickerReplaceIndex)
      .map((i) => `${i.brand}-${i.code}`);
  }, [ingredients, pickerReplaceIndex]);

  const handleSave = useCallback(() => {
    if (!mixedHex || ingredients.length === 0) return;
    const recipe: MixRecipe = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      targetHex,
      mixedHex,
      ingredients: [...ingredients],
    };
    setRecipes((prev) => {
      const next = [recipe, ...prev].slice(0, MAX_SAVED);
      saveRecipes(next);
      return next;
    });
  }, [targetHex, mixedHex, ingredients]);

  const handleImageLoaded = useCallback((img: HTMLImageElement | null) => {
    imageElRef.current = img;
    setHasImage(!!img);
    // When the image is removed, any crosshair marker is in stale coords — clear it
    if (!img) {
      setMarker(null);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (!mixedHex || ingredients.length === 0) return;
    exportMix({
      targetHex,
      mixedHex,
      deltaE: currentDeltaE,
      ingredients,
      percentages,
      marker,
      image: imageElRef.current,
    });
  }, [targetHex, mixedHex, currentDeltaE, ingredients, percentages, marker]);

  const handleStartFromScratch = useCallback(() => {
    // Leave target null, skip seeding. Open picker immediately.
    seededTargetRef.current = null;
    setIngredientsAutoSeeded(false);
    setPickerReplaceIndex(null);
    setPickerOpen(true);
    if (window.innerWidth < 1024) setShowMobileSheet(true);
  }, []);

  const handleLoadRecipe = useCallback((recipe: MixRecipe) => {
    seededTargetRef.current = recipe.targetHex;
    setTargetHex(recipe.targetHex);
    setMarker(null);
    setIngredients(recipe.ingredients);
    setIngredientsAutoSeeded(false);
    if (window.innerWidth < 1024) setShowMobileSheet(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteRecipe = useCallback((id: string) => {
    setRecipes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRecipes(next);
      return next;
    });
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-sky-100 selection:text-sky-900 flex flex-col text-slate-800">
      <SiteHeader paintCount={paints.length} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-8 pb-16">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Mix a custom paint color.
          </h2>
          <p className="text-sm text-slate-500 max-w-xl">
            When no single paint matches your target, blend two or more paints to get closer. Pick a target color from your photo, adjust the ratios, and preview the mix in real time.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <span className="text-slate-600 font-medium">Upload photo</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Pick target color</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Adjust ratios</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left panel */}
          <div className="w-full lg:w-[55%] self-start flex flex-col gap-4">
            <MixerImagePicker
              onPick={handleTargetChange}
              pickEnabled={!targetHex || repickMode}
              onRequestPick={handleRequestRepick}
              marker={marker}
              onImageLoaded={handleImageLoaded}
              onExport={handleExport}
              canExport={ingredients.length > 0 && !!mixedHex}
            />

            {/* Mix-from-scratch link — visible when no target yet */}
            {!targetHex && (
              <button
                onClick={handleStartFromScratch}
                className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                or mix from scratch without a target
                <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {/* Mobile: inline re-open button under image */}
            {(targetHex || ingredients.length > 0) && !showMobileSheet && (
              <button
                onClick={() => setShowMobileSheet(true)}
                className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors"
              >
                <Beaker className="w-4 h-4" />
                Open mixer
              </button>
            )}
          </div>

          {/* Right panel (desktop only) */}
          <div className="hidden lg:flex w-full lg:w-[45%] flex-col gap-4">
            {!targetHex && ingredients.length === 0 ? (
              <div className="rounded-xl p-8 text-center bg-slate-100/80 border border-slate-200/60">
                <p className="text-sm text-slate-400 font-light mb-4">
                  Upload a photo and click to pick your target color
                </p>
                <div className="text-[11px] text-slate-400 mb-3">— or —</div>
                <button
                  onClick={handleStartFromScratch}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mix from scratch (no target)
                </button>
              </div>
            ) : (
              <>
                <MixerResultCard
                  targetHex={targetHex}
                  mixedHex={mixedHex}
                  deltaE={currentDeltaE}
                  closest={closestPaint}
                  canSave={ingredients.length > 0 && !!mixedHex}
                  onSave={handleSave}
                  onExport={!hasImage ? handleExport : undefined}
                  canExport={!hasImage && ingredients.length > 0 && !!mixedHex}
                />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                      Ingredients
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                      {ingredients.length}/{MAX_INGREDIENTS} paints
                    </span>
                  </div>

                  {ingredientsAutoSeeded && ingredients.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1.5 rounded-md">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="flex-1">Auto-suggested your top {ingredients.length} paint matches — tweak ratios or swap as needed.</span>
                    </div>
                  )}

                  {ingredients.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                      <p className="text-sm text-slate-500 mb-3">No ingredients yet.</p>
                      <button
                        onClick={openAddPicker}
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
                          onPartsChange={(p) => handlePartsChange(i, p)}
                          onRemove={() => handleRemove(i)}
                          onReplace={() => openReplacePicker(i)}
                        />
                      ))}
                    </div>
                  )}

                  {ingredients.length > 0 && ingredients.length < MAX_INGREDIENTS && (
                    <button
                      onClick={openAddPicker}
                      className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add ingredient
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {recipes.length > 0 && (
          <div className="mt-10">
            <SavedMixes recipes={recipes} onLoad={handleLoadRecipe} onDelete={handleDeleteRecipe} />
          </div>
        )}

        <div className="mt-14 pt-8 border-t border-slate-200/60">
          <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200/60">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Disclaimer</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mixing results are approximations. Actual mixed colors depend on pigment concentration, transparency, medium, and application method. Pigment-based mixing powered by <a href="https://scrtwpns.com/mixbox" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Mixbox</a> — always test on a sample before committing to your build.
            </p>
          </div>
        </div>
      </main>

      {/* Mobile FAB — reachable when sheet closed and mix is active (target OR ingredients) */}
      {(targetHex || ingredients.length > 0) && !showMobileSheet && !pickerOpen && (
        <button
          onClick={() => setShowMobileSheet(true)}
          className="lg:hidden fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg hover:bg-slate-800 transition-colors"
        >
          <Beaker className="w-4 h-4" />
          Open mixer
        </button>
      )}

      {/* Mobile mixer sheet */}
      <MixerMobileSheet
        visible={showMobileSheet}
        targetHex={targetHex}
        mixedHex={mixedHex}
        deltaE={currentDeltaE}
        closest={closestPaint}
        ingredients={ingredients}
        percentages={percentages}
        maxIngredients={MAX_INGREDIENTS}
        autoSeeded={ingredientsAutoSeeded}
        onPartsChange={handlePartsChange}
        onRemoveIngredient={handleRemove}
        onReplaceIngredient={openReplacePicker}
        onAddIngredient={openAddPicker}
        onSave={handleSave}
        canSave={ingredients.length > 0 && !!mixedHex}
        onExport={!hasImage ? handleExport : () => { setShowMobileSheet(false); handleExport(); }}
        canExport={ingredients.length > 0 && !!mixedHex}
        onDismiss={() => setShowMobileSheet(false)}
      />

      <MixerIngredientPicker
        visible={pickerOpen}
        paints={paints}
        filterOptions={filterOptions}
        excludeKeys={excludeKeys}
        onSelect={handlePickIngredient}
        onDismiss={() => { setPickerOpen(false); setPickerReplaceIndex(null); }}
        title={pickerReplaceIndex != null ? "Swap ingredient" : "Add ingredient"}
      />

      <SiteFooter />
    </div>
  );
}
