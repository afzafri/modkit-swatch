"use client";

import { getContrastColor, hexToRgb } from "@/lib/colorMath";

type Props = {
  hex: string | null;
};

export default function ColorSwatch({ hex }: Props) {
  if (!hex) {
    return (
      <div className="rounded-xl p-8 text-center bg-slate-100/80 border border-slate-200/60">
        <p className="text-sm text-slate-400 font-light">
          Click on your image to pick a color
        </p>
      </div>
    );
  }

  const rgb = hexToRgb(hex);
  const textColor = getContrastColor(hex);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: hex }}
      >
        <span className="text-lg font-mono font-semibold tracking-wider" style={{ color: textColor }}>
          {hex.toUpperCase()}
        </span>
        <span className="text-xs font-mono opacity-60" style={{ color: textColor }}>
          {rgb.r}, {rgb.g}, {rgb.b}
        </span>
      </div>
    </div>
  );
}
