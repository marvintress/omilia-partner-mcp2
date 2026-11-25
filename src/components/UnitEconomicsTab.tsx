import React, { useState } from 'react';
import { Check, Copy, Download, Printer, RotateCcw } from 'lucide-react';
import {
  BYOLLM_STACK_TIERS,
  ByollmStackTier,
  COMPETITOR_PROFILES,
  CompetitorArchetype,
  VerticalPreset,
} from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  PaybackAnalysis,
  RoiInputs,
  RoiResults,
  SensitivityScenario,
} from '../utils/calculations';
import { InfoTooltip } from './InfoTooltip';

interface UnitEconomicsTabProps {
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  payback: PaybackAnalysis;
  sensitivity: SensitivityScenario[];
  competitorArchetype: CompetitorArchetype;
  onChangeCompetitor: (c: CompetitorArchetype) => void;
  byollmStackTier: ByollmStackTier;
  onChangeByollmStackTier: (tier: ByollmStackTier) => void;
  psDayRate: number;
  hleePsDays: number;
  hleeTimelineLabel: string;
  onUpdateInput: <K extends keyof RoiInputs>(key: K, val: RoiInputs[K]) => void;
  onApplyLaborPreset: (wage: number, burden: number) => void;
  onAutoFitFtes: () => void;
  onResetVerticalDefaults: () => void;
  onCopySummary: () => void;
  onDownloadCsv: () => void;
}

