"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Crosshair, Lock, Unlock } from "lucide-react";
import { rgbToHex } from "@/lib/colorMath";

type Props = {
  onColorPick: (hex: string) => void;
};

const ZOOM_LEVEL = 4;
const LOUPE_SIZE = 120;

export default function ImageCanvas({ onColorPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [pickMode, setPickMode] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [loupe, setLoupe] = useState<{
    visible: boolean;
    x: number;
    y: number;
    hex: string;
  }>({ visible: false, x: 0, y: 0, hex: "#000000" });
  const imageDataRef = useRef<HTMLImageElement | null>(null);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = containerRef.current;
    if (!container) return;

    const maxWidth = Math.min(800, container.clientWidth);
    const scale = maxWidth / img.width;
    const width = img.width * scale;
    const height = img.height * scale;

    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    imageDataRef.current = img;
    setHasImage(true);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          drawImage(img);
          setMarker(null);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [drawImage]
  );

  const drawMarker = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, hex: string) => {
      if (imageDataRef.current) {
        ctx.drawImage(imageDataRef.current, 0, 0);
      }

      const r = 16;
      const crossLen = 8;

      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.strokeStyle = hex;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r + 3.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - r - crossLen);
      ctx.lineTo(x, y - r + 2);
      ctx.moveTo(x, y + r - 2);
      ctx.lineTo(x, y + r + crossLen);
      ctx.moveTo(x - r - crossLen, y);
      ctx.lineTo(x - r + 2, y);
      ctx.moveTo(x + r - 2, y);
      ctx.lineTo(x + r + crossLen, y);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - r - crossLen);
      ctx.lineTo(x, y - r + 2);
      ctx.moveTo(x, y + r - 2);
      ctx.lineTo(x, y + r + crossLen);
      ctx.moveTo(x - r - crossLen, y);
      ctx.lineTo(x - r + 2, y);
      ctx.moveTo(x + r - 2, y);
      ctx.lineTo(x + r + crossLen, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    []
  );

  const drawLoupe = useCallback(
    (imgX: number, imgY: number) => {
      const loupeCanvas = loupeCanvasRef.current;
      const img = imageDataRef.current;
      if (!loupeCanvas || !img) return;

      const ctx = loupeCanvas.getContext("2d");
      if (!ctx) return;

      const srcSize = LOUPE_SIZE / ZOOM_LEVEL;

      ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);

      // Save and clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(LOUPE_SIZE / 2, LOUPE_SIZE / 2, LOUPE_SIZE / 2, 0, 2 * Math.PI);
      ctx.clip();

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        imgX - srcSize / 2,
        imgY - srcSize / 2,
        srcSize,
        srcSize,
        0,
        0,
        LOUPE_SIZE,
        LOUPE_SIZE
      );

      ctx.restore();

      // Grid lines
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      const pixelSize = ZOOM_LEVEL;
      for (let i = pixelSize; i < LOUPE_SIZE; i += pixelSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, LOUPE_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(LOUPE_SIZE, i);
        ctx.stroke();
      }

      // Center crosshair
      const center = LOUPE_SIZE / 2;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        center - pixelSize / 2 - 1,
        center - pixelSize / 2 - 1,
        pixelSize + 2,
        pixelSize + 2
      );
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        center - pixelSize / 2 - 1,
        center - pixelSize / 2 - 1,
        pixelSize + 2,
        pixelSize + 2
      );

      // Border ring
      ctx.beginPath();
      ctx.arc(center, center, LOUPE_SIZE / 2 - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center, center, LOUPE_SIZE / 2 + 0.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !imageDataRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const imgX = Math.floor((e.clientX - rect.left) * scaleX);
      const imgY = Math.floor((e.clientY - rect.top) * scaleY);

      // Read pixel from original image via a temp canvas
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = imageDataRef.current.width;
      tmpCanvas.height = imageDataRef.current.height;
      const tmpCtx = tmpCanvas.getContext("2d");
      if (!tmpCtx) return;
      tmpCtx.drawImage(imageDataRef.current, 0, 0);
      const pixel = tmpCtx.getImageData(imgX, imgY, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

      // Position loupe relative to container
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const loupeX = e.clientX - containerRect.left;
      const loupeY = e.clientY - containerRect.top;

      setLoupe({ visible: true, x: loupeX, y: loupeY, hex });
      drawLoupe(imgX, imgY);
    },
    [drawLoupe]
  );

  const handleMouseLeave = useCallback(() => {
    setLoupe((prev) => ({ ...prev, visible: false }));
  }, []);

  const pickColor = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (imageDataRef.current) {
        ctx.drawImage(imageDataRef.current, 0, 0);
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((clientX - rect.left) * scaleX);
      const y = Math.floor((clientY - rect.top) * scaleY);

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      onColorPick(hex);
      drawMarker(ctx, x, y, hex);
      setMarker({ x, y });
    },
    [onColorPick, drawMarker]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      pickColor(e.clientX, e.clientY);
    },
    [pickColor]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!pickMode) return; // allow normal scroll when pick mode is off
      e.preventDefault();
      const touch = e.touches[0];
      pickColor(touch.clientX, touch.clientY);
    },
    [pickColor, pickMode]
  );

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (imageDataRef.current) {
        drawImage(imageDataRef.current);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawImage]);

  return (
    <div ref={containerRef} className="w-full relative overflow-visible">
      {!hasImage && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-sky-400 bg-sky-50/50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-1">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-sm text-slate-700">
              Drop your reference image here
            </p>
            <p className="text-xs text-slate-400">
              or click to browse (JPEG, PNG, WebP)
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div className={`${!hasImage ? "hidden" : "inline-block"} relative`}>
        {/* Pick mode overlay for touch devices */}
        {isTouchDevice && !pickMode && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-black/5 pointer-events-none" />
        )}
        <canvas
          ref={canvasRef}
          className={`rounded-2xl block ${pickMode ? "cursor-crosshair" : "cursor-default"}`}
          onClick={pickMode ? handleCanvasClick : undefined}
          onTouchStart={handleTouchStart}
          onMouseMove={pickMode ? handleMouseMove : undefined}
          onMouseLeave={handleMouseLeave}
          style={{ touchAction: pickMode && isTouchDevice ? "none" : "auto" }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {isTouchDevice && (
            <button
              onClick={() => setPickMode(!pickMode)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm ${
                pickMode
                  ? "bg-sky-500/90 hover:bg-sky-600/90 text-white"
                  : "bg-black/50 hover:bg-black/70 text-white"
              }`}
            >
              {pickMode ? (
                <>
                  <Crosshair className="w-3.5 h-3.5" />
                  Picking
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  Scroll
                </>
              )}
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
          >
            Change Image
          </button>
        </div>
      </div>

      {/* Magnifier loupe */}
      {loupe.visible && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: loupe.x - LOUPE_SIZE / 2,
            top: loupe.y - LOUPE_SIZE - 30,
            width: LOUPE_SIZE,
            height: LOUPE_SIZE + 24,
          }}
        >
          <canvas
            ref={loupeCanvasRef}
            width={LOUPE_SIZE}
            height={LOUPE_SIZE}
            className="rounded-full"
            style={{
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
            }}
          />
          <div
            className="text-center text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded-full mx-auto w-fit"
            style={{
              backgroundColor: loupe.hex,
              color:
                parseInt(loupe.hex.slice(1, 3), 16) * 0.299 +
                parseInt(loupe.hex.slice(3, 5), 16) * 0.587 +
                parseInt(loupe.hex.slice(5, 7), 16) * 0.114 >
                128
                  ? "#000"
                  : "#fff",
            }}
          >
            {loupe.hex}
          </div>
        </div>
      )}
    </div>
  );
}
