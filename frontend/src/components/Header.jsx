import React, { useState } from 'react';
import { Bot, CheckCircle2, AlertCircle, HelpCircle, X, Cpu, Eye, MessageSquareText } from 'lucide-react';

export default function Header({ backendStatus }) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Conversational Image Recognition Chatbot
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Phase 3: YOLOv8s + VLM
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Structured object detection + conversational vision-language understanding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* How It Works Button */}
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>How It Works</span>
            </button>

            {/* Backend Status indicator */}
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              {backendStatus === 'online' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>YOLOv8s + VLM Ready</span>
                </>
              ) : backendStatus === 'checking' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Backend Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Modal (Explainability Feature - Part 7) */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">How This System Works</h3>
                  <p className="text-xs text-slate-400">YOLOv8 Structured Detection + Multimodal VLM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">1. Structured Object Detection (YOLOv8s)</h4>
                  <p className="text-slate-400 mt-1">
                    YOLOv8s scans the uploaded image to locate everyday objects from its fixed 80 MS COCO classes (e.g. person, laptop, chair, bottle). It yields precise pixel bounding boxes and detection confidence scores.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">2. Vision-Language Understanding (VLM)</h4>
                  <p className="text-slate-400 mt-1">
                    The Vision-Language Model interprets open-vocabulary objects outside COCO-80 (such as calculators, stationery, notebooks, or tools) and answers conversational questions about activities, visual context, and spatial arrangements.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">3. Conversational Context & Honesty</h4>
                  <p className="text-slate-400 mt-1">
                    The system maintains conversational memory across follow-up questions for the active image. When an object is unclear or outside the frame, the assistant states uncertainty honestly rather than hallucinating.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
