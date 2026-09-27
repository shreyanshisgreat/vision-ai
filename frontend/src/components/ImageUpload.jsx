import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

const SAMPLE_SCENES = [
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'Desk Electronics',
    filename: 'calculator.jpg',
    path: '/samples/calculator.jpg',
    description: 'Electronic calculator illustration',
  },
  {
    id: 'study_group',
    name: 'Study Desk',
    category: 'Multi-Object Scene',
    filename: 'study_group_desk.jpg',
    path: '/samples/study_group_desk.jpg',
    description: 'Students collaborating with laptops',
  },
  {
    id: 'man_laptop',
    name: 'Laptop & Chair',
    category: 'Transparent PNG',
    filename: 'man_laptop_chair.png',
    path: '/samples/man_laptop_chair.png',
    description: 'Workstation user with laptop',
  },
  {
    id: 'workspace',
    name: 'Workspace Scene',
    category: 'Stationery & Tech',
    filename: 'study_desk_open_vocab.jpg',
    path: '/samples/study_desk_open_vocab.jpg',
    description: 'Desk with notebook & stationery',
  },
  {
    id: 'street',
    name: 'Street Scene',
    category: 'Vehicles & People',
    filename: 'bus.jpg',
    path: '/samples/bus.jpg',
    description: 'Urban city bus with pedestrians',
  },
  {
    id: 'mobile',
    name: 'Mobile Phone',
    category: 'Handheld Device',
    filename: 'mobile_phone.jpg',
    path: '/samples/mobile_phone.jpg',
    description: 'Modern smartphone closeup',
  },
];

export default function ImageUpload({ onImageSelect, onError, onSelectSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const samplesRef = useRef(null);

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

  const scrollToSamples = (e) => {
    e.stopPropagation();
    samplesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-8 max-w-3xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 border-2 border-dashed flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 shadow-2xl shadow-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/60 hover:bg-slate-900/90 shadow-xl'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            See what's in your image.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload a photo and start a conversation with it.
          </p>
        </div>

        {/* Action Buttons inside Dropzone */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={scrollToSamples}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Try a Sample</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 pt-1">
          Supports JPEG, PNG, WebP, BMP (up to 10 MB) · Drag and drop enabled
        </p>
      </div>

      {/* Sample Scenes Showcase Grid */}
      <div ref={samplesRef} className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Or Try a Sample Scene
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any scene for instant analysis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SAMPLE_SCENES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample.path, sample.filename)}
              className="group p-2 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850/80 transition-all text-left flex flex-col gap-2 shadow-sm hover:shadow-md cursor-pointer"
            >
              {/* Thumbnail Container */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 relative">
                <img
                  src={sample.path}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-[10px] text-indigo-300 font-medium border border-slate-700/50">
                  {sample.category}
                </div>
              </div>

              {/* Title & Action */}
              <div className="px-1 pb-1 flex items-center justify-between gap-1">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {sample.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[130px] sm:max-w-[160px]">
                    {sample.description}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
