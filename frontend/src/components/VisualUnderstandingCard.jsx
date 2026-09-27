import React from 'react';
import { Sparkles } from 'lucide-react';

export default function VisualUnderstandingCard({
  summary,
  isLoading,
  hasError,
  source,
  isAnalyzed,
}) {
  return (
    <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-lg backdrop-blur-xs transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              ✨ What I See
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gemini provides conversational visual understanding of your image.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-medium text-indigo-300 shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Gemini Vision
        </span>
      </div>

      {/* Summary Content Body */}
      {(isAnalyzed || isLoading || summary || hasError) && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 animate-fade-in">
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 shadow-inner">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 py-0.5">
                <span>Gemini is looking at your image...</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-3" />
                </div>
              </div>
            ) : hasError ? (
              <p className="text-xs sm:text-sm text-slate-400 italic">
                Image summary unavailable. You can still ask questions about the image.
              </p>
            ) : summary ? (
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                {summary}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
