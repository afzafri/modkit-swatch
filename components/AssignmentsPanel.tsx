"use client";

import { useState } from "react";
import { X, ClipboardCopy, Check } from "lucide-react";
import { getContrastColor } from "@/lib/colorMath";
import type { Marker } from "@/types/paint";

type Props = {
  markers: Marker[];
  activeMarkerId: number | null;
  onSelectMarker: (id: number) => void;
  onRemoveMarker: (id: number) => void;
  onClearAll: () => void;
};

function capitalize(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

export default function AssignmentsPanel({
  markers,
  activeMarkerId,
  onSelectMarker,
  onRemoveMarker,
  onClearAll,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (markers.length === 0) return null;

  const handleExport = () => {
    const lines = markers.map((m) => {
      const paint = m.assignedPaint;
      if (paint) {
        return `#${m.id}: ${m.hex} → ${paint.brand} ${paint.code} - ${paint.name} (${capitalize(paint.finish)} ${capitalize(paint.type)})`;
      }
      return `#${m.id}: ${m.hex} → (unassigned)`;
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
          Paint Assignments
          <span className="font-sans text-xs font-normal text-slate-400 ml-1.5">
            {markers.length} {markers.length === 1 ? "marker" : "markers"}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <ClipboardCopy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {markers.map((m) => {
          const isActive = m.id === activeMarkerId;
          const textColor = getContrastColor(m.hex);
          return (
            <div
              key={m.id}
              onClick={() => onSelectMarker(m.id)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer group transition-colors ${
                isActive ? "bg-sky-50/50" : "hover:bg-slate-50"
              }`}
            >
              {/* Marker number */}
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: m.hex, color: textColor }}
              >
                {m.id}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {m.assignedPaint ? (
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {m.assignedPaint.brand} {m.assignedPaint.code}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      {m.assignedPaint.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No paint assigned
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400">
                  {m.hex}
                </span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <span className="text-[10px] text-sky-500 font-medium uppercase tracking-wider shrink-0">
                  Active
                </span>
              )}

              {/* Remove */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveMarker(m.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 shrink-0"
                title="Remove marker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
