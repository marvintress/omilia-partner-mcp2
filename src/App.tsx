/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AiRadarTab } from './components/AiRadarTab';
import { DealBriefModal } from './components/DealBriefModal';
import { DealScopingTab } from './components/DealScopingTab';
import { McpInspectorTab } from './components/McpInspectorTab';
import { TabKey, TopBar } from './components/TopBar';
import { TsServerModal } from './components/TsServerModal';
import { UnitEconomicsTab } from './components/UnitEconomicsTab';
import { WorkbenchGuideWidget } from './components/WorkbenchGuideWidget';
import { WorkspaceBar } from './components/WorkspaceBar';
import {
  ApiReadiness,
  PartnerMotion,
  SovereigntyTier,
  UseCase,
  VERTICAL_PRESETS,
  VerticalKey,
  VerticalPreset,
} from './data/verticalPresets';
import {
  buildExecutiveDealBrief,
  calculateHlee,
  calculateUnitEconomics,
  computeFittedAgents,
  formatCurrencyCompact,
  isTopRightQuadrant,
  RoiInputs,
} from './utils/calculations';

function buildDefaultUseCases(preset: VerticalPreset): UseCase[] {
  return preset.useCases.map((u, idx) => ({
    ...u,
    id: `${preset.key}-uc-${idx}`,
    included: u.feas >= 50 && u.imp >= 50,
  }));
}

function buildDefaultRoiInputs(preset: VerticalPreset): RoiInputs {
  const baseInputs: RoiInputs = {
    callVolume: preset.roi.callVolume,
    baseContainment: preset.roi.baseContainment,
    targetContainment: preset.roi.targetContainment,
    omiliaOutcomeRate: 0.4,
    aht: preset.roi.aht,
    acw: preset.roi.acw,
    surge: preset.roi.surge,
    wage: preset.roi.wage,
    burden: preset.roi.burden,
    occupancy: preset.roi.occupancy,
    cfoOverride: false,
    cfoOverrideVal: 4.25,
    talkguard: true,
    copilot: true,
    agents: 500,
    shiftHours: 8,
    workDays: 21.5,
  };
  return {
    ...baseInputs,
    agents: computeFittedAgents(baseInputs),
  };
}

const MOTION_LABELS: Record<PartnerMotion, string> = {
  ccaas: 'CCaaS Co-Sell (Genesys Cloud / NICE CXone / AWS Connect)',
  gsi: 'Global Systems Integrator (Accenture / Deloitte / Cognizant)',
  bpo: 'BPO Managed CX (Teleperformance / Concentrix)',
};

const SOVEREIGNTY_LABELS: Record<SovereigntyTier, string> = {
  saas: 'OCP SaaS (Managed AWS Certified Walled Garden)',
  baremetal: 'OCP Bare Metal (On-Premise / Air-Gapped Data Center)',
};

