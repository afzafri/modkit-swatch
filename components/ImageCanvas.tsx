"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { rgbToHex } from "@/lib/colorMath";

type Props = {
  onColorPick: (hex: string) => void;
};

export default function ImageCanvas({ onColorPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
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
      // Redraw clean image
      if (imageDataRef.current) {
        ctx.drawImage(imageDataRef.current, 0, 0);
      }

      const r = 16;
      const crossLen = 8;

      // Outer white ring
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Colored ring showing picked color
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.strokeStyle = hex;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Dark outer border
      ctx.beginPath();
      ctx.arc(x, y, r + 3.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Crosshair lines
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

      // Crosshair dark shadow
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

      // Center dot
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

  const pickColor = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Redraw clean image first so we sample the original pixel
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
      e.preventDefault();
      const touch = e.touches[0];
      pickColor(touch.clientX, touch.clientY);
    },
    [pickColor]
  );

  // Handle window resize
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
    <div ref={containerRef} className="w-full">
      {!hasImage && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-zinc-300 hover:border-zinc-400"
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
            <svg
              className="w-12 h-12 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-zinc-600 font-medium">
              Drop your reference image here
            </p>
            <p className="text-zinc-400 text-sm">
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

      <div className={`relative ${!hasImage ? "hidden" : ""}`}>
        <canvas
          ref={canvasRef}
          className="cursor-crosshair rounded-lg w-full"
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
        >
          Change Image
        </button>
      </div>
    </div>
  );
}
