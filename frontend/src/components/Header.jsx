import React, { useState } from 'react';
import { Eye, Sparkles, CheckCircle2, AlertCircle, HelpCircle, X, Cpu, MessageSquareText, Layers } from 'lucide-react';

export default function Header({ backendStatus }) {
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Product Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                Vision<span className="text-indigo-400">AI</span>
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-700/80 pl-2.5 font-medium">
                Conversational Image Intelligence
              </span>
            </div>
          </div>

          {/* Right Status & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gemini Vision Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden xs:inline">Gemini Vision</span>
              <span className="xs:hidden">Gemini</span>
            </div>

            {/* Backend Connectivity Status */}
            <div className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-400">
              {backendStatus === 'online' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : backendStatus === 'checking' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* About / Info Modal Button */}
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">About</span>
            </button>
          </div>
        </div>
      </header>

      {/* About VisionAI Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">About VisionAI</h3>
                  <p className="text-xs text-slate-400">Conversational Image Intelligence Architecture</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">Multimodal Visual Understanding (Gemini)</h4>
                  <p className="text-slate-400 mt-1">
                    Powered by Google Gemini multimodal vision. Interprets open-ended scenes, objects outside standard taxonomies (such as calculators, stationery, or tools), contextual activities, and spatial relationships.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">Supporting Technical Detector (YOLOv8s)</h4>
                  <p className="text-slate-400 mt-1">
                    YOLOv8s provides supporting technical detection for 80 common MS COCO categories. Bounding boxes and confidence metrics are available in the collapsible technical panel.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">Grounded Dialogue & Continuity</h4>
                  <p className="text-slate-400 mt-1">
                    Maintains conversation memory across multi-turn follow-up questions for the active image session, honestly stating uncertainty when evidence is ambiguous.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