export default function App() {
  const [vertical, setVertical] = useState<VerticalKey>('banking');
  const [activeTab, setActiveTab] = useState<TabKey>('economics');
  const [isDark, setIsDark] = useState<boolean>(false);

  const [roiByVertical, setRoiByVertical] = useState<Record<VerticalKey, RoiInputs>>(() => ({
    banking: buildDefaultRoiInputs(VERTICAL_PRESETS.banking),
    utilities: buildDefaultRoiInputs(VERTICAL_PRESETS.utilities),
    insurance: buildDefaultRoiInputs(VERTICAL_PRESETS.insurance),
    healthcare: buildDefaultRoiInputs(VERTICAL_PRESETS.healthcare),
    telecom: buildDefaultRoiInputs(VERTICAL_PRESETS.telecom),
  }));

  const [useCasesByVertical, setUseCasesByVertical] = useState<Record<VerticalKey, UseCase[]>>(() => ({
    banking: buildDefaultUseCases(VERTICAL_PRESETS.banking),
    utilities: buildDefaultUseCases(VERTICAL_PRESETS.utilities),
    insurance: buildDefaultUseCases(VERTICAL_PRESETS.insurance),
    healthcare: buildDefaultUseCases(VERTICAL_PRESETS.healthcare),
    telecom: buildDefaultUseCases(VERTICAL_PRESETS.telecom),
  }));

  const [selectedUcByVertical, setSelectedUcByVertical] = useState<Record<VerticalKey, string | null>>({
    banking: 'banking-uc-0',
    utilities: 'utilities-uc-0',
    insurance: 'insurance-uc-0',
    healthcare: 'healthcare-uc-0',
    telecom: 'telecom-uc-0',
  });

  const [partnerMotion, setPartnerMotion] = useState<PartnerMotion>('ccaas');
  const [sovereignty, setSovereignty] = useState<SovereigntyTier>('saas');
  const [apiReadiness, setApiReadiness] = useState<ApiReadiness>('modern');

  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefCopied, setBriefCopied] = useState(false);
  const [tsModalOpen, setTsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const notify = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const preset = VERTICAL_PRESETS[vertical];
  const inputs = roiByVertical[vertical];
  const useCases = useCasesByVertical[vertical];
  const selectedUcId = selectedUcByVertical[vertical];

  const roiResults = useMemo(() => calculateUnitEconomics(inputs, preset), [inputs, preset]);

  const includedUseCases = useMemo(
    () => useCases.filter((uc) => isTopRightQuadrant(uc) && uc.included !== false),
    [useCases]
  );

  const hlee = useMemo(
    () => calculateHlee(preset, includedUseCases, partnerMotion, sovereignty, apiReadiness),
    [preset, includedUseCases, partnerMotion, sovereignty, apiReadiness]
  );

  const briefText = useMemo(
    () =>
      buildExecutiveDealBrief({
        preset,
        inputs,
        results: roiResults,
        includedUseCases,
        motionLabel: MOTION_LABELS[partnerMotion],
        sovereigntyLabel: SOVEREIGNTY_LABELS[sovereignty],
        hlee,
      }),
    [preset, inputs, roiResults, includedUseCases, partnerMotion, sovereignty, hlee]
  );

  const handleChangeVertical = (next: VerticalKey) => {
    setVertical(next);
    notify(`Switched vertical to ${VERTICAL_PRESETS[next].name}`);
  };

  const handleUpdateInput = <K extends keyof RoiInputs>(key: K, val: RoiInputs[K]) => {
    setRoiByVertical((prev) => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        [key]: val,
      },
    }));
  };

  const handleApplyLaborPreset = (wage: number, burden: number) => {
    setRoiByVertical((prev) => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        wage,
        burden,
        cfoOverride: false,
      },
    }));
    notify(`Applied labor profile ($${wage}/hr, ${burden}% burden)`);
  };

  const handleAutoFitFtes = () => {
    const fitted = computeFittedAgents(inputs);
    handleUpdateInput('agents', fitted);
    notify(`Auto-fitted active workforce to ${fitted.toLocaleString()} agents`);
  };

  const handleResetVerticalRoi = () => {
    setRoiByVertical((prev) => ({
      ...prev,
      [vertical]: buildDefaultRoiInputs(preset),
    }));
    notify(`Reset ${preset.shortName} assumptions to preset defaults`);
  };

  const handleToggleIncludeUseCase = (id: string) => {
    setUseCasesByVertical((prev) => ({
      ...prev,
      [vertical]: prev[vertical].map((uc) => {
        if (uc.id !== id || !isTopRightQuadrant(uc)) return uc;
        const nextIncluded = uc.included === false;
        notify(nextIncluded ? `Included "${uc.name}" in Phase 1 SOW` : `Excluded "${uc.name}" from Phase 1 SOW`);
        return { ...uc, included: nextIncluded };
      }),
    }));
  };

  const handleDeleteUseCase = (id: string) => {
    const target = useCases.find((u) => u.id === id);
    const nextList = useCases.filter((u) => u.id !== id);
    setUseCasesByVertical((prev) => ({
      ...prev,
      [vertical]: nextList,
    }));
    if (selectedUcId === id) {
      setSelectedUcByVertical((prev) => ({
        ...prev,
        [vertical]: nextList[0]?.id ?? null,
      }));
    }
    if (target) {
      notify(`Removed "${target.name}" from AI Radar`);
    }
  };

  const handleAddCustomUseCase = (name: string, feas: number, imp: number) => {
    const isHighFeas = feas >= 50;
    const inTopRight = feas >= 50 && imp >= 50;
    const newUc: UseCase = {
      id: `${vertical}-custom-${Date.now()}`,
      name,
      feas,
      imp,
      included: inTopRight,
      desc: `Custom prospect call driver scoped live during ${preset.name} discovery.`,
      runtime: isHighFeas
        ? 'Deterministic miniApps® + AI Bootstrapping'
        : 'Autonomous Task Agent + Human-in-the-Loop Gate',
      rollout: isHighFeas
        ? 'Phase 1 (Weeks 1–3): Ingest historical call transcripts & OpenAPI schema for 95%+ Day-1 accuracy.'
        : "Phase 2 ('Training Wheels'): Expose backend API via MCP facade first, then graduate from supervised assist to autonomous execution.",
      gov: 'Glass Box decision logging + zero frontier model egress.',
    };
    setUseCasesByVertical((prev) => ({
      ...prev,
      [vertical]: [...prev[vertical], newUc],
    }));
    setSelectedUcByVertical((prev) => ({
      ...prev,
      [vertical]: newUc.id,
    }));
    notify(
      inTopRight
        ? `Plotted "${name}" in Top-Right Quadrant & added to Phase 1 Scope`
        : `Plotted "${name}" on AI Radar 2.0 (Phase 2/3)`
    );
  };

  const handleClearAllUseCases = () => {
    setUseCasesByVertical((prev) => ({
      ...prev,
      [vertical]: [],
    }));
    setSelectedUcByVertical((prev) => ({
      ...prev,
      [vertical]: null,
    }));
    notify(`Cleared AI Radar canvas for ${preset.shortName}`);
  };

  const handleRestoreDefaults = () => {
    const restored = buildDefaultUseCases(preset);
    setUseCasesByVertical((prev) => ({
      ...prev,
      [vertical]: restored,
    }));
    setSelectedUcByVertical((prev) => ({
      ...prev,
      [vertical]: restored[0]?.id ?? null,
    }));
    notify(`Reloaded default ${preset.shortName} use cases`);
  };

  const handleSetIntentCount = (targetCount: number) => {
    let seenTopRight = 0;
    setUseCasesByVertical((prev) => ({
      ...prev,
      [vertical]: prev[vertical].map((uc) => {
        if (!isTopRightQuadrant(uc)) return uc;
        const included = seenTopRight < targetCount;
        seenTopRight += 1;
        return { ...uc, included };
      }),
    }));
  };

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefText);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 1800);
      notify('Copied Executive Deal Brief to clipboard');
    } catch {
      notify('Clipboard copy unavailable');
    }
  };

  const handleCopyTcoSummary = async () => {
    const tcoSummary = [
      `OMILIA UNIT ECONOMICS & TCO SUMMARY — ${preset.name.toUpperCase()}`,
      `Monthly Inbound Calls: ${inputs.callVolume.toLocaleString()} (${inputs.surge.toFixed(1)}x surge = ${Math.round(roiResults.effectiveMonthlyCalls).toLocaleString()} calls/mo)`,
      `Containment: ${Math.round(roiResults.baseCont * 100)}% Baseline -> ${Math.round(roiResults.targetCont * 100)}% Omilia (+${roiResults.containmentLiftPct}% Lift)`,
      `Annual Net Savings: ${formatCurrencyCompact(roiResults.annualNetSavings)} | 3-Year vs. DIY LLM: ${formatCurrencyCompact(roiResults.threeYearDiySavings)}`,
      `Capacity Reclaimed: ${roiResults.daysSavedPerAgentMo.toFixed(1)} days/agent/mo (${Math.round(roiResults.ftesFreed).toLocaleString()} FTEs freed)`,
      `Annual TCO: Legacy ${formatCurrencyCompact(roiResults.annualLegacy)} | DIY LLM ${formatCurrencyCompact(roiResults.annualDiy)} | Omilia ${formatCurrencyCompact(roiResults.annualOmilia)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(tcoSummary);
      notify('Copied Unit Economics TCO Summary');
    } catch {
      notify('Clipboard copy unavailable');
    }
  };

  const handleCopyRadarSummary = async () => {
    const lines =
      useCases.length > 0
        ? useCases
            .map(
              (uc, i) =>
                `  ${i + 1}. ${uc.name} [${uc.feas}F / ${uc.imp}I — ${
                  isTopRightQuadrant(uc) && uc.included !== false ? 'Phase 1 SOW' : 'Phase 2/3'
                }]\n     Runtime: ${uc.runtime}`
            )
            .join('\n')
        : '  (No use cases plotted)';
    const summary = `OMILIA AI RADAR 2.0 PORTFOLIO — ${preset.name.toUpperCase()}\n${lines}`;
    try {
      await navigator.clipboard.writeText(summary);
      notify('Copied AI Radar 2.0 Discovery Summary');
    } catch {
      notify('Clipboard copy unavailable');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenBrief={() => setBriefModalOpen(true)}
      />

      <WorkspaceBar
        vertical={vertical}
        preset={preset}
        onChangeVertical={handleChangeVertical}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onPrint={() => window.print()}
      />

      {/* Print Header */}
      <div className="print-only mx-auto w-full max-w-[1440px] px-6 pt-4 pb-2 border-b border-slate-300">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-lg font-bold text-slate-900">
            Omilia Partner Workbench — {preset.name}
          </h1>
          <span className="text-xs text-slate-600">{preset.compliance.join(' · ')}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-7">
        {activeTab === 'economics' && (
          <UnitEconomicsTab
            preset={preset}
            inputs={inputs}
            results={roiResults}
            onUpdateInput={handleUpdateInput}
            onApplyLaborPreset={handleApplyLaborPreset}
            onAutoFitFtes={handleAutoFitFtes}
            onResetVerticalDefaults={handleResetVerticalRoi}
            onCopySummary={handleCopyTcoSummary}
          />
        )}

        {activeTab === 'radar' && (
          <AiRadarTab
            preset={preset}
            useCases={useCases}
            selectedId={selectedUcId}
            onSelectUseCase={(id) =>
              setSelectedUcByVertical((prev) => ({
                ...prev,
                [vertical]: id,
              }))
            }
            onToggleInclude={handleToggleIncludeUseCase}
            onDeleteUseCase={handleDeleteUseCase}
            onAddCustomUseCase={handleAddCustomUseCase}
            onClearAll={handleClearAllUseCases}
            onRestoreDefaults={handleRestoreDefaults}
            onCopyRadarSummary={handleCopyRadarSummary}
          />
        )}

        {activeTab === 'scoping' && (
          <DealScopingTab
            preset={preset}
            useCases={useCases}
            partnerMotion={partnerMotion}
            sovereignty={sovereignty}
            apiReadiness={apiReadiness}
            hlee={hlee}
            onChangeMotion={setPartnerMotion}
            onChangeSovereignty={setSovereignty}
            onChangeApiReadiness={setApiReadiness}
            onSetIntentCount={handleSetIntentCount}
            onToggleInclude={handleToggleIncludeUseCase}
            onDeleteUseCase={handleDeleteUseCase}
            onRestoreDefaults={handleRestoreDefaults}
            onOpenBrief={() => setBriefModalOpen(true)}
          />
        )}

        {activeTab === 'mcp' && (
          <McpInspectorTab
            preset={preset}
            inputs={inputs}
            results={roiResults}
            useCases={useCases}
            partnerMotion={partnerMotion}
            sovereignty={sovereignty}
            apiReadiness={apiReadiness}
            hlee={hlee}
            onOpenTsModal={() => setTsModalOpen(true)}
            onNotify={notify}
          />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Omilia Partner Workbench · Deterministic + Agentic MCP Deal-Scoping</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTsModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-100 underline-offset-4 hover:underline cursor-pointer"
            >
              TypeScript MCP Server Source
            </button>
            <button
              type="button"
              onClick={() => setBriefModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-100 underline-offset-4 hover:underline cursor-pointer"
            >
              Executive Deal Brief
            </button>
          </div>
        </div>
      </footer>

      <DealBriefModal
        open={briefModalOpen}
        onClose={() => setBriefModalOpen(false)}
        preset={preset}
        inputs={inputs}
        results={roiResults}
        includedUseCases={includedUseCases}
        motionLabel={MOTION_LABELS[partnerMotion]}
        sovereigntyLabel={SOVEREIGNTY_LABELS[sovereignty]}
        hlee={hlee}
        briefText={briefText}
        onCopyBrief={handleCopyBrief}
        copied={briefCopied}
      />

      <TsServerModal
        open={tsModalOpen}
        onClose={() => setTsModalOpen(false)}
        onNotify={notify}
      />

      <WorkbenchGuideWidget
        activeTab={activeTab}
        vertical={vertical}
        preset={preset}
        inputs={inputs}
        results={roiResults}
        useCases={useCases}
        partnerMotion={partnerMotion}
        sovereignty={sovereignty}
        apiReadiness={apiReadiness}
        hlee={hlee}
        onSelectTab={setActiveTab}
        onChangeVertical={handleChangeVertical}
        onUpdateInput={handleUpdateInput}
        onChangeSovereignty={setSovereignty}
        onAddCustomUseCase={handleAddCustomUseCase}
        onOpenBrief={() => setBriefModalOpen(true)}
        onOpenTsModal={() => setTsModalOpen(true)}
      />

      {/* Non-intrusive Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 left-5 z-50 rounded-lg border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
