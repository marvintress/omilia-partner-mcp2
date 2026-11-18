import {
  ApiReadiness,
  DealMetadata,
  PartnerMotion,
  SovereigntyTier,
  UseCase,
  VerticalPreset,
} from '../data/verticalPresets';

export interface RoiInputs {
  callVolume: number;
  baseContainment: number;
  targetContainment: number;
  omiliaOutcomeRate: number;
  aht: number;
  acw: number;
  surge: number;
  wage: number;
  burden: number;
  occupancy: number;
  cfoOverride: boolean;
  cfoOverrideVal: number;
  talkguard: boolean;
  copilot: boolean;
  agents: number;
  shiftHours: number;
  workDays: number;
}

export interface RoiResults {
  unitHumanCost: number;
  effectiveMonthlyCalls: number;
  baseCont: number;
  targetCont: number;
  diyContainment: number;
  legacyMonthlyCost: number;
  omiliaMonthlyCost: number;
  diyMonthlyCost: number;
  legacyPlatformSpendMo: number;
  diyPlatformSpendMo: number;
  omiliaPlatformSpendMo: number;
  legacyHumanCostMo: number;
  diyHumanCostMo: number;
  omiliaHumanCostMo: number;
  annualLegacy: number;
  annualDiy: number;
  annualOmilia: number;
  monthlyNetSavings: number;
  annualNetSavings: number;
  threeYearDiySavings: number;
  containmentLiftPct: number;
  omiliaAutomatedCalls: number;
  totalHoursSavedMo: number;
  daysSavedPerAgentMo: number;
  ftesFreed: number;
  chartScaleMax: number;
  totalHandleSec: number;
  tgSecSaved: number;
  cpSecSaved: number;
}

