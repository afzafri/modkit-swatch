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
      <div className="text-center py-8 text-zinc-400 text-sm">
        No matching paints found for current filters
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((paint) => (
        <PaintCard
          key={`${paint.brand}-${paint.code}`}
          paint={paint}
          onAddToPalette={onAddToPalette}
          isInPalette={paletteKeys.has(`${paint.brand}-${paint.code}`)}
        />
      ))}
    </div>
  );
}
