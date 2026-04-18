import { getContrastColor } from "./colorMath";
import type { MixIngredient } from "@/types/paint";

type Marker = { x: number; y: number; hex: string };

type ExportParams = {
  targetHex: string | null;
  mixedHex: string | null;
  deltaE: number | null;
  ingredients: MixIngredient[];
  percentages: number[];
  marker: Marker | null;
  image?: HTMLImageElement | null;
};

const DEFAULT_W = 1200;
const DEFAULT_H = 900;

function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getMatchLabel(de: number): string {
  if (de < 2) return "Excellent";
  if (de < 5) return "Good";
  if (de < 10) return "Fair";
  return "Rough";
}

function drawCrosshair(ctx: CanvasRenderingContext2D, m: Marker, cw: number, ch: number) {
  const s = Math.max(cw, ch) / 800;
  const r = 28 * s;
  const crossLen = 14 * s;
  ctx.beginPath(); ctx.arc(m.x, m.y, r + 3 * s, 0, 2 * Math.PI); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, 2 * Math.PI); ctx.strokeStyle = m.hex; ctx.lineWidth = 5 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(m.x, m.y, r + 5 * s, 0, 2 * Math.PI); ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1.5 * s; ctx.stroke();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(m.x, m.y - r - crossLen); ctx.lineTo(m.x, m.y - r + 2 * s);
  ctx.moveTo(m.x, m.y + r - 2 * s); ctx.lineTo(m.x, m.y + r + crossLen);
  ctx.moveTo(m.x - r - crossLen, m.y); ctx.lineTo(m.x - r + 2 * s, m.y);
  ctx.moveTo(m.x + r - 2 * s, m.y); ctx.lineTo(m.x + r + crossLen, m.y);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(m.x, m.y, 3.5 * s, 0, 2 * Math.PI); ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1 * s; ctx.stroke();
}

type CardLayout = { x: number; y: number; w: number; h: number };

function drawRecipeCard(
  ctx: CanvasRenderingContext2D,
  params: ExportParams,
  cw: number,
  ch: number,
  scale: number
): CardLayout {
  const { targetHex, mixedHex, deltaE, ingredients, percentages } = params;

  const pad = 22 * scale;
  const gap = 10 * scale;
  const fontTitle = 13 * scale;
  const fontHex = 17 * scale;
  const fontLabel = 11 * scale;
  const fontBody = 14 * scale;
  const rowH = 32 * scale;
  const swatchDotSize = 20 * scale;
  const bigSwatchH = 68 * scale;

  const cardW = Math.min(560 * scale, cw * 0.8);
  const innerW = cardW - pad * 2;

  // Height calc
  let contentH = 0;
  contentH += fontTitle + gap; // title
  contentH += bigSwatchH + gap; // swatches
  if (targetHex && deltaE != null) contentH += fontBody + gap; // match row
  contentH += fontLabel + gap * 0.8; // ingredients label
  contentH += ingredients.length * (rowH + 4 * scale); // rows
  const cardH = contentH + pad * 2;

  // Centered horizontally, seated just above the watermark
  const wmScale = Math.max(cw, ch) / 800 * 0.7;
  const wmH = 62 * wmScale;
  const wmMargin = 16 * wmScale;
  const gapAboveWatermark = 24 * scale;
  const cardX = (cw - cardW) / 2;
  const cardY = Math.max(pad, ch - wmH - wmMargin - gapAboveWatermark - cardH);

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 24 * scale;
  ctx.shadowOffsetY = 6 * scale;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 18 * scale); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(15,23,42,0.08)";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 18 * scale); ctx.stroke();

  let cy = cardY + pad;

  // Title
  ctx.font = `bold ${fontTitle}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(targetHex ? "COLOR MIX RECIPE" : "COLOR MIX RECIPE · SCRATCH", cardX + pad, cy + fontTitle);
  cy += fontTitle + gap;

  // Big swatches: Target | Mix (or Mix only)
  if (targetHex && mixedHex) {
    const sw = (innerW - gap) / 2;
    drawSwatchBlock(ctx, cardX + pad, cy, sw, bigSwatchH, targetHex, "TARGET", scale, fontHex, fontLabel);
    drawSwatchBlock(ctx, cardX + pad + sw + gap, cy, sw, bigSwatchH, mixedHex, "MIX RESULT", scale, fontHex, fontLabel);
  } else if (mixedHex) {
    drawSwatchBlock(ctx, cardX + pad, cy, innerW, bigSwatchH, mixedHex, "MIX RESULT", scale, fontHex, fontLabel);
  } else {
    // Empty placeholder
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath(); ctx.roundRect(cardX + pad, cy, innerW, bigSwatchH, 10 * scale); ctx.fill();
  }
  cy += bigSwatchH + gap;

  // Match row
  if (targetHex && deltaE != null) {
    ctx.font = `bold ${fontBody}px system-ui, sans-serif`;
    ctx.fillStyle = "#0f172a";
    const matchText = `Match: ΔE ${deltaE.toFixed(1)}  ·  ${getMatchLabel(deltaE)}`;
    ctx.fillText(matchText, cardX + pad, cy + fontBody);
    cy += fontBody + gap;
  }

  // Ingredients label
  ctx.font = `bold ${fontLabel}px system-ui, sans-serif`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`INGREDIENTS (${ingredients.length})`, cardX + pad, cy + fontLabel);
  cy += fontLabel + gap * 0.8;

  // Each ingredient row
  ingredients.forEach((ing, i) => {
    const rowY = cy + i * (rowH + 4 * scale);

    // Swatch
    ctx.fillStyle = ing.hex;
    ctx.beginPath(); ctx.roundRect(cardX + pad, rowY + (rowH - swatchDotSize) / 2, swatchDotSize, swatchDotSize, 4 * scale); ctx.fill();
    ctx.strokeStyle = "rgba(15,23,42,0.1)";
    ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.roundRect(cardX + pad, rowY + (rowH - swatchDotSize) / 2, swatchDotSize, swatchDotSize, 4 * scale); ctx.stroke();

    // Brand + code
    ctx.font = `bold ${fontBody}px system-ui, sans-serif`;
    ctx.fillStyle = "#0f172a";
    const codeText = `${ing.brand} ${ing.code}`;
    ctx.fillText(codeText, cardX + pad + swatchDotSize + 10 * scale, rowY + rowH / 2 + fontBody / 3);

    // Percent + parts
    const pct = percentages[i] ?? 0;
    const pctText = `${pct.toFixed(0)}%  ·  ${ing.parts}p`;
    ctx.font = `bold ${fontBody}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = "#334155";
    const pctW = ctx.measureText(pctText).width;
    ctx.fillText(pctText, cardX + cardW - pad - pctW, rowY + rowH / 2 + fontBody / 3);
  });

  return { x: cardX, y: cardY, w: cardW, h: cardH };
}

function drawSwatchBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hex: string,
  label: string,
  scale: number,
  fontHex: number,
  fontLabel: number
) {
  ctx.fillStyle = hex;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10 * scale); ctx.fill();

  const textColor = getContrastColor(hex);
  ctx.font = `bold ${fontLabel}px system-ui, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.75;
  ctx.fillText(label, x + 12 * scale, y + fontLabel + 10 * scale);
  ctx.globalAlpha = 1;

  ctx.font = `bold ${fontHex}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = textColor;
  ctx.fillText(hex.toUpperCase(), x + 12 * scale, y + h - 14 * scale);
}

function sampleLuminance(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): number {
  const data = ctx.getImageData(x, y, w, h).data;
  let r = 0, g = 0, b = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  return (r / n) * 0.299 + (g / n) * 0.587 + (b / n) * 0.114;
}

async function drawWatermark(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const wmScale = Math.max(cw, ch) / 800 * 0.7;
  const wmW = 320 * wmScale;
  const wmH = 62 * wmScale;
  const wmX = (cw - wmW) / 2;
  const wmY = ch - wmH - 16 * wmScale;

  const sampleW = Math.min(Math.floor(wmW), cw);
  const sampleH = Math.min(Math.floor(wmH), ch);
  const sampleX = Math.max(0, Math.floor(wmX));
  const sampleY = Math.max(0, Math.floor(wmY));
  const lum = sampleLuminance(ctx, sampleX, sampleY, sampleW, sampleH);
  const isDark = lum < 128;

  const wm = await loadImageAsync(isDark ? "/watermark-light.svg" : "/watermark.svg");
  ctx.globalAlpha = 0.5;
  ctx.drawImage(wm, wmX, wmY, wmW, wmH);
  ctx.globalAlpha = 1;
}

export async function exportMix(params: ExportParams): Promise<void> {
  // Prefer the in-memory image (always up-to-date, unaffected by localStorage quota).
  // Fall back to localStorage only if parent didn't provide one.
  let img: HTMLImageElement | null = params.image ?? null;
  if (!img) {
    const stored = typeof window !== "undefined" ? localStorage.getItem("modkitswatch_mix_image") : null;
    if (stored) {
      try { img = await loadImageAsync(stored); } catch { img = null; }
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = img ? img.width : DEFAULT_W;
  canvas.height = img ? img.height : DEFAULT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  if (img) {
    ctx.drawImage(img, 0, 0);
  } else {
    // Soft vertical gradient using slate-50 → slate-100
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#f8fafc");
    grad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Crosshair marker on image
  if (img && params.marker) {
    drawCrosshair(ctx, params.marker, canvas.width, canvas.height);
  }

  // Recipe card — centered horizontally, seated above the watermark, for both image & scratch modes
  const scale = Math.max(canvas.width, canvas.height) / 800;
  drawRecipeCard(ctx, params, canvas.width, canvas.height, scale);

  await drawWatermark(ctx, canvas.width, canvas.height);

  const link = document.createElement("a");
  link.download = `modkitswatch-mix-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