export function formatCurrencyCompact(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString()}K`;
  return `$${Math.round(val).toLocaleString()}`;
}

export function formatCurrencyFull(val: number): string {
  return `$${Math.round(val).toLocaleString()}`;
}

export function computeEffectiveUnitAgentCost(inputs: RoiInputs): number {
  if (inputs.cfoOverride) {
    return Math.max(0.5, inputs.cfoOverrideVal || 4.25);
  }
  const wage = inputs.wage || 26;
  const burden = (inputs.burden || 32) / 100;
  const occupancy = Math.max(0.3, (inputs.occupancy || 82) / 100);
  const aht = inputs.aht || 340;
  const acw = inputs.acw || 45;
  const loadedHourly = wage * (1 + burden);
  const productiveHourly = loadedHourly * occupancy;
  const totalHandleHours = (aht + acw) / 3600;
  return productiveHourly * totalHandleHours;
}

export function computeFittedAgents(inputs: RoiInputs): number {
  const baseCont = (inputs.baseContainment || 0) / 100;
  const occ = Math.max(0.3, (inputs.occupancy || 82) / 100);
  const shiftHrs = inputs.shiftHours || 8;
  const workDays = inputs.workDays || 21.5;
  const residualCalls = inputs.callVolume * (1 - baseCont);
  const requiredProductiveHours = (residualCalls * (inputs.aht + inputs.acw)) / 3600;
  const hoursPerAgentMonth = shiftHrs * workDays * occ;
  return Math.max(10, Math.round(requiredProductiveHours / hoursPerAgentMonth));
}

export function calculateUnitEconomics(inputs: RoiInputs, preset: VerticalPreset): RoiResults {
  const unitHumanCost = computeEffectiveUnitAgentCost(inputs);
  const baseCont = inputs.baseContainment / 100;
  const targetCont = Math.max(baseCont + 0.05, inputs.targetContainment / 100);
  const effectiveMonthlyCalls = inputs.callVolume * inputs.surge;

  // 1. Legacy Baseline
  const legacyHumanCalls = effectiveMonthlyCalls * (1 - baseCont);
  const legacyIvrCalls = effectiveMonthlyCalls * baseCont;
  const legacyPlatformSpendMo = legacyIvrCalls * 0.14;
  const legacyHumanCostMo = legacyHumanCalls * unitHumanCost;
  const legacyMonthlyCost = legacyHumanCostMo + legacyPlatformSpendMo;

  // 2. Omilia OCP Blended Stack
  const omiliaAutomatedCalls = effectiveMonthlyCalls * targetCont;
  const omiliaEscalatedCalls = effectiveMonthlyCalls * (1 - targetCont);
  const tgSecSaved = inputs.talkguard ? preset.roi.talkguardSec : 0;
  const cpSecSaved = inputs.copilot ? preset.roi.copilotSec : 0;
  const totalHandleSec = Math.max(1, inputs.aht + inputs.acw);
  const assistedTimeRatio = Math.max(0.55, (totalHandleSec - tgSecSaved - cpSecSaved) / totalHandleSec);
  const omiliaEscalatedUnitCost = unitHumanCost * assistedTimeRatio;
  const omiliaPlatformSpendMo = omiliaAutomatedCalls * inputs.omiliaOutcomeRate + 6500;
  const omiliaHumanCostMo = omiliaEscalatedCalls * omiliaEscalatedUnitCost;
  const omiliaMonthlyCost = omiliaPlatformSpendMo + omiliaHumanCostMo;

  // 3. DIY Frontier LLM Stack
  const diyContainment = Math.max(baseCont + 0.08, targetCont - 0.11);
  const diyAutomatedCalls = effectiveMonthlyCalls * diyContainment;
  const diyEscalatedCalls = effectiveMonthlyCalls * (1 - diyContainment);
  const nonlinearSurgePenalty = Math.pow(inputs.surge, 1.38);
  const diyPerCallTokenAndApi = 0.58 * nonlinearSurgePenalty;
  const diyPlatformSpendMo = diyAutomatedCalls * diyPerCallTokenAndApi + 28500;
  const diyHumanCostMo = diyEscalatedCalls * unitHumanCost;
  const diyMonthlyCost = diyPlatformSpendMo + diyHumanCostMo;

  // Net Savings & Capacity Metrics
  const monthlyNetSavings = Math.max(0, legacyMonthlyCost - omiliaMonthlyCost);
  const annualNetSavings = monthlyNetSavings * 12;
  const threeYearDiySavings = Math.max(0, (diyMonthlyCost - omiliaMonthlyCost) * 36);

  const deflectedCallsMo = Math.max(0, omiliaAutomatedCalls - legacyIvrCalls);
  const deflectionHoursMo = (deflectedCallsMo * totalHandleSec) / 3600;
  const assistHoursMo = (omiliaEscalatedCalls * (tgSecSaved + cpSecSaved)) / 3600;
  const totalHoursSavedMo = deflectionHoursMo + assistHoursMo;

  const agents = Math.max(1, inputs.agents || 500);
  const shiftHours = Math.max(1, inputs.shiftHours || 8);
  const daysSavedPerAgentMo = totalHoursSavedMo / agents / shiftHours;
  const ftesFreed = totalHoursSavedMo / (shiftHours * 21.5);

  // Max 4.0x surge scale for stable visual bar proportionality
  const maxSurge = 4.0;
  const maxSurgeCalls = inputs.callVolume * maxSurge;
  const maxAnnualLegacy =
    (maxSurgeCalls * (1 - baseCont) * unitHumanCost + maxSurgeCalls * baseCont * 0.14) * 12;
  const maxAnnualOmilia =
    (maxSurgeCalls * targetCont * inputs.omiliaOutcomeRate +
      maxSurgeCalls * (1 - targetCont) * omiliaEscalatedUnitCost +
      6500) *
    12;
  const maxAnnualDiy =
    (maxSurgeCalls * diyContainment * (0.58 * Math.pow(maxSurge, 1.38)) +
      maxSurgeCalls * (1 - diyContainment) * unitHumanCost +
      28500) *
    12;

  const chartScaleMax = Math.max(maxAnnualLegacy, maxAnnualDiy, maxAnnualOmilia, 1);

  return {
    unitHumanCost,
    effectiveMonthlyCalls,
    baseCont,
    targetCont,
    diyContainment,
    legacyMonthlyCost,
    omiliaMonthlyCost,
    diyMonthlyCost,
    legacyPlatformSpendMo,
    diyPlatformSpendMo,
    omiliaPlatformSpendMo,
    legacyHumanCostMo,
    diyHumanCostMo,
    omiliaHumanCostMo,
    annualLegacy: legacyMonthlyCost * 12,
    annualDiy: diyMonthlyCost * 12,
    annualOmilia: omiliaMonthlyCost * 12,
    monthlyNetSavings,
    annualNetSavings,
    threeYearDiySavings,
    containmentLiftPct: Math.round((targetCont - baseCont) * 100),
    omiliaAutomatedCalls,
    totalHoursSavedMo,
    daysSavedPerAgentMo,
    ftesFreed,
    chartScaleMax,
    totalHandleSec,
    tgSecSaved,
    cpSecSaved,
  };
}

export function isTopRightQuadrant(uc: Pick<UseCase, 'feas' | 'imp'>): boolean {
  return uc.feas >= 50 && uc.imp >= 50;
}

export function getUseCasePsDays(uc: Pick<UseCase, 'feas'>): number {
  if (uc.feas >= 75) return 2;
  if (uc.feas >= 50) return 3;
  return 4;
}

export interface QuadrantMeta {
  label: string;
  tone: 'teal' | 'amber' | 'blue' | 'rose';
}

export function getQuadrantMeta(feas: number, imp: number): QuadrantMeta {
  if (feas >= 50 && imp >= 50) return { label: 'Immediate Funding', tone: 'teal' };
  if (feas < 50 && imp >= 50) return { label: 'Training Wheels (Phase 2)', tone: 'amber' };
  if (feas >= 50 && imp < 50) return { label: 'Quick Win (RAG / FAQ)', tone: 'blue' };
  return { label: 'Defer / Deprioritize', tone: 'rose' };
}

export interface HleeResult {
  weeks: number;
  psDays: number;
  timelineLabel: string;
  psEffortLabel: string;
  badgeLabel: string;
  positioningHook: string;
  guardrails: string[];
  raciRows: { workstream: string; omiliaRole: string; partnerRole: string }[];
}

export function calculateHlee(
  preset: VerticalPreset,
  includedList: UseCase[],
  motion: PartnerMotion,
  sovereignty: SovereigntyTier,
  apiReady: ApiReadiness
): HleeResult {
  const intents = includedList.length;
  let weeks = 0;
  let psDays = 0;

  if (intents > 0) {
    const ucPsDays = includedList.reduce((acc, uc) => acc + getUseCasePsDays(uc), 0);
    psDays = 8 + ucPsDays;
    weeks = 2 + Math.ceil(ucPsDays / 3.5);

    if (sovereignty === 'baremetal') {
      weeks += 3;
      psDays += 12;
    }
    if (apiReady === 'mixed') {
      weeks += 1;
      psDays += 4;
    } else if (apiReady === 'mainframe') {
      weeks += 2;
      psDays += 8;
    }
  }

  const hooks: Record<PartnerMotion, string> = {
    ccaas: `Position Omilia as "Deal Insurance" to unblock stalled ${preset.shortName} CCaaS cloud migrations with native SIP/UUI context handoff.`,
    gsi: `Empower GSI architects with standardized MCP tool schemas & AI Bootstrapping to build repeatable ${preset.shortName} practices without custom ASR/NLU tuning.`,
    bpo: `Protect BPO margins by pivoting from headcount billing to outcome-based containment ($0.40/resolved) + CSR CoPilot AHT compression.`,
  };

  const guardrails = [
    intents === 0
      ? 'Zero Phase 1 Scope Selected: Enable at least 1 Top-Right Quadrant use case in AI Radar 2.0 or above to generate a Phase 1 SOW boundary.'
      : `Strict 80/20 Scope Fence: Phase 1 SOW locked to ${intents} Top-Right Quadrant intent${intents === 1 ? '' : 's'} (${includedList.map((u) => u.name).join(', ')}). Additional workflows gated to Phase 2 change order.`,
    `Sub-300ms Latency Isolation: Omilia guarantees <300ms MCP orchestration + Lexis TTS (<45ms); customer/partner owns downstream ${preset.shortName} API response latency.`,
    apiReady === 'mainframe'
      ? 'Mainframe Middleware Gate: Customer/GSI must expose REST/MCP facade (e.g., IBM z/OS Connect or MQ REST bridge) prior to Sprint 2; 3270 screen-scraping is out of SLA scope.'
      : 'API Schema Prerequisite: OpenAPI 3.0 / MCP tool schemas and non-prod sandbox credentials required 5 business days prior to kickoff.',
    sovereignty === 'baremetal'
      ? `Bare Metal Sovereignty Gate (+3 Weeks): Customer InfoSec to validate air-gapped node sizing, HSM/TLS certificates, and ${preset.compliance[0]} audit logging in Week 1.`
      : `Walled-Garden InfoSec Pack: Pre-certified ${preset.compliance.slice(0, 3).join(', ')} attestation pack delivered at discovery to accelerate security sign-off.`,
  ];

  const raciRows = [
    {
      workstream: 'AI Bootstrapping & NLU/Dialog Build',
      omiliaRole: 'Lead (95%+ Day-1 Accuracy)',
      partnerRole: 'Provide anonymized transcripts & SOPs',
    },
    {
      workstream: 'Telephony / CCaaS SIP & UUI Integration',
      omiliaRole: 'Provide Native Connector',
      partnerRole: motion === 'ccaas' ? 'Lead (CCaaS Trunking & Desktop)' : 'Co-Deliver with CCaaS',
    },
    {
      workstream: 'Backend Core System / MCP Exposure',
      omiliaRole: 'MCP Client & Parallel Dispatch',
      partnerRole: motion === 'gsi' ? 'Lead (GSI Middleware / APIs)' : 'Customer IT / API Team',
    },
    {
      workstream: 'Closed-Loop Self-Learning & HITL QA',
      omiliaRole: 'Offline Pattern Discovery',
      partnerRole: 'Mandatory Human Approval Gate',
    },
  ];

  return {
    weeks,
    psDays,
    timelineLabel: intents > 0 ? `${weeks}–${weeks + 1} Weeks` : '0 Weeks',
    psEffortLabel: intents > 0 ? `${psDays} PS Days` : '0 PS Days',
    badgeLabel: intents > 0 ? `${weeks}–${weeks + 1} Weeks Phase 1` : '0 Intents Scoped',
    positioningHook: hooks[motion],
    guardrails,
    raciRows,
  };
}

export interface CashFlowPoint {
  month: number;
  legacyCumulative: number;
  diyCumulative: number;
  omiliaCumulative: number;
}

export interface PaybackAnalysis {
  implementationCost: number;
  paybackMonths: number | null;
  points: CashFlowPoint[];
  threeYearOmiliaTotal: number;
  threeYearLegacyTotal: number;
  threeYearDiyTotal: number;
}

export function computePaybackAndCashFlow(
  results: RoiResults,
  psDays: number,
  psDayRate: number
): PaybackAnalysis {
  const implementationCost = Math.max(0, psDays * psDayRate);
  const diySetupCost = implementationCost * 1.45; // Custom glue & prompt engineering overhead
  const paybackMonths =
    results.monthlyNetSavings > 0 ? implementationCost / results.monthlyNetSavings : null;

  const points: CashFlowPoint[] = [];
  for (let month = 0; month <= 36; month += 3) {
    points.push({
      month,
      legacyCumulative: results.legacyMonthlyCost * month,
      diyCumulative: diySetupCost + results.diyMonthlyCost * month,
      omiliaCumulative: implementationCost + results.omiliaMonthlyCost * month,
    });
  }

  return {
    implementationCost,
    paybackMonths,
    points,
    threeYearLegacyTotal: results.legacyMonthlyCost * 36,
    threeYearDiyTotal: diySetupCost + results.diyMonthlyCost * 36,
    threeYearOmiliaTotal: implementationCost + results.omiliaMonthlyCost * 36,
  };
}

export interface SensitivityScenario {
  label: string;
  targetContainmentPct: number;
  annualNetSavings: number;
  threeYearVsDiy: number;
  ftesFreed: number;
  paybackMonths: number | null;
}

export function computeSensitivityScenarios(
  inputs: RoiInputs,
  preset: VerticalPreset,
  psDays: number,
  psDayRate: number
): SensitivityScenario[] {
  const implementationCost = Math.max(0, psDays * psDayRate);
  const conservativeTarget = Math.max(inputs.baseContainment + 5, inputs.targetContainment - 10);
  const expectedTarget = Math.max(inputs.baseContainment + 5, inputs.targetContainment);
  const aggressiveTarget = Math.min(99, Math.max(expectedTarget + 5, inputs.targetContainment + 10));

  const defs = [
    { label: 'Conservative (-10%)', target: conservativeTarget },
    { label: 'Expected Target', target: expectedTarget },
    { label: 'Aggressive (+10%)', target: aggressiveTarget },
  ];

  return defs.map((d) => {
    const res = calculateUnitEconomics({ ...inputs, targetContainment: d.target }, preset);
    return {
      label: d.label,
      targetContainmentPct: Math.round(res.targetCont * 100),
      annualNetSavings: res.annualNetSavings,
      threeYearVsDiy: res.threeYearDiySavings,
      ftesFreed: res.ftesFreed,
      paybackMonths: res.monthlyNetSavings > 0 ? implementationCost / res.monthlyNetSavings : null,
    };
  });
}

export function buildExecutiveDealBrief(params: {
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  includedUseCases: UseCase[];
  motionLabel: string;
  sovereigntyLabel: string;
  hlee: HleeResult;
  psDayRate: number;
  payback: PaybackAnalysis;
  dealMeta: DealMetadata;
}): string {
  const {
    preset,
    inputs,
    results,
    includedUseCases,
    motionLabel,
    sovereigntyLabel,
    hlee,
    psDayRate,
    payback,
    dealMeta,
  } = params;
  const includedLines =
    includedUseCases.length > 0
      ? includedUseCases
          .map(
            (uc, i) =>
              `  ${i + 1}. ${uc.name} (${uc.feas}F/${uc.imp}I — ${uc.runtime}, +${getUseCasePsDays(uc)} PS Days)`
          )
          .join('\n')
      : '  (None currently selected)';

  const metaLines = [
    dealMeta.prospectName ? `Prospect: ${dealMeta.prospectName}` : null,
    dealMeta.partnerName ? `Partner: ${dealMeta.partnerName}` : null,
    dealMeta.ccaasPlatform ? `Target CCaaS: ${dealMeta.ccaasPlatform}` : null,
    dealMeta.dealOwner ? `Deal Owner: ${dealMeta.dealOwner}` : null,
  ].filter(Boolean);

  return [
    `OMILIA ENTERPRISE CX DEAL BRIEF — ${preset.name.toUpperCase()}`,
    `================================================================`,
    ...(metaLines.length > 0 ? [metaLines.join(' | '), ``] : []),
    `Annual Net Savings: ${formatCurrencyCompact(results.annualNetSavings)} (${formatCurrencyCompact(results.monthlyNetSavings)}/mo vs. baseline)`,
    `3-Year TCO Advantage vs. DIY Frontier LLM: ${formatCurrencyCompact(results.threeYearDiySavings)}`,
    `Phase 1 Implementation Cost (${hlee.psDays} PS Days @ $${psDayRate.toLocaleString()}/day): ${formatCurrencyFull(payback.implementationCost)}`,
    `Break-Even Payback Period: ${payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} months` : 'N/A'}`,
    `Containment Lift: +${results.containmentLiftPct}% (${Math.round(results.omiliaAutomatedCalls).toLocaleString()} calls automated/mo)`,
    `Agent Capacity Reclaimed: ${results.daysSavedPerAgentMo.toFixed(1)} days/agent/mo (${Math.round(results.ftesFreed).toLocaleString()} FTEs freed)`,
    `Omilia Outcome Pricing: $${inputs.omiliaOutcomeRate.toFixed(2)}/resolved | Loaded Human Cost: $${results.unitHumanCost.toFixed(2)}/call`,
    ``,
    `INCLUDED PHASE 1 USE CASES (${includedUseCases.length} Scoped from AI Radar 2.0):`,
    includedLines,
    ``,
    `PARTNER SCOPING & HLEE GUARDRAILS:`,
    `- GTM Motion: ${motionLabel}`,
    `- Deployment: ${sovereigntyLabel}`,
    `- Phase 1 Estimate: ${hlee.timelineLabel} / ${hlee.psEffortLabel}`,
    `- Compliance Perimeter: ${preset.compliance.join(', ')}`,
    `- Target Backend Stack: ${preset.backendStack}`,
    `- Architecture Guarantee: Zero Frontier Egress | <300ms Parallel MCP Dispatch | <45ms Lexis TTS`,
  ].join('\n');
}

