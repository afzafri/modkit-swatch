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

export function computeRGBVariance(pixelData: Uint8ClampedArray): number {
  const count = pixelData.length / 4;
  if (count === 0) return 0;

  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < pixelData.length; i += 4) {
    rSum += pixelData[i];
    gSum += pixelData[i + 1];
    bSum += pixelData[i + 2];
  }
  const rMean = rSum / count;
  const gMean = gSum / count;
  const bMean = bSum / count;

  let rVar = 0, gVar = 0, bVar = 0;
  for (let i = 0; i < pixelData.length; i += 4) {
    rVar += (pixelData[i] - rMean) ** 2;
    gVar += (pixelData[i + 1] - gMean) ** 2;
    bVar += (pixelData[i + 2] - bMean) ** 2;
  }

  return (rVar + gVar + bVar) / (count * 3);
}

export type MetallicSignal = "high" | "medium" | "none";

export function detectMetallic(lab: Lab, variance: number): MetallicSignal {
  const labChroma = Math.sqrt(lab.a ** 2 + lab.b ** 2);
  const isBrightNeutral = lab.L > 70 && labChroma < 15;

  if (variance > 800) return "high";
  if (variance > 200) {
    return isBrightNeutral ? "high" : "medium";
  }
  return "none";
}

export function sampleRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 3
): { hex: string; variance: number } {
  const size = radius * 2 + 1;
  const pixelData = ctx.getImageData(x - radius, y - radius, size, size).data;
  const count = pixelData.length / 4;

  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < pixelData.length; i += 4) {
    rSum += pixelData[i];
    gSum += pixelData[i + 1];
    bSum += pixelData[i + 2];
  }

  const hex = rgbToHex(
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count)
  );
  const variance = computeRGBVariance(pixelData);

  return { hex, variance };
}
