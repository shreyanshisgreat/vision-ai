import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Info, Tag, Layers } from 'lucide-react';

export default function DetectionResults({ results }) {
  const [isTechnicalOpen, setIsTechnicalOpen] = useState(false);

  if (!results) return null;

  const { detections, unique_labels, total_detected } = results;

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  return (
    <div className="w-full bg-slate-900/70 rounded-2xl border border-slate-800/80 overflow-hidden shadow-md transition-all">
      <button
        type="button"
        onClick={() => setIsTechnicalOpen(!isTechnicalOpen)}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-850/50 transition cursor-pointer"
        aria-expanded={isTechnicalOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
                Technical Detection Details
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                COCO-80
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              YOLOv8 · COCO-80
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {total_detected > 0
              ? `${total_detected} ${total_detected === 1 ? 'detection' : 'detections'}`
              : '0 detections'}
          </span>
          <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
            {isTechnicalOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </button>

      {isTechnicalOpen && (
        <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 animate-fade-in">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              YOLOv8s provides supporting technical detection for 80 common COCO categories. These bounding boxes and confidence scores serve as supporting evidence alongside Gemini's comprehensive visual reasoning.
            </p>
          </div>

          {detections && detections.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detections.map((item, idx) => {
                  const percentage = Math.round(item.confidence * 100);
                  const progressColor =
                    percentage >= 80
                      ? 'bg-emerald-500'
                      : percentage >= 60
                      ? 'bg-indigo-500'
                      : 'bg-amber-500';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {capitalize(item.label)}
                          {item.class_id !== undefined && item.class_id !== null && (
                            <span className="text-[10px] text-slate-400 font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-750">
                              #{item.class_id}
                            </span>
                          )}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {unique_labels && unique_labels.length > 0 && (
                <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-500" />
                      COCO Categories:
                    </span>
                    {unique_labels.map((label, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                      >
                        {capitalize(label)}
                      </span>
                    ))}
                  </div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    COCO-80 Layer
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 px-3 text-center rounded-xl bg-slate-800/30 border border-slate-800 text-xs text-slate-400">
              No objects detected with sufficient confidence by YOLOv8s.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
