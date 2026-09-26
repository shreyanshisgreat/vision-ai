import React, { useState } from 'react';
import { X, Play, Loader2, Layers, Info } from 'lucide-react';

export default function ImagePreview({
  imageUrl,
  fileInfo,
  onAnalyze,
  onReset,
  isLoading,
  detections,
}) {
  const [showBoxes, setShowBoxes] = useState(true);

  // Format file size nicely
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full bg-slate-850 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl bg-slate-900/60">
      {/* Top Preview Bar */}
      <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-xs text-slate-300">
          <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
            {fileInfo?.name || 'Uploaded Image'}
          </span>
          {fileInfo?.size && (
            <span className="text-slate-400">({formatSize(fileInfo.size)})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {detections && detections.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBoxes(!showBoxes)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                showBoxes
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle bounding box highlights"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showBoxes ? 'Boxes: ON' : 'Boxes: OFF'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition flex items-center gap-1 disabled:opacity-50"
            title="Reset image"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Image Display with Optional Bounding Box Overlay */}
      <div className="relative flex items-center justify-center p-3 bg-slate-950/70 min-h-[260px] max-h-[480px] overflow-hidden">
        <div className="relative inline-block max-w-full max-h-[440px]">
          <img
            src={imageUrl}
            alt="Preview"
            className="rounded-lg object-contain max-h-[440px] max-w-full block mx-auto border border-slate-800"
          />

          {/* SVG Bounding Boxes Overlay (if detections available and toggled) */}
          {showBoxes && detections && detections.length > 0 && fileInfo?.width && fileInfo?.height && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
              viewBox={`0 0 ${fileInfo.width} ${fileInfo.height}`}
              preserveAspectRatio="none"
            >
              {detections.map((det, index) => {
                if (!det.box) return null;
                const { x1, y1, x2, y2 } = det.box;
                const width = Math.max(0, x2 - x1);
                const height = Math.max(0, y2 - y1);
                const colors = [
                  { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)' },
                  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' },
                  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
                  { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)' },
                  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' },
                ];
                const color = colors[index % colors.length];

                return (
                  <g key={index}>
                    <rect
                      x={x1}
                      y={y1}
                      width={width}
                      height={height}
                      fill={color.fill}
                      stroke={color.stroke}
                      strokeWidth="3"
                      rx="4"
                    />
                    {/* Label background badge */}
                    <rect
                      x={x1}
                      y={Math.max(0, y1 - 22)}
                      width={Math.min(width, (det.label.length + 5) * 10)}
                      height="20"
                      fill={color.stroke}
                      rx="3"
                    />
                    <text
                      x={x1 + 4}
                      y={Math.max(14, y1 - 8)}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {det.label} {Math.round(det.confidence * 100)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Loading scan overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center gap-3 p-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Analyzing Image...</p>
                <p className="text-xs text-indigo-300/80">Running YOLOv8 pretrained vision model</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action / Analyze Bar */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Click "Analyze Image" to detect objects and generate visual insights.</span>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Analyze Image</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
