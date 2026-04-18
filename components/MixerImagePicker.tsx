"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Crosshair, Download, ImageOff } from "lucide-react";
import { rgbToHex, sampleRegion } from "@/lib/colorMath";
import { compressImageForStorage } from "@/lib/imageCompression";

type Marker = { x: number; y: number; hex: string };

type Props = {
  onPick: (hex: string, x: number, y: number) => void;
  pickEnabled?: boolean;
  onRequestPick?: () => void;
  marker?: Marker | null;
  onImageLoaded?: (img: HTMLImageElement | null) => void;
  onExport?: () => void;
  canExport?: boolean;
};


const ZOOM_LEVEL = 4;
const LOUPE_SIZE = 120;

export default function MixerImagePicker({ onPick, pickEnabled = true, onRequestPick, marker = null, onImageLoaded, onExport, canExport = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDataRef = useRef<HTMLImageElement | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [loupe, setLoupe] = useState<{ visible: boolean; x: number; y: number; hex: string }>({
    visible: false, x: 0, y: 0, hex: "#000000",
  });

  const drawCrosshair = useCallback((ctx: CanvasRenderingContext2D, m: Marker, canvasW: number, canvasH: number) => {
    const s = Math.max(canvasW, canvasH) / 800;
    const r = 28 * s;
    const crossLen = 14 * s;
    ctx.beginPath(); ctx.arc(m.x, m.y, r + 3 * s, 0, 2 * Math.PI); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4 * s; ctx.stroke();
    ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, 2 * Math.PI); ctx.strokeStyle = m.hex; ctx.lineWidth = 5 * s; ctx.stroke();
    ctx.beginPath(); ctx.arc(m.x, m.y, r + 5 * s, 0, 2 * Math.PI); ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1.5 * s; ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * s; ctx.beginPath();
    ctx.moveTo(m.x, m.y - r - crossLen); ctx.lineTo(m.x, m.y - r + 2 * s);
    ctx.moveTo(m.x, m.y + r - 2 * s); ctx.lineTo(m.x, m.y + r + crossLen);
    ctx.moveTo(m.x - r - crossLen, m.y); ctx.lineTo(m.x - r + 2 * s, m.y);
    ctx.moveTo(m.x + r - 2 * s, m.y); ctx.lineTo(m.x + r + crossLen, m.y); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1 * s; ctx.beginPath();
    ctx.moveTo(m.x, m.y - r - crossLen); ctx.lineTo(m.x, m.y - r + 2 * s);
    ctx.moveTo(m.x, m.y + r - 2 * s); ctx.lineTo(m.x, m.y + r + crossLen);
    ctx.moveTo(m.x - r - crossLen, m.y); ctx.lineTo(m.x - r + 2 * s, m.y);
    ctx.moveTo(m.x + r - 2 * s, m.y); ctx.lineTo(m.x + r + crossLen, m.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(m.x, m.y, 3.5 * s, 0, 2 * Math.PI); ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1 * s; ctx.stroke();
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageDataRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    if (marker) drawCrosshair(ctx, marker, canvas.width, canvas.height);
  }, [marker, drawCrosshair]);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const maxWidth = Math.min(800, container.clientWidth);
    const scale = maxWidth / img.width;
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = `${img.width * scale}px`;
    canvas.style.height = `${img.height * scale}px`;
    imageDataRef.current = img;
    setHasImage(true);
    setImageVersion((v) => v + 1);
    onImageLoaded?.(img);
  }, [onImageLoaded]);

  const loadImageFromSrc = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => drawImage(img);
    img.src = src;
  }, [drawImage]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Display full-resolution original
      loadImageFromSrc(dataUrl);
      // Persist a compressed copy (JPEG, <=1600px long side) so it fits in localStorage
      compressImageForStorage(dataUrl)
        .then((compressed) => {
          try { localStorage.setItem("modkitswatch_mix_image", compressed); }
          catch { /* quota still exceeded — drop persistence, in-memory image still works */ }
        })
        .catch(() => { /* compression failed — skip persistence */ });
    };
    reader.readAsDataURL(file);
  }, [loadImageFromSrc]);

  useEffect(() => {
    const stored = localStorage.getItem("modkitswatch_mix_image");
    if (stored) loadImageFromSrc(stored);
  }, [loadImageFromSrc]);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const handleResize = () => { if (imageDataRef.current) drawImage(imageDataRef.current); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawImage]);

  // Redraw whenever marker or image changes (imageVersion bumps on every new image load / resize)
  useEffect(() => {
    if (hasImage) drawScene();
  }, [hasImage, imageVersion, drawScene]);

  const drawLoupeToCanvas = useCallback((imgX: number, imgY: number) => {
    const canvasEl = loupeCanvasRef.current;
    const img = imageDataRef.current;
    if (!canvasEl || !img) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const srcSize = LOUPE_SIZE / ZOOM_LEVEL;
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(LOUPE_SIZE / 2, LOUPE_SIZE / 2, LOUPE_SIZE / 2, 0, 2 * Math.PI);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, imgX - srcSize / 2, imgY - srcSize / 2, srcSize, srcSize, 0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 0.5;
    for (let i = ZOOM_LEVEL; i < LOUPE_SIZE; i += ZOOM_LEVEL) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, LOUPE_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(LOUPE_SIZE, i); ctx.stroke();
    }
    const center = LOUPE_SIZE / 2;
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    ctx.strokeRect(center - ZOOM_LEVEL / 2 - 1, center - ZOOM_LEVEL / 2 - 1, ZOOM_LEVEL + 2, ZOOM_LEVEL + 2);
    ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
    ctx.strokeRect(center - ZOOM_LEVEL / 2 - 1, center - ZOOM_LEVEL / 2 - 1, ZOOM_LEVEL + 2, ZOOM_LEVEL + 2);
    ctx.beginPath(); ctx.arc(center, center, LOUPE_SIZE / 2 - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.stroke();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pickEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas || !imageDataRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imgX = Math.floor((e.clientX - rect.left) * scaleX);
    const imgY = Math.floor((e.clientY - rect.top) * scaleY);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = imageDataRef.current.width;
    tmpCanvas.height = imageDataRef.current.height;
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx) return;
    tmpCtx.drawImage(imageDataRef.current, 0, 0);
    const pixel = tmpCtx.getImageData(imgX, imgY, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setLoupe({ visible: true, x: e.clientX - containerRect.left, y: e.clientY - containerRect.top, hex });
    drawLoupeToCanvas(imgX, imgY);
  }, [drawLoupeToCanvas, pickEnabled]);

  const handleMouseLeave = useCallback(() => setLoupe((p) => ({ ...p, visible: false })), []);

  const pickAt = useCallback((clientX: number, clientY: number) => {
    if (!pickEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas || !imageDataRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Redraw clean image (strip any existing crosshair) before sampling
    ctx.drawImage(imageDataRef.current, 0, 0);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);
    const { hex } = sampleRegion(ctx, x, y, 3);
    onPick(hex, x, y);
    setLoupe((p) => ({ ...p, visible: false }));
  }, [onPick, pickEnabled]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    pickAt(e.clientX, e.clientY);
  }, [pickAt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: TouchEvent) => {
      if (!pickEnabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      pickAt(touch.clientX, touch.clientY);
    };
    canvas.addEventListener("touchstart", handler, { passive: false });
    return () => canvas.removeEventListener("touchstart", handler);
  }, [pickAt, pickEnabled]);

  const loupeHexStyle = (hex: string) => ({
    backgroundColor: hex,
    color:
      parseInt(hex.slice(1, 3), 16) * 0.299 +
      parseInt(hex.slice(3, 5), 16) * 0.587 +
      parseInt(hex.slice(5, 7), 16) * 0.114 > 128 ? "#000" : "#fff",
  });

  return (
    <div ref={containerRef} className="w-full relative overflow-visible">
      {!hasImage && (
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            isDragging ? "border-sky-400 bg-sky-50/50" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-sm text-slate-700">Drop a reference image here</p>
            <p className="text-xs text-slate-400">or click to browse (JPEG, PNG, WebP)</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <div className={`${!hasImage ? "hidden" : "inline-block"} relative`}>
        {!pickEnabled && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-slate-900/5 pointer-events-none" />
        )}
        <canvas
          ref={canvasRef}
          className="rounded-2xl block"
          onClick={pickEnabled ? handleCanvasClick : undefined}
          onMouseMove={pickEnabled ? handleMouseMove : undefined}
          onMouseLeave={handleMouseLeave}
          style={{ touchAction: pickEnabled && isTouchDevice ? "none" : "auto", cursor: pickEnabled ? "crosshair" : "default" }}
        />
        <div className="absolute top-3 right-3 flex gap-2 z-20">
          {onExport && canExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 bg-slate-900/75 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
          {!pickEnabled && onRequestPick && (
            <button
              onClick={onRequestPick}
              className="inline-flex items-center gap-1.5 bg-slate-900/75 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Re-pick target
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-900/75 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
          >
            Change Image
          </button>
          <button
            onClick={() => {
              imageDataRef.current = null;
              setHasImage(false);
              setImageVersion((v) => v + 1);
              try { localStorage.removeItem("modkitswatch_mix_image"); } catch {}
              onImageLoaded?.(null);
            }}
            className="inline-flex items-center gap-1.5 bg-slate-900/75 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
            title="Remove image"
          >
            <ImageOff className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      </div>

      {loupe.visible && (
        <div className="pointer-events-none absolute z-10"
          style={{ left: loupe.x - LOUPE_SIZE / 2, top: loupe.y - LOUPE_SIZE - 30, width: LOUPE_SIZE, height: LOUPE_SIZE + 24 }}>
          <canvas ref={loupeCanvasRef} width={LOUPE_SIZE} height={LOUPE_SIZE} className="rounded-full"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
          <div className="text-center text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded-full mx-auto w-fit"
            style={loupeHexStyle(loupe.hex)}>{loupe.hex}</div>
        </div>
      )}
    </div>
  );
}
