import React from 'react';
import { Check, Copy, Printer, X } from 'lucide-react';
import { UseCase, VerticalPreset } from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  getUseCasePsDays,
  HleeResult,
  RoiInputs,
  RoiResults,
} from '../utils/calculations';

interface DealBriefModalProps {
  open: boolean;
  onClose: () => void;
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  includedUseCases: UseCase[];
  motionLabel: string;
  sovereigntyLabel: string;
  hlee: HleeResult;
  briefText: string;
  onCopyBrief: () => void;
  copied: boolean;
}

export const DealBriefModal: React.FC<DealBriefModalProps> = ({
  open,
  onClose,
  preset,
  inputs,
  results,
  includedUseCases,
  motionLabel,
  sovereigntyLabel,
  hlee,
  briefText,
  onCopyBrief,
  copied,
}) => {
  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dealBriefModalTitle"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="dealBriefModalTitle"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-50"
            >
              Executive Deal Brief — {preset.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronized across Unit Economics, AI Radar 2.0, and Partner SOW Guardrails
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onCopyBrief}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied Brief' : 'Copy Text Brief'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Financial Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Annual Net Savings</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-teal-700 dark:text-teal-400">
                {formatCurrencyCompact(results.annualNetSavings)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                {formatCurrencyCompact(results.monthlyNetSavings)}/mo vs baseline
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">3-Yr vs. DIY LLM</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {formatCurrencyCompact(results.threeYearDiySavings)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                @{inputs.surge.toFixed(1)}x peak surge
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Phase 1 HLEE</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {hlee.timelineLabel}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                {hlee.psEffortLabel} · {includedUseCases.length} Intents
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Capacity Reclaimed</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {Math.round(results.ftesFreed).toLocaleString()} FTEs
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                +{results.containmentLiftPct}% containment lift
              </div>
            </div>
          </div>

          {/* Scoping Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Architecture &amp; GTM Alignment
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">Partner Motion</dt>
                  <dd className="font-medium text-right text-slate-900 dark:text-slate-100">{motionLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">Deployment Tier</dt>
                  <dd className="font-medium text-right text-slate-900 dark:text-slate-100">{sovereigntyLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">Compliance Perimeter</dt>
                  <dd className="font-medium text-right text-slate-900 dark:text-slate-100">
                    {preset.compliance.slice(0, 3).join(' · ')}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Included Phase 1 Use Cases ({includedUseCases.length})
              </h3>
              {includedUseCases.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No Phase 1 Top-Right use cases selected.</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {includedUseCases.map((uc) => (
                    <li
                      key={uc.id}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 dark:border-slate-800"
                    >
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">{uc.name}</span>
                      <span className="font-mono text-[11px] tabular-nums text-teal-700 dark:text-teal-400 shrink-0">
                        +{getUseCasePsDays(uc)} PS Days
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Copyable Raw Brief */}
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Plain-Text Executive Summary
            </div>
            <pre className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-[11.5px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 whitespace-pre-wrap">
              {briefText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
