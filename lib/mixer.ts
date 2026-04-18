import mixbox from "mixbox";
import { rgbToHex } from "./colorMath";
import type { MixIngredient } from "@/types/paint";

export function normalizeRatios(parts: number[]): number[] {
  const total = parts.reduce((s, p) => s + p, 0);
  if (total === 0) return parts.map(() => 0);
  return parts.map((p) => p / total);
}

export function mixPaints(ingredients: MixIngredient[]): string | null {
  const valid = ingredients.filter((i) => i.parts > 0);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0].hex;

  const ratios = normalizeRatios(valid.map((i) => i.parts));

  const latentSize = mixbox.rgbToLatent(valid[0].hex).length;
  const summed: number[] = new Array(latentSize).fill(0);

  for (let i = 0; i < valid.length; i++) {
    const latent = mixbox.rgbToLatent(valid[i].hex);
    const w = ratios[i];
    for (let j = 0; j < latentSize; j++) {
      summed[j] += latent[j] * w;
    }
  }

  const [r, g, b] = mixbox.latentToRgb(summed);
  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}
