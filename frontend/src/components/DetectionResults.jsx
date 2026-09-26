import React from 'react';
import { CheckCircle2, AlertCircle, Tag } from 'lucide-react';

export default function DetectionResults({ results }) {
  if (!results) return null;

  const { detections, unique_labels, total_detected } = results;

  // Capitalize first letter helper
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Detected Objects
            </h2>
            <p className="text-xs text-slate-400">
              {total_detected > 0
                ? `${total_detected} object${total_detected === 1 ? '' : 's'} identified by the vision model`
                : 'Model inference completed'}
            </p>
          </div>
        </div>

        {total_detected > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
            {total_detected} Found
          </span>
        )}
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
                    </span>
                    <span className="font-semibold text-indigo-300 text-xs">
                      {capitalize(item.label)} — {percentage}%
                    </span>
                  </div>

                  {/* Clean readable confidence bar */}
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean categories summary */}
          {unique_labels && unique_labels.length > 0 && (
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-500" />
                Categories:
              </span>
              {unique_labels.map((label, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                >
                  {capitalize(label)}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty detection state */
        <div className="py-6 px-4 text-center rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-400/80" />
          <p className="text-sm font-medium text-slate-200">
            No objects detected with sufficient confidence in this image.
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            Try uploading a clearer photo containing prominent everyday objects like people, vehicles, furniture, or animals.
          </p>
        </div>
      )}
    </div>
  );
}
