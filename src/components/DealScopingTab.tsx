import React from 'react';
import { Copy, Printer, RotateCcw, Trash2 } from 'lucide-react';
import {
  ApiReadiness,
  PartnerMotion,
  SovereigntyTier,
  UseCase,
  VerticalPreset,
} from '../data/verticalPresets';
import {
  getUseCasePsDays,
  HleeResult,
  isTopRightQuadrant,
} from '../utils/calculations';
import { InfoTooltip } from './InfoTooltip';

interface DealScopingTabProps {
  preset: VerticalPreset;
  useCases: UseCase[];
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  hlee: HleeResult;
  onChangeMotion: (m: PartnerMotion) => void;
  onChangeSovereignty: (s: SovereigntyTier) => void;
  onChangeApiReadiness: (a: ApiReadiness) => void;
  onSetIntentCount: (count: number) => void;
  onToggleInclude: (id: string) => void;
  onDeleteUseCase: (id: string) => void;
  onRestoreDefaults: () => void;
  onOpenBrief: () => void;
}

export const DealScopingTab: React.FC<DealScopingTabProps> = ({
  preset,
  useCases,
  partnerMotion,
  sovereignty,
  apiReadiness,
  hlee,
  onChangeMotion,
  onChangeSovereignty,
  onChangeApiReadiness,
  onSetIntentCount,
  onToggleInclude,
  onDeleteUseCase,
  onRestoreDefaults,
  onOpenBrief,
}) => {
  const topRightUseCases = useCases.filter(isTopRightQuadrant);
  const includedCount = topRightUseCases.filter((u) => u.included !== false).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 5 Columns: Partner & Architecture Scoping Inputs */}
      <div className="lg:col-span-5 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                Partner &amp; Architecture Scoping Inputs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{preset.name}</p>
            </div>
            <button
              type="button"
              onClick={onRestoreDefaults}
              className="no-print inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reload Defaults
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label
                  htmlFor="selPartnerMotion"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Partner GTM Motion
                </label>
                <InfoTooltip
                  label="Partner GTM Motion"
                  description="Selects CCaaS Co-Sell, Global Systems Integrator (GSI), or BPO Managed CX to tailor co-sell positioning and RACI delivery boundaries."
                  tcoImpact="Clarifies whether the partner captures migration/PS margin (CCaaS/GSI) or recurring AHT & outcome savings (BPO)."
                />
              </div>
              <select
                id="selPartnerMotion"
                value={partnerMotion}
                onChange={(e) => onChangeMotion(e.target.value as PartnerMotion)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ccaas">CCaaS Co-Sell (Genesys Cloud / NICE CXone / AWS Connect)</option>
                <option value="gsi">Global Systems Integrator (Accenture / Deloitte / Cognizant)</option>
                <option value="bpo">BPO Managed CX (Teleperformance / Concentrix)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label
                  htmlFor="selSovereignty"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Deployment Sovereignty Tier
                </label>
                <InfoTooltip
                  label="Deployment Sovereignty Tier"
                  description="Chooses between Managed AWS Certified Walled Garden (OCP SaaS) and On-Premise / Air-Gapped deployment (OCP Bare Metal)."
                  tcoImpact="Bare Metal adds +3 weeks and +12 PS Days for air-gapped node sizing and InfoSec sign-off, affecting Phase 1 upfront implementation TCO."
                />
              </div>
              <select
                id="selSovereignty"
                value={sovereignty}
                onChange={(e) => onChangeSovereignty(e.target.value as SovereigntyTier)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="saas">OCP SaaS (Managed AWS Certified Walled Garden)</option>
                <option value="baremetal">OCP Bare Metal (On-Premise / Air-Gapped Data Center)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <label htmlFor="inpIntentCount" className="font-medium text-slate-700 dark:text-slate-300">
                    Phase 1 Bounded Intents (Top-Right Radar)
                  </label>
                  <InfoTooltip
                    label="Phase 1 Bounded Intents"
                    description="Synced with Top-Right AI Radar checkboxes. Adds 8 base PS days plus 2–3 PS days per intent depending on feasibility."
                    tcoImpact="Keeps Phase 1 scoped to the top 3–5 volume drivers (80/20 rule) so TCO payback begins in 4–6 weeks without PS overruns."
                  />
                </span>
                <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                  {includedCount} {includedCount === 1 ? 'Intent' : 'Intents'}
                </span>
              </div>
              <input
                id="inpIntentCount"
                type="range"
                min={0}
                max={Math.max(1, topRightUseCases.length)}
                step={1}
                value={includedCount}
                onChange={(e) => onSetIntentCount(Number(e.target.value))}
              />
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Includes only Top-Right Quadrant (Feasibility ≥50 &amp; Impact ≥50) intents from AI Radar 2.0.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label
                  htmlFor="selApiReadiness"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Backend API &amp; Middleware Readiness
                </label>
                <InfoTooltip
                  label="Backend API & Middleware Readiness"
                  description="Captures whether core systems expose Modern REST/MCP APIs, Mixed SOAP endpoints, or Legacy Mainframe (z/OS CICS/3270) interfaces."
                  tcoImpact="Mixed SOAP adds +1 wk (+4 PS days) and Mainframe adds +2 wks (+8 PS days), gating out costly 3270 screen-scraping from Phase 1 TCO."
                />
              </div>
              <select
                id="selApiReadiness"
                value={apiReadiness}
                onChange={(e) => onChangeApiReadiness(e.target.value as ApiReadiness)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="modern">Modern REST / GraphQL / MCP-Ready</option>
                <option value="mixed">Mixed REST + Legacy SOAP Endpoints</option>
                <option value="mainframe">Legacy Mainframe (z/OS CICS / MQ / 3270 Screens)</option>
              </select>
            </div>
          </div>

          {/* Vertical Compliance & Target Core Systems — Clean Hairline Section */}
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-4 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Vertical Compliance &amp; Regulatory Perimeter
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {preset.compliance.join(' · ')}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Target Core Systems &amp; Middleware
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {preset.backendStack}
              </p>
            </div>
          </div>

          <div className="no-print mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenBrief}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
            >
              <Copy className="h-3.5 w-3.5" />
              Open / Copy Deal Brief
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
          </div>
        </section>
      </div>

      {/* Right 7 Columns: HLEE Estimate, Included Use Cases, Guardrails, RACI */}
      <div className="lg:col-span-7 space-y-6">
        {/* HLEE Effort Estimate & SOW Guardrails */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                HLEE Effort Estimate &amp; Co-Sell Positioning
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {hlee.positioningHook}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-teal-700 dark:text-teal-400 shrink-0">
              {hlee.badgeLabel}
            </span>
          </div>

          {/* 3-Column HLEE Strip */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Est. Phase 1 Timeline</div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-teal-700 dark:text-teal-400">
                {hlee.timelineLabel}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">AI Bootstrapping accelerates NLU</div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Professional Services Effort</div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {hlee.psEffortLabel}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">Fixed-scope SOW guardrail</div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Core Architecture Guarantee</div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                Zero Egress
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">Sub-300ms MCP + Lexis TTS</div>
            </div>
          </div>

          {/* Included Phase 1 Use Cases */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Included Phase 1 Use Cases (Top-Right Radar Quadrant)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {includedCount} of {topRightUseCases.length} Top-Right intents active in SOW
                </p>
              </div>
            </div>

            {topRightUseCases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No Top-Right Quadrant (Feasibility ≥50 &amp; Impact ≥50) use cases currently plotted on AI Radar 2.0.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800 max-h-60 overflow-y-auto">
                {topRightUseCases.map((uc) => {
                  const isIncluded = uc.included !== false;
                  const psDays = getUseCasePsDays(uc);
                  return (
                    <div
                      key={uc.id}
                      className={`flex items-center justify-between gap-3 py-2.5 ${
                        !isIncluded ? 'opacity-55' : ''
                      }`}
                    >
                      <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => onToggleInclude(uc.id)}
                          className="h-3.5 w-3.5 rounded accent-teal-600 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate text-xs font-semibold text-slate-900 dark:text-slate-100 ${
                              !isIncluded ? 'line-through' : ''
                            }`}
                          >
                            {uc.name}
                          </div>
                          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {uc.runtime}
                          </div>
                        </div>
                      </label>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          {uc.feas}F / {uc.imp}I
                        </span>
                        <span
                          className={`font-mono text-[11px] font-semibold tabular-nums ${
                            isIncluded
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {isIncluded ? `+${psDays} PS Days` : 'Excluded'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteUseCase(uc.id)}
                          aria-label={`Delete ${uc.name}`}
                          className="no-print rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mandatory SOW & Margin Protection Guardrails */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2.5">
              Mandatory SOW &amp; Margin Protection Guardrails
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 list-disc pl-4">
              {hlee.guardrails.map((g, idx) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Partner vs. Omilia RACI Responsibility Matrix */}
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
              Partner vs. Omilia RACI Responsibility Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Clear delivery boundaries to prevent scope creep
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th className="px-6 py-3 font-semibold">Workstream / Deliverable</th>
                  <th className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-400">Omilia Role</th>
                  <th className="px-6 py-3 font-semibold">Partner / Client Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hlee.raciRows.map((row) => (
                  <tr key={row.workstream} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {row.workstream}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-teal-700 dark:text-teal-400">
                      {row.omiliaRole}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{row.partnerRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
