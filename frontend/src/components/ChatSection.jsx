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

  // Dynamic suggestion chips demonstrating YOLO structured queries and VLM open-vocabulary questions
  const suggestions = [
    'What objects are visible?',
    'Is there a laptop?',
    'Is there a calculator?',
    'What is the person doing?',
    'What is next to the laptop?',
    'Is this suitable for studying?',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[460px] max-h-[620px]">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              Image Conversation
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/60 font-medium">
                VLM Active
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
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Clear conversation history while keeping image"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Ask anything about this image</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              YOLOv8s provides structured object detection while the Vision-Language Model interprets activities, spatial relationships, and open-vocabulary objects.
            </p>

            {/* Quick Starter Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/50 transition cursor-pointer"
                >
                  "{suggestion}"
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
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-xs shadow-sm flex flex-col gap-1.5'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Engine Source Badge (Part 2 & Part 12 Explainability) */}
                  {!isUser && msg.source && (
                    <div className="flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-700/50 text-[10px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span className="font-mono">
                        {msg.source === 'gemini_multimodal_api'
                          ? 'Google Gemini 1.5 Flash (VLM)'
                          : msg.source === 'openai_multimodal_api'
                          ? 'OpenAI GPT-4o-mini (VLM)'
                          : msg.source === 'yolo_structured'
                          ? 'YOLOv8s Structured Detection'
                          : msg.source === 'vlm_vision_engine'
                          ? 'VLM Visual Understanding'
                          : 'YOLOv8s + VLM Hybrid Engine'}
                      </span>
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-slate-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing image & formulating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips below message stream if messages exist */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
          <span className="shrink-0 text-slate-500">Suggested:</span>
          {suggestions.slice(0, 4).map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickQuestion(suggestion)}
              className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-slate-850 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about this image..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0"
          title="Send Question"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
