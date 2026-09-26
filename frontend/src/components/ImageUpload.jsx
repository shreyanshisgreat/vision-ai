import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

export default function ImageUpload({ onImageSelect, onError, onSelectSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Please select a valid image file (JPEG, PNG, WebP, or BMP).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max limit is 10 MB.`);
      return;
    }

    onImageSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-indigo-500/60 bg-slate-800/40 hover:bg-slate-800/70'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <p className="text-base font-semibold text-white">
            Click to upload or drag & drop image
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports JPEG, PNG, WebP, BMP (up to 10 MB)
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
        >
          <ImageIcon className="w-4 h-4" />
          Browse Image File
        </button>
      </div>

      {/* Quick sample image presets for fast testing */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Or test with sample images:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectSample('/samples/bus.jpg', 'bus.jpg')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition hover:text-white"
          >
            🚌 Street Scene (Bus & People)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('/samples/zidane.jpg', 'zidane.jpg')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition hover:text-white"
          >
            👥 People & Clothing
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('/samples/empty_scene.jpg', 'empty_scene.jpg')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition hover:text-white"
          >
            🌌 Blank Scene (0 objects)
          </button>
        </div>
      </div>
    </div>
  );
}
