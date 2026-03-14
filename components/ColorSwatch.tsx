"use client";

import { getContrastColor, hexToRgb } from "@/lib/colorMath";

type Props = {
  hex: string | null;
};

export default function ColorSwatch({ hex }: Props) {
  if (!hex) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-zinc-400 text-sm">
          Click on the image to sample a color
        </p>
      </div>
    );
  }

  const rgb = hexToRgb(hex);
  const textColor = getContrastColor(hex);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200">
      <div
        className="p-6 flex items-center justify-center gap-4"
        style={{ backgroundColor: hex }}
      >
        <span
          className="text-2xl font-mono font-bold tracking-wider"
          style={{ color: textColor }}
        >
          {hex.toUpperCase()}
        </span>
      </div>
      <div className="bg-white px-4 py-2 flex justify-center gap-6 text-xs text-zinc-500 font-mono">
        <span>R:{rgb.r}</span>
        <span>G:{rgb.g}</span>
        <span>B:{rgb.b}</span>
      </div>
    </div>
  );
}
