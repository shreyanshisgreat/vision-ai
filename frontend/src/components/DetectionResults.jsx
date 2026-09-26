import React from 'react';
import { CheckCircle2, AlertCircle, Tag, Info, Layers } from 'lucide-react';

export default function DetectionResults({ results }) {
  if (!results) return null;

  const { detections, unique_labels, total_detected } = results;

  // Capitalize first letter helper
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              Structured YOLOv8 Detections
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                COCO-80
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {total_detected > 0
                ? `${total_detected} object${total_detected === 1 ? '' : 's'} identified by the structured detection model`
                : 'Model inference completed (0 objects)'}
            </p>
          </div>
        </div>

        {total_detected > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
            {total_detected} Detected
          </span>
        )}
      </div>

      {/* Model Confidence Notice (Addressing Part 5 Requirements) */}
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">About Detection Confidence:</strong> Confidence scores indicate how strongly the YOLOv8s detection model scored each prediction. It is a model evaluation metric, not a guaranteed real-world probability.
        </p>
      </div>

      {detections && detections.length > 0 ? (
        <div className="space-y-4">
          {/* Main Detected Objects List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {detections.map((item, idx) => {
              const percentage = Math.round(item.confidence * 100);

              // Color based on confidence tier
              const progressColor =
                percentage >= 80
                  ? 'bg-emerald-500'
                  : percentage >= 60
                  ? 'bg-indigo-500'
                  : 'bg-amber-500';

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                      {capitalize(item.label)}
                      {item.class_id !== undefined && item.class_id !== null && (
                        <span className="text-[10px] text-slate-400 font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-750">
                          #{item.class_id}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-300">
                      Detection confidence: <strong className="text-indigo-300 font-semibold">{percentage}%</strong>
                    </span>
                  </div>

                  {/* Clean readable confidence bar */}
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden mt-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean categories summary & COCO context */}
          {unique_labels && unique_labels.length > 0 && (
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  Categories:
                </span>
                {unique_labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                  >
                    {capitalize(label)}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>YOLO COCO-80 Layer</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty detection state */
        <div className="py-6 px-4 text-center rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-400/80" />
          <p className="text-sm font-medium text-slate-200">
            No objects detected with sufficient confidence by YOLOv8s.
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            YOLOv8s checks 80 standard COCO classes. Objects outside COCO (such as stationery, tools, or art) can still be recognized by the Vision-Language Model in the chat panel.
          </p>
        </div>
      )}
    </div>
  );
}
