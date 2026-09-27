import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Loader2, MessageSquare, Layers, Cpu } from 'lucide-react';

export default function ChatSection({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  detectedLabels = [],
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = inputValue.trim();
    if (!clean || isLoading) return;
    onSendMessage(clean);
    setInputValue('');
  };

  const handleQuickQuestion = (question) => {
    if (isLoading) return;
    onSendMessage(question);
  };

  // UI starter suggestions as requested
  const suggestions = [
    "What's in this image?",
    "Where is the object?",
    "What is the person doing?",
    "What text can you see?",
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[500px] max-h-[640px]">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-850/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Conversation
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                Gemini Vision
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Ask natural-language questions about objects, context, and activities
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-300 border border-slate-700/80 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Clear conversation history while keeping image"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">Ask anything about this image</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
              Gemini provides conversational visual understanding for open-ended questions, while YOLOv8s provides supporting technical object localization.
            </p>

            {/* Quick Starter Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(suggestion)}
                  disabled={isLoading}
                  className="text-xs px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-200 border border-slate-700/80 hover:border-indigo-500/50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>"{suggestion}"</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/80 border border-slate-700/70 text-slate-100 rounded-tl-xs shadow-sm flex flex-col gap-2'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Engine Source Badge */}
                  {!isUser && msg.source && (
                    <div className="flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-700/50">
                      {msg.source === 'gemini_multimodal_api' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-medium text-indigo-300">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                          Gemini Vision
                        </span>
                      ) : msg.source === 'openai_multimodal_api' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-medium text-emerald-300">
                          OpenAI Vision
                        </span>
                      ) : msg.source === 'yolo_vlm_hybrid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/40 text-[10px] font-medium text-slate-300">
                          <Layers className="w-2.5 h-2.5 text-slate-400" />
                          Local Hybrid Engine
                        </span>
                      ) : msg.source === 'vlm_vision_engine' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/40 text-[10px] font-medium text-slate-300">
                          <Cpu className="w-2.5 h-2.5 text-slate-400" />
                          Local Vision Fallback
                        </span>
                      ) : msg.source === 'yolo_structured' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/40 text-[10px] font-medium text-slate-300">
                          <Layers className="w-2.5 h-2.5 text-slate-400" />
                          YOLOv8s Structured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/40 text-[10px] font-medium text-slate-300">
                          {msg.source}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-300 flex items-center gap-2.5 shadow-sm">
              <span className="text-slate-300">Gemini is analyzing your image</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-3" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips above input if conversation has started */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
          <span className="shrink-0 text-slate-500 text-[10px] uppercase font-semibold">Suggested:</span>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickQuestion(suggestion)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 transition cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-3.5 bg-slate-850/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask anything about this image..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs sm:text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          title="Send Question"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
