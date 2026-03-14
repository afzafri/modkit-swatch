import { hexToLab, deltaE } from "./colorMath";
import type { PaintWithLab, PaintMatch, Filters } from "@/types/paint";

const CLEAR_PATTERN = /^(clear|smoke|flat base)/i;

export function isClearPaint(paint: PaintWithLab): boolean {
  return CLEAR_PATTERN.test(paint.name);
}

export function matchPaints(
  pickedHex: string,
  paints: PaintWithLab[],
  filters: Filters,
  topN: number = 10,
  excludeClear: boolean = true
): PaintMatch[] {
  const pickedLab = hexToLab(pickedHex);

  const filtered = paints.filter((p) => {
    if (excludeClear && isClearPaint(p)) return false;
    if (filters.brand !== "All" && p.brand !== filters.brand) return false;
    if (filters.finish !== "All" && p.finish !== filters.finish) return false;
    if (filters.type !== "All" && p.type !== filters.type) return false;
    return true;
  });

  const scored: PaintMatch[] = filtered.map((p) => ({
    ...p,
    deltaE: deltaE(pickedLab, p.lab),
  }));

  scored.sort((a, b) => a.deltaE - b.deltaE);

  return scored.slice(0, topN);
}

export function extractFilterOptions(paints: PaintWithLab[]) {
  const brands = Array.from(new Set(paints.map((p) => p.brand))).sort();
  const finishes = Array.from(new Set(paints.map((p) => p.finish))).sort();
  const types = Array.from(new Set(paints.map((p) => p.type))).sort();
  return { brands, finishes, types };
}
