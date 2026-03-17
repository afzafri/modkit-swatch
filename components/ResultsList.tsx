"use client";

import type { PaintMatch } from "@/types/paint";
import PaintCard from "./PaintCard";

type Props = {
  results: PaintMatch[];
  onAssign: (paint: PaintMatch) => void;
  assignedPaintKey: string | null;
};

export default function ResultsList({
  results,
  onAssign,
  assignedPaintKey,
}: Props) {
  if (results.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-2xl"
        style={{ background: "var(--surface-warm, #f1f5f9)", color: "var(--text-tertiary, #94a3b8)" }}
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
          onAssign={onAssign}
          isAssigned={assignedPaintKey === `${paint.brand}-${paint.code}`}
        />
      ))}
    </div>
  );
}
