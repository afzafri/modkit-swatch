"use client";

import type { PaintMatch } from "@/types/paint";
import PaintCard from "./PaintCard";

type Props = {
  results: PaintMatch[];
  onAddToPalette: (paint: PaintMatch) => void;
  paletteKeys: Set<string>;
};

export default function ResultsList({
  results,
  onAddToPalette,
  paletteKeys,
}: Props) {
  if (results.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-2xl"
        style={{ background: "var(--surface-warm)", color: "var(--text-tertiary)" }}
      >
        <p className="text-sm">No matching paints found for current filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((paint, i) => (
        <PaintCard
          key={`${paint.brand}-${paint.code}`}
          paint={paint}
          rank={i + 1}
          onAddToPalette={onAddToPalette}
          isInPalette={paletteKeys.has(`${paint.brand}-${paint.code}`)}
        />
      ))}
    </div>
  );
}