export const UnitEconomicsTab: React.FC<UnitEconomicsTabProps> = ({
  preset,
  inputs,
  results,
  payback,
  sensitivity,
  competitorArchetype,
  onChangeCompetitor,
  byollmStackTier,
  onChangeByollmStackTier,
  psDayRate,
  hleePsDays,
  hleeTimelineLabel,
  onUpdateInput,
  onApplyLaborPreset,
  onAutoFitFtes,
  onResetVerticalDefaults,
  onCopySummary,
  onDownloadCsv,
}) => {
  const [chartView, setChartView] = useState<'bars' | 'cashflow'>('bars');
  const [tableView, setTableView] = useState<'cfo' | 'sensitivity'>('cfo');

  const comp = results.competitorProfile;
  const isByollm = comp.key === 'byollm';
  const activeTier = BYOLLM_STACK_TIERS[byollmStackTier] ?? BYOLLM_STACK_TIERS.flagship;

  const bars = [
    {
      key: 'legacy',
      label: 'Legacy Human + IVR',
      sub: `${Math.round(results.baseCont * 100)}% baseline containment`,
      val: results.annualLegacy,
      colorClass: 'bg-slate-400 dark:bg-slate-600',
      textClass: 'text-slate-700 dark:text-slate-300',
    },
    {
      key: 'competitor',
      label: isByollm
        ? `${comp.title} · ${activeTier.shortLabel} (${comp.examples})`
        : `${comp.title} (${comp.examples})`,
      sub: `${Math.round(results.diyContainment * 100)}% eff. · $${results.diyPerCallVariableRate.toFixed(2)}/res + 35% esc. attempt burn + ${
        isByollm ? 'license' : '40% drift tax'
      }`,
      val: results.annualDiy,
      colorClass: isByollm ? 'bg-amber-600 dark:bg-amber-500' : 'bg-rose-600 dark:bg-rose-500',
      textClass: isByollm ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400',
    },
    {
      key: 'omilia',
      label: 'Omilia Vertically Integrated Sovereign Stack',
      sub: `${Math.round(results.targetCont * 100)}% blended · $${inputs.omiliaOutcomeRate.toFixed(2)}/res flat → $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)} Yr3`,
      val: results.annualOmilia,
      colorClass: 'bg-teal-600 dark:bg-teal-500',
      textClass: 'text-teal-700 dark:text-teal-400',
    },
  ];

  const maxBarScale = Math.max(results.annualLegacy, results.annualDiy, results.annualOmilia, 1);

  return (
    <div className="space-y-6">
      {/* 5-Column Executive KPI Strip — Single-elevation flat architectural grid */}
      <section aria-label="Key Financial and Capacity Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Annual Hard P&amp;L Savings</span>
              <InfoTooltip
                label="Annual Hard P&L Savings"
                description={`Year-1 annualized steady-state cash savings vs. Legacy Human + IVR at ${results.laborRealizationPct}% Hard P&L Labor Realization (captured via natural attrition, BPO flex-down, and hiring avoidance—never assuming Day-1 layoffs). Break-even payback (${payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} mo` : 'N/A'}) also factors in your ${payback.omiliaBuildMonths.toFixed(1)}m HLEE build wait and 2-month phased traffic ramp (25% -> 60% -> 100%).`}
                tcoImpact="Separates bankable CFO P&L cost takeout from frontline queue capacity relief so financial break-even stays defensible."
                placement="bottom"
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-teal-700 dark:text-teal-400">
              {formatCurrencyCompact(results.annualNetSavings)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {formatCurrencyCompact(results.monthlyNetSavings)}/mo ·{' '}
              {payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} mo payback` : 'N/A'}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>3-Yr Savings vs. {comp.shortLabel}</span>
              <InfoTooltip
                label="3-Year Competitor TCO Advantage"
                description={`Cumulative 36-month TCO advantage over ${
                  isByollm ? `${comp.title} (${activeTier.label})` : comp.title
                } including upfront implementation (${comp.setupRangeLabel}), latency containment gap, metered surge & 35% escalated attempt burn, and Yr2–Yr3 Offline Self-Learning compression.`}
                tcoImpact="Quantifies total multi-year budget saved vs. buying an orchestrator-only or DIY hyperscaler stack."
                placement="bottom"
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              {formatCurrencyCompact(payback.threeYearCompetitorSavings)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Incl. {comp.setupRangeLabel} &amp; Self-Learning
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Containment Lift</span>
              <InfoTooltip
                label="Incremental Containment Lift"
                description="Percentage-point jump from your Legacy IVR Baseline to Omilia's blended deterministic + agentic containment rate."
                tcoImpact="Every incremental call contained avoids loaded human labor and pays the flat Omilia outcome rate instead."
                placement="bottom"
                align="center"
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              +{results.containmentLiftPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {Math.round(results.omiliaAutomatedCalls).toLocaleString()} calls automated/mo
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Days / Mo per Agent Saved</span>
              <InfoTooltip
                label="Days/Mo per Agent Saved"
                description="Average productive workdays freed per active agent each month from incremental deflection plus TalkGuard KBA and CoPilot ACW savings."
                tcoImpact="Shows frontline operational relief in tangible queue hours without requiring immediate headcount cuts."
                placement="bottom"
                align="right"
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-teal-700 dark:text-teal-400">
              {results.daysSavedPerAgentMo.toFixed(1)} days
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {Math.round(results.totalHoursSavedMo).toLocaleString()} hrs/mo reclaimed
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Equivalent FTEs Freed</span>
              <InfoTooltip
                label="Equivalent FTEs Freed & Reclaimed Capacity"
                description={`Total monthly agent hours reclaimed divided by Shift Hrs/Day × Work Days/Mo. At ${results.laborRealizationPct}% Hard P&L capture, unharvested hours stay in the queue as ${formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr Reclaimed Capacity (zero layoffs).`}
                tcoImpact="Quantifies both hard hiring/BPO avoidance and non-layoff queue relief for retention and CSAT."
                placement="bottom"
                align="right"
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
              {Math.round(results.ftesFreed).toLocaleString()} FTEs
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              ${results.unitHumanCost.toFixed(2)}/call · +{formatCurrencyCompact(results.annualCapacityReinvestedValue)} capacity
            </div>
          </div>
        </div>
      </section>

      {/* Main 12-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls (5 Columns) — Hidden in PDF print in favor of clean Executive Assumptions Summary */}
        <div className="no-print lg:col-span-5 space-y-6">
          {/* Volume & Surge Profile */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                    Contact Center Volume &amp; Surge Profile
                  </h2>
                  <InfoTooltip
                    label="Contact Center Volume & Surge Profile"
                    description="Configures monthly inbound volume, legacy IVR baseline containment, target Omilia containment, flat outcome rate ($0 on escalations), AHT, and peak surge multiplier."
                    tcoImpact="Drives call-deflection savings, competitor 35% escalated attempt burn vs. Omilia outcome fees, and 36-month cash flow."
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {preset.name} baseline assumptions
                </p>
              </div>
              <button
                type="button"
                onClick={onResetVerticalDefaults}
                className="no-print inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                title="Reset inputs to vertical preset defaults"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpCallVolume" className="font-medium text-slate-700 dark:text-slate-300">
                      Monthly Inbound Call Volume
                    </label>
                    <InfoTooltip
                      label="Monthly Inbound Call Volume"
                      description="Baseline monthly inbound calls entering the contact center before peak surge scaling."
                      tcoImpact="Larger call volumes spread fixed platform costs ($6.5K/mo Omilia vs. $15K/mo BYOLLM / $34K/mo DIY) across more calls, rapidly scaling annual net TCO savings."
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {inputs.callVolume.toLocaleString()}
                  </span>
                </div>
                <input
                  id="inpCallVolume"
                  type="range"
                  min={50000}
                  max={2000000}
                  step={10000}
                  value={inputs.callVolume}
                  onChange={(e) => onUpdateInput('callVolume', Number(e.target.value))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpBaseContainment" className="font-medium text-slate-700 dark:text-slate-300">
                      Baseline Legacy IVR Containment
                    </label>
                    <InfoTooltip
                      label="Baseline Legacy IVR Containment"
                      description="Percentage of calls currently resolved by the existing legacy IVR ($0.14/call); remaining calls route to live human agents."
                      tcoImpact="A higher starting baseline leaves fewer human calls to automate, narrowing incremental TCO savings; lower baselines increase net savings potential."
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {inputs.baseContainment}%
                  </span>
                </div>
                <input
                  id="inpBaseContainment"
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={inputs.baseContainment}
                  onChange={(e) => onUpdateInput('baseContainment', Number(e.target.value))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpTargetContainment" className="font-medium text-slate-700 dark:text-slate-300">
                      Target Omilia OCP Containment
                    </label>
                    <InfoTooltip
                      label="Target Omilia OCP Containment"
                      description={`Blended deterministic + agentic containment rate achieved with Omilia OCP (${comp.shortLabel} trails by ~${Math.round(comp.containmentLag * 100)} pts due to multi-turn latency & acoustic gaps).`}
                      tcoImpact="Primary driver of TCO savings: every +1% shifts calls from loaded human labor to flat outcome pricing, directly increasing annual savings and FTEs freed."
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                    {inputs.targetContainment}%
                  </span>
                </div>
                <input
                  id="inpTargetContainment"
                  type="range"
                  min={25}
                  max={99}
                  step={1}
                  value={inputs.targetContainment}
                  onChange={(e) => onUpdateInput('targetContainment', Number(e.target.value))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpOmiliaOutcomeRate" className="font-medium text-slate-700 dark:text-slate-300">
                      Omilia Outcome Rate ($ / Resolved Call)
                    </label>
                    <InfoTooltip
                      label="Omilia Outcome Rate"
                      description="Predictable Year 1 per-resolved-interaction price with zero pass-through token/ASR/TTS fees; Offline Self-Learning compresses effective unit cost in Years 2–3."
                      tcoImpact={`Lower outcome rates reduce Omilia monthly spend directly, widening 3-year TCO savings against both Legacy Baseline and ${comp.shortLabel}.`}
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    ${inputs.omiliaOutcomeRate.toFixed(2)}
                  </span>
                </div>
                <input
                  id="inpOmiliaOutcomeRate"
                  type="range"
                  min={0.15}
                  max={1.0}
                  step={0.01}
                  value={inputs.omiliaOutcomeRate}
                  onChange={(e) => onUpdateInput('omiliaOutcomeRate', Number(e.target.value))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpAht" className="font-medium text-slate-700 dark:text-slate-300">
                      Average Handle Time (AHT)
                    </label>
                    <InfoTooltip
                      label="Average Handle Time (AHT)"
                      description="Average talk and hold duration (seconds) for human-handled calls before adding After-Call Work (ACW)."
                      tcoImpact="Longer AHT raises the loaded human cost per call, which magnifies the dollar savings of every call deflected or shortened."
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {inputs.aht}s
                  </span>
                </div>
                <input
                  id="inpAht"
                  type="range"
                  min={1}
                  max={720}
                  step={1}
                  value={inputs.aht}
                  onChange={(e) => onUpdateInput('aht', Number(e.target.value))}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpSurge" className="font-medium text-slate-700 dark:text-slate-300">
                      Seasonal / Outage Peak Surge Multiplier
                    </label>
                    <InfoTooltip
                      label="Peak Surge Multiplier"
                      description="Models seasonal spikes (storms, CAT claims, Black Friday, open enrollment) from 1.0x to 4.0x baseline volume."
                      tcoImpact={`${comp.shortLabel} metered token, ASR/TTS & retry usage scales nonlinearly (surge^${comp.surgeExponent.toFixed(2)}), sharply expanding Omilia's 3-year TCO advantage.`}
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                    {inputs.surge.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="inpSurge"
                  type="range"
                  min={1.0}
                  max={4.0}
                  step={0.1}
                  value={inputs.surge}
                  onChange={(e) => onUpdateInput('surge', Number(e.target.value))}
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {preset.roi.surgeNote}
                </p>
              </div>
            </div>
          </section>

          {/* Agent Cost Shaping & AI Assist */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  Agent Cost Shaping &amp; AI Assist
                </h2>
                <InfoTooltip
                  label="Labor Shaping & Dynamic Auto-Fit FTEs"
                  description="Computes loaded human cost/call from wage, burden, occupancy, AHT, and ACW. When Auto-Fit is Live (default), Active Agents scales automatically whenever call volume, baseline containment, handle time, occupancy, or shift schedule changes."
                  tcoImpact="Higher loaded labor costs increase baseline spend and raise net dollar TCO savings per deflected or assisted interaction."
                />
              </div>
              <button
                type="button"
                onClick={onAutoFitFtes}
                aria-pressed={inputs.autoFitAgents !== false}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  inputs.autoFitAgents !== false
                    ? 'border-teal-600 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-950'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Toggle dynamic auto-sizing of active agents to baseline uncontained volume"
              >
                <Check
                  className={`h-3 w-3 ${inputs.autoFitAgents !== false ? 'opacity-100' : 'opacity-30'}`}
                  aria-hidden="true"
                />
                {inputs.autoFitAgents !== false ? 'Auto-Fit: Live' : 'Enable Auto-Fit'}
              </button>
            </div>

            {/* Labor Location Presets */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {[
                { label: 'Onshore ($26/hr)', wage: 26, burden: 32 },
                { label: 'Nearshore ($16/hr)', wage: 16, burden: 26 },
                { label: 'Offshore ($10/hr)', wage: 10, burden: 22 },
              ].map((p) => {
                const isSelected = inputs.wage === p.wage && inputs.burden === p.burden && !inputs.cfoOverride;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onApplyLaborPreset(p.wage, p.burden)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <InfoTooltip
                label="Regional Labor Presets"
                description="Applies typical hourly wage and overhead burden for Onshore, Nearshore, or Offshore contact centers and turns off CFO Override."
                tcoImpact="Onshore labor profiles yield higher cost-per-call savings per automated interaction than offshore centers."
                align="right"
              />
            </div>

            {/* Bottom-up Labor Inputs */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpWage" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Base Wage ($/hr)
                  </label>
                  <InfoTooltip
                    label="Base Wage ($/hr)"
                    description="Direct hourly pay rate per contact center agent before benefits and overhead."
                    tcoImpact="Directly raises loaded unit cost per human call, increasing annual net savings for every deflected call."
                  />
                </div>
                <input
                  id="inpWage"
                  type="number"
                  min={5}
                  max={120}
                  step={1}
                  value={inputs.wage}
                  disabled={inputs.cfoOverride}
                  onChange={(e) => onUpdateInput('wage', Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpBurden" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Burden / Overhead (%)
                  </label>
                  <InfoTooltip
                    label="Burden / Overhead (%)"
                    description="Payroll taxes, benefits, seat licensing, QA/supervision, and facilities markup on top of base wage."
                    tcoImpact="Scales loaded hourly agent cost by (1 + burden%), increasing baseline human cost and net TCO savings."
                    align="right"
                  />
                </div>
                <input
                  id="inpBurden"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={inputs.burden}
                  disabled={inputs.cfoOverride}
                  onChange={(e) => onUpdateInput('burden', Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpOccupancy" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Occupancy (%)
                  </label>
                  <InfoTooltip
                    label="Agent Occupancy (%)"
                    description="Share of paid shift time agents spend actively handling calls vs. idle/available time."
                    tcoImpact="Scales productive hourly rate in the unit-cost formula; calibrating to actual WFM occupancy aligns labor savings to reality."
                  />
                </div>
                <input
                  id="inpOccupancy"
                  type="number"
                  min={40}
                  max={98}
                  step={1}
                  value={inputs.occupancy}
                  disabled={inputs.cfoOverride}
                  onChange={(e) => onUpdateInput('occupancy', Number(e.target.value) || 40)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpAcw" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    After-Call Work (ACW s)
                  </label>
                  <InfoTooltip
                    label="After-Call Work (ACW)"
                    description="Post-call CRM notes, dispositioning, and wrap-up seconds added to AHT for total handle time."
                    tcoImpact="Increases total human cost per call and amplifies capacity savings reclaimed by CSR CoPilot auto-summarization."
                    align="right"
                  />
                </div>
                <input
                  id="inpAcw"
                  type="number"
                  min={0}
                  max={240}
                  step={5}
                  value={inputs.acw}
                  onChange={(e) => onUpdateInput('acw', Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Clean Hairline Divider Option List (No Nested Cards) */}
            <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <span>Direct CFO Cost-per-Call Override</span>
                    <InfoTooltip
                      label="Direct CFO Cost-per-Call Override"
                      description="Replaces bottom-up wage/burden/occupancy math with finance's pre-approved unit cost per live agent call."
                      tcoImpact="Raising the override increases Legacy & DIY escalation labor costs, directly growing annual net TCO savings."
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bypass bottom-up labor math with finance-approved unit cost
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <input
                    type="number"
                    aria-label="CFO cost per call override USD"
                    min={0.5}
                    max={50}
                    step={0.05}
                    value={inputs.cfoOverrideVal}
                    disabled={!inputs.cfoOverride}
                    onChange={(e) => onUpdateInput('cfoOverrideVal', Number(e.target.value) || 0.5)}
                    className="w-20 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs tabular-nums text-slate-900 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <input
                    type="checkbox"
                    aria-label="Enable CFO Cost-per-Call Override"
                    checked={inputs.cfoOverride}
                    onChange={(e) => onUpdateInput('cfoOverride', e.target.checked)}
                    className="h-4 w-4 rounded accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <label htmlFor="chkTalkguard" className="cursor-pointer">
                      TalkGuard Passive Voice Biometrics
                    </label>
                    <InfoTooltip
                      label="TalkGuard Voice Biometrics"
                      description={`Verifies caller identity passively in ~6s while screening synthetic deepfakes, eliminating ${preset.roi.talkguardSec}s of KBA questioning.`}
                      tcoImpact="Reduces handle time and residual unit cost on every escalated human call—boosting TCO savings even on uncontained calls."
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Eliminates {preset.roi.talkguardSec}s KBA interrogation in ~6s natural speech
                  </div>
                </div>
                <input
                  id="chkTalkguard"
                  type="checkbox"
                  checked={inputs.talkguard}
                  onChange={(e) => onUpdateInput('talkguard', e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <label htmlFor="chkCopilot" className="cursor-pointer">
                      CSR CoPilot Real-Time Agent Assist
                    </label>
                    <InfoTooltip
                      label="CSR CoPilot Agent Assist"
                      description={`Generates structured call summaries and live guidance on escalated calls, shaving ${preset.roi.copilotSec}s off After-Call Work.`}
                      tcoImpact="Compresses residual human escalation cost and reclaims agent capacity hours across 100% of agent-assisted traffic."
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auto-summarizes escalated calls (-{preset.roi.copilotSec}s ACW reduction)
                  </div>
                </div>
                <input
                  id="chkCopilot"
                  type="checkbox"
                  checked={inputs.copilot}
                  onChange={(e) => onUpdateInput('copilot', e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Workforce Shift Sizing */}
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpAgents" className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Active Agents ({inputs.autoFitAgents !== false ? 'Auto' : 'Manual'})
                  </label>
                  <InfoTooltip
                    label="Active Agents (Dynamic Auto-Fit)"
                    description="Live-sized from baseline uncontained volume, (AHT + ACW), occupancy, and shift hours while Auto-Fit is Live. Typing a custom headcount switches smoothly to Manual mode."
                    tcoImpact="Adjusts Days/Mo per Agent Saved without changing dollar TCO savings."
                  />
                </div>
                <input
                  id="inpAgents"
                  type="number"
                  min={10}
                  max={25000}
                  step={10}
                  value={inputs.agents}
                  onChange={(e) => onUpdateInput('agents', Number(e.target.value) || 10)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpShiftHours" className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Shift Hrs/Day
                  </label>
                  <InfoTooltip
                    label="Shift Hours per Day"
                    description="Paid shift hours per agent per workday."
                    tcoImpact="Converts total monthly hours saved into Days/Mo per Agent Saved and Equivalent FTEs Freed; dollar TCO stays unchanged."
                    align="center"
                  />
                </div>
                <input
                  id="inpShiftHours"
                  type="number"
                  min={4}
                  max={12}
                  step={0.5}
                  value={inputs.shiftHours}
                  onChange={(e) => onUpdateInput('shiftHours', Number(e.target.value) || 8)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="inpWorkDays" className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Work Days/Mo
                  </label>
                  <InfoTooltip
                    label="Work Days per Month"
                    description="Average working days per FTE each month (typically 21.5)."
                    tcoImpact="Scales Equivalent FTEs Freed (hoursSaved / (shiftHrs × workDays)) without altering dollar TCO savings."
                    align="right"
                  />
                </div>
                <input
                  id="inpWorkDays"
                  type="number"
                  min={15}
                  max={26}
                  step={0.5}
                  value={inputs.workDays}
                  onChange={(e) => onUpdateInput('workDays', Number(e.target.value) || 21.5)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Hard P&L Labor Realization (%) */}
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <label
                    htmlFor="inpLaborRealization"
                    className="font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Hard P&amp;L Labor Realization (%)
                  </label>
                  <InfoTooltip
                    label="Hard P&L Labor Realization (%) — Zero-Layoff Modeling"
                    description="Controls what share of freed agent payroll turns into hard P&L cash savings (via natural 25–35% annual attrition, BPO flex-down, and surge/overtime hiring avoidance) vs. Reclaimed Capacity reinvested in shorter queues with zero layoffs."
                    tcoImpact="Platform/outcome/token spend stays 100% cash. Lowering realization shifts break-even markers rightward across all models so CFOs see an honest hard-cash payback timeline."
                  />
                </span>
                <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                  {results.laborRealizationPct}% Hard P&amp;L
                </span>
              </div>

              <input
                id="inpLaborRealization"
                type="range"
                min={25}
                max={100}
                step={5}
                value={results.laborRealizationPct}
                onChange={(e) => onUpdateInput('laborRealizationPct', Number(e.target.value))}
              />

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Conservative (50%)', val: 50 },
                  { label: 'Realistic P&L (65%)', val: 65 },
                  { label: 'Capacity Value (100%)', val: 100 },
                ].map((opt) => {
                  const isActive = results.laborRealizationPct === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => onUpdateInput('laborRealizationPct', opt.val)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span>
                  Reclaimed non-layoff capacity:{' '}
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr
                  </strong>
                </span>
                <span>
                  {results.laborRealizationPct === 100
                    ? 'Full FTE cost-out view'
                    : `${100 - results.laborRealizationPct}% reinvested in CSAT / surge shield`}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Visualizations & CFO Table (Full 12-Col Width in PDF Print) */}
        <div className="lg:col-span-7 print:col-span-12 space-y-6">
          {/* Competitor Architecture Baseline Selector & TCO Chart */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            {/* Competitor Architecture Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Competitor Architecture Baseline
                </span>
                <InfoTooltip
                  label="Competitor Architecture Baseline"
                  description="Compare Omilia's vertically integrated Sovereign Stack against either Packaged BYOLLM platforms (NiCE Cognigy, Kore.ai, Parloa — switchable between Flagship Voice $0.46 and Discounted Mini $0.36 tiers) or custom DIY Hyperscaler stacks (Azure OpenAI / Bedrock)."
                  tcoImpact="Each baseline models upfront build costs ($180K–$300K vs. $450K–$750K), pass-through token/ASR/TTS metering across BOTH resolved and failed/escalated attempts (35% turn burn vs. Omilia $0 on unresolved escalations), and turn-latency attrition."
                />
              </div>

              <div
                role="group"
                aria-label="Competitor Architecture Baseline"
                className="no-print inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-950"
              >
                {(
                  [
                    { key: 'byollm', label: 'Packaged BYOLLM (Cognigy / Kore / Parloa)' },
                    { key: 'diy_hyperscaler', label: 'DIY Hyperscaler (OpenAI / Bedrock)' },
                  ] as { key: CompetitorArchetype; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onChangeCompetitor(opt.key)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      competitorArchetype === opt.key
                        ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {isByollm && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                    BYOLLM Model &amp; Speech Stack
                  </span>
                  <InfoTooltip
                    label="BYOLLM Model & Speech Stack Tier"
                    description="Switches Cognigy / Kore / Parloa pass-through voice AI stack pricing between Flagship Voice (frontier/realtime LLM + commercial ASR + ElevenLabs-tier premium neural TTS + orchestration at $0.46/res base, surge^0.15) and Discounted Mini (mini/flash LLM + standard TTS at $0.36/res base, surge^0.28)."
                    tcoImpact="Updates pass-through $/resolved pricing across Year-1 TCO bars, 36-month cumulative cash flow, and CFO breakdowns while holding containment constant."
                  />
                </div>

                <div
                  role="group"
                  aria-label="BYOLLM Model and Speech Stack Tier"
                  className="no-print inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-950"
                >
                  {(['flagship', 'mini'] as ByollmStackTier[]).map((tierKey) => {
                    const tier = BYOLLM_STACK_TIERS[tierKey];
                    const selected = byollmStackTier === tierKey;
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() => onChangeByollmStackTier(tierKey)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
                <span className="print-only font-mono text-[11px] font-semibold text-amber-700">
                  {activeTier.label}
                </span>
              </div>
            )}

            {/* Active Baseline Cost & Architecture Mechanics Note */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-100 pb-4 text-[11.5px] leading-relaxed dark:border-slate-800">
              <div className="text-slate-600 dark:text-slate-300">
                <strong
                  className={`font-semibold ${
                    isByollm ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {COMPETITOR_PROFILES[competitorArchetype].shortLabel} Cost Mechanics:
                </strong>{' '}
                {comp.commercialSummary}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Latency &amp; Perimeter Risk:
                </strong>{' '}
                {comp.architectureSummary}
              </div>
            </div>

            {/* TCO Comparison Header + Chart Mode Switcher */}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                    {chartView === 'bars'
                      ? `Annualized Yr-1 TCO: Legacy vs. ${comp.shortLabel} vs. Omilia Sovereign Stack`
                      : `36-Month Cumulative Cash Flow & Self-Learning Compression (${comp.shortLabel})`}
                  </h2>
                  <InfoTooltip
                    label="Annual TCO vs. 36-Month Cash Flow & Break-Even Markers"
                    description={`Switch between Year-1 annualized bars and the 36-month cumulative curve. Each trajectory accounts for realistic build-time wait (${payback.omiliaBuildMonths.toFixed(1)}m Omilia HLEE vs. ${payback.byollmBuildMonths.toFixed(1)}m BYOLLM / ${payback.diyBuildMonths.toFixed(1)}m DIY) plus a 2-month phased traffic ramp (25% -> 60% -> 100%) at ${results.laborRealizationPct}% Hard P&L capture.`}
                    tcoImpact="Shows color-coded Break-Even markers for Omilia (Teal), BYOLLM (Amber), and DIY (Rose) with build lag, consumption, and no Day-1 layoffs."
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {chartView === 'bars'
                    ? `Omilia flat $${inputs.omiliaOutcomeRate.toFixed(2)}/res vs. metered pass-through fees (${results.laborRealizationPct}% Hard P&L labor capture)`
                    : `Omilia PS ${formatCurrencyFull(payback.implementationCost)} (${payback.omiliaBuildMonths.toFixed(1)}m build + 2m ramp) vs. ${payback.byollmBuildMonths.toFixed(1)}m BYOLLM / ${payback.diyBuildMonths.toFixed(1)}m DIY · ${results.laborRealizationPct}% Hard P&L`}
                </p>
              </div>
              <div className="no-print flex items-center gap-2 shrink-0">
                <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={() => setChartView('bars')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      chartView === 'bars'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Annual TCO Bars
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('cashflow')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      chartView === 'cashflow'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    36-Mo Cash Flow
                  </button>
                </div>
              </div>
            </div>

            {chartView === 'bars' ? (
              <div className="mt-5 space-y-5">
                {bars.map((bar) => {
                  const widthPct = Math.max(4, Math.min(100, (bar.val / maxBarScale) * 100));
                  return (
                    <div key={bar.key}>
                      <div className="flex items-baseline justify-between gap-4 mb-1.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {bar.label}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{bar.sub}</span>
                        </div>
                        <span className={`font-mono text-sm font-bold tabular-nums ${bar.textClass}`}>
                          {formatCurrencyCompact(bar.val)}/yr
                        </span>
                      </div>
                      <div className="h-7 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800/80">
                        <div
                          className={`h-full rounded-md transition-all duration-300 ease-out ${bar.colorClass}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              (() => {
                const W = 640;
                const H = 250;
                const padL = 62;
                const padR = 22;
                const padT = 18;
                const padB = 34;
                const plotW = W - padL - padR;
                const plotH = H - padT - padB;
                const maxCumulative = Math.max(
                  payback.threeYearLegacyTotal,
                  payback.threeYearByollmTotal,
                  payback.threeYearDiyHyperscalerTotal,
                  payback.threeYearOmiliaTotal,
                  1
                );
                const xOf = (m: number) => padL + (m / 36) * plotW;
                const yOf = (val: number) => padT + (1 - val / maxCumulative) * plotH;

                const makePath = (getter: (pt: (typeof payback.monthlyPoints)[number]) => number) =>
                  payback.monthlyPoints
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xOf(pt.month).toFixed(1)} ${yOf(getter(pt)).toFixed(1)}`)
                    .join(' ');

                const isByollmSelected = competitorArchetype === 'byollm';
                const breakEvenMarkers = [
                  {
                    key: 'omilia',
                    label: 'Omilia',
                    months: payback.paybackMonths,
                    color: '#0d9488',
                    pillBg: '#0f766e',
                    badgeY: padT + 4,
                  },
                  {
                    key: 'byollm',
                    label: 'BYOLLM',
                    months: payback.byollmPaybackMonths,
                    color: '#d97706',
                    pillBg: '#b45309',
                    badgeY: padT + 25,
                  },
                  {
                    key: 'diy',
                    label: 'DIY',
                    months: payback.diyHyperscalerPaybackMonths,
                    color: '#e11d48',
                    pillBg: '#be123c',
                    badgeY: padT + 46,
                  },
                ];

                return (
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px]">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-400 dark:border-slate-500" />
                          Legacy ({formatCurrencyCompact(payback.threeYearLegacyTotal)})
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            isByollmSelected
                              ? 'font-semibold text-amber-700 dark:text-amber-400'
                              : 'text-amber-700/80 dark:text-amber-400/80'
                          }`}
                        >
                          <span className="inline-block h-2 w-4 rounded-xs bg-amber-600" />
                          BYOLLM ({formatCurrencyCompact(payback.threeYearByollmTotal)})
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            !isByollmSelected
                              ? 'font-semibold text-rose-700 dark:text-rose-400'
                              : 'text-rose-700/80 dark:text-rose-400/80'
                          }`}
                        >
                          <span className="inline-block h-2 w-4 rounded-xs bg-rose-600" />
                          DIY Hyperscaler ({formatCurrencyCompact(payback.threeYearDiyHyperscalerTotal)})
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">
                          <span className="inline-block h-2 w-4 rounded-xs bg-teal-600" />
                          Omilia OCP ({formatCurrencyCompact(payback.threeYearOmiliaTotal)})
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950">
                      <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className="block w-full h-auto select-none"
                        role="img"
                        aria-label="36-month cumulative spend and color-coded break-even comparison for Legacy, Packaged BYOLLM, DIY Hyperscaler, and Omilia OCP"
                      >
                        {[0, 0.5, 1].map((frac) => {
                          const val = maxCumulative * frac;
                          const y = yOf(val);
                          return (
                            <g key={frac}>
                              <line
                                x1={padL}
                                y1={y}
                                x2={padL + plotW}
                                y2={y}
                                className="stroke-slate-200 dark:stroke-slate-800"
                                strokeWidth="1"
                              />
                              <text
                                x={padL - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono tabular-nums"
                              >
                                {formatCurrencyCompact(val)}
                              </text>
                            </g>
                          );
                        })}

                        {[0, 12, 24, 36].map((m) => (
                          <text
                            key={m}
                            x={xOf(m)}
                            y={H - 10}
                            textAnchor="middle"
                            className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono tabular-nums"
                          >
                            Mo {m}
                          </text>
                        ))}

                        {/* Cumulative Cost Curves */}
                        <path
                          d={makePath((p) => p.legacyCumulative)}
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                        />
                        <path
                          d={makePath((p) => p.byollmCumulative)}
                          fill="none"
                          stroke="#d97706"
                          strokeWidth={isByollmSelected ? '2.4' : '1.7'}
                          strokeDasharray={isByollmSelected ? undefined : '5 3'}
                          strokeOpacity={isByollmSelected ? 1 : 0.75}
                        />
                        <path
                          d={makePath((p) => p.diyHyperscalerCumulative)}
                          fill="none"
                          stroke="#e11d48"
                          strokeWidth={!isByollmSelected ? '2.4' : '1.7'}
                          strokeDasharray={!isByollmSelected ? undefined : '5 3'}
                          strokeOpacity={!isByollmSelected ? 1 : 0.75}
                        />
                        <path
                          d={makePath((p) => p.omiliaCumulative)}
                          fill="none"
                          stroke="#0d9488"
                          strokeWidth="2.8"
                        />

                        {/* Color-Coded Break-Even Markers & Staggered Callout Pills */}
                        {breakEvenMarkers.map((be) => {
                          const hasPoint =
                            be.months !== null && be.months >= 0 && be.months <= 36;
                          const badgeW = 92;
                          const badgeH = 16;
                          const statusText =
                            be.months === null
                              ? `${be.label}: N/A`
                              : be.months > 36
                              ? `${be.label}: >36m`
                              : `${be.label}: ${be.months.toFixed(1)}m`;

                          if (!hasPoint || be.months === null) {
                            const pillX = padL + plotW - badgeW - 4;
                            return (
                              <g key={be.key}>
                                <rect
                                  x={pillX}
                                  y={be.badgeY}
                                  width={badgeW}
                                  height={badgeH}
                                  rx="4"
                                  fill={be.pillBg}
                                  fillOpacity="0.92"
                                />
                                <text
                                  x={pillX + badgeW / 2}
                                  y={be.badgeY + 11.2}
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  className="text-[9.5px] font-mono font-bold tabular-nums"
                                >
                                  {statusText}
                                </text>
                              </g>
                            );
                          }

                          const cx = xOf(be.months);
                          const cy = yOf(results.legacyMonthlyCost * be.months);
                          const preferredX = cx + 6;
                          const pillX = Math.max(
                            padL + 4,
                            Math.min(padL + plotW - badgeW - 4, preferredX)
                          );

                          return (
                            <g key={be.key}>
                              <line
                                x1={cx}
                                y1={be.badgeY + badgeH}
                                x2={cx}
                                y2={padT + plotH}
                                stroke={be.color}
                                strokeWidth="1.3"
                                strokeDasharray="3 3"
                                strokeOpacity="0.8"
                              />
                              <line
                                x1={cx}
                                y1={be.badgeY + badgeH / 2}
                                x2={pillX}
                                y2={be.badgeY + badgeH / 2}
                                stroke={be.color}
                                strokeWidth="1.1"
                                strokeOpacity="0.7"
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r="4.5"
                                fill={be.color}
                                className="stroke-white dark:stroke-slate-950"
                                strokeWidth="2"
                              />
                              <rect
                                x={pillX}
                                y={be.badgeY}
                                width={badgeW}
                                height={badgeH}
                                rx="4"
                                fill={be.pillBg}
                              />
                              <text
                                x={pillX + badgeW / 2}
                                y={be.badgeY + 11.2}
                                textAnchor="middle"
                                fill="#ffffff"
                                className="text-[9.5px] font-mono font-bold tabular-nums"
                              >
                                {statusText}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">
                          Offline Self-Learning Cost Compression:
                        </strong>{' '}
                        Closed loop codifies agentic turns into deterministic micro-flows, compressing variable outcome fees in Yrs 2–3.
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                        Yr1 ${payback.omiliaUnitRatesByYear.yr1.toFixed(2)} → Yr2 $
                        {payback.omiliaUnitRatesByYear.yr2.toFixed(2)} → Yr3 $
                        {payback.omiliaUnitRatesByYear.yr3.toFixed(2)}/res
                      </span>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Architectural Advantage Indicators (Unboxed 4-Column Hairline Grid) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-t border-slate-100 pt-4 dark:divide-slate-800 dark:border-slate-800">
              <div className="py-2 sm:pr-3 sm:py-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Sub-1s Voice Latency</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  &lt;45ms Lexis TTS vs. {comp.turnLatencyLabel}
                </div>
              </div>
              <div className="py-2 sm:px-3 sm:py-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Zero Third-Party Egress</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  PCI L1 / FedRAMP-ready vs. {comp.egressLabel}
                </div>
              </div>
              <div className="py-2 sm:px-3 sm:py-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Native TalkGuard</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  Passive biometrics &amp; deepfake block
                </div>
              </div>
              <div className="py-2 sm:pl-3 sm:py-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>100% CCaaS Neutral</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  Genesys, NICE, AWS Connect, RingCentral
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic Executive CFO & Partner Takeaway Callout */}
          <section
            aria-label="Executive CFO and Partner Summary"
            className="rounded-xl border border-teal-200 bg-teal-50/40 p-5 dark:border-teal-900/60 dark:bg-teal-950/25"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-slate-50">
                  Executive CFO &amp; Partner Summary — {preset.shortName} vs. {comp.title}
                  {isByollm ? ` (${activeTier.shortLabel})` : ''}
                </h3>
                <InfoTooltip
                  label="Executive CFO Summary"
                  description="Dynamically recalculates a board-ready executive takeaway whenever you change vertical presets, competitor baselines, or sliders."
                  tcoImpact="Translates technical latency, egress, and Self-Learning curves into CFO language ready for copy-paste or slide export."
                />
              </div>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                {formatCurrencyCompact(payback.threeYearCompetitorSavings)} 3-Yr TCO Advantage
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              Selecting Omilia over <strong className="font-semibold">{comp.examples}</strong> delivers{' '}
              <strong className="font-mono font-semibold tabular-nums text-teal-800 dark:text-teal-300">
                {formatCurrencyCompact(payback.threeYearCompetitorSavings)}
              </strong>{' '}
              in 3-year cumulative TCO savings and{' '}
              <strong className="font-mono font-semibold tabular-nums text-teal-800 dark:text-teal-300">
                {formatCurrencyCompact(results.annualNetSavings)}/yr
              </strong>{' '}
              in Hard P&amp;L savings ({results.laborRealizationPct}% labor realization via natural attrition, BPO flex-down, and hiring avoidance—without assuming instant layoffs), plus{' '}
              <strong className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr
              </strong>{' '}
              in Reclaimed Capacity ({Math.round(results.ftesFreed).toLocaleString()} equivalent FTEs freed). Omilia locks in flat{' '}
              <strong className="font-mono tabular-nums">${inputs.omiliaOutcomeRate.toFixed(2)}/resolved</strong>{' '}
              pricing with zero pass-through token, ASR, or TTS volatility during{' '}
              <strong className="font-mono tabular-nums">{inputs.surge.toFixed(1)}x</strong> volume surges—compressing
              further to{' '}
              <strong className="font-mono tabular-nums">
                ${payback.omiliaUnitRatesByYear.yr3.toFixed(2)}/resolved
              </strong>{' '}
              by Year 3 via the Offline Self-Learning Closed Loop. Using{' '}
              <strong className="font-semibold">AI Bootstrapping (95%+ Day-1 accuracy)</strong>, Phase 1 goes live
              in <strong className="font-semibold">{hleeTimelineLabel}</strong> (
              <span className="font-mono tabular-nums">{formatCurrencyFull(payback.implementationCost)}</span> PS) vs.{' '}
              {comp.timeToValueLabel} ({comp.setupRangeLabel}) on {comp.shortLabel}, keeping your CCaaS choice 100%
              portable inside a zero-egress security perimeter.
            </p>
          </section>

          {/* CFO Breakdown & Containment Sensitivity Table */}
          <section className="print:break-before-page rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                    {tableView === 'cfo'
                      ? 'CFO Financial & Architectural Impact Breakdown'
                      : 'Containment Sensitivity Matrix (±10% Execution Bands)'}
                  </h2>
                  <InfoTooltip
                    label="CFO Breakdown vs. Sensitivity Matrix"
                    description="Toggle between the line-by-line Legacy vs. Competitor vs. Omilia TCO audit table and the ±10% Containment Sensitivity stress test."
                    tcoImpact="Shows procurement teams that even in a -10% Conservative scenario, Omilia remains strongly ROI-positive."
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tableView === 'cfo'
                    ? `Omilia Sovereign Stack vs. ${comp.title}${
                        isByollm ? ` · ${activeTier.label}` : ''
                      } (${comp.examples})`
                    : 'Stress-tests annual savings, payback months, and FTE capacity across conservative to aggressive containment'}
                </p>
              </div>
              <div className="no-print flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={() => setTableView('cfo')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      tableView === 'cfo'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    CFO Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableView('sensitivity')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      tableView === 'sensitivity'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Sensitivity
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy TCO
                </button>
                <button
                  type="button"
                  onClick={onDownloadCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {tableView === 'cfo' ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <th className="px-6 py-3 font-semibold">Cost &amp; Architectural Dimension</th>
                      <th className="px-4 py-3 text-right font-semibold">Legacy Baseline</th>
                      <th className="px-4 py-3 text-right font-semibold">{comp.tableHeader}</th>
                      <th className="px-6 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">
                        Omilia Sovereign Stack
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        Upfront Implementation &amp; Time-to-Value
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        $0 (Sunk)
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono tabular-nums ${
                          isByollm ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrencyFull(payback.competitorSetupCost)} ({comp.timeToValueLabel})
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                        {formatCurrencyFull(payback.implementationCost)} ({hleeTimelineLabel})
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        Effective Containment Rate
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {Math.round(results.baseCont * 100)}%
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {Math.round(results.diyContainment * 100)}% (latency drop-off)
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                        {Math.round(results.targetCont * 100)}% Blended (90%+ Task Resolution / 96%+ Day-1 NLU)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        Monthly Platform, Metering &amp; Maintenance
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCurrencyFull(results.legacyPlatformSpendMo)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono tabular-nums ${
                          isByollm ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrencyFull(results.diyPlatformSpendMo)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                        {formatCurrencyFull(results.omiliaPlatformSpendMo)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        <span className="inline-flex items-center gap-1.5">
                          <span>Residual &amp; Retained Payroll ({results.laborRealizationPct}% P&amp;L Capture)</span>
                          <InfoTooltip
                            label="Residual & Retained Payroll"
                            description={`Reflects active escalation labor PLUS the ${100 - results.laborRealizationPct}% of freed W2 payroll deliberately retained in operations (Reclaimed Capacity) instead of assuming Day-1 layoffs.`}
                            tcoImpact="Ensures Hard P&L Break-Even and 3-year totals only count cash savings captured through attrition, BPO flex-down, and hiring avoidance."
                          />
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCurrencyFull(results.legacyHumanCostMo)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCurrencyFull(results.diyHumanCostMo)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {formatCurrencyFull(results.omiliaHumanCostMo)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                      <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-slate-50">
                        3-Year Cumulative Spend (Incl. Setup &amp; Compression)
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatCurrencyCompact(payback.threeYearLegacyTotal)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold tabular-nums ${
                          isByollm ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrencyCompact(payback.threeYearDiyTotal)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatCurrencyCompact(payback.threeYearOmiliaTotal)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        Turn Latency, Sovereignty &amp; Lock-In
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                        Legacy IVR
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-medium ${
                          isByollm ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {comp.turnLatencyLabel} · {comp.egressLabel}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        &lt;1s (&lt;45ms Lexis) · Zero Egress · CCaaS Neutral
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <th className="px-6 py-3 font-semibold">Scenario Band</th>
                      <th className="px-4 py-3 text-right font-semibold">Target Containment</th>
                      <th className="px-4 py-3 text-right font-semibold">Annual Net Savings</th>
                      <th className="px-4 py-3 text-right font-semibold">3-Yr vs. {comp.shortLabel}</th>
                      <th className="px-4 py-3 text-right font-semibold">Payback</th>
                      <th className="px-6 py-3 text-right font-semibold">FTEs Freed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sensitivity.map((row, idx) => {
                      const isExpected = idx === 1;
                      return (
                        <tr
                          key={row.label}
                          className={
                            isExpected
                              ? 'bg-teal-50/60 dark:bg-teal-950/30 font-semibold'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }
                        >
                          <td className="px-6 py-3.5 text-slate-900 dark:text-slate-100">{row.label}</td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums text-teal-700 dark:text-teal-400">
                            {row.targetContainmentPct}%
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                            {formatCurrencyCompact(row.annualNetSavings)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {formatCurrencyCompact(row.threeYearVsCompetitor)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {row.paybackMonths !== null ? `${row.paybackMonths.toFixed(1)} mo` : 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                            {Math.round(row.ftesFreed).toLocaleString()} FTEs
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {tableView === 'cfo' && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Note:</span>{' '}
                Blended Containment measures total contact-center-wide call deflection across all inbound traffic, while{' '}
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">96%+ Day-1 NLU</span> and{' '}
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">90%+ Task Resolution</span>{' '}
                reflect Day-1 AI Bootstrapped intent accuracy and in-scope workflow completion.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Print-Only Unit Economics Assumptions Summary */}
      <section className="print-only rounded-xl border border-slate-300 bg-white p-5 mt-4">
        <h3 className="font-display text-sm font-bold text-slate-900">
          Unit Economics &amp; Contact Center Assumptions Summary — {preset.name}
        </h3>
        <table className="mt-3 w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600">
              <th className="py-2 pr-4">Volume &amp; Commercial Inputs</th>
              <th className="py-2 pr-4">Value</th>
              <th className="py-2 pr-4">Workforce &amp; Modeling Inputs</th>
              <th className="py-2">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            <tr>
              <td className="py-2 pr-4 font-medium">Monthly Inbound Call Volume</td>
              <td className="py-2 pr-4 font-mono">
                {inputs.callVolume.toLocaleString()} ({Math.round(results.effectiveMonthlyCalls).toLocaleString()} @ {inputs.surge.toFixed(1)}x)
              </td>
              <td className="py-2 pr-4 font-medium">Loaded Human Cost / Call</td>
              <td className="py-2 font-mono">
                ${results.unitHumanCost.toFixed(2)}/call{' '}
                {inputs.cfoOverride ? '(CFO Override)' : `($${inputs.wage}/hr, ${inputs.burden}%, ${inputs.occupancy}%)`}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Containment Lift</td>
              <td className="py-2 pr-4 font-mono">
                {Math.round(results.baseCont * 100)}% → {Math.round(results.targetCont * 100)}% (+{results.containmentLiftPct}%)
              </td>
              <td className="py-2 pr-4 font-medium">TalkGuard &amp; CSR CoPilot</td>
              <td className="py-2">
                TalkGuard: {inputs.talkguard ? `Enabled (-${preset.roi.talkguardSec}s)` : 'Off'} · CoPilot:{' '}
                {inputs.copilot ? `Enabled (-${preset.roi.copilotSec}s)` : 'Off'}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Omilia Outcome Rate ($0 Esc.)</td>
              <td className="py-2 pr-4 font-mono">
                ${inputs.omiliaOutcomeRate.toFixed(2)} Yr1 → ${payback.omiliaUnitRatesByYear.yr3.toFixed(2)} Yr3
              </td>
              <td className="py-2 pr-4 font-medium">Active Agents &amp; Shift Sizing</td>
              <td className="py-2 font-mono">
                {inputs.agents.toLocaleString()} FTEs ({inputs.autoFitAgents !== false ? 'Auto-Fit' : 'Manual'}) · {inputs.shiftHours}h × {inputs.workDays}d
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Competitor Baseline (35% Burn)</td>
              <td className="py-2 pr-4 font-mono">
                {comp.title}
                {isByollm ? ` · ${activeTier.shortLabel}` : ''} ({comp.setupRangeLabel})
              </td>
              <td className="py-2 pr-4 font-medium">Build Delay &amp; Traffic Ramp</td>
              <td className="py-2 font-mono">
                {payback.omiliaBuildMonths.toFixed(1)}m Omilia build + 2m ramp (25%→60%→100%)
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Hard P&amp;L Labor Realization</td>
              <td className="py-2 pr-4 font-mono">
                {results.laborRealizationPct}% (Zero Day-1 Layoffs)
              </td>
              <td className="py-2 pr-4 font-medium">Reclaimed Queue Capacity</td>
              <td className="py-2 font-mono">
                {formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr ({Math.round(results.ftesFreed).toLocaleString()} FTEs freed)
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};
