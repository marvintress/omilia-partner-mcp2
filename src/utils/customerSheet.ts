import type ExcelJS from 'exceljs';
import {
  ApiReadiness,
  BYOLLM_STACK_TIERS,
  ByollmStackTier,
  COMPETITOR_PROFILES,
  CompetitorArchetype,
  DealMetadata,
  DEFAULT_POV_CONFIG,
  PartnerMotion,
  PovBackendMode,
  PovCommercialModel,
  PovConfig,
  PovScopeStrategy,
  SovereigntyTier,
  UseCase,
  VERTICAL_PRESETS,
  VerticalKey,
  VerticalPreset,
} from '../data/verticalPresets';
import { computeFittedAgents, RoiInputs } from './calculations';

export interface CustomerSheetSeedState {
  vertical: VerticalKey;
  inputs: RoiInputs;
  useCases: UseCase[];
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  competitorArchetype: CompetitorArchetype;
  byollmStackTier?: ByollmStackTier;
  povConfig: PovConfig;
  psDayRate: number;
  dealMeta: DealMetadata;
}

export interface ParsedCustomerIntake {
  fileName: string;
  vertical: VerticalKey;
  verticalDetectedExplicitly: boolean;
  inputs: RoiInputs;
  dealMeta: DealMetadata;
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  competitorArchetype: CompetitorArchetype;
  byollmStackTier: ByollmStackTier;
  psDayRate: number;
  povConfig: PovConfig;
  useCases: UseCase[];
  useCasesUpdatedCount: number;
  fieldsAppliedCount: number;
  warnings: string[];
  summaryRows: { label: string; value: string }[];
}

interface QuestionDef {
  key: string;
  section: string;
  question: string;
  allowed: string;
  guidance: string;
  kind: 'text' | 'enum' | 'number' | 'percent' | 'currency' | 'boolean' | 'agents';
  dropdown?: string[];
  numFmt?: string;
  min?: number;
  max?: number;
  getSeedValue: (state: CustomerSheetSeedState) => string | number;
}

const VERTICAL_LABELS: Record<VerticalKey, string> = {
  banking: 'Banking & Financial Services',
  utilities: 'Utilities & Energy',
  insurance: 'Insurance',
  healthcare: 'Healthcare',
  telecom: 'Telecom',
};

const COMPETITOR_LABELS: Record<CompetitorArchetype, string> = {
  byollm: 'Packaged BYOLLM (Cognigy / Kore / Parloa)',
  diy_hyperscaler: 'DIY Hyperscaler (OpenAI / Bedrock)',
};

const BYOLLM_TIER_LABELS: Record<ByollmStackTier, string> = {
  flagship: BYOLLM_STACK_TIERS.flagship.label,
  mini: BYOLLM_STACK_TIERS.mini.label,
};

const SOVEREIGNTY_LABELS: Record<SovereigntyTier, string> = {
  saas: 'OCP SaaS (Certified Cloud)',
  baremetal: 'OCP Bare Metal (On-Prem / Air-Gapped)',
};

const API_READINESS_LABELS: Record<ApiReadiness, string> = {
  modern: 'Modern REST / GraphQL',
  mixed: 'Mixed Legacy + REST',
  mainframe: 'Mainframe / Screen-Scrape',
};

const MOTION_LABELS: Record<PartnerMotion, string> = {
  ccaas: 'CCaaS Co-Sell',
  gsi: 'Global Systems Integrator (GSI)',
  bpo: 'BPO Managed CX',
};

const POV_STRATEGY_LABELS: Record<PovScopeStrategy, string> = {
  hybrid: 'Hybrid (Top-Right + Bottom-Right)',
  top_right: 'Top-Right Only',
  bottom_right: 'Bottom-Right Quick Wins',
};

const POV_BACKEND_LABELS: Record<PovBackendMode, string> = {
  sandbox_mock: 'OpenAPI Sandbox Stubs (Zero InfoSec Wait)',
  nonprod_api: 'Non-Prod Test APIs',
  talkguard_sip: 'Live SIP + TalkGuard',
};

const POV_COMMERCIAL_LABELS: Record<PovCommercialModel, string> = {
  funded_credited: 'Funded Pilot (Credited to SOW)',
  co_sell_free: '$0 Co-Sell Pilot',
  paid_pilot: 'Paid Fixed-Fee Pilot',
};

