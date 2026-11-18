import React from 'react';
import { Check, Copy, Download, Presentation, Printer, X } from 'lucide-react';
import { BYOLLM_STACK_TIERS, DealMetadata, UseCase, VerticalPreset } from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  getUseCasePsDays,
  HleeResult,
  PaybackAnalysis,
  PovPlanResult,
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
  psDayRate: number;
  payback: PaybackAnalysis;
  povPlan?: PovPlanResult;
  dealMeta: DealMetadata;
  onUpdateDealMeta: <K extends keyof DealMetadata>(key: K, val: DealMetadata[K]) => void;
  briefText: string;
  onCopyBrief: () => void;
  onDownloadCsv: () => void;
  onDownloadDeck: () => void;
  onPrintBrief: () => void;
  isExportingDeck: boolean;
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
  psDayRate,
  payback,
  povPlan,
  dealMeta,
  onUpdateDealMeta,
  briefText,
  onCopyBrief,
  onDownloadCsv,
  onDownloadDeck,
  onPrintBrief,
  isExportingDeck,
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="dealBriefModalTitle"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-50"
            >
              Executive Deal Brief — {dealMeta.prospectName ? `${dealMeta.prospectName} · ` : ''}{preset.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronized across Unit Economics, AI Radar 2.0, and Partner SOW Guardrails
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onCopyBrief}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied Brief' : 'Copy Text'}
            </button>
            <button
              type="button"
              onClick={onDownloadDeck}
              disabled={isExportingDeck}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100 disabled:opacity-60 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-950 cursor-pointer whitespace-nowrap"
            >
              <Presentation className="h-3.5 w-3.5" />
              {isExportingDeck ? 'Building Deck...' : 'Download Deck (.pptx)'}
            </button>
            <button
              type="button"
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onPrintBrief}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
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

        <div className="max-h-[76vh] overflow-y-auto p-6 space-y-6">
          {/* Client-Ready Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <div>
              <label htmlFor="metaProspect" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Prospect Account
              </label>
              <input
                id="metaProspect"
                type="text"
                value={dealMeta.prospectName}
                onChange={(e) => onUpdateDealMeta('prospectName', e.target.value)}
                placeholder="e.g., First National Bank"
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="metaPartner" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Partner Organization
              </label>
              <input
                id="metaPartner"
                type="text"
                value={dealMeta.partnerName}
                onChange={(e) => onUpdateDealMeta('partnerName', e.target.value)}
                placeholder="e.g., Accenture / Genesys"
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="metaCcaas" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Target CCaaS Platform
              </label>
              <input
                id="metaCcaas"
                type="text"
                value={dealMeta.ccaasPlatform}
                onChange={(e) => onUpdateDealMeta('ccaasPlatform', e.target.value)}
                placeholder="e.g., Genesys Cloud CX"
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="metaOwner" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Deal Owner / SE
              </label>
              <input
                id="metaOwner"
                type="text"
                value={dealMeta.dealOwner}
                onChange={(e) => onUpdateDealMeta('dealOwner', e.target.value)}
                placeholder="e.g., Partner Architect"
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Financial Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Hard P&amp;L Savings ({results.laborRealizationPct}%)
              </div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-teal-700 dark:text-teal-400">
                {formatCurrencyCompact(results.annualNetSavings)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                +{formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr capacity
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Break-Even Payback</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} mos` : 'N/A'}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                PS Cost: {formatCurrencyFull(payback.implementationCost)}
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                3-Yr vs. {results.competitorProfile.shortLabel}
              </div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {formatCurrencyCompact(payback.threeYearCompetitorSavings)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                @{inputs.surge.toFixed(1)}x surge · Self-Learning
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Phase 1 HLEE</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {hlee.timelineLabel}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                {hlee.psEffortLabel} (@ ${psDayRate.toLocaleString()}/d)
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
                  <dt className="text-slate-500 dark:text-slate-400">Competitive Baseline</dt>
                  <dd className="font-medium text-right text-slate-900 dark:text-slate-100">
                    {results.competitorProfile.title}
                    {results.competitorProfile.key === 'byollm'
                      ? ` · ${BYOLLM_STACK_TIERS[results.byollmStackTier].shortLabel}`
                      : ''}{' '}
                    ({results.competitorProfile.examples})
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">Compliance Perimeter</dt>
                  <dd className="font-medium text-right text-slate-900 dark:text-slate-100">
                    {preset.compliance.slice(0, 3).join(' · ')}
                  </dd>
                </div>
                {povPlan && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                    <dt className="text-slate-500 dark:text-slate-400">Initial POV / POC</dt>
                    <dd className="font-medium text-right text-teal-700 dark:text-teal-400">
                      {povPlan.povDurationLabel} ({povPlan.heroIntents.length} Hero Intents ·{' '}
                      {povPlan.effectiveFeeUsd === 0
                        ? 'Co-Sell $0'
                        : formatCurrencyFull(povPlan.effectiveFeeUsd)}
                      )
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Included Phase 1 Use Cases ({includedUseCases.length})
              </h3>
              {includedUseCases.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No High-Feasibility (Top-Right / Bottom-Right) use cases selected.</p>
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
