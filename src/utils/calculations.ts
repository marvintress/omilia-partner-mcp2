import {
  ApiReadiness,
  COMPETITOR_PROFILES,
  CompetitorArchetype,
  CompetitorProfile,
  DealMetadata,
  PartnerMotion,
  PovConfig,
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
  autoFitAgents?: boolean;
  shiftHours: number;
  workDays: number;
  laborRealizationPct?: number;
}

export interface RoiResults {
  competitorProfile: CompetitorProfile;
  unitHumanCost: number;
  effectiveMonthlyCalls: number;
  baseCont: number;
  targetCont: number;
  diyContainment: number;
  diyPerCallVariableRate: number;
  legacyMonthlyCost: number;
  omiliaMonthlyCost: number;
  diyMonthlyCost: number;
  byollmMonthlyCost: number;
  diyHyperscalerMonthlyCost: number;
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
  laborRealizationPct: number;
  annualCapacityReinvestedValue: number;
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

export function calculateUnitEconomics(
  inputs: RoiInputs,
  preset: VerticalPreset,
  competitorArchetype: CompetitorArchetype = 'byollm'
): RoiResults {
  const competitorProfile = COMPETITOR_PROFILES[competitorArchetype] ?? COMPETITOR_PROFILES.byollm;
  const unitHumanCost = computeEffectiveUnitAgentCost(inputs);
  const baseCont = inputs.baseContainment / 100;
  const targetCont = Math.max(baseCont + 0.05, inputs.targetContainment / 100);
  const effectiveMonthlyCalls = inputs.callVolume * inputs.surge;

  const laborRealizationPct = Math.max(25, Math.min(100, inputs.laborRealizationPct ?? 65));
  const realizationFactor = laborRealizationPct / 100;

  // 1. Legacy Baseline
  const legacyHumanCalls = effectiveMonthlyCalls * (1 - baseCont);
  const legacyIvrCalls = effectiveMonthlyCalls * baseCont;
  const legacyPlatformSpendMo = legacyIvrCalls * 0.14;
  const legacyHumanCostMo = legacyHumanCalls * unitHumanCost;
  const legacyMonthlyCost = legacyHumanCostMo + legacyPlatformSpendMo;

  // 2. Omilia OCP Vertically Integrated Stack (Year 1 run-rate; Self-Learning compresses Years 2 & 3)
  const omiliaAutomatedCalls = effectiveMonthlyCalls * targetCont;
  const omiliaEscalatedCalls = effectiveMonthlyCalls * (1 - targetCont);
  const tgSecSaved = inputs.talkguard ? preset.roi.talkguardSec : 0;
  const cpSecSaved = inputs.copilot ? preset.roi.copilotSec : 0;
  const totalHandleSec = Math.max(1, inputs.aht + inputs.acw);
  const assistedTimeRatio = Math.max(0.55, (totalHandleSec - tgSecSaved - cpSecSaved) / totalHandleSec);
  const omiliaEscalatedUnitCost = unitHumanCost * assistedTimeRatio;
  const omiliaPlatformSpendMo = omiliaAutomatedCalls * inputs.omiliaOutcomeRate + 6500;
  const omiliaRawHumanCostMo = omiliaEscalatedCalls * omiliaEscalatedUnitCost;
  const omiliaHumanCostMo =
    legacyHumanCostMo >= omiliaRawHumanCostMo
      ? legacyHumanCostMo - realizationFactor * (legacyHumanCostMo - omiliaRawHumanCostMo)
      : omiliaRawHumanCostMo;
  const omiliaMonthlyCost = omiliaPlatformSpendMo + omiliaHumanCostMo;
  const annualCapacityReinvestedValue =
    Math.max(0, (1 - realizationFactor) * (legacyHumanCostMo - omiliaRawHumanCostMo)) * 12;

  // 3. Competitor Baseline (Packaged BYOLLM or DIY Hyperscaler)
  const computeCompetitorRunRate = (profile: CompetitorProfile) => {
    const cCont = Math.max(baseCont + 0.08, targetCont - profile.containmentLag);
    const cAuto = effectiveMonthlyCalls * cCont;
    const cEsc = effectiveMonthlyCalls * (1 - cCont);
    const cSurgePenalty = Math.pow(inputs.surge, profile.surgeExponent);
    const cVarRate = profile.baseVariableRate * cSurgePenalty;
    const cPlatformMo = cAuto * cVarRate + profile.monthlyLicenseOrTaxBase;
    const rawHumanMo = cEsc * unitHumanCost;
    const cHumanMo =
      legacyHumanCostMo >= rawHumanMo
        ? legacyHumanCostMo - realizationFactor * (legacyHumanCostMo - rawHumanMo)
        : rawHumanMo;
    return {
      cCont,
      cAuto,
      cVarRate,
      cPlatformMo,
      cHumanMo,
      cMonthly: cPlatformMo + cHumanMo,
    };
  };

  const activeCompRun = computeCompetitorRunRate(competitorProfile);
  const byollmMonthlyCost = computeCompetitorRunRate(COMPETITOR_PROFILES.byollm).cMonthly;
  const diyHyperscalerMonthlyCost = computeCompetitorRunRate(
    COMPETITOR_PROFILES.diy_hyperscaler
  ).cMonthly;

  const diyContainment = activeCompRun.cCont;
  const diyPerCallVariableRate = activeCompRun.cVarRate;
  const diyPlatformSpendMo = activeCompRun.cPlatformMo;
  const diyHumanCostMo = activeCompRun.cHumanMo;
  const diyMonthlyCost = activeCompRun.cMonthly;

  // Net Savings & Capacity Metrics
  const monthlyNetSavings = Math.max(0, legacyMonthlyCost - omiliaMonthlyCost);
  const annualNetSavings = monthlyNetSavings * 12;
  // Average 3-year self-learning compression factor across 36 mos: (12*1.0 + 12*0.90 + 12*0.82) / 36 = 0.9067
  const threeYearDiySavings = Math.max(0, (diyMonthlyCost - omiliaMonthlyCost * 0.9067) * 36);

  const deflectedCallsMo = Math.max(0, omiliaAutomatedCalls - legacyIvrCalls);
  const deflectionHoursMo = (deflectedCallsMo * totalHandleSec) / 3600;
  const assistHoursMo = (omiliaEscalatedCalls * (tgSecSaved + cpSecSaved)) / 3600;
  const totalHoursSavedMo = deflectionHoursMo + assistHoursMo;

  const agents =
    inputs.autoFitAgents !== false ? computeFittedAgents(inputs) : Math.max(1, inputs.agents || 500);
  const shiftHours = Math.max(1, inputs.shiftHours || 8);
  const workDays = Math.max(1, inputs.workDays || 21.5);
  const daysSavedPerAgentMo = totalHoursSavedMo / agents / shiftHours;
  const ftesFreed = totalHoursSavedMo / (shiftHours * workDays);

  // Max 4.0x surge scale for stable visual bar proportionality
  const maxSurge = 4.0;
  const maxSurgeCalls = inputs.callVolume * maxSurge;
  const maxLegacyHumanCost = maxSurgeCalls * (1 - baseCont) * unitHumanCost;
  const maxAnnualLegacy = (maxLegacyHumanCost + maxSurgeCalls * baseCont * 0.14) * 12;
  const maxOmiliaRawHuman = maxSurgeCalls * (1 - targetCont) * omiliaEscalatedUnitCost;
  const maxOmiliaHuman =
    maxLegacyHumanCost >= maxOmiliaRawHuman
      ? maxLegacyHumanCost - realizationFactor * (maxLegacyHumanCost - maxOmiliaRawHuman)
      : maxOmiliaRawHuman;
  const maxAnnualOmilia =
    (maxSurgeCalls * targetCont * inputs.omiliaOutcomeRate + maxOmiliaHuman + 6500) * 12;
  const maxDiyRawHuman = maxSurgeCalls * (1 - diyContainment) * unitHumanCost;
  const maxDiyHuman =
    maxLegacyHumanCost >= maxDiyRawHuman
      ? maxLegacyHumanCost - realizationFactor * (maxLegacyHumanCost - maxDiyRawHuman)
      : maxDiyRawHuman;
  const maxAnnualDiy =
    (maxSurgeCalls *
      diyContainment *
      (competitorProfile.baseVariableRate * Math.pow(maxSurge, competitorProfile.surgeExponent)) +
      maxDiyHuman +
      competitorProfile.monthlyLicenseOrTaxBase) *
    12;

  const chartScaleMax = Math.max(maxAnnualLegacy, maxAnnualDiy, maxAnnualOmilia, 1);

  return {
    competitorProfile,
    unitHumanCost,
    effectiveMonthlyCalls,
    baseCont,
    targetCont,
    diyContainment,
    diyPerCallVariableRate,
    legacyMonthlyCost,
    omiliaMonthlyCost,
    diyMonthlyCost,
    byollmMonthlyCost,
    diyHyperscalerMonthlyCost,
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
    laborRealizationPct,
    annualCapacityReinvestedValue,
  };
}

export function isTopRightQuadrant(uc: Pick<UseCase, 'feas' | 'imp'>): boolean {
  return uc.feas >= 50 && uc.imp >= 50;
}

export function isBottomRightQuadrant(uc: Pick<UseCase, 'feas' | 'imp'>): boolean {
  return uc.feas >= 50 && uc.imp < 50;
}

export function isHighFeasibilityQuadrant(uc: Pick<UseCase, 'feas'>): boolean {
  return uc.feas >= 50;
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
      ? 'Zero Phase 1 Scope Selected: Enable at least 1 High-Feasibility (Top-Right or Bottom-Right, ≥50F) use case in AI Radar 2.0 or above to generate a Phase 1 SOW boundary.'
      : `Strict 80/20 Scope Fence: Phase 1 SOW locked to ${intents} High-Feasibility (Top-Right + Bottom-Right) intent${intents === 1 ? '' : 's'} (${includedList.map((u) => u.name).join(', ')}). Lower-feasibility (<50F) workflows gated to Phase 2 change order.`,
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
  byollmCumulative: number;
  diyHyperscalerCumulative: number;
  omiliaCumulative: number;
}

export interface PaybackAnalysis {
  implementationCost: number;
  competitorSetupCost: number;
  byollmSetupCost: number;
  diyHyperscalerSetupCost: number;
  omiliaBuildMonths: number;
  byollmBuildMonths: number;
  diyBuildMonths: number;
  paybackMonths: number | null;
  byollmPaybackMonths: number | null;
  diyHyperscalerPaybackMonths: number | null;
  points: CashFlowPoint[];
  monthlyPoints: CashFlowPoint[];
  threeYearOmiliaTotal: number;
  threeYearLegacyTotal: number;
  threeYearDiyTotal: number;
  threeYearByollmTotal: number;
  threeYearDiyHyperscalerTotal: number;
  threeYearCompetitorSavings: number;
  omiliaUnitRatesByYear: {
    yr1: number;
    yr2: number;
    yr3: number;
  };
}

function getRampShareAtTime(tMid: number, buildMonths: number): number {
  if (tMid < buildMonths) return 0;
  const elapsed = tMid - buildMonths;
  if (elapsed < 1) return 0.25;
  if (elapsed < 2) return 0.6;
  return 1.0;
}

function solveRampModelTrajectory(params: {
  setupCost: number;
  buildMonths: number;
  legacyMonthlyCost: number;
  getSteadyMonthlyCostAtTime: (tMid: number) => number;
}): {
  atMonth: (month: number) => number;
  breakEvenMonths: number | null;
} {
  const { setupCost, buildMonths, legacyMonthlyCost, getSteadyMonthlyCostAtTime } = params;
  const B = Math.max(0, Math.min(35.5, buildMonths));
  const rawBreaks = [0, B, B + 1, B + 2, 12, 24, 36].filter((x) => x >= 0 && x <= 36);
  const breaks = Array.from(new Set(rawBreaks.map((x) => Number(x.toFixed(6))))).sort((a, b) => a - b);

  const atMonth = (targetMonth: number): number => {
    const M = Math.max(0, Math.min(36, targetMonth));
    let total = setupCost;
    for (let i = 0; i < breaks.length - 1; i++) {
      const t0 = breaks[i];
      const t1 = Math.min(breaks[i + 1], M);
      if (t1 <= t0) continue;
      const tMid = (t0 + t1) / 2;
      const alpha = getRampShareAtTime(tMid, B);
      const steadyAiCost = getSteadyMonthlyCostAtTime(tMid);
      const rate = legacyMonthlyCost + alpha * (steadyAiCost - legacyMonthlyCost);
      total += (t1 - t0) * rate;
    }
    return total;
  };

  let breakEvenMonths: number | null = null;
  if (setupCost <= 0) {
    breakEvenMonths = 0;
  } else {
    let deficit = setupCost;
    for (let i = 0; i < breaks.length - 1; i++) {
      const t0 = breaks[i];
      const t1 = breaks[i + 1];
      if (t1 <= t0) continue;
      const tMid = (t0 + t1) / 2;
      const alpha = getRampShareAtTime(tMid, B);
      const steadyAiCost = getSteadyMonthlyCostAtTime(tMid);
      const monthlySavings = alpha * (legacyMonthlyCost - steadyAiCost);
      const endDeficit = deficit - monthlySavings * (t1 - t0);
      if (monthlySavings > 0 && endDeficit <= 0) {
        breakEvenMonths = t0 + deficit / monthlySavings;
        break;
      }
      deficit = endDeficit;
    }
  }

  return { atMonth, breakEvenMonths };
}

export function computeCompetitorSetupCost(
  archetype: CompetitorArchetype,
  psDays: number
): number {
  const effectiveDays = Math.max(0, psDays - 10);
  if (archetype === 'byollm') {
    // $180k–$300k moderate upfront PS build
    return Math.min(300_000, 180_000 + effectiveDays * 4_000);
  }
  // $450k–$750k heavy upfront custom engineering build
  return Math.min(750_000, 450_000 + effectiveDays * 12_000);
}

export function computePaybackAndCashFlow(
  results: RoiResults,
  psDays: number,
  psDayRate: number,
  baseOutcomeRate = 0.4,
  hleeWeeks = 6
): PaybackAnalysis {
  const implementationCost = Math.max(0, psDays * psDayRate);
  const byollmSetupCost = computeCompetitorSetupCost('byollm', psDays);
  const diyHyperscalerSetupCost = computeCompetitorSetupCost('diy_hyperscaler', psDays);
  const competitorSetupCost =
    results.competitorProfile.key === 'byollm' ? byollmSetupCost : diyHyperscalerSetupCost;

  // Build delays tied directly to HLEE Weeks & Competitor Time-to-Value before post-launch ramp
  const omiliaBuildMonths =
    hleeWeeks > 0 ? Math.max(0.75, Number((hleeWeeks / 4.33).toFixed(2))) : 0;
  const byollmBuildMonths = 3.25; // 12–16 weeks multi-vendor orchestrator build
  const diyBuildMonths = 7.5; // 6–9 months custom engineering build

  // Year 2 (-10%) & Year 3 (-18%) Self-Learning applies strictly to Omilia's variable outcome fees
  const outcomeVariableYr1 = Math.max(0, results.omiliaPlatformSpendMo - 6500);
  const omiliaMonthlyCostYr1 = results.omiliaMonthlyCost;
  const omiliaMonthlyCostYr2 = outcomeVariableYr1 * 0.9 + 6500 + results.omiliaHumanCostMo;
  const omiliaMonthlyCostYr3 = outcomeVariableYr1 * 0.82 + 6500 + results.omiliaHumanCostMo;

  const omiliaTraj = solveRampModelTrajectory({
    setupCost: implementationCost,
    buildMonths: omiliaBuildMonths,
    legacyMonthlyCost: results.legacyMonthlyCost,
    getSteadyMonthlyCostAtTime: (tMid) =>
      tMid < 12 ? omiliaMonthlyCostYr1 : tMid < 24 ? omiliaMonthlyCostYr2 : omiliaMonthlyCostYr3,
  });

  const byollmTraj = solveRampModelTrajectory({
    setupCost: byollmSetupCost,
    buildMonths: byollmBuildMonths,
    legacyMonthlyCost: results.legacyMonthlyCost,
    getSteadyMonthlyCostAtTime: () => results.byollmMonthlyCost,
  });

  const diyTraj = solveRampModelTrajectory({
    setupCost: diyHyperscalerSetupCost,
    buildMonths: diyBuildMonths,
    legacyMonthlyCost: results.legacyMonthlyCost,
    getSteadyMonthlyCostAtTime: () => results.diyHyperscalerMonthlyCost,
  });

  const activeIsByollm = results.competitorProfile.key === 'byollm';

  const makePointAt = (month: number): CashFlowPoint => {
    const byollmCum = byollmTraj.atMonth(month);
    const diyHypCum = diyTraj.atMonth(month);
    return {
      month,
      legacyCumulative: results.legacyMonthlyCost * month,
      diyCumulative: activeIsByollm ? byollmCum : diyHypCum,
      byollmCumulative: byollmCum,
      diyHyperscalerCumulative: diyHypCum,
      omiliaCumulative: omiliaTraj.atMonth(month),
    };
  };

  const points: CashFlowPoint[] = [];
  for (let month = 0; month <= 36; month += 3) {
    points.push(makePointAt(month));
  }

  const monthlyPoints: CashFlowPoint[] = [];
  for (let month = 0; month <= 36; month += 1) {
    monthlyPoints.push(makePointAt(month));
  }

  const threeYearLegacyTotal = results.legacyMonthlyCost * 36;
  const threeYearByollmTotal = byollmTraj.atMonth(36);
  const threeYearDiyHyperscalerTotal = diyTraj.atMonth(36);
  const threeYearDiyTotal = activeIsByollm ? threeYearByollmTotal : threeYearDiyHyperscalerTotal;
  const threeYearOmiliaTotal = omiliaTraj.atMonth(36);

  return {
    implementationCost,
    competitorSetupCost,
    byollmSetupCost,
    diyHyperscalerSetupCost,
    omiliaBuildMonths,
    byollmBuildMonths,
    diyBuildMonths,
    paybackMonths: implementationCost <= 0 ? 0 : omiliaTraj.breakEvenMonths,
    byollmPaybackMonths: byollmTraj.breakEvenMonths,
    diyHyperscalerPaybackMonths: diyTraj.breakEvenMonths,
    points,
    monthlyPoints,
    threeYearLegacyTotal,
    threeYearDiyTotal,
    threeYearByollmTotal,
    threeYearDiyHyperscalerTotal,
    threeYearOmiliaTotal,
    threeYearCompetitorSavings: Math.max(0, threeYearDiyTotal - threeYearOmiliaTotal),
    omiliaUnitRatesByYear: {
      yr1: baseOutcomeRate,
      yr2: baseOutcomeRate * 0.9,
      yr3: baseOutcomeRate * 0.82,
    },
  };
}

export interface SensitivityScenario {
  label: string;
  targetContainmentPct: number;
  annualNetSavings: number;
  threeYearVsCompetitor: number;
  ftesFreed: number;
  paybackMonths: number | null;
}

export function computeSensitivityScenarios(
  inputs: RoiInputs,
  preset: VerticalPreset,
  psDays: number,
  psDayRate: number,
  competitorArchetype: CompetitorArchetype = 'byollm',
  hleeWeeks = 6
): SensitivityScenario[] {
  const conservativeTarget = Math.max(inputs.baseContainment + 5, inputs.targetContainment - 10);
  const expectedTarget = Math.max(inputs.baseContainment + 5, inputs.targetContainment);
  const aggressiveTarget = Math.min(99, Math.max(expectedTarget + 5, inputs.targetContainment + 10));

  const defs = [
    { label: 'Conservative (-10%)', target: conservativeTarget },
    { label: 'Expected Target', target: expectedTarget },
    { label: 'Aggressive (+10%)', target: aggressiveTarget },
  ];

  return defs.map((d) => {
    const res = calculateUnitEconomics(
      { ...inputs, targetContainment: d.target },
      preset,
      competitorArchetype
    );
    const pb = computePaybackAndCashFlow(res, psDays, psDayRate, inputs.omiliaOutcomeRate, hleeWeeks);
    return {
      label: d.label,
      targetContainmentPct: Math.round(res.targetCont * 100),
      annualNetSavings: res.annualNetSavings,
      threeYearVsCompetitor: pb.threeYearCompetitorSavings,
      ftesFreed: res.ftesFreed,
      paybackMonths: pb.paybackMonths,
    };
  });
}

export interface PovExitGate {
  metric: string;
  threshold: string;
  measurement: string;
  scope: string;
}

export interface PovSprintWeek {
  weekLabel: string;
  title: string;
  owner: string;
  deliverables: string[];
}

export interface PovPlanResult {
  heroIntents: UseCase[];
  scopeStrategyLabel: string;
  povWeeksMin: number;
  povWeeksMax: number;
  povDurationLabel: string;
  competitorPovDurationLabel: string;
  effectiveFeeUsd: number;
  phase1CreditUsd: number;
  netPhase1IncrementalCostUsd: number;
  commercialLabel: string;
  backendIsolationLabel: string;
  infosecGateRisk: 'Low (Zero InfoSec Gate)' | 'Moderate (Non-Prod Allowlist)' | 'Elevated (SIP + Audio Leg)';
  prerequisites: string[];
  exitGates: PovExitGate[];
  sprintWeeks: PovSprintWeek[];
  conversionClause: string;
  warnings: string[];
}

export function calculatePovPlan(
  preset: VerticalPreset,
  includedUseCases: UseCase[],
  povConfig: PovConfig,
  competitorArchetype: CompetitorArchetype,
  phase1ImplementationCost: number
): PovPlanResult {
  const byTopFeasibility = (a: UseCase, b: UseCase) => b.feas - a.feas || b.imp - a.imp;
  const strategy = povConfig.scopeStrategy ?? 'hybrid';
  const clampedCount = Math.max(1, Math.min(3, povConfig.intentCount));

  const topRightCandidates = includedUseCases.filter(isTopRightQuadrant).sort(byTopFeasibility);
  const bottomRightCandidates = includedUseCases.filter(isBottomRightQuadrant).sort(byTopFeasibility);
  const allCandidates = [...includedUseCases].filter(isHighFeasibilityQuadrant).sort(byTopFeasibility);

  let heroIntents: UseCase[] = [];
  if (strategy === 'top_right') {
    heroIntents = topRightCandidates.slice(0, clampedCount);
  } else if (strategy === 'bottom_right') {
    heroIntents = bottomRightCandidates.slice(0, clampedCount);
  } else {
    // Hybrid: top-feasibility Top-Right + top-feasibility Bottom-Right, then fill by highest feasibility
    if (clampedCount === 1) {
      heroIntents = allCandidates.slice(0, 1);
    } else {
      const pickedIds = new Set<string>();
      const seeded: UseCase[] = [];
      if (topRightCandidates[0]) {
        seeded.push(topRightCandidates[0]);
        pickedIds.add(topRightCandidates[0].id);
      }
      if (bottomRightCandidates[0] && seeded.length < clampedCount) {
        seeded.push(bottomRightCandidates[0]);
        pickedIds.add(bottomRightCandidates[0].id);
      }
      for (const candidate of allCandidates) {
        if (seeded.length >= clampedCount) break;
        if (!pickedIds.has(candidate.id)) {
          seeded.push(candidate);
          pickedIds.add(candidate.id);
        }
      }
      heroIntents = seeded.sort(byTopFeasibility);
    }
  }

  const scopeStrategyLabels: Record<NonNullable<PovConfig['scopeStrategy']>, string> = {
    hybrid: 'Hybrid (Top-Feasibility Top-Right + Bottom-Right)',
    top_right: 'Top-Right Only (Immediate Funding ≥50F & ≥50I)',
    bottom_right: 'Bottom-Right Only (Quick-Win RAG / FAQ ≥50F)',
  };
  const scopeStrategyLabel = scopeStrategyLabels[strategy];

  let weeksMin = 2;
  let weeksMax = 3;
  if (povConfig.backendMode === 'sandbox_mock' && clampedCount <= 2 && !povConfig.includeTalkguardTest) {
    weeksMin = 2;
    weeksMax = 2;
  } else if (povConfig.backendMode === 'sandbox_mock') {
    weeksMin = 2;
    weeksMax = 3;
  } else if (povConfig.backendMode === 'nonprod_api') {
    weeksMin = 3;
    weeksMax = clampedCount >= 3 ? 4 : 3;
  } else {
    weeksMin = 3;
    weeksMax = 4;
  }

  const povDurationLabel = weeksMin === weeksMax ? `${weeksMin} Weeks` : `${weeksMin}–${weeksMax} Weeks`;
  const competitorPovDurationLabel =
    competitorArchetype === 'byollm' ? '6–8 Weeks Multi-Vendor' : '8–12 Weeks Custom Build';

  const effectiveFeeUsd =
    povConfig.commercialModel === 'co_sell_free' ? 0 : Math.max(5000, povConfig.povFeeUsd);
  const phase1CreditUsd =
    povConfig.commercialModel === 'funded_credited'
      ? Math.min(effectiveFeeUsd, phase1ImplementationCost)
      : 0;
  const netPhase1IncrementalCostUsd = Math.max(0, phase1ImplementationCost - phase1CreditUsd);

  const commercialLabels: Record<PovConfig['commercialModel'], string> = {
    co_sell_free: 'Partner-Funded Co-Sell POV ($0 Fee · 3-Wk Hard Cap)',
    funded_credited: `Funded Fixed-Fee POV ($${effectiveFeeUsd.toLocaleString()} · 100% Credited to Phase 1)`,
    paid_pilot: `Production-Path Paid Pilot ($${effectiveFeeUsd.toLocaleString()} · Live Audio Runtime)`,
  };

  const backendLabels: Record<PovConfig['backendMode'], string> = {
    sandbox_mock: 'Synthetic / OpenAPI Sandbox Stub (Zero InfoSec Delay)',
    nonprod_api: 'Non-Prod Test API / Customer MCP Bridge',
    talkguard_sip: 'Live SIP Trunk + TalkGuard Voice Biometrics Leg',
  };

  const infosecGateRisk: PovPlanResult['infosecGateRisk'] =
    povConfig.backendMode === 'sandbox_mock'
      ? 'Low (Zero InfoSec Gate)'
      : povConfig.backendMode === 'nonprod_api'
      ? 'Moderate (Non-Prod Allowlist)'
      : 'Elevated (SIP + Audio Leg)';

  const primaryBackend = preset.backendStack.split(',')[0]?.trim() || 'Core Backend';

  const prerequisites = [
    `250–500 anonymized ${preset.shortName} call transcripts or knowledge PDFs covering ${
      heroIntents.map((u) => u.name).join(' & ') || 'top feasibility intents'
    }`,
    povConfig.backendMode === 'sandbox_mock'
      ? `Sample JSON payloads / OpenAPI 3.0 schema from ${primaryBackend} (mocked inside Omilia sandbox—no firewall/VPN ticket needed)`
      : `Non-prod ${primaryBackend} REST/MCP endpoint credentials, mTLS test certs, and test customer account IDs`,
    povConfig.backendMode === 'talkguard_sip' || povConfig.includeTalkguardTest
      ? 'Test DID / SIP trunk routing rule (or WebRTC test harness) plus 10–15 synthetic/consented voice samples for TalkGuard EER verification'
      : '1 dedicated SME + Product Owner committed for 2×30-min tuning reviews in Week 2',
  ];

  const exitGates: PovExitGate[] = [
    {
      metric: 'Day-1 Bootstrapped NLU Accuracy',
      threshold: `≥ ${povConfig.nluTargetPct}%`,
      measurement: 'Blind hold-out test set from prospect historical utterances',
      scope: `${heroIntents.length} ${strategy === 'hybrid' ? 'hybrid' : 'bounded'} intent${heroIntents.length === 1 ? '' : 's'}`,
    },
    {
      metric: 'In-Scope Task Resolution',
      threshold: `≥ ${povConfig.taskTargetPct}%`,
      measurement: 'End-to-end dialog completion across happy + grounded RAG paths',
      scope: 'Deterministic + RAG orchestration',
    },
    {
      metric: 'End-to-End Voice Turn Latency',
      threshold: `< ${povConfig.latencyTargetMs.toLocaleString()} ms`,
      measurement: '8kHz ASR → Parallel MCP → <45ms Lexis TTS vs. 1,200ms hang-up line',
      scope: 'Omilia Core + Sandbox/MCP',
    },
    {
      metric: 'Data Sovereignty & Security',
      threshold: '0 External Egress',
      measurement: `Audit log inspection confirming zero third-party LLM calls (${preset.compliance[0]})`,
      scope: 'Certified Walled Garden',
    },
  ];

  if (povConfig.includeTalkguardTest) {
    exitGates.push({
      metric: 'TalkGuard Passive Biometrics & Deepfake Screen',
      threshold: 'Pass (<1% FAR / Anti-Spoof)',
      measurement: 'Passive enrollment + cloned-voice replay rejection test',
      scope: `Target -${preset.roi.talkguardSec}s KBA reduction`,
    });
  }

  const sprintWeeks: PovSprintWeek[] = [
    {
      weekLabel: 'Week 1',
      title: 'AI Bootstrapping & Environment Setup',
      owner: 'Omilia SE + Partner SME',
      deliverables: [
        `Ingest ${preset.shortName} transcripts & knowledge docs for ${heroIntents.length} top-feasibility ${strategy === 'hybrid' ? 'hybrid ' : ''}intent${heroIntents.length === 1 ? '' : 's'}`,
        povConfig.backendMode === 'sandbox_mock'
          ? `Spin up OpenAPI / JSON mock MCP stubs for ${preset.mcpSystems.slice(0, 2).map((s) => s.name).join(' & ')}`
          : `Connect non-prod MCP server (${primaryBackend}) via OAuth 2.0 + mTLS`,
      ],
    },
    {
      weekLabel: 'Week 2',
      title: 'Micro-Flow Tuning, Latency & Biometric QA',
      owner: 'Omilia Dialog Architect + Buyer QA',
      deliverables: [
        `Tune edge cases, barge-in, and 8kHz acoustic noise handling toward ≥${povConfig.nluTargetPct}% NLU / ≥${povConfig.taskTargetPct}% Task Res`,
        povConfig.includeTalkguardTest
          ? `Validate TalkGuard passive KBA (-${preset.roi.talkguardSec}s) & anti-deepfake screening`
          : `Benchmark sub-${povConfig.latencyTargetMs}ms turn latency with <45ms Lexis TTS`,
      ],
    },
    {
      weekLabel: weeksMax >= 4 ? 'Weeks 3–4' : 'Week 3',
      title: 'Live Caller UAT & Phase 1 Conversion Gate',
      owner: 'Buyer Sponsor + CFO / Partner Lead',
      deliverables: [
        'Run live scripted & unscripted blind test suite against agreed Exit Criteria scorecard',
        `Trigger pre-agreed Phase 1 SOW conversion (${phase1CreditUsd > 0 ? `$${phase1CreditUsd.toLocaleString()} POV fee credited 100%` : 'full production rollout'})`,
      ],
    },
  ];

  const warnings: string[] = [];
  if (heroIntents.length === 0) {
    warnings.push(
      `No matching High-Feasibility (${strategy === 'top_right' ? 'Top-Right' : strategy === 'bottom_right' ? 'Bottom-Right' : 'Top-Right or Bottom-Right'}) use cases are enabled in AI Radar.`
    );
  } else if (strategy === 'hybrid' && clampedCount >= 2 && (topRightCandidates.length === 0 || bottomRightCandidates.length === 0)) {
    warnings.push(
      'Hybrid mode pairs Top-Right + Bottom-Right workflows; add or enable a use case in the missing right-hand quadrant on AI Radar 2.0.'
    );
  }
  if (clampedCount >= 3) {
    warnings.push(
      '3 intents stretches POV scope risk—2 intents (e.g., 1 Top-Right + 1 Bottom-Right Hybrid) maximizes Day-1 accuracy inside 2–3 weeks.'
    );
  }
  if (povConfig.backendMode !== 'sandbox_mock') {
    warnings.push(
      'Non-prod/SIP integration adds customer firewall & InfoSec lead time; keep OpenAPI sandbox stubs ready as a Week-1 fallback.'
    );
  }

  const conversionClause =
    povConfig.commercialModel === 'funded_credited'
      ? `Upon achieving ≥${povConfig.nluTargetPct}% NLU accuracy, ≥${povConfig.taskTargetPct}% task resolution, and <${povConfig.latencyTargetMs}ms voice latency, 100% of the $${effectiveFeeUsd.toLocaleString()} POV fee is credited toward Phase 1 PS (${formatCurrencyFull(netPhase1IncrementalCostUsd)} remaining Phase 1 balance).`
      : povConfig.commercialModel === 'paid_pilot'
      ? `Paid Pilot runtime promotes directly into Phase 1 production upon meeting Exit Criteria (≥${povConfig.nluTargetPct}% NLU, ≥${povConfig.taskTargetPct}% Task Res, <${povConfig.latencyTargetMs}ms latency), compressing Phase 1 kickoff lead time.`
      : `Co-Sell POV runs strictly for ${povDurationLabel} on ${heroIntents.length} bounded intent${heroIntents.length === 1 ? '' : 's'}; hitting the Exit Criteria converts directly into the scoped Phase 1 SOW.`;

  return {
    heroIntents,
    scopeStrategyLabel,
    povWeeksMin: weeksMin,
    povWeeksMax: weeksMax,
    povDurationLabel,
    competitorPovDurationLabel,
    effectiveFeeUsd,
    phase1CreditUsd,
    netPhase1IncrementalCostUsd,
    commercialLabel: commercialLabels[povConfig.commercialModel],
    backendIsolationLabel: backendLabels[povConfig.backendMode],
    infosecGateRisk,
    prerequisites,
    exitGates,
    sprintWeeks,
    conversionClause,
    warnings,
  };
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
  povPlan?: PovPlanResult;
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
    povPlan,
  } = params;
  const comp = results.competitorProfile;
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

