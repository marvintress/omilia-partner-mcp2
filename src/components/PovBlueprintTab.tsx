import React from 'react';
import { ArrowRight, Check, Copy, Printer, RotateCcw } from 'lucide-react';
import {
  CompetitorProfile,
  PovBackendMode,
  PovCommercialModel,
  PovConfig,
  PovScopeStrategy,
  VerticalPreset,
} from '../data/verticalPresets';
import {
  formatCurrencyFull,
  HleeResult,
  isTopRightQuadrant,
  PovPlanResult,
} from '../utils/calculations';
import { InfoTooltip } from './InfoTooltip';

interface PovBlueprintTabProps {
  preset: VerticalPreset;
  competitorProfile: CompetitorProfile;
  povConfig: PovConfig;
  povPlan: PovPlanResult;
  hlee: HleeResult;
  phase1ImplementationCost: number;
  onUpdatePov: <K extends keyof PovConfig>(key: K, val: PovConfig[K]) => void;
  onResetPov: () => void;
  onCopyCharter: () => void;
  onGoToRadar: () => void;
  onGoToScoping: () => void;
}

export const PovBlueprintTab: React.FC<PovBlueprintTabProps> = ({
  preset,
  competitorProfile,
  povConfig,
  povPlan,
  hlee,
  phase1ImplementationCost,
  onUpdatePov,
  onResetPov,
  onCopyCharter,
  onGoToRadar,
  onGoToScoping,
}) => {
  const backendModes: {
    key: PovBackendMode;
    title: string;
    detail: string;
    badge: string;
  }[] = [
    {
      key: 'sandbox_mock',
      title: 'Synthetic / OpenAPI Sandbox Stub',
      detail: 'Mocked JSON payloads from prospect schemas inside Omilia sandbox—zero firewall or InfoSec tickets.',
      badge: '2–3 Wks · Low Risk',
    },
    {
      key: 'nonprod_api',
      title: 'Non-Prod Test API / MCP Bridge',
      detail: 'Live JSON-RPC 2.0 / REST lookup into customer staging environment with mTLS test credentials.',
      badge: '3 Wks · Allowlist',
    },
    {
      key: 'talkguard_sip',
      title: 'Live SIP Trunk + TalkGuard Leg',
      detail: 'End-to-end carrier audio path plus passive voice biometric & deepfake anti-spoof validation.',
      badge: '3–4 Wks · Full Audio',
    },
  ];

  const commercialOptions: {
    key: PovCommercialModel;
    title: string;
    desc: string;
  }[] = [
    {
      key: 'funded_credited',
      title: 'Funded Fixed-Fee POV (100% Credited to Phase 1)',
      desc: 'Filters tire-kickers while keeping net Phase 1 cost zero incremental spend once Exit Criteria pass.',
    },
    {
      key: 'co_sell_free',
      title: 'Partner-Funded Co-Sell POV ($0 Client Fee)',
      desc: 'Strict 3-week, 2-intent cap backed by signed Exit Criteria and automatic Phase 1 conversion.',
    },
    {
      key: 'paid_pilot',
      title: 'Production-Path Paid Pilot',
      desc: 'Deploys directly on production-grade OCP infrastructure so pilot flows carry straight into live traffic.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4-Column Executive POV Strip */}
      <section aria-label="POV Summary Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>AI-Bootstrapped POV Timeline</span>
              <InfoTooltip
                label="AI-Bootstrapped POV Timeline"
                description="Elapsed weeks from kickoff to Week-3 exit sign-off based on backend isolation mode (Sandbox Stub vs. Non-Prod API vs. Live SIP + TalkGuard)."
                tcoImpact="Compressing validation from 8–16 weeks to 2–4 weeks pulls forward Phase 1 monthly savings by 1–3 quarters."
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-teal-700 dark:text-teal-400">
              {povPlan.povDurationLabel}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              vs. {povPlan.competitorPovDurationLabel} on {competitorProfile.shortLabel}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Bounded Hero Scope</span>
              <InfoTooltip
                label="Bounded Hero Scope"
                description="Locks POV scope to 1–3 high-feasibility intents selected by your strategy (Hybrid defaults to top Top-Right API workflow + Bottom-Right Quick-Win RAG/FAQ)."
                tcoImpact="Enforces 80/20 scope discipline so engineering proves real containment cleanly before expanding to full Phase 1."
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              {povPlan.heroIntents.length} {povPlan.heroIntents.length === 1 ? 'Intent' : 'Intents'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {povConfig.scopeStrategy === 'hybrid'
                ? 'Hybrid: Top-Right + Bottom-Right'
                : povConfig.scopeStrategy === 'top_right'
                ? 'Top-Right AI Radar'
                : 'Bottom-Right AI Radar'}{' '}
              · {povPlan.infosecGateRisk}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>POV Fee &amp; Phase 1 Credit</span>
              <InfoTooltip
                label="POV Fee & Phase 1 Credit"
                description="Displays fixed POV investment and the dollar credit applied toward the Phase 1 SOW once Exit Criteria pass."
                tcoImpact="Under Funded-Credited terms, 100% of the POV fee rolls directly into Phase 1 PS, keeping net 36-month TCO unchanged."
              />
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              {povPlan.effectiveFeeUsd === 0 ? '$0 (Co-Sell)' : formatCurrencyFull(povPlan.effectiveFeeUsd)}
            </div>
            <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 tabular-nums font-medium">
              {povPlan.phase1CreditUsd > 0
                ? `${formatCurrencyFull(povPlan.phase1CreditUsd)} credited 100% to Phase 1`
                : povConfig.commercialModel === 'paid_pilot'
                ? 'Production runtime carries to Phase 1'
                : 'Strict 80/20 cap on free trial'}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Conversion Exit Gate</span>
              <InfoTooltip
                label="Conversion Exit Gate"
                description="Signed Day-1 NLU, Task Resolution, and <1s End-to-End Voice Latency thresholds required to auto-trigger Phase 1 SOW."
                tcoImpact="Tie-breaks subjective demos with hard metrics aligned directly to your CFO Unit Economics targets."
                align="right"
              />
            </div>
            <div className="mt-1.5 font-display text-xl font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
              {povConfig.nluTargetPct}% NLU · {povConfig.taskTargetPct}% Task
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              &lt;{povConfig.latencyTargetMs.toLocaleString()}ms E2E · Zero Frontier Egress
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: POV Scoping & Exit Criteria Controls — summarized in print-only Charter table */}
        <div className="no-print lg:col-span-5 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  Initial POV / POC Scope Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bounded validation gate prior to {hlee.timelineLabel} Phase 1 SOW
                </p>
              </div>
              <button
                type="button"
                onClick={onResetPov}
                className="no-print inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset POV
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* POV Intent Mix Strategy */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <span>POV Intent Selection Strategy</span>
                  <InfoTooltip
                    label="POV Intent Strategy"
                    description="Hybrid (default) selects the highest-feasibility Top-Right transactional workflow PLUS the highest-feasibility Bottom-Right Quick-Win RAG/FAQ workflow from AI Radar."
                    tcoImpact="Combines high-impact core API containment with zero-friction Week-1 RAG deflection to prove both deterministic and generative capabilities in one 2–3 week POV."
                  />
                </div>
                <div
                  role="group"
                  aria-label="POV Intent Selection Strategy"
                  className="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950"
                >
                  {(
                    [
                      { key: 'hybrid', label: 'Hybrid (TR + BR)' },
                      { key: 'top_right', label: 'Top-Right Only' },
                      { key: 'bottom_right', label: 'Bottom-Right Only' },
                    ] as { key: PovScopeStrategy; label: string }[]
                  ).map((opt) => {
                    const active = (povConfig.scopeStrategy ?? 'hybrid') === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => onUpdatePov('scopeStrategy', opt.key)}
                        className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-white text-teal-800 shadow-xs font-semibold dark:bg-slate-800 dark:text-teal-300'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hero Intent Cap */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <label htmlFor="inpPovIntents" className="font-medium text-slate-700 dark:text-slate-300">
                      Bounded Hero Intents (From AI Radar)
                    </label>
                    <InfoTooltip
                      label="Bounded Hero Intents"
                      description="Caps the initial POV to 1–3 highest-feasibility workflows matching your strategy (Hybrid pulls top-feasibility Top-Right + Bottom-Right)."
                      tcoImpact="Prevents unbounded 'science project' POCs that burn partner SE hours without accelerating time-to-value or TCO realization."
                    />
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                    {povConfig.intentCount} {povConfig.intentCount === 1 ? 'Intent' : 'Intents'}
                  </span>
                </div>
                <input
                  id="inpPovIntents"
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={povConfig.intentCount}
                  onChange={(e) => onUpdatePov('intentCount', Number(e.target.value))}
                />

                {/* Preview of locked hero intents */}
                <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>
                        Auto-Selected {povConfig.scopeStrategy === 'hybrid' ? 'Hybrid ' : ''}Workflows ({preset.shortName})
                      </span>
                      <InfoTooltip
                        label="Auto-Selected Hero Workflows"
                        description="Automatically picks the highest-feasibility workflows from your active AI Radar portfolio matching the selected strategy (Hybrid = top-feasibility Top-Right + Bottom-Right)."
                        tcoImpact="Ensures every POV showcases immediate, high-confidence Day-1 containment without stalling on low-readiness <50F integrations."
                      />
                    </span>
                    <button
                      type="button"
                      onClick={onGoToRadar}
                      className="text-[11px] font-semibold text-teal-700 hover:underline dark:text-teal-400 cursor-pointer"
                    >
                      Edit in AI Radar →
                    </button>
                  </div>
                  {povPlan.heroIntents.length === 0 ? (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      No matching High-Feasibility (≥50F) use cases enabled in AI Radar.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {povPlan.heroIntents.map((uc, idx) => {
                        const isTr = isTopRightQuadrant(uc);
                        return (
                          <li
                            key={uc.id}
                            className="flex items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-300"
                          >
                            <span className="truncate font-medium">
                              {idx + 1}. {uc.name}
                            </span>
                            <span
                              className={`font-mono text-[10.5px] tabular-nums shrink-0 ${
                                isTr
                                  ? 'text-teal-700 dark:text-teal-400'
                                  : 'text-sky-700 dark:text-sky-400'
                              }`}
                            >
                              {uc.feas}F/{uc.imp}I · {isTr ? 'Top-Right' : 'Bottom-Right'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Backend Isolation Mode */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <span>Backend Integration &amp; InfoSec Isolation</span>
                  <InfoTooltip
                    label="Backend Isolation Mode"
                    description="Controls whether the POV runs on OpenAPI/JSON sandbox stubs (no InfoSec wait) or connects to live non-prod APIs / SIP legs."
                    tcoImpact="Using Synthetic/Sandbox stubs keeps POV kickoff under 5 business days so Phase 1 TCO savings start months sooner."
                  />
                </div>
                <div className="space-y-2">
                  {backendModes.map((m) => {
                    const active = povConfig.backendMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => onUpdatePov('backendMode', m.key)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                          active
                            ? 'border-teal-600 bg-teal-50/70 dark:border-teal-500 dark:bg-teal-950/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {m.title}
                          </span>
                          <span className="font-mono text-[10.5px] font-semibold tabular-nums text-teal-700 dark:text-teal-400 shrink-0">
                            {m.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          {m.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commercial Structure */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <label
                    htmlFor="selPovCommercial"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    POV Commercial Structure
                  </label>
                  <InfoTooltip
                    label="POV Commercial Structure"
                    description="Defines whether the POV is Partner Co-Sell ($0), Funded & 100% Credited toward Phase 1 SOW, or a Production-Path Pilot."
                    tcoImpact="Funded-Credited POVs secure executive sponsor commitment without increasing net 36-month TCO—100% credits into Phase 1 PS."
                  />
                </div>
                <select
                  id="selPovCommercial"
                  value={povConfig.commercialModel}
                  onChange={(e) => onUpdatePov('commercialModel', e.target.value as PovCommercialModel)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {commercialOptions.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {commercialOptions.find((c) => c.key === povConfig.commercialModel)?.desc}
                </p>

                {povConfig.commercialModel !== 'co_sell_free' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="inline-flex items-center gap-1.5">
                        <label htmlFor="inpPovFee" className="text-slate-600 dark:text-slate-400">
                          Fixed POV Fee (USD)
                        </label>
                        <InfoTooltip
                          label="Fixed POV Fee (USD)"
                          description="Fixed commercial fee for the 2–4 week POV sprint ($10K–$50K). Credited 100% toward Phase 1 PS when Funded-Credited is selected."
                          tcoImpact="Zero net incremental 36-month TCO impact under Funded-Credited terms while establishing formal buyer commitment."
                        />
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatCurrencyFull(povConfig.povFeeUsd)}
                      </span>
                    </div>
                    <input
                      id="inpPovFee"
                      type="range"
                      min={10000}
                      max={50000}
                      step={2500}
                      value={povConfig.povFeeUsd}
                      onChange={(e) => onUpdatePov('povFeeUsd', Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {/* Quantitative Exit Criteria Thresholds */}
              <div className="border-t border-slate-100 pt-4 space-y-3.5 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>Success Exit Criteria Thresholds</span>
                  <InfoTooltip
                    label="Exit Criteria Thresholds"
                    description="Quantitative benchmarks written into the POV Charter that trigger automatic progression to the Phase 1 SOW."
                    tcoImpact="Replaces subjective POC evaluations with verifiable Day-1 NLU, Task Resolution, and Latency proof tied to the ROI model."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="inline-flex items-center gap-1.5">
                      <label htmlFor="inpNluTarget" className="text-slate-600 dark:text-slate-400">
                        Day-1 Bootstrapped NLU Target
                      </label>
                      <InfoTooltip
                        label="Day-1 NLU Accuracy Gate"
                        description="Minimum intent & entity recognition pass rate measured against a blind hold-out set of real prospect utterances."
                        tcoImpact="96%+ Day-1 NLU eliminates months of manual utterance labeling required by DIY stacks and packaged BYOLLM tools."
                      />
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                      ≥ {povConfig.nluTargetPct}%
                    </span>
                  </div>
                  <input
                    id="inpNluTarget"
                    type="range"
                    min={90}
                    max={99}
                    step={1}
                    value={povConfig.nluTargetPct}
                    onChange={(e) => onUpdatePov('nluTargetPct', Number(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="inline-flex items-center gap-1.5">
                      <label htmlFor="inpTaskTarget" className="text-slate-600 dark:text-slate-400">
                        In-Scope Task Resolution Target
                      </label>
                      <InfoTooltip
                        label="In-Scope Task Resolution Gate"
                        description="Target end-to-end completion rate across the bounded hero workflows (happy paths + multi-turn error recovery)."
                        tcoImpact="Proves workflow-level containment (90%+) required to achieve the full contact-center Blended Containment target."
                      />
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                      ≥ {povConfig.taskTargetPct}%
                    </span>
                  </div>
                  <input
                    id="inpTaskTarget"
                    type="range"
                    min={80}
                    max={98}
                    step={1}
                    value={povConfig.taskTargetPct}
                    onChange={(e) => onUpdatePov('taskTargetPct', Number(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="inline-flex items-center gap-1.5">
                      <label htmlFor="inpLatencyTarget" className="text-slate-600 dark:text-slate-400">
                        End-to-End Voice Turn Latency Gate
                      </label>
                      <InfoTooltip
                        label="Voice Latency SLA Gate"
                        description="Maximum allowed conversational turnaround (ASR + Dialog + Parallel MCP + <45ms Lexis TTS) well below the 1,200ms caller hang-up threshold."
                        tcoImpact="Prevents the 1.8s–3.5s dead-air drop-off that cuts competitor effective containment by 6–11 points."
                      />
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      &lt; {povConfig.latencyTargetMs.toLocaleString()} ms
                    </span>
                  </div>
                  <input
                    id="inpLatencyTarget"
                    type="range"
                    min={600}
                    max={1200}
                    step={50}
                    value={povConfig.latencyTargetMs}
                    onChange={(e) => onUpdatePov('latencyTargetMs', Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <label htmlFor="chkPovTalkguard" className="cursor-pointer">
                      Include TalkGuard Biometric &amp; Deepfake Gate
                    </label>
                    <InfoTooltip
                      label="TalkGuard Biometric POV Gate"
                      description="Adds passive ~6s voiceprint verification and synthetic deepfake screening validation to the POV Exit Criteria Scorecard."
                      tcoImpact={`Demonstrates how KBA drops by -${preset.roi.talkguardSec}s even on calls that escalate to live human agents.`}
                    />
                  </span>
                  <input
                    id="chkPovTalkguard"
                    type="checkbox"
                    checked={povConfig.includeTalkguardTest}
                    onChange={(e) => onUpdatePov('includeTalkguardTest', e.target.checked)}
                    className="h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right 7 Columns (Full 12-Col Width in PDF Print): 3-Week Sprint Plan, Exit Gate Scorecard, Prerequisites */}
        <div className="lg:col-span-7 print:col-span-12 space-y-6">
          {/* Speed Comparison & 3-Week Sprint Timeline */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                    AI-Bootstrapped Sprint Plan ({povPlan.povDurationLabel})
                  </h2>
                  <InfoTooltip
                    label="AI-Bootstrapped Sprint Plan"
                    description="Week-by-week mutual execution plan contrasting Omilia's 2–3 week AI-Bootstrapped POV against competitor multi-vendor or custom builds."
                    tcoImpact="Compressing POV-to-Launch by 4–8 weeks pulls forward monthly contact center TCO savings."
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Time-to-Value vs. {competitorProfile.title} ({povPlan.competitorPovDurationLabel})
                </p>
              </div>
              <div className="no-print flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Export PDF
                </button>
                <button
                  type="button"
                  onClick={onCopyCharter}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy POV Charter
                </button>
                <button
                  type="button"
                  onClick={onGoToScoping}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
                >
                  Phase 1 SOW ({hlee.timelineLabel})
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Warnings if scope exceeds safe bounds */}
            {povPlan.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {povPlan.warnings.map((w) => (
                  <div
                    key={w}
                    className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                  >
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* 3-Column Sprint Breakdown */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/50">
              {povPlan.sprintWeeks.map((week) => (
                <div key={week.weekLabel} className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400">
                      {week.weekLabel.toUpperCase()}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      {week.owner}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {week.title}
                  </h3>
                  <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {week.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Conversion Trigger Callout */}
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900/60 dark:bg-teal-950/25">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-50">
                  POV-to-Phase 1 Mutual Conversion Gate
                </span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                  Phase 1 SOW: {formatCurrencyFull(phase1ImplementationCost)} total PS
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {povPlan.conversionClause}
              </p>
            </div>
          </section>

          {/* Binary Exit Criteria Scorecard */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  Quantitative Exit Criteria Scorecard
                </h2>
                <InfoTooltip
                  label="Quantitative Exit Criteria Scorecard"
                  description="Objective pass/fail gates across Blind NLU Accuracy, Task Resolution, End-to-End Voice Latency, Sovereign Data Perimeter, and optional TalkGuard Biometrics."
                  tcoImpact="Prevents indefinite pilot extensions by converting technical proof directly into signed Phase 1 SOW execution."
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verifiable go/no-go pass gates signed prior to Week 1 kickoff
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <th className="px-6 py-3 font-semibold">Exit Gate Metric</th>
                    <th className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-400">Pass Threshold</th>
                    <th className="px-4 py-3 font-semibold">Verification Method</th>
                    <th className="px-6 py-3 font-semibold text-right">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {povPlan.exitGates.map((gate) => (
                    <tr key={gate.metric} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {gate.metric}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {gate.threshold}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {gate.measurement}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {gate.scope}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Day-1 Customer Prerequisites */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                Day-1 Prospect Prerequisites (Zero-Delay Checklist)
              </h2>
              <InfoTooltip
                label="Day-1 Prospect Prerequisites"
                description="Lightweight buyer inputs needed prior to Day 1—automatically adapts if you switch between Sandbox Stubs, Non-Prod APIs, or Live SIP + TalkGuard."
                tcoImpact="Completing prerequisites upfront eliminates mid-POV bottlenecks so the 2–3 week timeline holds firm."
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Required prior to Week 1 so AI Bootstrapping hits 96%+ Day-1 NLU without schedule slippage
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              {povPlan.prerequisites.map((req, idx) => (
                <li
                  key={req}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <span className="font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400 shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Print-Only POV Charter Summary Table */}
      <section className="print-only rounded-xl border border-slate-300 bg-white p-5 mt-4">
        <h3 className="font-display text-sm font-bold text-slate-900">
          Initial POV / POC Charter &amp; Configuration Summary — {preset.name}
        </h3>
        <table className="mt-3 w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600">
              <th className="py-2 pr-4">POV Dimension</th>
              <th className="py-2 pr-4">Configured Setting</th>
              <th className="py-2">Target Value / Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            <tr>
              <td className="py-2 pr-4 font-medium">Intent Strategy &amp; Timeline</td>
              <td className="py-2 pr-4">{povPlan.scopeStrategyLabel}</td>
              <td className="py-2 font-mono">
                {povPlan.povDurationLabel} (vs. {povPlan.competitorPovDurationLabel} on {competitorProfile.shortLabel})
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Backend &amp; Commercial Terms</td>
              <td className="py-2 pr-4">
                {backendModes.find((m) => m.key === povConfig.backendMode)?.title}
              </td>
              <td className="py-2 font-mono">
                {povPlan.effectiveFeeUsd === 0 ? '$0 Co-Sell' : formatCurrencyFull(povPlan.effectiveFeeUsd)}
                {povPlan.phase1CreditUsd > 0 ? ` (${formatCurrencyFull(povPlan.phase1CreditUsd)} credited to Phase 1)` : ''}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Auto-Selected Hero Workflows</td>
              <td className="py-2 pr-4">{povPlan.heroIntents.length} bounded intents</td>
              <td className="py-2">
                {povPlan.heroIntents
                  .map((u) => `${u.name} (${u.feas}F/${u.imp}I · ${isTopRightQuadrant(u) ? 'TR' : 'BR'})`)
                  .join('; ')}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Conversion Exit Thresholds</td>
              <td className="py-2 pr-4 font-mono">
                ≥{povConfig.nluTargetPct}% NLU · ≥{povConfig.taskTargetPct}% Task · &lt;{povConfig.latencyTargetMs}ms
              </td>
              <td className="py-2">
                {povConfig.includeTalkguardTest
                  ? `Includes TalkGuard Biometrics & Deepfake Screen (-${preset.roi.talkguardSec}s KBA)`
                  : 'Standard Conversational + Zero Frontier Egress Gate'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};