const QUESTIONS: QuestionDef[] = [
  // Section 1: Account & Deal Context
  {
    key: 'prospect_name',
    section: '1. Account Context',
    question: 'Customer / Organization Name',
    allowed: 'Text',
    guidance: 'Appears on the Executive Deal Brief & PowerPoint deck cover.',
    kind: 'text',
    getSeedValue: (s) => s.dealMeta.prospectName || '',
  },
  {
    key: 'vertical',
    section: '1. Account Context',
    question: 'Industry Vertical',
    allowed: 'Dropdown (5 Sectors)',
    guidance: 'Sets baseline compliance perimeter, benchmark AHT, and starter call drivers.',
    kind: 'enum',
    dropdown: Object.values(VERTICAL_LABELS),
    getSeedValue: (s) => VERTICAL_LABELS[s.vertical],
  },
  {
    key: 'ccaas_platform',
    section: '1. Account Context',
    question: 'Current CCaaS / Telephony Platform',
    allowed: 'Text (e.g. Genesys Cloud, NICE CXone, Amazon Connect)',
    guidance: 'Used to align SIP/UUI handoff & native connector scope.',
    kind: 'text',
    getSeedValue: (s) => s.dealMeta.ccaasPlatform || '',
  },
  {
    key: 'partner_name',
    section: '1. Account Context',
    question: 'Delivery Partner Name (Optional)',
    allowed: 'Text',
    guidance: 'Consulting/GSI/BPO/CCaaS partner co-authoring the business case.',
    kind: 'text',
    getSeedValue: (s) => s.dealMeta.partnerName || '',
  },
  {
    key: 'deal_owner',
    section: '1. Account Context',
    question: 'Primary Contact / Deal Owner (Optional)',
    allowed: 'Text',
    guidance: 'Customer sponsor or partner architect owning the sizing intake.',
    kind: 'text',
    getSeedValue: (s) => s.dealMeta.dealOwner || '',
  },

  // Section 2: Contact Center Volume & Containment
  {
    key: 'call_volume',
    section: '2. Volume & Containment',
    question: 'Monthly Inbound Call Volume (Steady State)',
    allowed: '50,000 – 2,000,000 calls/mo',
    guidance: 'Total monthly calls entering the voice queue before peak seasonal surge.',
    kind: 'number',
    numFmt: '#,##0',
    min: 50000,
    max: 2000000,
    getSeedValue: (s) => s.inputs.callVolume,
  },
  {
    key: 'base_containment',
    section: '2. Volume & Containment',
    question: 'Current Legacy IVR Containment Rate (%)',
    allowed: '0 – 50 (enter whole % e.g. 28)',
    guidance: 'Share of calls resolved today in existing DTMF/IVR before hitting live agents.',
    kind: 'percent',
    numFmt: '0',
    min: 0,
    max: 50,
    getSeedValue: (s) => s.inputs.baseContainment,
  },
  {
    key: 'target_containment',
    section: '2. Volume & Containment',
    question: 'Target Blended AI Containment Rate (%)',
    allowed: '25 – 99 (enter whole % e.g. 58)',
    guidance: 'Expected end-to-end deflection rate with Omilia Conversational AI.',
    kind: 'percent',
    numFmt: '0',
    min: 25,
    max: 99,
    getSeedValue: (s) => s.inputs.targetContainment,
  },
  {
    key: 'surge',
    section: '2. Volume & Containment',
    question: 'Peak / Seasonal Surge Multiplier',
    allowed: '1.0 – 4.0 (e.g. 1.4 for +40% peaks)',
    guidance: 'Outage, open-enrollment, billing cycle, or fraud-event traffic multiplier.',
    kind: 'number',
    numFmt: '0.0',
    min: 1.0,
    max: 4.0,
    getSeedValue: (s) => s.inputs.surge,
  },

  // Section 3: Workforce & Payroll
  {
    key: 'aht',
    section: '3. Workforce & Payroll',
    question: 'Average Handle Time — Talk/Hold (seconds)',
    allowed: '1 – 720 sec (e.g. 340)',
    guidance: 'Average live-agent conversation duration excluding wrap-up.',
    kind: 'number',
    numFmt: '#,##0',
    min: 1,
    max: 720,
    getSeedValue: (s) => s.inputs.aht,
  },
  {
    key: 'acw',
    section: '3. Workforce & Payroll',
    question: 'After-Call Work / Wrap Time (seconds)',
    allowed: '0 – 240 sec (e.g. 45)',
    guidance: 'Average CRM note-taking / wrap duration after caller disconnects.',
    kind: 'number',
    numFmt: '#,##0',
    min: 0,
    max: 240,
    getSeedValue: (s) => s.inputs.acw,
  },
  {
    key: 'wage',
    section: '3. Workforce & Payroll',
    question: 'Base Agent Hourly Wage (USD / hr)',
    allowed: '10 – 65 USD/hr (e.g. 26)',
    guidance: 'Average base hourly wage across onshore/nearshore/BPO agent mix.',
    kind: 'currency',
    numFmt: '$#,##0.00',
    min: 10,
    max: 65,
    getSeedValue: (s) => s.inputs.wage,
  },
  {
    key: 'burden',
    section: '3. Workforce & Payroll',
    question: 'Payroll Taxes, Benefits & Overhead Burden (%)',
    allowed: '10 – 60 (enter whole % e.g. 32)',
    guidance: 'Employer benefits, payroll tax, telecom seat & facilities uplift.',
    kind: 'percent',
    numFmt: '0',
    min: 10,
    max: 60,
    getSeedValue: (s) => s.inputs.burden,
  },
  {
    key: 'occupancy',
    section: '3. Workforce & Payroll',
    question: 'Agent Occupancy Rate (%)',
    allowed: '55 – 95 (enter whole % e.g. 82)',
    guidance: 'Share of paid agent time actively handling calls + wrap-up.',
    kind: 'percent',
    numFmt: '0',
    min: 55,
    max: 95,
    getSeedValue: (s) => s.inputs.occupancy,
  },
  {
    key: 'agents',
    section: '3. Workforce & Payroll',
    question: 'Active Contact Center Agent Headcount (or AUTO)',
    allowed: 'AUTO or Integer (e.g. 500)',
    guidance: 'Leave AUTO to auto-size headcount from volume & AHT, or enter exact FTEs.',
    kind: 'agents',
    getSeedValue: (s) => (s.inputs.autoFitAgents !== false ? 'AUTO' : s.inputs.agents),
  },
  {
    key: 'shift_hours',
    section: '3. Workforce & Payroll',
    question: 'Paid Shift Length (Hours / Day)',
    allowed: '4 – 12 hrs (default 8)',
    guidance: 'Used to convert hours reclaimed into equivalent FTEs freed.',
    kind: 'number',
    numFmt: '0.0',
    min: 4,
    max: 12,
    getSeedValue: (s) => s.inputs.shiftHours,
  },
  {
    key: 'work_days',
    section: '3. Workforce & Payroll',
    question: 'Working Days / Month per Agent',
    allowed: '15 – 26 days (default 21.5)',
    guidance: 'Standard productive workdays per month per full-time agent.',
    kind: 'number',
    numFmt: '0.0',
    min: 15,
    max: 26,
    getSeedValue: (s) => s.inputs.workDays,
  },
  {
    key: 'cfo_override',
    section: '3. Workforce & Payroll',
    question: 'Use Direct Finance Cost-per-Call Override?',
    allowed: 'Dropdown (No / Yes)',
    guidance: 'Choose Yes only if your CFO provides an audited flat $/call benchmark.',
    kind: 'boolean',
    dropdown: ['No', 'Yes'],
    getSeedValue: (s) => (s.inputs.cfoOverride ? 'Yes' : 'No'),
  },
  {
    key: 'cfo_override_val',
    section: '3. Workforce & Payroll',
    question: 'Audited CFO Cost per Human Call (USD)',
    allowed: '0.50 – 15.00 USD (if Override = Yes)',
    guidance: 'Replaces wage/burden/occupancy math when Override = Yes.',
    kind: 'currency',
    numFmt: '$#,##0.00',
    min: 0.5,
    max: 15,
    getSeedValue: (s) => s.inputs.cfoOverrideVal,
  },
  {
    key: 'labor_realization_pct',
    section: '3. Workforce & Payroll',
    question: 'Hard P&L Labor Realization (%)',
    allowed: '25 – 100 (default 65)',
    guidance: 'Share converted to cash savings via attrition/BPO flex-down (zero Day-1 layoffs).',
    kind: 'percent',
    numFmt: '0',
    min: 25,
    max: 100,
    getSeedValue: (s) => s.inputs.laborRealizationPct ?? 65,
  },

  // Section 4: Architecture, Capabilities & Commercials
  {
    key: 'competitor_archetype',
    section: '4. Commercials & Architecture',
    question: 'Primary Alternative Architecture Under Review',
    allowed: 'Dropdown (BYOLLM / DIY Hyperscaler)',
    guidance: 'Benchmarks Omilia TCO & break-even against Packaged BYOLLM or DIY builds (incl. build wait, drift & 35% failed-call burn).',
    kind: 'enum',
    dropdown: Object.values(COMPETITOR_LABELS),
    getSeedValue: (s) => COMPETITOR_LABELS[s.competitorArchetype],
  },
  {
    key: 'byollm_stack_tier',
    section: '4. Commercials & Architecture',
    question: 'Packaged BYOLLM Model & Speech Stack Tier',
    allowed: 'Dropdown (Flagship Voice / Discounted Mini)',
    guidance: 'Applies when BYOLLM is selected: Flagship Voice ($0.46/res base: Frontier LLM + Premium TTS) vs. Discounted Mini ($0.36/res base).',
    kind: 'enum',
    dropdown: Object.values(BYOLLM_TIER_LABELS),
    getSeedValue: (s) => BYOLLM_TIER_LABELS[s.byollmStackTier ?? 'flagship'],
  },
  {
    key: 'omilia_outcome_rate',
    section: '4. Commercials & Architecture',
    question: 'Target Omilia Outcome Rate ($ / Resolved Call)',
    allowed: '0.15 – 1.00 USD (default 0.40)',
    guidance: 'Flat Year-1 per-resolution rate ($0 on unresolved escalations, zero pass-through token/ASR/TTS fees; -10% Yr2 / -18% Yr3).',
    kind: 'currency',
    numFmt: '$#,##0.00',
    min: 0.15,
    max: 1.0,
    getSeedValue: (s) => s.inputs.omiliaOutcomeRate,
  },
  {
    key: 'talkguard',
    section: '4. Commercials & Architecture',
    question: 'Include Passive Voice Biometrics (TalkGuard)?',
    allowed: 'Dropdown (Yes / No)',
    guidance: 'Eliminates manual KBA authentication seconds on escalated calls + blocks deepfakes.',
    kind: 'boolean',
    dropdown: ['Yes', 'No'],
    getSeedValue: (s) => (s.inputs.talkguard ? 'Yes' : 'No'),
  },
  {
    key: 'copilot',
    section: '4. Commercials & Architecture',
    question: 'Include Real-Time Agent Assist (CSR CoPilot)?',
    allowed: 'Dropdown (Yes / No)',
    guidance: 'Automates live dispositioning & wrap-up notes on escalated calls.',
    kind: 'boolean',
    dropdown: ['Yes', 'No'],
    getSeedValue: (s) => (s.inputs.copilot ? 'Yes' : 'No'),
  },
  {
    key: 'sovereignty',
    section: '4. Commercials & Architecture',
    question: 'Deployment Sovereignty Requirement',
    allowed: 'Dropdown (OCP SaaS / Bare Metal)',
    guidance: 'Bare Metal on-prem/air-gapped deployment adds +3 wks & +12 PS days.',
    kind: 'enum',
    dropdown: Object.values(SOVEREIGNTY_LABELS),
    getSeedValue: (s) => SOVEREIGNTY_LABELS[s.sovereignty],
  },
  {
    key: 'api_readiness',
    section: '4. Commercials & Architecture',
    question: 'Backend System / API Readiness',
    allowed: 'Dropdown (Modern / Mixed / Mainframe)',
    guidance: 'Assesses REST/MCP availability vs. mainframe middleware prerequisites.',
    kind: 'enum',
    dropdown: Object.values(API_READINESS_LABELS),
    getSeedValue: (s) => API_READINESS_LABELS[s.apiReadiness],
  },
  {
    key: 'partner_motion',
    section: '4. Commercials & Architecture',
    question: 'Preferred Delivery / Partner Motion',
    allowed: 'Dropdown (CCaaS / GSI / BPO)',
    guidance: 'Tailors SOW RACI ownership split and co-sell positioning.',
    kind: 'enum',
    dropdown: Object.values(MOTION_LABELS),
    getSeedValue: (s) => MOTION_LABELS[s.partnerMotion],
  },
  {
    key: 'ps_day_rate',
    section: '4. Commercials & Architecture',
    question: 'Blended Professional Services Day Rate (USD / Day)',
    allowed: '800 – 3,500 USD (default 1800)',
    guidance: 'Multiplied by HLEE PS days to calculate Phase 1 setup cost & payback.',
    kind: 'currency',
    numFmt: '$#,##0',
    min: 800,
    max: 3500,
    getSeedValue: (s) => s.psDayRate,
  },

  // Section 5: POV / POC Blueprint (Optional)
  {
    key: 'pov_strategy',
    section: '5. POV / POC Charter',
    question: 'Initial POV / POC Intent Selection Strategy',
    allowed: 'Dropdown (Hybrid / Top-Right / Quick Wins)',
    guidance: 'Hybrid validates both transactional API integration & Voice-Safe RAG in one pilot.',
    kind: 'enum',
    dropdown: Object.values(POV_STRATEGY_LABELS),
    getSeedValue: (s) => POV_STRATEGY_LABELS[s.povConfig.scopeStrategy],
  },
  {
    key: 'pov_intent_count',
    section: '5. POV / POC Charter',
    question: 'Hero Intents Scoped for POV (1–3)',
    allowed: '1, 2, or 3',
    guidance: 'Recommended max 3 workflows to lock a fast 2–4 week production-grade pilot.',
    kind: 'number',
    numFmt: '0',
    min: 1,
    max: 3,
    getSeedValue: (s) => s.povConfig.intentCount,
  },
  {
    key: 'pov_backend_mode',
    section: '5. POV / POC Charter',
    question: 'POV Backend Isolation Mode',
    allowed: 'Dropdown (Sandbox / Non-Prod / Live SIP)',
    guidance: 'OpenAPI Sandbox stubs avoid customer InfoSec queues during pilot.',
    kind: 'enum',
    dropdown: Object.values(POV_BACKEND_LABELS),
    getSeedValue: (s) => POV_BACKEND_LABELS[s.povConfig.backendMode],
  },
  {
    key: 'pov_commercial_model',
    section: '5. POV / POC Charter',
    question: 'POV Commercial Structure',
    allowed: 'Dropdown (Funded-Credited / $0 Co-Sell / Paid)',
    guidance: 'Funded-Credited applies 100% of pilot fee toward the Phase 1 SOW.',
    kind: 'enum',
    dropdown: Object.values(POV_COMMERCIAL_LABELS),
    getSeedValue: (s) => POV_COMMERCIAL_LABELS[s.povConfig.commercialModel],
  },
];

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadCustomerSpreadsheet(
  state: CustomerSheetSeedState,
  mode: 'seeded' | 'blank'
): Promise<void> {
  const ExcelJSModule = await import('exceljs');
  const ExcelJSClass = ExcelJSModule.default;
  const wb = new ExcelJSClass.Workbook();
  wb.creator = 'Omilia Partner Workbench';
  wb.created = new Date();

  const preset = VERTICAL_PRESETS[state.vertical];
  const navy = '0F172A';
  const teal = '0F766E';
  const inputBg = 'ECFEFF';
  const stripeBg = 'F8FAFC';
  const headerText = 'FFFFFF';
  const borderColor = 'CBD5E1';

  // =========================================================================
  // TAB 1: Customer Discovery
  // =========================================================================
  const ws = wb.addWorksheet('Customer Discovery', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ws.columns = [
    { key: 'fieldKey', width: 22 },
    { key: 'section', width: 25 },
    { key: 'question', width: 44 },
    { key: 'value', width: 34 },
    { key: 'allowed', width: 34 },
    { key: 'guidance', width: 54 },
  ];

  // Title & Instructions Banner
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `OMILIA PARTNER WORKBENCH — CUSTOMER DISCOVERY INTAKE QUESTIONNAIRE`;
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:F2');
  const subCell = ws.getCell('A2');
  subCell.value =
    mode === 'seeded'
      ? `Pre-seeded with ${preset.name} assumptions. Please update ONLY the light-teal "Customer Input" column (Column D) and score call drivers on Tab 2, then save & return.`
      : `Blank discovery intake. Fill in the light-teal "Customer Input" cells (Column D) you know—leave unknowns blank to use industry benchmarks—and review Tab 2 call drivers.`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '334155' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
  ws.getRow(2).height = 26;

  ws.getRow(3).height = 8;

  const headerRow = ws.getRow(4);
  headerRow.values = [
    'Field Key (Do Not Edit)',
    'Category',
    'Discovery Input Question',
    'Customer Input (Edit Here)',
    'Format / Expected Range',
    'Guidance & Context',
  ];
  headerRow.height = 24;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: headerText } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colNumber === 4 ? teal : navy },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });

  QUESTIONS.forEach((q, idx) => {
    const rowIdx = 5 + idx;
    const row = ws.getRow(rowIdx);

    let seedVal: string | number = '';
    if (mode === 'seeded') {
      seedVal = q.getSeedValue(state);
    } else if (q.key === 'vertical') {
      seedVal = VERTICAL_LABELS[state.vertical];
    }

    row.values = [q.key, q.section, q.question, seedVal, q.allowed, q.guidance];
    row.height = 23;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: borderColor } },
        bottom: { style: 'thin', color: { argb: borderColor } },
        left: { style: 'thin', color: { argb: borderColor } },
        right: { style: 'thin', color: { argb: borderColor } },
      };

      if (colNumber === 1) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: '64748B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeBg } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      } else if (colNumber === 2) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '334155' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeBg } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      } else if (colNumber === 3) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
      } else if (colNumber === 4) {
        cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: '0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: inputBg } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: q.kind === 'number' || q.kind === 'percent' || q.kind === 'currency' ? 'right' : 'left',
          indent: 1,
        };
        if (q.numFmt) {
          cell.numFmt = q.numFmt;
        }
        if (q.dropdown && q.dropdown.length > 0) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${q.dropdown.join(',')}"`],
            showErrorMessage: false,
          };
        }
      } else {
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: '475569' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
      }
    });
  });

  // =========================================================================
  // TAB 2: Use Cases (Call Drivers)
  // =========================================================================
  const ucWs = wb.addWorksheet('Use Cases (Call Drivers)', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ucWs.columns = [
    { key: 'name', width: 38 },
    { key: 'feas', width: 24 },
    { key: 'imp', width: 24 },
    { key: 'include', width: 22 },
    { key: 'notes', width: 52 },
  ];

  ucWs.mergeCells('A1:E1');
  const ucTitle = ucWs.getCell('A1');
  ucTitle.value = `TOP CALL DRIVERS & AUTOMATION CANDIDATES (${preset.shortName.toUpperCase()})`;
  ucTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: headerText } };
  ucTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
  ucTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ucWs.getRow(1).height = 28;

  ucWs.mergeCells('A2:E2');
  const ucSub = ucWs.getCell('A2');
  ucSub.value =
    'Score Feasibility (0–100: APIs & data readiness) and Business Impact (0–100: call volume & cost). Items with Feasibility >= 50 and Include = Yes populate your Phase 1 SOW.';
  ucSub.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '334155' } };
  ucSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  ucSub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
  ucWs.getRow(2).height = 24;

  ucWs.getRow(3).height = 8;

  const ucHeader = ucWs.getRow(4);
  ucHeader.values = [
    'Use Case / Call Driver Name',
    'Feasibility & Data (0–100)',
    'Business & CX Impact (0–100)',
    'Include in Phase 1? (Yes/No)',
    'Backend API / Workflow Notes',
  ];
  ucHeader.height = 24;
  ucHeader.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: teal } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });

  const ucRowsCount = Math.max(state.useCases.length + 4, 12);
  for (let i = 0; i < ucRowsCount; i++) {
    const existing = state.useCases[i];
    const row = ucWs.getRow(5 + i);
    if (existing) {
      row.values = [
        existing.name,
        existing.feas,
        existing.imp,
        existing.included !== false ? 'Yes' : 'No',
        existing.desc,
      ];
    } else {
      row.values = ['', '', '', '', ''];
    }
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: borderColor } },
        bottom: { style: 'thin', color: { argb: borderColor } },
        left: { style: 'thin', color: { argb: borderColor } },
        right: { style: 'thin', color: { argb: borderColor } },
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber <= 4 ? inputBg : 'FFFFFF' } };
      cell.font = { name: 'Calibri', size: 10, color: { argb: '0F172A' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 2 || colNumber === 3 ? 'right' : 'left',
        indent: 1,
        wrapText: true,
      };
      if (colNumber === 4) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Yes,No"'],
          showErrorMessage: false,
        };
      }
    });
  }

  // =========================================================================
  // TAB 3: Reference & Glossary
  // =========================================================================
  const refWs = wb.addWorksheet('Reference & Benchmarks');
  refWs.columns = [
    { key: 'vertical', width: 28 },
    { key: 'calls', width: 18 },
    { key: 'base', width: 16 },
    { key: 'target', width: 16 },
    { key: 'aht', width: 14 },
    { key: 'acw', width: 14 },
    { key: 'wage', width: 14 },
    { key: 'surge', width: 14 },
  ];

  refWs.mergeCells('A1:H1');
  const refTitle = refWs.getCell('A1');
  refTitle.value = 'INDUSTRY BENCHMARK DEFAULTS & GLOSSARY';
  refTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: headerText } };
  refTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
  refTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  refWs.getRow(1).height = 26;

  const refHeader = refWs.getRow(3);
  refHeader.values = [
    'Industry Vertical',
    'Calls / Mo',
    'Legacy IVR %',
    'Target AI %',
    'AHT (sec)',
    'ACW (sec)',
    'Wage ($/hr)',
    'Peak Surge',
  ];
  refHeader.height = 22;
  refHeader.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: teal } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });

  (Object.keys(VERTICAL_PRESETS) as VerticalKey[]).forEach((k, idx) => {
    const p: VerticalPreset = VERTICAL_PRESETS[k];
    const r = refWs.getRow(4 + idx);
    r.values = [
      p.name,
      p.roi.callVolume,
      p.roi.baseContainment,
      p.roi.targetContainment,
      p.roi.aht,
      p.roi.acw,
      p.roi.wage,
      p.roi.surge,
    ];
    r.height = 21;
  });

  const glossaryNotes = [
    ['Key Term', 'What It Means in the Omilia Partner Workbench'],
    [
      'Hard P&L Labor Realization (%)',
      'Percent of freed agent payroll realized as cash budget savings via natural attrition (25–35%/yr), BPO flex-down, and hiring avoidance—without assuming Day-1 layoffs. The remaining share stays in the contact center as Reclaimed Capacity.',
    ],
    [
      'Outcome Pricing vs. Attempt Metering',
      'Omilia charges a flat outcome rate per resolved call ($0 on unresolved escalations, zero token/ASR/TTS pass-through), compressing -10% Yr2 / -18% Yr3 via Self-Learning. BYOLLM & DIY stacks meter LLM/ASR/TTS across both resolved calls and ~35% failed/escalated bot attempts.',
    ],
    [
      'BYOLLM Model & Speech Stack Tier',
      'Switches Packaged BYOLLM (Cognigy / Kore.ai / Parloa) pass-through pricing between Flagship Voice (default: $0.46/res base, surge^0.15 — Frontier/Realtime LLM + Commercial ASR + ElevenLabs-tier Premium TTS + orchestration) and Discounted Mini ($0.36/res base, surge^0.28 — Mini/Flash LLM + Standard TTS), both plus $15K/mo license and 35% escalated attempt burn.',
    ],
    [
      'Legacy IVR Containment (%)',
      'Share of inbound calls currently resolved end-to-end in existing DTMF/IVR before transferring to a live agent.',
    ],
    [
      'Occupancy Rate (%)',
      'Percentage of logged-in paid time an agent spends actively handling calls + wrap-up (typically 75–85%).',
    ],
    [
      'Build Window + 2-Mo Ramp',
      'Break-even payback accounts for implementation time (zero deflection during build) plus a 2-month post-launch ramp (25% -> 60% -> 100%) and Omilia consumption fees.',
    ],
    [
      'Partial Fill & Round-Trip Sync',
      'Leave any cell blank if unknown—on upload, the workbench inherits that vertical’s verified industry benchmarks and previews all changes before applying.',
    ],
  ];
  glossaryNotes.forEach((pair, idx) => {
    const r = refWs.getRow(11 + idx);
    r.getCell(1).value = pair[0];
    refWs.mergeCells(`B${11 + idx}:H${11 + idx}`);
    r.getCell(2).value = pair[1];
    r.height = idx === 0 ? 22 : 34;
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: idx === 0 ? headerText : navy } };
    r.getCell(2).font = { name: 'Calibri', size: 10, bold: idx === 0, color: { argb: idx === 0 ? headerText : '334155' } };
    if (idx === 0) {
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
    } else {
      r.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const slug = (state.dealMeta.prospectName || preset.shortName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, `omilia-customer-discovery-${slug || 'template'}.xlsx`);
}