  const povLines = povPlan
    ? [
        ``,
        `INITIAL POV / POC CHARTER (${povPlan.povDurationLabel} vs. ${povPlan.competitorPovDurationLabel} on ${comp.shortLabel}):`,
        `- Intent Strategy: ${povPlan.scopeStrategyLabel}`,
        `- Bounded Hero Intents (${povPlan.heroIntents.length}): ${
          povPlan.heroIntents.map((u) => u.name).join(', ') || 'Pending High-Feasibility selection'
        }`,
        `- Backend Isolation: ${povPlan.backendIsolationLabel}`,
        `- Commercial Posture: ${povPlan.commercialLabel}`,
        `- Conversion Clause: ${povPlan.conversionClause}`,
      ]
    : [];

  return [
    `OMILIA ENTERPRISE CX DEAL BRIEF — ${preset.name.toUpperCase()}`,
    `================================================================`,
    ...(metaLines.length > 0 ? [metaLines.join(' | '), ``] : []),
    `Competitive Baseline: Omilia Sovereign Stack vs. ${comp.title} (${comp.examples})`,
    `Annual Hard P&L Savings vs. Legacy (${results.laborRealizationPct}% Labor Capture): ${formatCurrencyCompact(results.annualNetSavings)} (${formatCurrencyCompact(results.monthlyNetSavings)}/mo)`,
    `Reclaimed Non-Layoff Capacity Value: ${formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr (${Math.round(results.ftesFreed).toLocaleString()} FTEs freed via attrition/BPO/surge avoidance)`,
    `3-Year TCO Advantage vs. ${comp.shortLabel}: ${formatCurrencyCompact(payback.threeYearCompetitorSavings)} (incl. Self-Learning Compression)`,
    `Phase 1 Implementation Cost (${hlee.psDays} PS Days @ $${psDayRate.toLocaleString()}/day): ${formatCurrencyFull(payback.implementationCost)} vs. ${comp.setupRangeLabel}`,
    `Break-Even Payback (Hard P&L incl. ${payback.omiliaBuildMonths.toFixed(1)}m build + 2m ramp): ${payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} months` : 'N/A'}`,
    `Containment Lift: +${results.containmentLiftPct}% (${Math.round(results.omiliaAutomatedCalls).toLocaleString()} calls automated/mo)`,
    `Agent Capacity Reclaimed: ${results.daysSavedPerAgentMo.toFixed(1)} days/agent/mo (${Math.round(results.ftesFreed).toLocaleString()} FTEs freed)`,
    `Omilia Outcome Pricing: $${inputs.omiliaOutcomeRate.toFixed(2)}/resolved (Yr1) → $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)}/resolved (Yr3 Self-Learning) | Human Cost: $${results.unitHumanCost.toFixed(2)}/call`,
    ``,
    `INCLUDED PHASE 1 USE CASES (${includedUseCases.length} Scoped from AI Radar 2.0):`,
    includedLines,
    ...povLines,
    ``,
    `PARTNER SCOPING & HLEE GUARDRAILS:`,
    `- GTM Motion: ${motionLabel}`,
    `- Deployment: ${sovereigntyLabel}`,
    `- Phase 1 Estimate: ${hlee.timelineLabel} / ${hlee.psEffortLabel} (96%+ Day-1 NLU via AI Bootstrapping)`,
    `- Compliance Perimeter: ${preset.compliance.join(', ')}`,
    `- Target Backend Stack: ${preset.backendStack}`,
    `- Architecture Guarantee: Zero Third-Party Egress (PCI L1 / FedRAMP-ready) | <1s Voice Latency (<45ms Lexis TTS) | Native TalkGuard | 100% CCaaS Neutral`,
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
  povPlan?: PovPlanResult;
}): string {
  const { preset, inputs, results, useCases, hlee, psDayRate, payback, sensitivity, dealMeta, povPlan } = params;
  const comp = results.competitorProfile;
  const povCsvRows: string[][] = povPlan
    ? [
        [],
        ['INITIAL POV / POC CHARTER', 'Value'],
        ['POV Intent Strategy', povPlan.scopeStrategyLabel],
        ['POV Duration (Omilia vs Competitor)', `${povPlan.povDurationLabel} vs ${povPlan.competitorPovDurationLabel}`],
        ['Bounded Hero Intents', povPlan.heroIntents.map((u) => u.name).join(' | ') || 'None'],
        ['Backend Isolation Mode', povPlan.backendIsolationLabel],
        ['Commercial Posture', povPlan.commercialLabel],
        ['POV Fee (USD)', povPlan.effectiveFeeUsd.toString()],
        ['Phase 1 Credit (USD)', povPlan.phase1CreditUsd.toString()],
        ...povPlan.exitGates.map((g) => [`Exit Gate: ${g.metric}`, `${g.threshold} (${g.measurement})`]),
      ]
    : [];

  const rows: string[][] = [
    ['Omilia Partner Workbench Export', preset.name],
    ['Competitive Comparison Baseline', `${comp.title} (${comp.examples})`],
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
    ['Omilia Outcome Rate Yr1 / Yr2 / Yr3 (USD)', `$${payback.omiliaUnitRatesByYear.yr1.toFixed(2)} / $${payback.omiliaUnitRatesByYear.yr2.toFixed(2)} / $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)}`],
    ['Loaded Human Cost per Call (USD)', results.unitHumanCost.toFixed(2)],
    ['Hard P&L Labor Realization (%)', `${results.laborRealizationPct}%`],
    ['Annual Hard P&L Net Savings vs Legacy (USD)', Math.round(results.annualNetSavings).toString()],
    ['Reclaimed Non-Layoff Capacity Value (USD/yr)', Math.round(results.annualCapacityReinvestedValue).toString()],
    [`3-Year TCO Advantage vs ${comp.shortLabel} (USD)`, Math.round(payback.threeYearCompetitorSavings).toString()],
    ['Phase 1 PS Effort', `${hlee.psDays} days @ $${psDayRate}/day`],
    ['Phase 1 Implementation Cost (USD)', Math.round(payback.implementationCost).toString()],
    [`${comp.shortLabel} Upfront Build Cost (USD)`, Math.round(payback.competitorSetupCost).toString()],
    ['Break-Even Payback (Months, Incl. Build & Ramp)', payback.paybackMonths !== null ? payback.paybackMonths.toFixed(1) : 'N/A'],
    ['Equivalent FTEs Freed', Math.round(results.ftesFreed).toString()],
    [],
    ['ANNUALIZED & 3-YR TCO COMPARISON', 'Legacy Baseline', comp.tableHeader, 'Omilia OCP'],
    ['Effective Containment', `${Math.round(results.baseCont * 100)}%`, `${Math.round(results.diyContainment * 100)}%`, `${Math.round(results.targetCont * 100)}%`],
    ['Upfront Build / PS Cost (USD)', '0', Math.round(payback.competitorSetupCost).toString(), Math.round(payback.implementationCost).toString()],
    ['Monthly Platform & AI Spend Yr1 (USD)', Math.round(results.legacyPlatformSpendMo).toString(), Math.round(results.diyPlatformSpendMo).toString(), Math.round(results.omiliaPlatformSpendMo).toString()],
    ['Monthly Escalation Labor Yr1 (USD)', Math.round(results.legacyHumanCostMo).toString(), Math.round(results.diyHumanCostMo).toString(), Math.round(results.omiliaHumanCostMo).toString()],
    ['Annualized Yr1 TCO (USD)', Math.round(results.annualLegacy).toString(), Math.round(results.annualDiy).toString(), Math.round(results.annualOmilia).toString()],
    ['3-Year Total Cumulative Spend (USD)', Math.round(payback.threeYearLegacyTotal).toString(), Math.round(payback.threeYearDiyTotal).toString(), Math.round(payback.threeYearOmiliaTotal).toString()],
    [],
    ['CONTAINMENT SENSITIVITY', 'Target Containment', 'Annual Net Savings (USD)', `3-Yr vs ${comp.shortLabel} (USD)`, 'Payback (Months)', 'FTEs Freed'],
    ...sensitivity.map((s) => [
      s.label,
      `${s.targetContainmentPct}%`,
      Math.round(s.annualNetSavings).toString(),
      Math.round(s.threeYearVsCompetitor).toString(),
      s.paybackMonths !== null ? s.paybackMonths.toFixed(1) : 'N/A',
      Math.round(s.ftesFreed).toString(),
    ]),
    ...povCsvRows,
    [],
    ['AI RADAR 2.0 PORTFOLIO', 'Quadrant', 'Feasibility', 'Impact', 'Phase 1 SOW Included', 'PS Days', 'Runtime Tier'],
    ...useCases.map((uc) => {
      const q = getQuadrantMeta(uc.feas, uc.imp);
      const included = isHighFeasibilityQuadrant(uc) && uc.included !== false;
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
