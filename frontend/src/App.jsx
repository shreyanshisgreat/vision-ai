import React, { useState, useEffect } from 'react';
import { Bot, User, Send, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ImagePreview from './components/ImagePreview';
import DetectionResults from './components/DetectionResults';
import { analyzeImage, checkBackendHealth } from './services/api';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend health on mount
  useEffect(() => {
    async function verifyHealth() {
      const res = await checkBackendHealth();
      if (res && res.status === 'healthy') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle image selection
  const handleImageSelect = (file) => {
    setErrorMessage(null);
    setAnalysisResults(null);
    setSelectedFile(file);

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    // Read image dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  // Handle sample image click
  const handleSelectSample = async (samplePath, filename) => {
    try {
      setErrorMessage(null);
      const res = await fetch(samplePath);
      if (!res.ok) throw new Error('Could not load sample image');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      handleImageSelect(file);
    } catch (err) {
      setErrorMessage(`Failed to load sample image: ${err.message}`);
    }
  };

  // Run image analysis via API
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await analyzeImage(selectedFile);
      setAnalysisResults(data);
    } catch (err) {
      setErrorMessage(err.message || 'Image analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset entire state
  const handleReset = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageDimensions({ width: 0, height: 0 });
    setAnalysisResults(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sticky Top Header */}
      <Header backendStatus={backendStatus} />

      {/* Main Chat Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Validation / Processing Error</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Conversation Stream Container */}
        <div className="flex-1 flex flex-col gap-6">
          {/* 1. Bot Welcome Message */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 shadow-md max-w-2xl space-y-2">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <span>Welcome to Phase 1</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Image Understanding
                </span>
              </p>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Upload any picture and I'll analyze it using a pretrained deep-learning computer vision model (YOLOv8) to detect objects and calculate detection confidence scores.
              </p>
            </div>
          </div>

          {/* 2. Image Selection or Upload Dropzone */}
          {!selectedFile ? (
            <div className="pl-11">
              <ImageUpload
                onImageSelect={handleImageSelect}
                onError={(msg) => setErrorMessage(msg)}
                onSelectSample={handleSelectSample}
              />
            </div>
          ) : (
            <>
              {/* User Message Bubble showing selected image */}
              <div className="flex items-start justify-end gap-3">
                <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm p-3.5 text-xs text-indigo-200 shadow-md max-w-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={imagePreviewUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white truncate max-w-[180px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-indigo-300 text-[11px]">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Image ready for analysis
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Bot Response Bubble containing Preview & Results */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-4 max-w-3xl">
                  {/* Image Preview & Controls */}
                  <ImagePreview
                    imageUrl={imagePreviewUrl}
                    fileInfo={{
                      name: selectedFile.name,
                      size: selectedFile.size,
                      width: imageDimensions.width,
                      height: imageDimensions.height,
                    }}
                    onAnalyze={handleAnalyze}
                    onReset={handleReset}
                    isLoading={isLoading}
                    detections={analysisResults?.detections}
                  />

                  {/* Detected Objects Section */}
                  {analysisResults && (
                    <div className="animate-fade-in">
                      <DetectionResults results={analysisResults} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Conversational Chatbot Input Bar (Phase 2 Roadmap Preview) */}
        <div className="border-t border-slate-800 pt-4 mt-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              disabled
              placeholder="💬 Conversational Q&A is coming in Phase 2! (Ask questions about your image)"
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-400 text-xs sm:text-sm rounded-xl py-3 pl-4 pr-12 cursor-not-allowed opacity-75 placeholder:text-slate-500"
            />
            <button
              disabled
              type="button"
              className="absolute right-2 p-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed"
              title="Phase 2 Feature"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
            <span>Phase 1 Scope: Object Recognition & Visual Understanding</span>
            <span>Phase 2 Scope: VQA & Conversational Chat</span>
          </div>
        </div>
      </main>
    </div>
  );
}
