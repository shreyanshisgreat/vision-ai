import React from 'react';
import { Bot, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({ backendStatus }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Conversational Image Recognition Chatbot
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Phase 1
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Upload an image and interact with it using natural language.
            </p>
          </div>
        </div>

        {/* Backend Status indicator */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
          {backendStatus === 'online' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vision Model Ready (YOLOv8)</span>
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
    </header>
  );
}
