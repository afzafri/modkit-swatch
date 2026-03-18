"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Crosshair, Unlock, Download } from "lucide-react";
import { rgbToHex, sampleRegion, hexToLab, detectMetallic } from "@/lib/colorMath";
import type { MetallicSignal } from "@/lib/colorMath";
import type { Marker } from "@/types/paint";

type Props = {
  markers: Marker[];
  activeMarkerId: number | null;
  onColorPick: (hex: string, metallicSignal: MetallicSignal, x: number, y: number, action: "new" | "reselect") => void;
  onSelectMarker: (id: number) => void;
  onRemoveMarker: (id: number) => void;
  onUpdateMarkerLabel?: (id: number, labelX: number, labelY: number) => void;
};

type LabelRect = {
  markerId: number;
  x: number; y: number; w: number; h: number; // canvas coords
};

const ZOOM_LEVEL = 4;
const LOUPE_SIZE = 120;
const MARKER_RADIUS = 28;

export default function ImageCanvas({ markers, activeMarkerId, onColorPick, onSelectMarker, onRemoveMarker, onUpdateMarkerLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const pinnedLoupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pickMode, setPickMode] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [loupe, setLoupe] = useState<{ visible: boolean; x: number; y: number; hex: string }>({
    visible: false, x: 0, y: 0, hex: "#000000",
  });
  const [pinnedLoupe, setPinnedLoupe] = useState<{
    visible: boolean; x: number; y: number; hex: string; imgX: number; imgY: number;
  }>({ visible: false, x: 0, y: 0, hex: "#000000", imgX: 0, imgY: 0 });
  const [labelRects, setLabelRects] = useState<LabelRect[]>([]);
  const imageDataRef = useRef<HTMLImageElement | null>(null);
  const paintImgCache = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const [paintImgVersion, setPaintImgVersion] = useState(0);
  const [resizeVersion, setResizeVersion] = useState(0);
  const draggingLabelRef = useRef<{ markerId: number; offsetX: number; offsetY: number } | null>(null);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = containerRef.current;
    if (!container) return;

    const maxWidth = Math.min(800, container.clientWidth);
    const scale = maxWidth / img.width;
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = `${img.width * scale}px`;
    canvas.style.height = `${img.height * scale}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    imageDataRef.current = img;
    setHasImage(true);
  }, []);

  const loadImageFromSrc = useCallback(
    (src: string) => {
      const img = new Image();
      img.onload = () => {
        drawImage(img);
        setLoupe((prev) => ({ ...prev, visible: false }));
        setPinnedLoupe((prev) => ({ ...prev, visible: false }));
      };
      img.src = src;
    },
    [drawImage]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        loadImageFromSrc(dataUrl);
        try {
          localStorage.setItem("modkitswatch_image", dataUrl);
        } catch {
          // localStorage full — silently skip
        }
      };
      reader.readAsDataURL(file);
    },
    [loadImageFromSrc]
  );

  // Preload paint images
  useEffect(() => {
    for (const m of markers) {
      if (!m.assignedPaint) continue;
      const slug = m.assignedPaint.brand.toLowerCase().replace(/[\s.]+/g, "-");
      const key = `${slug}/${m.assignedPaint.code}`;
      if (paintImgCache.current.has(key)) continue;
      const img = new Image();
      img.onload = () => { paintImgCache.current.set(key, img); setPaintImgVersion((v) => v + 1); };
      img.onerror = () => { paintImgCache.current.set(key, null); };
      img.src = `/paints/${key}.jpg`;
    }
  }, [markers]);

  // Restore image from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("modkitswatch_image");
    if (stored) loadImageFromSrc(stored);
  }, [loadImageFromSrc]);

  const drawMarkersToCtx = useCallback((ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, img: HTMLImageElement, activeId: number | null): LabelRect[] => {
    ctx.drawImage(img, 0, 0);
    const s = Math.max(canvasW, canvasH) / 800;
    const cw = canvasW;
    const ch = canvasH;
    const placedLabels: { x: number; y: number; w: number; h: number }[] = [];
    const labelRects: LabelRect[] = [];
    const dotR = 12 * s;

    for (const m of markers) {
      const isActive = m.id === activeId;
      const hasAssignment = !!m.assignedPaint;
      if (!isActive && !hasAssignment) continue;

      if (isActive && !hasAssignment) {
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
        continue;
      }
      if (!hasAssignment) continue;
      const paint = m.assignedPaint!;

      ctx.beginPath(); ctx.arc(m.x, m.y, dotR, 0, 2 * Math.PI); ctx.fillStyle = m.hex; ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * s; ctx.stroke();
      ctx.beginPath(); ctx.arc(m.x, m.y, dotR + 2 * s, 0, 2 * Math.PI); ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1 * s; ctx.stroke();

      const fontSize1 = Math.round(16 * s); const fontSize2 = Math.round(14 * s);
      const fontSizeHex = Math.round(11 * s);
      const pad = 6 * s; const lineGap = 6 * s; const cornerR = 6 * s;
      const codeLine = `${paint.brand} ${paint.code}`; const nameLine = paint.name;

      // Paint thumbnail
      const imgSlug = paint.brand.toLowerCase().replace(/[\s.]+/g, "-");
      const imgKey = `${imgSlug}/${paint.code}`;
      const paintImg = paintImgCache.current.get(imgKey) || null;
      const thumbW = paintImg ? 48 * s : 0;
      const thumbPad = paintImg ? 8 * s : 0;

      ctx.font = `bold ${fontSize1}px system-ui, sans-serif`; const codeWidth = ctx.measureText(codeLine).width;
      ctx.font = `${fontSize2}px system-ui, sans-serif`; const nameWidth = ctx.measureText(nameLine).width;
      ctx.font = `${fontSizeHex}px system-ui, sans-serif`; const hexWidth = ctx.measureText(paint.hex).width;
      const hexBadgeFullH = fontSizeHex + 6 * s;
      const textAreaW = Math.max(codeWidth, nameWidth, hexWidth + 14 * s) + pad * 2;
      const cardW = thumbW + thumbPad + textAreaW;
      const cardH = Math.max(fontSize1 + fontSize2 + hexBadgeFullH + lineGap * 2 + pad * 2, thumbW + pad * 2);
      const gap = 30 * s;

      const candidates = [
        { x: m.x + gap, y: m.y - cardH / 2 }, { x: m.x - cardW - gap, y: m.y - cardH / 2 },
        { x: m.x - cardW / 2, y: m.y - cardH - gap }, { x: m.x - cardW / 2, y: m.y + gap },
        { x: m.x + gap, y: m.y - cardH - gap }, { x: m.x - cardW - gap, y: m.y - cardH - gap },
        { x: m.x + gap, y: m.y + gap }, { x: m.x - cardW - gap, y: m.y + gap },
      ];
      let bestScore = -Infinity; let bestCand = candidates[0];
      for (const c of candidates) {
        const cx = Math.max(4 * s, Math.min(c.x, cw - cardW - 4 * s));
        const cy = Math.max(4 * s, Math.min(c.y, ch - cardH - 4 * s));
        let score = 0;
        for (const placed of placedLabels) {
          if (cx < placed.x + placed.w && cx + cardW > placed.x && cy < placed.y + placed.h && cy + cardH > placed.y) score -= 1000;
        }
        for (const other of markers) {
          if (other.id === m.id) continue;
          if (cx < other.x + dotR * 2 && cx + cardW > other.x - dotR * 2 && cy < other.y + dotR * 2 && cy + cardH > other.y - dotR * 2) score -= 500;
        }
        if (c.x === cx && c.y === cy) score += 100;
        const cardCenterX = cx + cardW / 2; const cardCenterY = cy + cardH / 2;
        score += (Math.abs(cardCenterX - cw / 2) / (cw / 2) + Math.abs(cardCenterY - ch / 2) / (ch / 2)) * 50;
        if (score > bestScore) { bestScore = score; bestCand = { x: cx, y: cy }; }
      }
      // Use user-dragged position if available, otherwise auto-position
      let cardX: number, cardY: number;
      if (m.labelX != null && m.labelY != null) {
        cardX = m.labelX;
        cardY = m.labelY;
      } else {
        cardX = Math.max(4 * s, Math.min(bestCand.x, cw - cardW - 4 * s));
        cardY = Math.max(4 * s, Math.min(bestCand.y, ch - cardH - 4 * s));
      }
      const centerCardX = cardX + cardW / 2; const centerCardY = cardY + cardH / 2;
      let lineFromX: number, lineFromY: number;
      if (m.x > centerCardX) { lineFromX = cardX + cardW; } else { lineFromX = cardX; }
      if (m.y > centerCardY) { lineFromY = cardY + cardH; } else { lineFromY = cardY; }
      placedLabels.push({ x: cardX, y: cardY, w: cardW, h: cardH });
      labelRects.push({ markerId: m.id, x: cardX, y: cardY, w: cardW, h: cardH });

      ctx.beginPath(); ctx.moveTo(lineFromX, lineFromY); ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 5 * s; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lineFromX, lineFromY); ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineWidth = 3 * s; ctx.stroke();

      // Card background
      ctx.fillStyle = "rgba(255,255,255,0.93)";
      ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, cornerR); ctx.fill();
      ctx.strokeStyle = isActive ? "rgba(56,189,248,0.8)" : "rgba(0,0,0,0.12)";
      ctx.lineWidth = isActive ? 3 * s : 1.5 * s; ctx.stroke();

      // Paint thumbnail
      const textX = cardX + thumbW + thumbPad + pad;
      if (paintImg) {
        const tX = cardX + pad; const tY = cardY + pad; const tH = cardH - pad * 2;
        ctx.save();
        ctx.beginPath(); ctx.roundRect(tX, tY, thumbW, tH, 4 * s); ctx.clip();
        ctx.fillStyle = "#ffffff"; ctx.fillRect(tX, tY, thumbW, tH);
        const aspect = paintImg.width / paintImg.height;
        let dW = thumbW, dH = tH;
        if (aspect > thumbW / tH) { dH = thumbW / aspect; } else { dW = tH * aspect; }
        ctx.drawImage(paintImg, tX + (thumbW - dW) / 2, tY + (tH - dH) / 2, dW, dH);
        ctx.restore();
        ctx.beginPath(); ctx.roundRect(tX, tY, thumbW, tH, 4 * s);
        ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 1 * s; ctx.stroke();
      }

      // Code text
      ctx.font = `bold ${fontSize1}px system-ui, sans-serif`; ctx.fillStyle = "#0f172a";
      ctx.fillText(codeLine, textX, cardY + pad + fontSize1);

      // Name text
      ctx.font = `${fontSize2}px system-ui, sans-serif`; ctx.fillStyle = "#64748b";
      ctx.fillText(nameLine, textX, cardY + pad + fontSize1 + lineGap + fontSize2);

      // Hex badge
      const paintHex = paint.hex;
      const hexY = cardY + pad + fontSize1 + lineGap + fontSize2 + lineGap;
      const hexBadgeW = hexWidth + 12 * s;
      ctx.fillStyle = paintHex;
      ctx.beginPath(); ctx.roundRect(textX, hexY, hexBadgeW, hexBadgeFullH, 3 * s); ctx.fill();
      ctx.font = `bold ${fontSizeHex}px system-ui, sans-serif`;
      const hexTextColor = parseInt(paintHex.slice(1, 3), 16) * 0.299 + parseInt(paintHex.slice(3, 5), 16) * 0.587 + parseInt(paintHex.slice(5, 7), 16) * 0.114 > 128 ? "#000000" : "#ffffff";
      ctx.fillStyle = hexTextColor;
      ctx.fillText(paintHex, textX + 6 * s, hexY + fontSizeHex + 1 * s);
    }

    return labelRects;
  }, [markers]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageDataRef.current;
    if (!canvas || !img) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const octx = offscreen.getContext("2d");
    if (!octx) return;

    // Draw image + markers with NO active highlight (null)
    drawMarkersToCtx(octx, canvas.width, canvas.height, img, null);

    // Calculate watermark size and position (70% of original)
    const wmScale = Math.max(canvas.width, canvas.height) / 800 * 0.7;
    const wmW = 320 * wmScale;
    const wmH = 62 * wmScale;
    const wmX = (canvas.width - wmW) / 2;
    const wmY = canvas.height - wmH - 16 * wmScale;

    // Sample the area where the watermark will be placed to determine brightness
    const sampleW = Math.min(Math.floor(wmW), canvas.width);
    const sampleH = Math.min(Math.floor(wmH), canvas.height);
    const sampleX = Math.max(0, Math.floor(wmX));
    const sampleY = Math.max(0, Math.floor(wmY));
    const pixelData = octx.getImageData(sampleX, sampleY, sampleW, sampleH).data;

    let rSum = 0, gSum = 0, bSum = 0;
    const pixelCount = pixelData.length / 4;
    for (let i = 0; i < pixelData.length; i += 4) {
      rSum += pixelData[i];
      gSum += pixelData[i + 1];
      bSum += pixelData[i + 2];
    }
    const avgLuminance = (rSum / pixelCount * 0.299 + gSum / pixelCount * 0.587 + bSum / pixelCount * 0.114);
    const isDark = avgLuminance < 128;

    const watermark = new Image();
    watermark.onload = () => {
      octx.globalAlpha = 0.5;
      octx.drawImage(watermark, wmX, wmY, wmW, wmH);
      octx.globalAlpha = 1;

      const link = document.createElement("a");
      link.download = "modkitswatch-export.png";
      link.href = offscreen.toDataURL("image/png");
      link.click();
    };
    watermark.src = isDark ? "/watermark-light.svg" : "/watermark.svg";
  }, [drawMarkersToCtx]);

  // Draw all markers on the canvas
  const drawAllMarkers = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageDataRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rects = drawMarkersToCtx(ctx, canvas.width, canvas.height, img, activeMarkerId);
    setLabelRects(rects);
  }, [markers, activeMarkerId, drawMarkersToCtx, paintImgVersion]);

  // Redraw markers whenever they change
  useEffect(() => {
    if (hasImage) drawAllMarkers();
  }, [markers, activeMarkerId, hasImage, drawAllMarkers, paintImgVersion, resizeVersion]);

  const drawLoupeToCanvas = useCallback(
    (canvasEl: HTMLCanvasElement | null, imgX: number, imgY: number) => {
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
      // Grid
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      for (let i = ZOOM_LEVEL; i < LOUPE_SIZE; i += ZOOM_LEVEL) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, LOUPE_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(LOUPE_SIZE, i); ctx.stroke();
      }
      // Center crosshair
      const center = LOUPE_SIZE / 2;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      ctx.strokeRect(center - ZOOM_LEVEL / 2 - 1, center - ZOOM_LEVEL / 2 - 1, ZOOM_LEVEL + 2, ZOOM_LEVEL + 2);
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
      ctx.strokeRect(center - ZOOM_LEVEL / 2 - 1, center - ZOOM_LEVEL / 2 - 1, ZOOM_LEVEL + 2, ZOOM_LEVEL + 2);
      // Border
      ctx.beginPath(); ctx.arc(center, center, LOUPE_SIZE / 2 - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(center, center, LOUPE_SIZE / 2 + 0.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1; ctx.stroke();
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
      drawLoupeToCanvas(loupeCanvasRef.current, imgX, imgY);

    },
    [drawLoupeToCanvas]
  );

  const handleMouseLeave = useCallback(() => {
    setLoupe((prev) => ({ ...prev, visible: false }));
  }, []);

  // Label dragging via canvas mouse events
  const hitTestLabel = useCallback((clientX: number, clientY: number): LabelRect | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imgX = (clientX - rect.left) * scaleX;
    const imgY = (clientY - rect.top) * scaleY;
    // Add padding for touch targets (20px in image coords)
    const pad = 20 * (Math.max(canvas.width, canvas.height) / 800);
    for (const lr of labelRects) {
      if (imgX >= lr.x - pad && imgX <= lr.x + lr.w + pad &&
          imgY >= lr.y - pad && imgY <= lr.y + lr.h + pad) {
        return lr;
      }
    }
    return null;
  }, [labelRects]);

  const handleLabelDragStart = useCallback((e: React.MouseEvent) => {
    const hit = hitTestLabel(e.clientX, e.clientY);
    if (!hit) return false;
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imgX = (e.clientX - rect.left) * scaleX;
    const imgY = (e.clientY - rect.top) * scaleY;
    draggingLabelRef.current = {
      markerId: hit.markerId,
      offsetX: imgX - hit.x,
      offsetY: imgY - hit.y,
    };
    return true;
  }, [hitTestLabel]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    // Always update cursor based on label hit
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      if (draggingLabelRef.current) {
        canvasEl.style.cursor = "grabbing";
      } else {
        const hit = hitTestLabel(e.clientX, e.clientY);
        canvasEl.style.cursor = hit ? "move" : (pickMode ? "crosshair" : "default");
      }
    }

    if (!draggingLabelRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imgX = (e.clientX - rect.left) * scaleX;
    const imgY = (e.clientY - rect.top) * scaleY;
    const newX = imgX - draggingLabelRef.current.offsetX;
    const newY = imgY - draggingLabelRef.current.offsetY;
    onUpdateMarkerLabel?.(draggingLabelRef.current.markerId, newX, newY);
  }, [onUpdateMarkerLabel, hitTestLabel, pickMode]);

  const handleContainerMouseUp = useCallback(() => {
    draggingLabelRef.current = null;
  }, []);

  // Check if click is near an existing marker
  const findNearbyMarker = useCallback(
    (imgX: number, imgY: number): Marker | null => {
      for (const m of markers) {
        const dist = Math.sqrt((m.x - imgX) ** 2 + (m.y - imgY) ** 2);
        if (dist < 40) return m;
      }
      return null;
    },
    [markers]
  );

  const resolvePickAt = useCallback(
    (clientX: number, clientY: number, action: "new" | "reselect") => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx || !imageDataRef.current) return;

      // Redraw clean image for sampling
      ctx.drawImage(imageDataRef.current, 0, 0);

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((clientX - rect.left) * scaleX);
      const y = Math.floor((clientY - rect.top) * scaleY);

      const { hex, variance } = sampleRegion(ctx, x, y, 3);
      const lab = hexToLab(hex);
      const metallicSignal = detectMetallic(lab, variance);

      onColorPick(hex, metallicSignal, x, y, action);

      // Hide loupes after picking
      setLoupe((prev) => ({ ...prev, visible: false }));
      setPinnedLoupe((prev) => ({ ...prev, visible: false }));
    },
    [onColorPick]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Check if clicking on a label (start drag)
      if (handleLabelDragStart(e)) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const imgX = Math.floor((e.clientX - rect.left) * scaleX);
      const imgY = Math.floor((e.clientY - rect.top) * scaleY);

      // Check if clicking on an existing marker
      const nearby = findNearbyMarker(imgX, imgY);
      if (nearby && nearby.id !== activeMarkerId) {
        onSelectMarker(nearby.id);
        return;
      }

      // Always create a new marker
      resolvePickAt(e.clientX, e.clientY, "new");
    },
    [markers, activeMarkerId, findNearbyMarker, resolvePickAt, onSelectMarker, handleLabelDragStart]
  );

  // Attach touchstart as non-passive so preventDefault works
  const touchHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);
  const touchDragActiveRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  touchHandlerRef.current = (e: TouchEvent) => {
    if (!pickMode) return;
    const touch = e.touches[0];
    longPressTriggeredRef.current = false;

    // Check if touching a label — start drag or long-press to remove
    const hit = hitTestLabel(touch.clientX, touch.clientY);
    if (hit) {
      e.preventDefault();
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const imgX = (touch.clientX - rect.left) * scaleX;
      const imgY = (touch.clientY - rect.top) * scaleY;
      draggingLabelRef.current = {
        markerId: hit.markerId,
        offsetX: imgX - hit.x,
        offsetY: imgY - hit.y,
      };
      touchDragActiveRef.current = true;

      // Start long-press timer (600ms) — remove marker if held without moving
      longPressTimerRef.current = setTimeout(() => {
        if (draggingLabelRef.current && !longPressTriggeredRef.current) {
          longPressTriggeredRef.current = true;
          draggingLabelRef.current = null;
          touchDragActiveRef.current = false;
          onRemoveMarker(hit.markerId);
        }
      }, 600);
      return;
    }

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imgX = Math.floor((touch.clientX - rect.left) * scaleX);
    const imgY = Math.floor((touch.clientY - rect.top) * scaleY);

    const nearby = findNearbyMarker(imgX, imgY);
    if (nearby && nearby.id !== activeMarkerId) {
      onSelectMarker(nearby.id);
      return;
    }

    // Safety: don't create new marker if tap is near any assigned marker's label
    for (const lr of labelRects) {
      const pad = 30 * (Math.max(canvas.width, canvas.height) / 800);
      if (imgX >= lr.x - pad && imgX <= lr.x + lr.w + pad &&
          imgY >= lr.y - pad && imgY <= lr.y + lr.h + pad) {
        // Tapped on/near a label — select that marker instead
        onSelectMarker(lr.markerId);
        return;
      }
    }

    resolvePickAt(touch.clientX, touch.clientY, "new");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: TouchEvent) => touchHandlerRef.current?.(e);
    const moveHandler = (e: TouchEvent) => {
      // Cancel long-press if finger moves (user is dragging, not holding)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (!draggingLabelRef.current || longPressTriggeredRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const imgX = (touch.clientX - rect.left) * scaleX;
      const imgY = (touch.clientY - rect.top) * scaleY;
      const newX = imgX - draggingLabelRef.current.offsetX;
      const newY = imgY - draggingLabelRef.current.offsetY;
      onUpdateMarkerLabel?.(draggingLabelRef.current.markerId, newX, newY);
    };
    const endHandler = () => {
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      draggingLabelRef.current = null;
      touchDragActiveRef.current = false;
    };
    canvas.addEventListener("touchstart", handler, { passive: false });
    canvas.addEventListener("touchmove", moveHandler, { passive: false });
    canvas.addEventListener("touchend", endHandler);
    return () => {
      canvas.removeEventListener("touchstart", handler);
      canvas.removeEventListener("touchmove", moveHandler);
      canvas.removeEventListener("touchend", endHandler);
    };
  }, []);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (pinnedLoupe.visible) {
      drawLoupeToCanvas(pinnedLoupeCanvasRef.current, pinnedLoupe.imgX, pinnedLoupe.imgY);
    }
  }, [pinnedLoupe, drawLoupeToCanvas]);

  useEffect(() => {
    const handleResize = () => {
      if (imageDataRef.current) {
        drawImage(imageDataRef.current);
        setResizeVersion((v) => v + 1);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawImage]);


  const loupeHexStyle = (hex: string) => ({
    backgroundColor: hex,
    color:
      parseInt(hex.slice(1, 3), 16) * 0.299 +
      parseInt(hex.slice(3, 5), 16) * 0.587 +
      parseInt(hex.slice(5, 7), 16) * 0.114 > 128
        ? "#000" : "#fff",
  });

  return (
    <div ref={containerRef} className="w-full relative overflow-visible"
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}>
      {!hasImage && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragging ? "border-sky-400 bg-sky-50/50" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-1">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-sm text-slate-700">Drop your reference image here</p>
            <p className="text-xs text-slate-400">or click to browse (JPEG, PNG, WebP)</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />

      <div className={`${!hasImage ? "hidden" : "inline-block"} relative`}>
        {isTouchDevice && !pickMode && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-black/5 pointer-events-none" />
        )}
        <canvas
          ref={canvasRef}
          className="rounded-2xl block"
          onMouseDown={pickMode ? handleCanvasMouseDown : undefined}
          onMouseMove={pickMode ? handleMouseMove : undefined}
          onMouseLeave={handleMouseLeave}
          style={{ touchAction: pickMode && isTouchDevice ? "none" : "auto", cursor: pickMode ? "crosshair" : "default" }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {markers.filter((m) => m.assignedPaint).length > 0 && (
            <button
              onClick={exportImage}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
          >
            Change Image
          </button>
        </div>

        {/* Remove buttons on label cards (desktop only — mobile uses AssignmentsPanel) */}
        {!isTouchDevice && labelRects.map((lr) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const displayW = canvas.clientWidth;
          const displayH = canvas.clientHeight;
          const scaleX = displayW / canvas.width;
          const scaleY = displayH / canvas.height;
          const btnSize = 18;
          const dx = lr.x * scaleX + lr.w * scaleX - btnSize / 2 + 4;
          const dy = lr.y * scaleY - btnSize / 2 + 4;
          return (
            <button
              key={`rm-${lr.markerId}`}
              onClick={(e) => { e.stopPropagation(); onRemoveMarker(lr.markerId); }}
              className="absolute z-20 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
              style={{ left: dx, top: dy, width: btnSize, height: btnSize }}
              title="Remove marker"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          );
        })}

      </div>

      {/* Hover loupe */}
      {loupe.visible && (
        <div className="pointer-events-none absolute z-10"
          style={{ left: loupe.x - LOUPE_SIZE / 2, top: loupe.y - LOUPE_SIZE - 30, width: LOUPE_SIZE, height: LOUPE_SIZE + 24 }}>
          <canvas ref={loupeCanvasRef} width={LOUPE_SIZE} height={LOUPE_SIZE} className="rounded-full"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
          <div className="text-center text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded-full mx-auto w-fit"
            style={loupeHexStyle(loupe.hex)}>{loupe.hex}</div>
        </div>
      )}

      {/* Pinned loupe */}
      {pinnedLoupe.visible && (
        <div className="pointer-events-none absolute z-10"
          style={{ left: pinnedLoupe.x - LOUPE_SIZE / 2, top: pinnedLoupe.y - LOUPE_SIZE - 30, width: LOUPE_SIZE, height: LOUPE_SIZE + 24 }}>
          <canvas ref={pinnedLoupeCanvasRef} width={LOUPE_SIZE} height={LOUPE_SIZE} className="rounded-full"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))", border: "2px solid rgba(255,255,255,0.8)" }} />
          <div className="text-center text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded-full mx-auto w-fit"
            style={loupeHexStyle(pinnedLoupe.hex)}>{pinnedLoupe.hex}</div>
        </div>
      )}
    </div>
  );
}