export function downloadBlankCsvTemplate(state: CustomerSheetSeedState, mode: 'seeded' | 'blank'): void {
  const esc = (v: string | number) => {
    const str = String(v ?? '');
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const header = ['field_key', 'category', 'question', 'customer_input', 'allowed_range', 'guidance'];
  const rows = QUESTIONS.map((q) => {
    let val: string | number = '';
    if (mode === 'seeded') {
      val = q.getSeedValue(state);
    } else if (q.key === 'vertical') {
      val = VERTICAL_LABELS[state.vertical];
    }
    return [q.key, q.section, q.question, val, q.allowed, q.guidance].map(esc).join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, `omilia-customer-discovery-${state.vertical}.csv`);
}

function extractCellRawValue(cellVal: ExcelJS.CellValue): string | number | boolean | null {
  if (cellVal === null || cellVal === undefined) return null;
  if (typeof cellVal === 'string' || typeof cellVal === 'number' || typeof cellVal === 'boolean') {
    return cellVal;
  }
  if (typeof cellVal === 'object') {
    if ('result' in cellVal && cellVal.result !== undefined) {
      return cellVal.result as string | number | boolean;
    }
    if ('richText' in cellVal && Array.isArray(cellVal.richText)) {
      return cellVal.richText.map((r) => r.text).join('');
    }
    if ('text' in cellVal && typeof cellVal.text === 'string') {
      return cellVal.text;
    }
    if ('hyperlink' in cellVal && typeof cellVal.hyperlink === 'string') {
      return cellVal.hyperlink;
    }
  }
  return String(cellVal);
}

function cleanNumberString(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const cleaned = trimmed
    .replace(/[$€£,%\s]/g, '')
    .replace(/calls\/mo|calls|sec|hrs|hr|days|day|x$/gi, '')
    .trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parsePercentCell(
  rawVal: string | number | boolean | null,
  numFmt: string | undefined,
  min: number,
  max: number,
  label: string,
  warnings: string[]
): number | null {
  if (rawVal === null || rawVal === '') return null;
  const rawStr = String(rawVal).trim();
  if (!rawStr) return null;

  let n = typeof rawVal === 'number' ? rawVal : cleanNumberString(rawStr);
  if (n === null) {
    warnings.push(`${label}: could not parse "${rawStr}" as percentage; kept default.`);
    return null;
  }

  // Excel percentage cells store e.g. 58% as 0.58
  if ((numFmt && numFmt.includes('%') && n <= 1) || rawStr.includes('%') && n <= 1 || (n > 0 && n <= 1)) {
    n = n * 100;
  }
  const rounded = Math.round(n);
  if (rounded < min || rounded > max) {
    const clamped = Math.max(min, Math.min(max, rounded));
    warnings.push(`${label}: ${rounded}% clamped to ${clamped}% (allowed ${min}–${max}%).`);
    return clamped;
  }
  return rounded;
}

function parseNumericCell(
  rawVal: string | number | boolean | null,
  min: number,
  max: number,
  decimals: number,
  label: string,
  warnings: string[]
): number | null {
  if (rawVal === null || rawVal === '') return null;
  const rawStr = String(rawVal).trim();
  if (!rawStr) return null;
  const n = typeof rawVal === 'number' ? rawVal : cleanNumberString(rawStr);
  if (n === null) {
    warnings.push(`${label}: could not parse "${rawStr}" as number; kept default.`);
    return null;
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(n * factor) / factor;
  if (rounded < min || rounded > max) {
    const clamped = Math.max(min, Math.min(max, rounded));
    warnings.push(`${label}: ${rounded} clamped to ${clamped} (allowed ${min}–${max}).`);
    return clamped;
  }
  return rounded;
}

function parseBooleanCell(rawVal: string | number | boolean | null): boolean | null {
  if (rawVal === null || rawVal === '') return null;
  if (typeof rawVal === 'boolean') return rawVal;
  const s = String(rawVal).trim().toLowerCase();
  if (!s) return null;
  if (['yes', 'y', 'true', '1', 'on', 'enabled', 'include', 'included'].includes(s)) return true;
  if (['no', 'n', 'false', '0', 'off', 'disabled', 'exclude', 'excluded'].includes(s)) return false;
  return null;
}

function matchVertical(raw: string): VerticalKey | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('bank') || s.includes('fin')) return 'banking';
  if (s.includes('util') || s.includes('energy') || s.includes('power')) return 'utilities';
  if (s.includes('insur')) return 'insurance';
  if (s.includes('health') || s.includes('med') || s.includes('clinic')) return 'healthcare';
  if (s.includes('tel') || s.includes('isp') || s.includes('carrier')) return 'telecom';
  return null;
}

function matchCompetitor(raw: string): CompetitorArchetype | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('diy') || s.includes('hyperscaler') || s.includes('openai') || s.includes('bedrock') || s.includes('azure')) {
    return 'diy_hyperscaler';
  }
  if (s.includes('byollm') || s.includes('packaged') || s.includes('cognigy') || s.includes('kore') || s.includes('parloa')) {
    return 'byollm';
  }
  return null;
}

