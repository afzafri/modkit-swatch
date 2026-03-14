import chroma from "chroma-js";

export type RGB = { r: number; g: number; b: number };
export type Lab = { L: number; a: number; b: number };

export function hexToRgb(hex: string): RGB {
  const color = chroma(hex);
  const [r, g, b] = color.rgb();
  return { r, g, b };
}

export function hexToLab(hex: string): Lab {
  const [L, a, b] = chroma(hex).lab();
  return { L, a, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return chroma(r, g, b).hex();
}

export function deltaE(lab1: Lab, lab2: Lab): number {
  const c1 = chroma.lab(lab1.L, lab1.a, lab1.b);
  const c2 = chroma.lab(lab2.L, lab2.a, lab2.b);
  return chroma.deltaE(c1, c2);
}

export function getContrastColor(hex: string): "#000" | "#fff" {
  return chroma(hex).luminance() > 0.5 ? "#000" : "#fff";
}