function csvEscape(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildDealCsv(params: {
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  useCases: UseCase[];
  hlee: HleeResult;
  psDayRate: number;
  payback: PaybackAnalysis;
  sensitivity: SensitivityScenario[];
  dealMeta: DealMetadata;
}): string {
  const { preset, inputs, results, useCases, hlee, psDayRate, payback, sensitivity, dealMeta } = params;
  const rows: string[][] = [
    ['Omilia Partner Workbench Export', preset.name],
    ['Prospect', dealMeta.prospectName || 'Unspecified'],
    ['Partner', dealMeta.partnerName || 'Unspecified'],
    ['CCaaS Platform', dealMeta.ccaasPlatform || 'Unspecified'],
    ['Deal Owner', dealMeta.dealOwner || 'Unspecified'],
    [],
    ['UNIT ECONOMICS SUMMARY', 'Value'],
    ['Monthly Inbound Call Volume', inputs.callVolume.toString()],
    ['Surge Multiplier', `${inputs.surge.toFixed(1)}x`],
    ['Baseline Containment', `${inputs.baseContainment}%`],
    ['Target Omilia Containment', `${Math.round(results.targetCont * 100)}%`],
    ['Omilia Outcome Rate (USD)', inputs.omiliaOutcomeRate.toFixed(2)],
    ['Loaded Human Cost per Call (USD)', results.unitHumanCost.toFixed(2)],
    ['Annual Net Savings (USD)', Math.round(results.annualNetSavings).toString()],
    ['3-Year Advantage vs DIY LLM (USD)', Math.round(results.threeYearDiySavings).toString()],
    ['Phase 1 PS Effort', `${hlee.psDays} days @ $${psDayRate}/day`],
    ['Phase 1 Implementation Cost (USD)', Math.round(payback.implementationCost).toString()],
    ['Break-Even Payback (Months)', payback.paybackMonths !== null ? payback.paybackMonths.toFixed(1) : 'N/A'],
    ['Equivalent FTEs Freed', Math.round(results.ftesFreed).toString()],
    [],
    ['ANNUALIZED TCO COMPARISON', 'Legacy Baseline', 'DIY Frontier LLM', 'Omilia OCP'],
    ['Effective Containment', `${Math.round(results.baseCont * 100)}%`, `${Math.round(results.diyContainment * 100)}%`, `${Math.round(results.targetCont * 100)}%`],
    ['Monthly Platform Spend (USD)', Math.round(results.legacyPlatformSpendMo).toString(), Math.round(results.diyPlatformSpendMo).toString(), Math.round(results.omiliaPlatformSpendMo).toString()],
    ['Monthly Escalation Labor (USD)', Math.round(results.legacyHumanCostMo).toString(), Math.round(results.diyHumanCostMo).toString(), Math.round(results.omiliaHumanCostMo).toString()],
    ['Annualized TCO (USD)', Math.round(results.annualLegacy).toString(), Math.round(results.annualDiy).toString(), Math.round(results.annualOmilia).toString()],
    [],
    ['CONTAINMENT SENSITIVITY', 'Target Containment', 'Annual Net Savings (USD)', '3-Year vs DIY (USD)', 'Payback (Months)', 'FTEs Freed'],
    ...sensitivity.map((s) => [
      s.label,
      `${s.targetContainmentPct}%`,
      Math.round(s.annualNetSavings).toString(),
      Math.round(s.threeYearVsDiy).toString(),
      s.paybackMonths !== null ? s.paybackMonths.toFixed(1) : 'N/A',
      Math.round(s.ftesFreed).toString(),
    ]),
    [],
    ['AI RADAR 2.0 PORTFOLIO', 'Quadrant', 'Feasibility', 'Impact', 'Phase 1 SOW Included', 'PS Days', 'Runtime Tier'],
    ...useCases.map((uc) => {
      const q = getQuadrantMeta(uc.feas, uc.imp);
      const included = isTopRightQuadrant(uc) && uc.included !== false;
      return [
        uc.name,
        q.label,
        uc.feas.toString(),
        uc.imp.toString(),
        included ? 'Yes' : 'No',
        included ? getUseCasePsDays(uc).toString() : '0',
        uc.runtime,
      ];
    }),
  ];

  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}
