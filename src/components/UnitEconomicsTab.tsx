import React from 'react';
import { Copy, Printer, RotateCcw } from 'lucide-react';
import { VerticalPreset } from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  RoiInputs,
  RoiResults,
} from '../utils/calculations';

interface UnitEconomicsTabProps {
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  onUpdateInput: <K extends keyof RoiInputs>(key: K, val: RoiInputs[K]) => void;
  onApplyLaborPreset: (wage: number, burden: number) => void;
  onAutoFitFtes: () => void;
  onResetVerticalDefaults: () => void;
  onCopySummary: () => void;
}

export const UnitEconomicsTab: React.FC<UnitEconomicsTabProps> = ({
  preset,
  inputs,
  results,
  onUpdateInput,
  onApplyLaborPreset,
  onAutoFitFtes,
  onResetVerticalDefaults,
  onCopySummary,
}) => {
  const bars = [
    {
      label: 'Legacy Human + IVR',
      sub: `${Math.round(results.baseCont * 100)}% baseline containment`,
      val: results.annualLegacy,
      colorClass: 'bg-slate-400 dark:bg-slate-600',
      textClass: 'text-slate-700 dark:text-slate-300',
    },
    {
      label: 'DIY Frontier LLM Stack',
      sub: `${Math.round(results.diyContainment * 100)}% w/ token retry drift`,
      val: results.annualDiy,
      colorClass: 'bg-rose-600 dark:bg-rose-500',
      textClass: 'text-rose-700 dark:text-rose-400',
    },
    {
      label: 'Omilia OCP Platform',
      sub: `${Math.round(results.targetCont * 100)}% blended · $${inputs.omiliaOutcomeRate.toFixed(2)}/res`,
      val: results.annualOmilia,
      colorClass: 'bg-teal-600 dark:bg-teal-500',
      textClass: 'text-teal-700 dark:text-teal-400',
    },
  ];

  const maxBarScale = Math.max(results.chartScaleMax, results.annualLegacy, results.annualDiy, results.annualOmilia, 1);

  return (
    <div className="space-y-6">
      {/* 5-Column Executive KPI Strip — Single-elevation flat architectural grid */}
      <section aria-label="Key Financial and Capacity Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Annual Net Savings
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-teal-700 dark:text-teal-400">
              {formatCurrencyCompact(results.annualNetSavings)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {formatCurrencyCompact(results.monthlyNetSavings)} / mo vs. baseline
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              3-Year TCO vs. DIY LLM
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              {formatCurrencyCompact(results.threeYearDiySavings)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Saved vs. frontier token + glue tax
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Containment Lift
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              +{results.containmentLiftPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {Math.round(results.omiliaAutomatedCalls).toLocaleString()} calls automated/mo
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Days / Mo per Agent Saved
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-teal-700 dark:text-teal-400">
              {results.daysSavedPerAgentMo.toFixed(1)} days
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {Math.round(results.totalHoursSavedMo).toLocaleString()} hrs/mo reclaimed
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Equivalent FTEs Freed
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
              {Math.round(results.ftesFreed).toLocaleString()} FTEs
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Loaded human cost: ${results.unitHumanCost.toFixed(2)}/call
            </div>
          </div>
        </div>
      </section>

      {/* Main 12-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Volume & Surge Profile */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  Contact Center Volume &amp; Surge Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {preset.name} baseline assumptions
                </p>
              </div>
              <button
                type="button"
                onClick={onResetVerticalDefaults}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                title="Reset inputs to vertical preset defaults"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="inpCallVolume" className="font-medium text-slate-700 dark:text-slate-300">
                    Monthly Inbound Call Volume
                  </label>
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
                  <label htmlFor="inpBaseContainment" className="font-medium text-slate-700 dark:text-slate-300">
                    Baseline Legacy IVR Containment
                  </label>
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
                  <label htmlFor="inpTargetContainment" className="font-medium text-slate-700 dark:text-slate-300">
                    Target Omilia OCP Containment
                  </label>
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
                  <label htmlFor="inpOmiliaOutcomeRate" className="font-medium text-slate-700 dark:text-slate-300">
                    Omilia Outcome Rate ($ / Resolved Call)
                  </label>
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
                  <label htmlFor="inpAht" className="font-medium text-slate-700 dark:text-slate-300">
                    Average Handle Time (AHT)
                  </label>
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
                  <label htmlFor="inpSurge" className="font-medium text-slate-700 dark:text-slate-300">
                    Seasonal / Outage Peak Surge Multiplier
                  </label>
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
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                Agent Cost Shaping &amp; AI Assist
              </h2>
              <button
                type="button"
                onClick={onAutoFitFtes}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                title="Size active agents to residual uncontained volume"
              >
                Auto-Fit FTEs
              </button>
            </div>

            {/* Labor Location Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
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
            </div>

            {/* Bottom-up Labor Inputs */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="inpWage" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Base Wage ($/hr)
                </label>
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
                <label htmlFor="inpBurden" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Burden / Overhead (%)
                </label>
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
                <label htmlFor="inpOccupancy" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Occupancy (%)
                </label>
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
                <label htmlFor="inpAcw" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  After-Call Work (ACW s)
                </label>
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
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Direct CFO Cost-per-Call Override
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

              <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    TalkGuard Passive Voice Biometrics
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Eliminates {preset.roi.talkguardSec}s KBA interrogation in ~6s natural speech
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={inputs.talkguard}
                  onChange={(e) => onUpdateInput('talkguard', e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    CSR CoPilot Real-Time Agent Assist
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auto-summarizes escalated calls (-{preset.roi.copilotSec}s ACW reduction)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={inputs.copilot}
                  onChange={(e) => onUpdateInput('copilot', e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </label>
            </div>

            {/* Workforce Shift Sizing */}
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <label htmlFor="inpAgents" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Agents
                </label>
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
                <label htmlFor="inpShiftHours" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Shift Hrs/Day
                </label>
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
                <label htmlFor="inpWorkDays" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Work Days/Mo
                </label>
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
          </section>
        </div>

        {/* Right Visualizations & CFO Table (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Annualized TCO Bar Comparison */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  Annualized TCO Comparison: Human Baseline vs. DIY Frontier LLM vs. Omilia OCP
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scaled to 4.0x surge ceiling · Includes peak retry tax &amp; residual human escalation labor
                </p>
              </div>
              <div className="font-mono text-xs font-semibold tabular-nums text-teal-700 dark:text-teal-400 shrink-0">
                ${inputs.omiliaOutcomeRate.toFixed(2)} / resolved outcome
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {bars.map((bar) => {
                const widthPct = Math.max(4, Math.min(100, (bar.val / maxBarScale) * 100));
                return (
                  <div key={bar.label}>
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

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>
                Surge impact at <strong className="font-mono text-slate-700 dark:text-slate-200">{inputs.surge.toFixed(1)}x</strong>:{' '}
                DIY token burn scales nonlinearly (×{Math.pow(inputs.surge, 1.38).toFixed(2)}), whereas Omilia outcome pricing stays flat.
              </span>
              <span className="font-mono tabular-nums">
                Annual DIY vs. Omilia delta: {formatCurrencyCompact(Math.max(0, results.annualDiy - results.annualOmilia))}
              </span>
            </div>
          </section>

          {/* CFO Breakdown Table */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  CFO Financial &amp; Operational Impact Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Vertically Integrated Speech-to-Speech Stack vs. Fragmented APIs
                </p>
              </div>
              <div className="no-print flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy TCO Summary
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <th className="px-6 py-3 font-semibold">Cost &amp; Operational Dimension</th>
                    <th className="px-4 py-3 text-right font-semibold">Legacy Baseline</th>
                    <th className="px-4 py-3 text-right font-semibold">DIY Frontier LLM</th>
                    <th className="px-6 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">
                      Omilia OCP Platform
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      Effective Containment Rate
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {Math.round(results.baseCont * 100)}%
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {Math.round(results.diyContainment * 100)}% (token drift)
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                      {Math.round(results.targetCont * 100)}% Blended
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      Monthly Platform &amp; AI Spend
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatCurrencyFull(results.legacyPlatformSpendMo)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-rose-700 dark:text-rose-400">
                      {formatCurrencyFull(results.diyPlatformSpendMo)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                      {formatCurrencyFull(results.omiliaPlatformSpendMo)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      Residual Human Escalation Cost
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
                      Annualized Total Cost (TCO)
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrencyFull(results.annualLegacy)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400">
                      {formatCurrencyFull(results.annualDiy)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrencyFull(results.annualOmilia)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      Data Sovereignty &amp; Egress
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                      On-Prem / Legacy
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-rose-700 dark:text-rose-400">
                      Public Frontier Egress
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                      Zero Frontier Egress
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
              <th className="py-2 pr-4">Volume &amp; Containment Inputs</th>
              <th className="py-2 pr-4">Value</th>
              <th className="py-2 pr-4">Workforce &amp; AI Assist Inputs</th>
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
          </tbody>
        </table>
      </section>
    </div>
  );
};