function matchByollmTier(raw: string): ByollmStackTier | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('mini') || s.includes('discount') || s.includes('std') || s.includes('flash') || s.includes('0.36')) {
    return 'mini';
  }
  if (s.includes('flagship') || s.includes('frontier') || s.includes('premium') || s.includes('eleven') || s.includes('0.46')) {
    return 'flagship';
  }
  return null;
}

function matchSovereignty(raw: string): SovereigntyTier | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('bare') || s.includes('prem') || s.includes('air')) return 'baremetal';
  if (s.includes('saas') || s.includes('cloud') || s.includes('walled')) return 'saas';
  return null;
}

function matchApiReadiness(raw: string): ApiReadiness | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('mainframe') || s.includes('3270') || s.includes('screen')) return 'mainframe';
  if (s.includes('mix')) return 'mixed';
  if (s.includes('modern') || s.includes('rest') || s.includes('graphql')) return 'modern';
  return null;
}

function matchMotion(raw: string): PartnerMotion | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('gsi') || s.includes('integrator') || s.includes('accenture') || s.includes('deloitte')) return 'gsi';
  if (s.includes('bpo') || s.includes('managed')) return 'bpo';
  if (s.includes('ccaas') || s.includes('co-sell') || s.includes('cosell')) return 'ccaas';
  return null;
}

