"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import type { Damage, BoundingBox } from "@/lib/types";

interface DamageAnnotatorProps {
  imageUrl: string;
  annotatedImageUrl?: string;
  agentAnnotatedImageUrl?: string;
  damages: Damage[];
  annotationMode?: boolean;
  onBoundingBoxComplete?: (box: BoundingBox) => void;
  onSaveAnnotatedImage?: (imageDataUrl: string) => void;
  estimateSource?: "AI only" | "Edited by claims agent" | "Claims agent only";
  pendingBoundingBox?: BoundingBox | null;
  onRevertToAIImage?: () => void;
}

export function DamageAnnotator({
  imageUrl,
  annotatedImageUrl,
  agentAnnotatedImageUrl,
  damages,
  annotationMode = false,
  onBoundingBoxComplete,
  onSaveAnnotatedImage,
  estimateSource = "AI only",
  pendingBoundingBox = null,
  onRevertToAIImage,
}: DamageAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);

  // Determine which image to show: agent-annotated, then AI annotated, then raw
  const getDisplayUrl = () => {
    if (agentAnnotatedImageUrl) {
      return agentAnnotatedImageUrl;
    }
    if (annotatedImageUrl) {
      return annotatedImageUrl;
    }
    return imageUrl;
  };

  const displayUrl = getDisplayUrl();
  const hasAgentEdits =
    estimateSource === "Edited by claims agent" ||
    estimateSource === "Claims agent only";

  const getPercentCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!annotationMode || !onBoundingBoxComplete || !containerRef.current)
        return;
      e.preventDefault();
      const coords = getPercentCoords(e.clientX, e.clientY);
      if (!coords) return;
      setIsDrawing(true);
      setDrawStart(coords);
      setCurrentBox({
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
      });
    },
    [annotationMode, onBoundingBoxComplete, getPercentCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !drawStart || !containerRef.current) return;
      const coords = getPercentCoords(e.clientX, e.clientY);
      if (!coords) return;

      const x = Math.min(drawStart.x, coords.x);
      const y = Math.min(drawStart.y, coords.y);
      const width = Math.abs(coords.x - drawStart.x);
      const height = Math.abs(coords.y - drawStart.y);

      setCurrentBox({ x, y, width, height });
    },
    [isDrawing, drawStart, getPercentCoords]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !currentBox || !onBoundingBoxComplete) return;
      e.preventDefault();

      // Only complete if box has minimum size
      if (currentBox.width > 1 && currentBox.height > 1) {
        onBoundingBoxComplete(currentBox);
      }

      setIsDrawing(false);
      setDrawStart(null);
      setCurrentBox(null);
    },
    [isDrawing, currentBox, onBoundingBoxComplete]
  );

  const handleSaveImage = useCallback(() => {
    if (!containerRef.current || !onSaveAnnotatedImage) return;

    const container = containerRef.current;
    const img = container.querySelector("img");
    if (!img) return;

    // Create canvas to capture the annotated image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use natural image dimensions for better quality
    const tempImg = new window.Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.onload = () => {
      // Set canvas to image dimensions
      canvas.width = tempImg.naturalWidth;
      canvas.height = tempImg.naturalHeight;

      // Draw the image at full size
      ctx.drawImage(tempImg, 0, 0);

      // Draw bounding boxes
      damages.forEach((d) => {
        if (d.boundingBox) {
          const x = (d.boundingBox.x / 100) * canvas.width;
          const y = (d.boundingBox.y / 100) * canvas.height;
          const width = (d.boundingBox.width / 100) * canvas.width;
          const height = (d.boundingBox.height / 100) * canvas.height;

          // Draw rectangle border
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = Math.max(3, canvas.width / 200);
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, width, height);

          // Draw semi-transparent fill
          ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
          ctx.fillRect(x, y, width, height);

          // Draw label background
          const labelText = `${d.type}`;
          ctx.font = `${Math.max(14, canvas.width / 50)}px Arial`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          const textMetrics = ctx.measureText(labelText);
          const textHeight = Math.max(14, canvas.width / 50);
          const padding = 4;

          ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
          ctx.fillRect(
            x,
            y - textHeight - padding * 2,
            textMetrics.width + padding * 2,
            textHeight + padding * 2
          );

          // Draw label text
          ctx.fillStyle = "#000";
          ctx.fillText(labelText, x + padding, y - textHeight - padding);
        } else if (d.markerPosition) {
          // Legacy marker support
          const x = (d.markerPosition.x / 100) * canvas.width;
          const y = (d.markerPosition.y / 100) * canvas.height;
          const radius = Math.max(8, canvas.width / 50);
          ctx.fillStyle = "rgba(251, 191, 36, 0.8)";
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = Math.max(2, canvas.width / 200);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onSaveAnnotatedImage(dataUrl);
    };
    tempImg.onerror = () => {
      console.error("Failed to load image for saving");
    };
    tempImg.src = displayUrl;
  }, [damages, displayUrl, onSaveAnnotatedImage]);

  const damagesWithBoxes = damages.filter(
    (d) => d.boundingBox || d.markerPosition
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {estimateSource !== "AI only" && (
            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {estimateSource}
            </span>
          )}
          {agentAnnotatedImageUrl && (
            <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              ✓ Edited by Claims Agent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {agentAnnotatedImageUrl && onRevertToAIImage && (
            <button
              type="button"
              onClick={onRevertToAIImage}
              className="rounded border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700"
              title="Revert to AI annotated image"
            >
              Revert to AI Image
            </button>
          )}
          {onSaveAnnotatedImage && hasAgentEdits && (
            <button
              type="button"
              onClick={handleSaveImage}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={damagesWithBoxes.length === 0}
              title={
                damagesWithBoxes.length === 0
                  ? "Add annotations to save image"
                  : "Save annotated image with rectangles"
              }
            >
              {agentAnnotatedImageUrl ? "Update Image" : "Save Annotated Image"}
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          // Cancel drawing if mouse leaves
          if (isDrawing) {
            setIsDrawing(false);
            setDrawStart(null);
            setCurrentBox(null);
          }
        }}
        className={`relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${
          annotationMode
            ? "cursor-crosshair ring-2 ring-blue-500 ring-offset-2"
            : ""
        }`}
      >
        {displayUrl.startsWith("data:") ? (
          <img
            src={displayUrl}
            alt="Vehicle damage"
            className="pointer-events-none h-full w-full object-contain"
          />
        ) : (
          <Image
            src={displayUrl}
            alt="Vehicle damage"
            fill
            className="pointer-events-none object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        )}
        {annotationMode && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
              Click and drag to draw rectangle
            </span>
          </div>
        )}
        {/* Draw existing bounding boxes */}
        {damages.map((d, i) => {
          if (d.boundingBox) {
            return (
              <div
                key={i}
                className="absolute border-2 border-amber-500 bg-amber-400/20"
                style={{
                  left: `${d.boundingBox.x}%`,
                  top: `${d.boundingBox.y}%`,
                  width: `${d.boundingBox.width}%`,
                  height: `${d.boundingBox.height}%`,
                }}
                title={`${d.type} — ${d.location}`}
              >
                <div className="absolute -top-6 left-0 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">
                  {d.type}
                </div>
              </div>
            );
          }
          // Legacy marker support
          if (d.markerPosition) {
            return (
              <div
                key={i}
                className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500 bg-amber-400/80 shadow-md"
                style={{
                  left: `${d.markerPosition.x}%`,
                  top: `${d.markerPosition.y}%`,
                }}
                title={`${d.type} — ${d.location}`}
              />
            );
          }
          return null;
        })}
        {/* Draw current rectangle being drawn (while dragging) */}
        {currentBox && currentBox.width > 0 && currentBox.height > 0 && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-400/20"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`,
            }}
          />
        )}
        {/* Draw pending bounding box (set but not yet added to damage) */}
        {pendingBoundingBox &&
          pendingBoundingBox.width > 0 &&
          pendingBoundingBox.height > 0 && (
            <div
              className="absolute border-2 border-emerald-500 bg-emerald-400/30"
              style={{
                left: `${pendingBoundingBox.x}%`,
                top: `${pendingBoundingBox.y}%`,
                width: `${pendingBoundingBox.width}%`,
                height: `${pendingBoundingBox.height}%`,
              }}
            >
              <div className="absolute -top-6 left-0 rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-medium text-white">
                New
              </div>
            </div>
          )}
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Damages ({damages.length})
        </p>
        <ul className="space-y-1.5 text-sm">
          {damages.map((d, i) => (
            <li
              key={i}
              className="flex justify-between text-gray-700 dark:text-gray-300"
            >
              <span>
                {d.type} — {d.location}
                {(d.boundingBox || d.markerPosition) && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    ●
                  </span>
                )}
              </span>
              <span className="font-medium">
                ${d.estimatedCost.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