function matchPovStrategy(raw: string): PovScopeStrategy | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('hybrid')) return 'hybrid';
  if (s.includes('top')) return 'top_right';
  if (s.includes('bottom') || s.includes('quick')) return 'bottom_right';
  return null;
}

function matchPovBackend(raw: string): PovBackendMode | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('non') || s.includes('test')) return 'nonprod_api';
  if (s.includes('live') || s.includes('sip') || s.includes('talkguard')) return 'talkguard_sip';
  if (s.includes('sandbox') || s.includes('stub') || s.includes('mock')) return 'sandbox_mock';
  return null;
}

function matchPovCommercial(raw: string): PovCommercialModel | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('co-sell') || s.includes('cosell') || s.includes('$0') || s.includes('free')) return 'co_sell_free';
  if (s.includes('paid')) return 'paid_pilot';
  if (s.includes('fund') || s.includes('credit')) return 'funded_credited';
  return null;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function buildDefaultRoiFromPreset(preset: VerticalPreset): RoiInputs {
  const base: RoiInputs = {
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
    autoFitAgents: true,
    shiftHours: 8,
    workDays: 21.5,
    laborRealizationPct: 65,
  };
  return {
    ...base,
    agents: computeFittedAgents(base),
  };
}

export async function parseCustomerSpreadsheet(
  file: File,
  fallbackVertical: VerticalKey
): Promise<ParsedCustomerIntake> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extractedMap = new Map<
    string,
    { rawVal: string | number | boolean | null; numFmt?: string }
  >();
  const rawUseCaseRows: {
    name: string;
    feasRaw: string | number | boolean | null;
    impRaw: string | number | boolean | null;
    includeRaw: string | number | boolean | null;
    notes: string;
  }[] = [];

  if (ext === 'csv') {
    const text = await file.text();
    const csvRows = parseCsvRows(text);
    for (const r of csvRows) {
      const k = (r[0] ?? '').trim();
      const questionText = (r[2] ?? '').trim().toLowerCase();
      const val = (r[3] ?? '').trim();
      if (k && QUESTIONS.some((q) => q.key === k)) {
        if (val !== '') extractedMap.set(k, { rawVal: val });
      } else if (questionText) {
        const matched = QUESTIONS.find((q) => q.question.toLowerCase() === questionText);
        if (matched && val !== '') extractedMap.set(matched.key, { rawVal: val });
      }
    }
  } else {
    const ExcelJSModule = await import('exceljs');
    const ExcelJSClass = ExcelJSModule.default;
    const wb = new ExcelJSClass.Workbook();
    const buf = await file.arrayBuffer();
    await wb.xlsx.load(buf);

    const discoveryWs =
      wb.getWorksheet('Customer Discovery') ?? wb.worksheets[0];

    if (!discoveryWs) {
      throw new Error('No worksheets found inside the uploaded Excel file.');
    }

    discoveryWs.eachRow((row) => {
      const colA = extractCellRawValue(row.getCell(1).value);
      const colC = extractCellRawValue(row.getCell(3).value);
      const cellD = row.getCell(4);
      const colD = extractCellRawValue(cellD.value);

      const keyStr = colA !== null ? String(colA).trim() : '';
      const qStr = colC !== null ? String(colC).trim().toLowerCase() : '';

      let matchedDef = QUESTIONS.find((q) => q.key === keyStr);
      if (!matchedDef && qStr) {
        matchedDef = QUESTIONS.find((q) => q.question.toLowerCase() === qStr);
      }
      if (matchedDef && colD !== null && String(colD).trim() !== '') {
        extractedMap.set(matchedDef.key, {
          rawVal: colD,
          numFmt: typeof cellD.numFmt === 'string' ? cellD.numFmt : undefined,
        });
      }
    });

    const ucWs =
      wb.getWorksheet('Use Cases (Call Drivers)') ?? wb.worksheets[1];
    if (ucWs && ucWs.name.toLowerCase().includes('use case')) {
      ucWs.eachRow((row, rowNumber) => {
        if (rowNumber <= 4) return;
        const nameRaw = extractCellRawValue(row.getCell(1).value);
        const name = nameRaw !== null ? String(nameRaw).trim() : '';
        if (!name || name.toLowerCase().startsWith('use case / call driver')) return;
        const feasRaw = extractCellRawValue(row.getCell(2).value);
        const impRaw = extractCellRawValue(row.getCell(3).value);
        const includeRaw = extractCellRawValue(row.getCell(4).value);
        const notesRaw = extractCellRawValue(row.getCell(5).value);
        rawUseCaseRows.push({
          name,
          feasRaw,
          impRaw,
          includeRaw,
          notes: notesRaw !== null ? String(notesRaw).trim() : '',
        });
      });
    }
  }

  if (extractedMap.size === 0 && rawUseCaseRows.length === 0) {
    throw new Error(
      'Could not find any Customer Discovery fields. Please upload an .xlsx or .csv exported from the Omilia Customer Sheet template.'
    );
  }

  const warnings: string[] = [];

  // 1. Determine vertical first so remaining blank cells inherit that vertical's preset defaults!
  let targetVertical: VerticalKey = fallbackVertical;
  let verticalDetectedExplicitly = false;
  const vertEntry = extractedMap.get('vertical');
  if (vertEntry && vertEntry.rawVal !== null) {
    const matchedVert = matchVertical(String(vertEntry.rawVal));
    if (matchedVert) {
      targetVertical = matchedVert;
      verticalDetectedExplicitly = true;
    } else {
      warnings.push(
        `Industry Vertical "${vertEntry.rawVal}" unrecognized; defaulted to ${VERTICAL_PRESETS[fallbackVertical].shortName}.`
      );
    }
  }

  const preset = VERTICAL_PRESETS[targetVertical];
  const inputs: RoiInputs = buildDefaultRoiFromPreset(preset);
  const dealMeta: DealMetadata = {
    prospectName: '',
    partnerName: '',
    ccaasPlatform: '',
    dealOwner: '',
  };
  let partnerMotion: PartnerMotion = 'ccaas';
  let sovereignty: SovereigntyTier = 'saas';
  let apiReadiness: ApiReadiness = 'modern';
  let competitorArchetype: CompetitorArchetype = 'byollm';
  let byollmStackTier: ByollmStackTier = 'flagship';
  let psDayRate = 1800;
  const povConfig: PovConfig = { ...DEFAULT_POV_CONFIG };

  let fieldsAppliedCount = verticalDetectedExplicitly ? 1 : 0;

  const getText = (key: string): string | null => {
    const entry = extractedMap.get(key);
    if (!entry || entry.rawVal === null) return null;
    const str = String(entry.rawVal).trim();
    return str.length > 0 ? str : null;
  };

  const prospectName = getText('prospect_name');
  if (prospectName) {
    dealMeta.prospectName = prospectName;
    fieldsAppliedCount++;
  }
  const partnerName = getText('partner_name');
  if (partnerName) {
    dealMeta.partnerName = partnerName;
    fieldsAppliedCount++;
  }
  const ccaasPlatform = getText('ccaas_platform');
  if (ccaasPlatform) {
    dealMeta.ccaasPlatform = ccaasPlatform;
    fieldsAppliedCount++;
  }
  const dealOwner = getText('deal_owner');
  if (dealOwner) {
    dealMeta.dealOwner = dealOwner;
    fieldsAppliedCount++;
  }

  const applyNum = (
    key: string,
    min: number,
    max: number,
    decimals: number,
    label: string,
    setter: (v: number) => void
  ) => {
    const e = extractedMap.get(key);
    if (!e) return;
    const v = parseNumericCell(e.rawVal, min, max, decimals, label, warnings);
    if (v !== null) {
      setter(v);
      fieldsAppliedCount++;
    }
  };

  const applyPct = (
    key: string,
    min: number,
    max: number,
    label: string,
    setter: (v: number) => void
  ) => {
    const e = extractedMap.get(key);
    if (!e) return;
    const v = parsePercentCell(e.rawVal, e.numFmt, min, max, label, warnings);
    if (v !== null) {
      setter(v);
      fieldsAppliedCount++;
    }
  };

  applyNum('call_volume', 50000, 2000000, 0, 'Monthly Call Volume', (v) => (inputs.callVolume = v));
  applyPct('base_containment', 0, 50, 'Legacy IVR Containment', (v) => (inputs.baseContainment = v));
  applyPct('target_containment', 25, 99, 'Target Containment', (v) => (inputs.targetContainment = v));
  applyNum('surge', 1.0, 4.0, 1, 'Peak Surge Multiplier', (v) => (inputs.surge = v));
  applyNum('aht', 1, 720, 0, 'AHT (seconds)', (v) => (inputs.aht = v));
  applyNum('acw', 0, 240, 0, 'ACW (seconds)', (v) => (inputs.acw = v));
  applyNum('wage', 10, 65, 2, 'Agent Wage', (v) => (inputs.wage = v));
  applyPct('burden', 10, 60, 'Payroll Burden', (v) => (inputs.burden = v));
  applyPct('occupancy', 55, 95, 'Occupancy Rate', (v) => (inputs.occupancy = v));
  applyNum('shift_hours', 4, 12, 1, 'Shift Hours/Day', (v) => (inputs.shiftHours = v));
  applyNum('work_days', 15, 26, 1, 'Working Days/Mo', (v) => (inputs.workDays = v));
  applyPct('labor_realization_pct', 25, 100, 'Hard P&L Realization', (v) => (inputs.laborRealizationPct = v));
  applyNum('omilia_outcome_rate', 0.15, 1.0, 2, 'Omilia Outcome Rate', (v) => (inputs.omiliaOutcomeRate = v));
  applyNum('cfo_override_val', 0.5, 15.0, 2, 'CFO Cost Override', (v) => (inputs.cfoOverrideVal = v));
  applyNum('ps_day_rate', 800, 3500, 0, 'PS Day Rate', (v) => (psDayRate = v));
  applyNum('pov_intent_count', 1, 3, 0, 'POV Hero Intents', (v) => (povConfig.intentCount = v));

  if (inputs.targetContainment <= inputs.baseContainment) {
    const adjusted = Math.min(99, inputs.baseContainment + 10);
    warnings.push(
      `Target Containment (${inputs.targetContainment}%) was not above Legacy Containment (${inputs.baseContainment}%); adjusted to ${adjusted}%.`
    );
    inputs.targetContainment = adjusted;
  }

  // Agents (AUTO vs numeric headcount)
  const agentsEntry = extractedMap.get('agents');
  if (agentsEntry && agentsEntry.rawVal !== null) {
    const str = String(agentsEntry.rawVal).trim().toLowerCase();
    if (!str || str === 'auto' || str.includes('auto')) {
      inputs.autoFitAgents = true;
      inputs.agents = computeFittedAgents(inputs);
      fieldsAppliedCount++;
    } else {
      const parsed = parseNumericCell(agentsEntry.rawVal, 10, 100000, 0, 'Active Agents', warnings);
      if (parsed !== null) {
        inputs.autoFitAgents = false;
        inputs.agents = parsed;
        fieldsAppliedCount++;
      } else {
        inputs.autoFitAgents = true;
        inputs.agents = computeFittedAgents(inputs);
      }
    }
  } else {
    inputs.autoFitAgents = true;
    inputs.agents = computeFittedAgents(inputs);
  }

  // Booleans
  const cfoOv = parseBooleanCell(extractedMap.get('cfo_override')?.rawVal ?? null);
  if (cfoOv !== null) {
    inputs.cfoOverride = cfoOv;
    fieldsAppliedCount++;
  }
  const tg = parseBooleanCell(extractedMap.get('talkguard')?.rawVal ?? null);
  if (tg !== null) {
    inputs.talkguard = tg;
    fieldsAppliedCount++;
  }
  const cp = parseBooleanCell(extractedMap.get('copilot')?.rawVal ?? null);
  if (cp !== null) {
    inputs.copilot = cp;
    fieldsAppliedCount++;
  }

  // Enums
  const compStr = getText('competitor_archetype');
  if (compStr) {
    const m = matchCompetitor(compStr);
    if (m) {
      competitorArchetype = m;
      fieldsAppliedCount++;
    } else {
      warnings.push(`Competitor "${compStr}" unrecognized; kept ${COMPETITOR_PROFILES[competitorArchetype].shortLabel}.`);
    }
  }

  const tierStr = getText('byollm_stack_tier');
  if (tierStr) {
    const m = matchByollmTier(tierStr);
    if (m) {
      byollmStackTier = m;
      fieldsAppliedCount++;
    } else {
      warnings.push(`BYOLLM stack tier "${tierStr}" unrecognized; defaulted to Flagship Voice.`);
    }
  }

  const sovStr = getText('sovereignty');
  if (sovStr) {
    const m = matchSovereignty(sovStr);
    if (m) {
      sovereignty = m;
      fieldsAppliedCount++;
    } else {
      warnings.push(`Sovereignty "${sovStr}" unrecognized; defaulted to OCP SaaS.`);
    }
  }

  const apiStr = getText('api_readiness');
  if (apiStr) {
    const m = matchApiReadiness(apiStr);
    if (m) {
      apiReadiness = m;
      fieldsAppliedCount++;
    } else {
      warnings.push(`API Readiness "${apiStr}" unrecognized; defaulted to Modern REST.`);
    }
  }

  const motionStr = getText('partner_motion');
  if (motionStr) {
    const m = matchMotion(motionStr);
    if (m) {
      partnerMotion = m;
      fieldsAppliedCount++;
    } else {
      warnings.push(`Partner Motion "${motionStr}" unrecognized; defaulted to CCaaS Co-Sell.`);
    }
  }

  const povStratStr = getText('pov_strategy');
  if (povStratStr) {
    const m = matchPovStrategy(povStratStr);
    if (m) {
      povConfig.scopeStrategy = m;
      fieldsAppliedCount++;
    }
  }
  const povBackStr = getText('pov_backend_mode');
  if (povBackStr) {
    const m = matchPovBackend(povBackStr);
    if (m) {
      povConfig.backendMode = m;
      fieldsAppliedCount++;
    }
  }
  const povCommStr = getText('pov_commercial_model');
  if (povCommStr) {
    const m = matchPovCommercial(povCommStr);
    if (m) {
      povConfig.commercialModel = m;
      fieldsAppliedCount++;
    }
  }
  povConfig.includeTalkguardTest = inputs.talkguard;

  // Use Cases parsing (Tab 2)
  const defaultUseCases: UseCase[] = preset.useCases.map((u, idx) => ({
    ...u,
    id: `${preset.key}-uc-${idx}`,
    included: u.feas >= 50,
  }));

  let finalUseCases = defaultUseCases;
  let useCasesUpdatedCount = 0;

  if (rawUseCaseRows.length > 0) {
    const parsedUcs: UseCase[] = rawUseCaseRows.map((row, idx) => {
      const existingPreset = defaultUseCases.find(
        (d) => d.name.toLowerCase() === row.name.toLowerCase()
      );
      const feasParsed = parseNumericCell(
        row.feasRaw,
        0,
        100,
        0,
        `Use Case "${row.name}" Feasibility`,
        warnings
      );
      const impParsed = parseNumericCell(
        row.impRaw,
        0,
        100,
        0,
        `Use Case "${row.name}" Impact`,
        warnings
      );
      const feas = feasParsed ?? existingPreset?.feas ?? 75;
      const imp = impParsed ?? existingPreset?.imp ?? 75;
      const incParsed = parseBooleanCell(row.includeRaw);
      const included = incParsed !== null ? incParsed : feas >= 50;

      if (existingPreset) {
        return {
          ...existingPreset,
          feas,
          imp,
          included,
          desc: row.notes || existingPreset.desc,
        };
      }

      const runtimeTier =
        feas >= 50 && imp >= 50
          ? 'Deterministic miniApps® + AI Bootstrapping'
          : feas >= 50
          ? 'OCP Knowledge Engine (Voice-Safe RAG)'
          : 'Autonomous Task Agent + Human-in-the-Loop (HITL)';

      return {
        id: `${targetVertical}-intake-${idx}-${Date.now()}`,
        name: row.name,
        feas,
        imp,
        desc: row.notes || 'Customer-submitted discovery call driver.',
        runtime: runtimeTier,
        rollout:
          feas >= 50
            ? 'Phase 1 SOW candidate from customer intake spreadsheet.'
            : 'Phase 2 candidate pending backend API & data readiness.',
        gov: 'Zero frontier data egress; Glass Box MCP audit trail.',
        included,
      };
    });

    if (parsedUcs.length > 0) {
      finalUseCases = parsedUcs;
      useCasesUpdatedCount = parsedUcs.length;
    }
  }

  const phase1Count = finalUseCases.filter((u) => u.feas >= 50 && u.included !== false).length;

  const summaryRows: { label: string; value: string }[] = [
    {
      label: 'Prospect & Vertical',
      value: `${dealMeta.prospectName || 'Unnamed Prospect'} · ${preset.shortName}`,
    },
    {
      label: 'Volume & Surge',
      value: `${inputs.callVolume.toLocaleString()} calls/mo · ${inputs.surge.toFixed(1)}x peak surge`,
    },
    {
      label: 'Containment Shift',
      value: `${inputs.baseContainment}% Legacy -> ${inputs.targetContainment}% Target`,
    },
    {
      label: 'Workforce & Payroll',
      value: inputs.cfoOverride
        ? `CFO Override $${inputs.cfoOverrideVal.toFixed(2)}/call · ${inputs.agents.toLocaleString()} agents (${inputs.autoFitAgents !== false ? 'Auto-Fit' : 'Manual'})`
        : `$${inputs.wage}/hr · ${inputs.aht}s AHT + ${inputs.acw}s ACW · ${inputs.agents.toLocaleString()} agents (${inputs.autoFitAgents !== false ? 'Auto-Fit' : 'Manual'})`,
    },
    {
      label: 'Hard P&L Realization',
      value: `${inputs.laborRealizationPct ?? 65}% Hard Cash / ${100 - (inputs.laborRealizationPct ?? 65)}% Reclaimed Capacity`,
    },
    {
      label: 'Architecture & Baseline',
      value: `${COMPETITOR_PROFILES[competitorArchetype].shortLabel}${
        competitorArchetype === 'byollm' ? ` (${BYOLLM_STACK_TIERS[byollmStackTier].shortLabel})` : ''
      } · ${sovereignty === 'baremetal' ? 'Bare Metal' : 'OCP SaaS'} · ${apiReadiness.toUpperCase()} APIs`,
    },
    {
      label: 'Use Cases Imported',
      value: `${finalUseCases.length} plotted (${phase1Count} Phase 1 High-Feasibility included)`,
    },
  ];

  return {
    fileName: file.name,
    vertical: targetVertical,
    verticalDetectedExplicitly,
    inputs,
    dealMeta,
    partnerMotion,
    sovereignty,
    apiReadiness,
    competitorArchetype,
    byollmStackTier,
    psDayRate,
    povConfig,
    useCases: finalUseCases,
    useCasesUpdatedCount,
    fieldsAppliedCount,
    warnings,
    summaryRows,
  };
}
