export type VerticalKey = 'banking' | 'utilities' | 'insurance' | 'healthcare' | 'telecom';
export type PartnerMotion = 'ccaas' | 'gsi' | 'bpo';
export type SovereigntyTier = 'saas' | 'baremetal';
export type ApiReadiness = 'modern' | 'mixed' | 'mainframe';
export type CompetitorArchetype = 'byollm' | 'diy_hyperscaler';

export interface CompetitorProfile {
  key: CompetitorArchetype;
  shortLabel: string;
  title: string;
  examples: string;
  tableHeader: string;
  commercialSummary: string;
  architectureSummary: string;
  setupRangeLabel: string;
  timeToValueLabel: string;
  turnLatencyLabel: string;
  egressLabel: string;
  ecosystemLabel: string;
  waterfallLatencyMs: number;
  baseVariableRate: number;
  surgeExponent: number;
  monthlyLicenseOrTaxBase: number;
  maintenanceTaxLabel: string;
  containmentLag: number;
}

export const COMPETITOR_PROFILES: Record<CompetitorArchetype, CompetitorProfile> = {
  byollm: {
    key: 'byollm',
    shortLabel: 'Packaged BYOLLM',
    title: 'Packaged BYOLLM Platform',
    examples: 'NiCE Cognigy, Kore.ai, Parloa',
    tableHeader: 'Packaged BYOLLM',
    commercialSummary:
      'Moderate upfront PS ($180K–$300K) + annual platform license + metered pass-through charges for third-party frontier LLM tokens, ASR/STT, and TTS that escalate with RAG context windows.',
    architectureSummary:
      'Multi-hop API chain (CCaaS → Orchestrator → External ASR → LLM → External TTS) yields 1.8s–2.8s latency, third-party data egress, and CCaaS ecosystem lock-in risk.',
    setupRangeLabel: '$180K–$300K PS',
    timeToValueLabel: '12–16 Weeks',
    turnLatencyLabel: '1.8s–2.8s Multi-Hop',
    egressLabel: 'External LLM / TTS Egress',
    ecosystemLabel: 'CCaaS Lock-In Conflict (NiCE vs. Genesys/AWS/RC)',
    waterfallLatencyMs: 2150,
    baseVariableRate: 0.44,
    surgeExponent: 1.28,
    monthlyLicenseOrTaxBase: 14500,
    maintenanceTaxLabel: 'Annual License + Pass-Through Token/ASR/TTS',
    containmentLag: 0.06,
  },
  diy_hyperscaler: {
    key: 'diy_hyperscaler',
    shortLabel: 'DIY Hyperscaler Stack',
    title: 'DIY Hyperscaler / Frontier Stack',
    examples: 'Azure OpenAI / AWS Bedrock + Twilio / Connect',
    tableHeader: 'DIY Hyperscaler',
    commercialSummary:
      'Heavy custom engineering build ($450K–$750K over 6–9 mos), 40% ongoing integration & schema-drift maintenance tax, plus raw token-burn volatility during peak call spikes.',
    architectureSummary:
      '2.5s–3.5s dead air risk, lacks native 8kHz telephony acoustic tuning, and requires custom engineering for PCI Level 1 masking and passive voice biometrics.',
    setupRangeLabel: '$450K–$750K Build',
    timeToValueLabel: '6–9 Months (24–36 Wks)',
    turnLatencyLabel: '2.5s–3.5s Dead Air Risk',
    egressLabel: 'Public Cloud / Frontier Egress',
    ecosystemLabel: 'No Turnkey PCI L1 / TalkGuard Biometrics',
    waterfallLatencyMs: 2950,
    baseVariableRate: 0.58,
    surgeExponent: 1.38,
    monthlyLicenseOrTaxBase: 39900,
    maintenanceTaxLabel: '+40% Integration & Schema-Drift Tax',
    containmentLag: 0.11,
  },
};

export type PovBackendMode = 'sandbox_mock' | 'nonprod_api' | 'talkguard_sip';
export type PovCommercialModel = 'co_sell_free' | 'funded_credited' | 'paid_pilot';
export type PovScopeStrategy = 'hybrid' | 'top_right' | 'bottom_right';

export interface PovConfig {
  scopeStrategy: PovScopeStrategy;
  intentCount: number;
  backendMode: PovBackendMode;
  commercialModel: PovCommercialModel;
  nluTargetPct: number;
  taskTargetPct: number;
  latencyTargetMs: number;
  includeTalkguardTest: boolean;
  povFeeUsd: number;
}

export const DEFAULT_POV_CONFIG: PovConfig = {
  scopeStrategy: 'hybrid',
  intentCount: 2,
  backendMode: 'sandbox_mock',
  commercialModel: 'funded_credited',
  nluTargetPct: 96,
  taskTargetPct: 90,
  latencyTargetMs: 1000,
  includeTalkguardTest: true,
  povFeeUsd: 20000,
};

export interface RoiPreset {
  callVolume: number;
  baseContainment: number;
  targetContainment: number;
  aht: number;
  surge: number;
  talkguardSec: number;
  copilotSec: number;
  wage: number;
  burden: number;
  occupancy: number;
  acw: number;
  surgeNote: string;
}

export interface McpSystem {
  name: string;
  ms: number;
  color: string;
}

export interface UseCase {
  id: string;
  name: string;
  feas: number;
  imp: number;
  desc: string;
  runtime: string;
  rollout: string;
  gov: string;
  included?: boolean;
}

export interface VerticalPreset {
  key: VerticalKey;
  name: string;
  shortName: string;
  compliance: string[];
  backendStack: string;
  roi: RoiPreset;
  mcpSystems: McpSystem[];
  useCases: Omit<UseCase, 'id' | 'included'>[];
}

export interface DealMetadata {
  prospectName: string;
  partnerName: string;
  ccaasPlatform: string;
  dealOwner: string;
}

export interface CallTurnScenario {
  intentName: string;
  callerUtterance: string;
  asrTokens: string;
  omiliaReply: string;
  uuiHandoffSummary: string;
  systemPayloads: {
    system: string;
    result: string;
  }[];
}

export const VERTICAL_PRESETS: Record<VerticalKey, VerticalPreset> = {
  banking: {
    key: 'banking',
    name: 'Banking & Financial Services',
    shortName: 'Banking',
    compliance: ['PCI DSS Level 1', 'SOC 2 Type II', 'ISO 27001', 'GDPR', 'DORA Ready'],
    backendStack:
      'IBM z/OS Connect (CICS / Db2), Core Banking Ledger (Temenos / FIS), TalkGuard Voice Biometrics, Salesforce Financial Services Cloud',
    roi: {
      callVolume: 450000,
      baseContainment: 28,
      targetContainment: 58,
      aht: 340,
      surge: 1.4,
      talkguardSec: 45,
      copilotSec: 20,
      wage: 26,
      burden: 32,
      occupancy: 82,
      acw: 45,
      surgeNote:
        'Models fraud-event and month-end statement spikes (1.4x) vs. Omilia flat outcome pricing ($0.40/resolved).',
    },
    mcpSystems: [
      { name: 'Core Banking Ledger (z/OS REST)', ms: 215, color: '#0d9488' },
      { name: 'TalkGuard Passive Biometrics', ms: 140, color: '#0284c7' },
      { name: 'Salesforce Financial Cloud', ms: 240, color: '#4f46e5' },
    ],
    useCases: [
      {
        name: 'Card Activation & PIN Reset',
        feas: 92,
        imp: 85,
        desc: 'Instant debit/credit card activation and PCI-compliant PIN reset using 98% accurate numeric capture.',
        runtime: 'Deterministic miniApps® + AI Bootstrapping',
        rollout:
          'Week 1–2: Ingest existing IVR call logs & card processor OpenAPI spec for 95%+ Day-1 accuracy.',
        gov: 'PCI-DSS DTMF/voice masking; zero sensitive card digits logged in plaintext.',
      },
      {
        name: 'Account Balance & Recent Transactions',
        feas: 95,
        imp: 82,
        desc: 'Natural-language multi-account balance inquiry, pending authorization checks, and statement dates.',
        runtime: 'Deterministic miniApps® (Out-of-the-Box Banking Template)',
        rollout: 'Week 1–3: Connect read-only Core Banking API via parallel MCP lookup (<220ms).',
        gov: 'RBAC-scoped OAuth2 token bound to authenticated session identity.',
      },
      {
        name: 'Passive Voice Biometric Auth (TalkGuard)',
        feas: 88,
        imp: 90,
        desc: '4-layer anti-fraud screening (ANI spoofing, liveness/deepfake detection, blocklist, behavioral probing) in ~6s.',
        runtime: 'Native TalkGuard Security Agent',
        rollout: 'Week 1–2: Passive background enrollment & verification without KBA interrogation.',
        gov: 'Eliminates 45s of KBA questions while blocking synthetic voice cloning attacks.',
      },
      {
        name: 'Fraud Alert Confirmation & Card Reissue',
        feas: 68,
        imp: 92,
        desc: 'Outbound/inbound suspicious transaction verification, immediate card freeze, and replacement dispatch.',
        runtime: 'Blended Deterministic Flow + Agentic Fallback',
        rollout:
          'Week 3–5: Deterministic transaction confirmation paired with agentic handling of travel notices.',
        gov: 'Full Glass Box audit attribution for every card status mutation.',
      },
      {
        name: 'Wire Transfer & Multi-Account Dispute Investigation',
        feas: 38,
        imp: 88,
        desc: 'Cross-system Reg-E dispute intake and high-value wire status investigation across legacy CICS/MQ.',
        runtime: 'Autonomous Task Agent + Human-in-the-Loop (HITL)',
        rollout:
          "Phase 2 ('Training Wheels'): Stage dispute packet autonomously; require agent/supervisor approval before provisional credit.",
        gov: 'Mandatory HITL approval gate & mainframe latency isolation.',
      },
      {
        name: 'Branch Hours, Routing Numbers & SWIFT Codes',
        feas: 90,
        imp: 35,
        desc: 'Instant answers to branch locations, wire routing instructions, and fee schedules.',
        runtime: 'OCP Knowledge Engine (Voice-Safe RAG)',
        rollout: 'Week 1 Quick-Win: Ingest public bank PDFs & branch directory with confidence thresholds.',
        gov: 'Strict grounding; escalates if confidence score drops below threshold.',
      },
      {
        name: 'Legacy Mainframe Loan Modification',
        feas: 28,
        imp: 62,
        desc: 'Complex mortgage forbearance restructuring tied to green-screen 3270 mainframe workflows.',
        runtime: 'Defer to Phase 2/3 (Pending z/OS Connect API Facade)',
        rollout: 'Defer until customer mainframe team exposes REST/MCP facade via IBM z/OS Connect.',
        gov: 'Excluded from Phase 1 SOW to protect PS margins and sub-300ms voice SLA.',
      },
    ],
  },
  utilities: {
    key: 'utilities',
    name: 'Energy & Utilities',
    shortName: 'Utilities',
    compliance: ['NERC CIP', 'Ofgem / PUC Regulatory', 'ISO 27001', 'PCI DSS Level 1', 'GDPR'],
    backendStack:
      'SAP IS-U / Oracle CC&B Billing, Outage Management System (OMS / GIS), Smart Meter AMI Telemetry, Field Crew Dispatch',
    roi: {
      callVolume: 380000,
      baseContainment: 25,
      targetContainment: 56,
      aht: 310,
      surge: 3.2,
      talkguardSec: 35,
      copilotSec: 18,
      wage: 24,
      burden: 30,
      occupancy: 84,
      acw: 40,
      surgeNote:
        'Models severe storm & winter freeze call surges (3.2x spike) where frontier LLM token bills explode vs. Omilia flat outcome pricing.',
    },
    mcpSystems: [
      { name: 'Outage Management GIS (OMS)', ms: 190, color: '#0d9488' },
      { name: 'Smart Meter Telemetry (AMI)', ms: 165, color: '#0284c7' },
      { name: 'SAP IS-U / Oracle CC&B', ms: 245, color: '#4f46e5' },
    ],
    useCases: [
      {
        name: 'Automated Meter Reading & Balance Check',
        feas: 94,
        imp: 84,
        desc: 'High-accuracy gas/electric meter digit capture (98% alphanumeric accuracy) and real-time bill balance.',
        runtime: 'Deterministic miniApps® + AI Bootstrapping',
        rollout: 'Week 1–2: Deploy pre-trained utility numeric capture & SAP IS-U balance lookup.',
        gov: 'Deterministic validation prevents misbilled meter read submissions.',
      },
      {
        name: 'Outage Reporting & Restoration ETA',
        feas: 88,
        imp: 94,
        desc: 'Automated premise lookup via ANI/postcode, smart-meter ping, outage ticket logging, and live crew ETR.',
        runtime: 'Blended Deterministic + Parallel OMS/AMI Dispatch',
        rollout: 'Week 2–4: Parallel query across OMS GIS and Smart Meter AMI (<250ms) to deflect storm call spikes.',
        gov: 'Handles 3x–4x severe weather concurrency with zero token surge penalty.',
      },
      {
        name: 'Direct Debit & Payment Plan Setup',
        feas: 85,
        imp: 80,
        desc: 'Self-service bill payment, budget-billing enrollment, and automated installment arrangements.',
        runtime: 'Deterministic miniApps® (PCI-DSS Enforced)',
        rollout: 'Week 2–4: Connect payment gateway and SAP billing rules for compliant arrears arrangements.',
        gov: 'PCI-DSS Level 1 card capture + regulatory affordability rule checks.',
      },
      {
        name: 'Smart Tariff Switch & EV Rate Advisor',
        feas: 65,
        imp: 86,
        desc: 'Personalized time-of-use and EV charging tariff comparison grounded in 12-month usage history.',
        runtime: 'OCP Knowledge Engine (RAG) + Task Agent',
        rollout: 'Week 4–6: Ground tariff rules in approved regulatory rate cards before executing switch.',
        gov: 'Mandatory disclosure playback and confirmation gate before contract change.',
      },
      {
        name: 'Complex Billing Dispute & Vulnerable Customer Flagging',
        feas: 40,
        imp: 90,
        desc: 'Estimated-bill reconciliation and Priority Services Register (medical/vulnerable household) flagging.',
        runtime: 'Autonomous Task Agent + HITL Escalation',
        rollout:
          "Phase 2 ('Training Wheels'): Automatically detect vulnerability cues & warm-transfer with full UUI context.",
        gov: 'Ofgem/PUC compliance audit trail + immediate priority queue routing.',
      },
      {
        name: 'Move-In / Move-Out Multi-Meter Transfer',
        feas: 34,
        imp: 82,
        desc: 'Closing final landlord/tenant accounts and opening multi-fuel supply at a new address.',
        runtime: 'Autonomous Task Agent (Phased Phase 2)',
        rollout: 'Phase 2: Orchestrate multi-step meter close/open across SAP IS-U with supervisor QA review.',
        gov: 'Human approval gate on deposit waivers and commercial meter transfers.',
      },
      {
        name: 'Tariff FAQ & Streetlight Outage Reporting',
        feas: 91,
        imp: 36,
        desc: 'Deflect general rate questions and municipal streetlight fault tickets.',
        runtime: 'OCP Knowledge Engine (Voice-Safe RAG)',
        rollout: 'Week 1 Quick-Win: Ingest tariff PDFs and municipal GIS lookup.',
        gov: 'Low-risk sandbox proving sub-second barge-in and accuracy.',
      },
    ],
  },
  insurance: {
    key: 'insurance',
    name: 'Insurance (P&C / Health)',
    shortName: 'Insurance',
    compliance: ['PCI DSS Level 1', 'HIPAA & BAA', 'NAIC Model Law', 'SOC 2 Type II', 'GDPR'],
    backendStack:
      'Guidewire PolicyCenter & ClaimCenter, Duck Creek Claims, TalkGuard Fraud Scoring, Roadside Dispatch APIs',
    roi: {
      callVolume: 290000,
      baseContainment: 22,
      targetContainment: 52,
      aht: 420,
      surge: 2.4,
      talkguardSec: 40,
      copilotSec: 25,
      wage: 27,
      burden: 33,
      occupancy: 80,
      acw: 55,
      surgeNote:
        'Models catastrophe (CAT) hail/hurricane FNOL claim surges (2.4x spike) vs. Omilia flat outcome pricing ($0.40/resolved).',
    },
    mcpSystems: [
      { name: 'Guidewire ClaimCenter', ms: 230, color: '#0d9488' },
      { name: 'TalkGuard Fraud Scoring', ms: 145, color: '#0284c7' },
      { name: 'PolicyCenter CRM', ms: 210, color: '#4f46e5' },
    ],
    useCases: [
      {
        name: 'Policy Document & Digital ID Card Request',
        feas: 95,
        imp: 78,
        desc: 'Instant verification and SMS/email dispatch of auto proof-of-insurance cards and policy declarations.',
        runtime: 'Deterministic miniApps® + Omnichannel SMS/Chat',
        rollout: 'Week 1–2: Connect PolicyCenter lookup + automated SMS card delivery.',
        gov: 'Zero-egress PII protection; immediate deflection of high-frequency calls.',
      },
      {
        name: 'Roadside Assistance Dispatch & GPS Pin',
        feas: 86,
        imp: 90,
        desc: 'Multimodal voice + SMS geo-location capture to dispatch tow, battery, or lockout vendors in real time.',
        runtime: 'Blended Deterministic + Multimodal SMS Link',
        rollout: 'Week 2–4: Noise-hardened 8kHz ASR handles highway background noise cleanly.',
        gov: 'Real-time ETA updates pushed via SMS to reduce repeat status calls.',
      },
      {
        name: 'Deductible & Coverage Inquiry',
        feas: 82,
        imp: 76,
        desc: 'Policy-specific deductible, rental-car coverage, and glass repair benefit answers grounded in policy schedules.',
        runtime: 'OCP Knowledge Engine (Grounded RAG)',
        rollout: 'Week 2–3: Combine PolicyCenter coverage flags with grounded policy booklet RAG.',
        gov: 'Confidence thresholds prevent misquoting exclusions or coverage limits.',
      },
      {
        name: 'First Notice of Loss (FNOL) Auto Claim Intake',
        feas: 58,
        imp: 94,
        desc: 'Structured capture of accident date, location, vehicle damage, and police report details into Guidewire.',
        runtime: 'Blended Deterministic + Agentic Slot Recovery',
        rollout: 'Week 4–6: Collect structured FNOL slots and stage claim in Guidewire ClaimCenter.',
        gov: 'TalkGuard screens synthetic voice fraud; complex injury claims escalate immediately.',
      },
      {
        name: 'Multi-Party Bodily Injury Claim Adjudication',
        feas: 32,
        imp: 89,
        desc: 'Complex liability determination, medical lien review, and reserve adjustments across multiple carriers.',
        runtime: 'CSR CoPilot + HITL Licensed Adjuster Gate',
        rollout: 'Phase 2: Assist licensed adjusters with real-time summarization & compliance checklists.',
        gov: 'Strict regulatory requirement: licensed human adjuster makes all liability decisions.',
      },
      {
        name: 'Renewal Quote & Endorsement Adjustment',
        feas: 45,
        imp: 82,
        desc: 'Adding/removing vehicles or drivers and recalculating mid-term policy premiums.',
        runtime: 'Autonomous Task Agent + Underwriting Rules Gate',
        rollout: 'Phase 2: Run rating engine via MCP and require explicit policyholder binding confirmation.',
        gov: 'Full Glass Box audit log of every rating variable and disclosure.',
      },
      {
        name: 'In-Network Repair Shop & Provider Lookup',
        feas: 90,
        imp: 34,
        desc: 'ZIP-code lookup of preferred collision repair centers and direct-repair program shops.',
        runtime: 'Deterministic miniApps®',
        rollout: 'Week 1 Quick-Win: Ingest preferred shop directory API.',
        gov: 'Simple, deterministic, high-CSAT quick win.',
      },
    ],
  },
  healthcare: {
    key: 'healthcare',
    name: 'Healthcare & Payers',
    shortName: 'Healthcare',
    compliance: ['HIPAA & Executed BAA', 'HITRUST CSF', 'SOC 2 Type II', 'ISO 27001', 'Zero PHI Egress'],
    backendStack:
      'Epic / Oracle Cerner EHR (HL7 FHIR R4), Payer Eligibility & Claims (EDI 270/271), Pharmacy Benefit Manager (PBM) APIs',
    roi: {
      callVolume: 520000,
      baseContainment: 24,
      targetContainment: 54,
      aht: 380,
      surge: 1.9,
      talkguardSec: 40,
      copilotSec: 22,
      wage: 25,
      burden: 31,
      occupancy: 83,
      acw: 50,
      surgeNote:
        'Models Annual Open Enrollment & seasonal flu surges (1.9x spike) inside a strict HIPAA zero-egress perimeter.',
    },
    mcpSystems: [
      { name: 'Epic FHIR R4 Patient Record', ms: 220, color: '#0d9488' },
      { name: 'Payer Eligibility (EDI 270/271)', ms: 185, color: '#0284c7' },
      { name: 'Appointment Scheduling Engine', ms: 195, color: '#4f46e5' },
    ],
    useCases: [
      {
        name: 'Appointment Confirmation & Rescheduling',
        feas: 94,
        imp: 86,
        desc: 'Natural-language clinic scheduling, rescheduling, and cancellation synced live with Epic/Cerner slots.',
        runtime: 'Deterministic miniApps® + HL7 FHIR R4',
        rollout: 'Week 1–3: Out-of-the-box healthcare scheduling template cuts no-shows by 20%+.',
        gov: 'HIPAA BAA covered; inline PHI redaction in logs.',
      },
      {
        name: 'Prescription Refill & Pharmacy Routing',
        feas: 90,
        imp: 84,
        desc: 'Automated maintenance medication refill requests and preferred pharmacy status checks.',
        runtime: 'Deterministic miniApps® + PBM Integration',
        rollout: 'Week 2–3: Validate DOB/ZIP + Rx number; route controlled substances to clinical staff.',
        gov: 'Deterministic clinical safety rules block unauthorized controlled-substance refills.',
      },
      {
        name: 'Clinic Hours & Pre-Visit Prep Instructions',
        feas: 95,
        imp: 42,
        desc: 'Fasting rules, imaging prep checklists, parking directions, and telehealth link troubleshooting.',
        runtime: 'OCP Knowledge Engine (Voice-Safe RAG)',
        rollout: 'Week 1 Quick-Win: Ingest hospital patient prep PDFs and clinic directories.',
        gov: 'Strictly grounded in clinician-approved patient education materials.',
      },
      {
        name: 'Benefits, Deductible & Co-Pay Eligibility Check',
        feas: 72,
        imp: 88,
        desc: 'Real-time member deductible progress, specialist co-pay, and in-network coverage verification.',
        runtime: 'Blended Deterministic + Parallel EDI 270/271 MCP',
        rollout: 'Week 3–5: Parallel lookup across payer eligibility & claims APIs (<250ms).',
        gov: 'Zero PHI sent to public frontier models; 100% sovereign perimeter.',
      },
      {
        name: 'Prior Authorization Status & Payer Inquiry',
        feas: 44,
        imp: 92,
        desc: 'Provider and member status checks on pending prior authorizations and missing clinical documentation.',
        runtime: 'Autonomous Task Agent + HITL Nurse Review',
        rollout: "Phase 2 ('Training Wheels'): Automate status retrieval; route clinical peer-to-peer appeals to nurses.",
        gov: 'Full Glass Box audit attribution for payer compliance.',
      },
      {
        name: 'Post-Discharge Symptom Triage & Nurse Escalation',
        feas: 35,
        imp: 95,
        desc: 'Structured post-op follow-up outreach that detects red-flag symptoms and warm-transfers to triage RN.',
        runtime: 'Deterministic Clinical Protocol + Immediate RN Warm Transfer',
        rollout: 'Phase 2: Strictly scripted clinical red-flag triggers with zero generative improvisation.',
        gov: 'Zero hallucination tolerance; immediate UUI clinical summary screen-pop to RN.',
      },
      {
        name: 'Medical Records Release Request',
        feas: 62,
        imp: 55,
        desc: 'Identity-verified medical record request intake and portal download guidance.',
        runtime: 'Deterministic miniApps®',
        rollout: 'Week 3–4: Authenticate patient and trigger HIM workflow ticket.',
        gov: 'Strict HIPAA authorization logging.',
      },
    ],
  },
  telecom: {
    key: 'telecom',
    name: 'Telecoms, Retail & Logistics',
    shortName: 'Telecom & Retail',
    compliance: ['PCI DSS Level 1', 'ISO 27001', 'SOC 2 Type II', 'GDPR / CCPA', '98% Alphanumeric SLA'],
    backendStack:
      'Order Management / WMS (Manhattan / SAP), Telecom OSS/BSS & Network Diagnostics, Salesforce Service Cloud, Carrier Tracking APIs',
    roi: {
      callVolume: 600000,
      baseContainment: 30,
      targetContainment: 62,
      aht: 290,
      surge: 2.8,
      talkguardSec: 30,
      copilotSec: 15,
      wage: 22,
      burden: 28,
      occupancy: 85,
      acw: 35,
      surgeNote:
        'Models Black Friday peak retail & fiber outage spikes (2.8x load) vs. Omilia flat outcome pricing ($0.40/resolved).',
    },
    mcpSystems: [
      { name: 'Order Management / WMS', ms: 175, color: '#0d9488' },
      { name: 'Network & Router Diagnostics', ms: 225, color: '#0284c7' },
      { name: 'Salesforce / Billing CRM', ms: 205, color: '#4f46e5' },
    ],
    useCases: [
      {
        name: 'Parcel Tracking & Delivery Redirection',
        feas: 95,
        imp: 88,
        desc: '98% accurate alphanumeric tracking ID capture (Purolator benchmark) with live hold-at-depot or reschedule.',
        runtime: 'Deterministic miniApps® (98% Alphanumeric Accuracy)',
        rollout: 'Week 1–2: Proven logistics template achieves 98% voice accuracy and 95% chat containment.',
        gov: 'Single-turn complex alphanumeric recognition eliminates caller frustration.',
      },
      {
        name: 'Router Reboot & Line Outage Diagnostics',
        feas: 88,
        imp: 91,
        desc: 'Automated line test, remote ONT/router reset, outage ETA check, and guided LED troubleshooting.',
        runtime: 'Blended Deterministic + Parallel OSS Diagnostics',
        rollout: 'Week 2–4: Run line diagnostics while greeting caller; deflects 65%+ of tier-1 tech support calls.',
        gov: 'Passes full diagnostic telemetry to tier-2 agent if hardware fault detected.',
      },
      {
        name: 'Return Merchandise Authorization (RMA) & Refund Status',
        feas: 91,
        imp: 80,
        desc: 'Instant return eligibility check, QR return label SMS dispatch, and refund processing status.',
        runtime: 'Deterministic miniApps® + Omnichannel SMS',
        rollout: 'Week 1–3: Connect OMS return rules and automated QR label generation.',
        gov: 'Fraud velocity rules flag repeat returners for human review.',
      },
      {
        name: 'Plan Upgrade & International Roaming Add-On',
        feas: 76,
        imp: 84,
        desc: 'Personalized mobile/fiber tier upgrade and instant travel roaming pass activation.',
        runtime: 'Blended Deterministic + Agentic Upsell',
        rollout: 'Week 3–5: Check usage profile via CRM and activate roaming bundle with explicit price confirmation.',
        gov: 'Mandatory spoken confirmation of recurring charges before BSS provisioning.',
      },
      {
        name: 'Billing Overcharge & Multi-Line Dispute',
        feas: 42,
        imp: 89,
        desc: 'Itemized invoice variance analysis and prorated credit calculation across family/business lines.',
        runtime: 'Autonomous Task Agent + HITL Credit Threshold',
        rollout:
          "Phase 2 ('Training Wheels'): Auto-apply credits under $25; escalate higher disputes with itemized breakdown.",
        gov: 'RBAC credit-limit guardrails prevent unauthorized revenue leakage.',
      },
      {
        name: 'Fiber Installation Reschedule & Field Dispatch',
        feas: 55,
        imp: 78,
        desc: 'Real-time technician appointment window rescheduling synced with field workforce dispatch.',
        runtime: 'Autonomous Task Agent via MCP',
        rollout: 'Week 4–6: Expose field dispatch slot API as typed MCP tool.',
        gov: 'SMS confirmation sent immediately upon slot lock.',
      },
      {
        name: 'Store Hours, Curbside Pickup & Stock Check',
        feas: 93,
        imp: 38,
        desc: 'Local store inventory availability, hours, and curbside pickup check-in.',
        runtime: 'OCP Knowledge Engine (Voice-Safe RAG)',
        rollout: 'Week 1 Quick-Win: Connect store locator & inventory feed.',
        gov: 'Fastest time-to-value pilot for retail stakeholders.',
      },
    ],
  },
};

export const CALL_TURN_SCENARIOS: Record<VerticalKey, CallTurnScenario> = {
  banking: {
    intentName: 'Fraud Alert Confirmation & Card Reissue',
    callerUtterance:
      '“My debit card just got declined at Heathrow—can you unlock it and check my checking balance?”',
    asrTokens: '8kHz ASR · 98.4% confidence · Zero PII logged',
    omiliaReply:
      '“Verified via TalkGuard. I’ve cleared the £420 Heathrow travel flag on your debit card ending in 4812, and your checking balance is $8,430.50. Would you like an SMS confirmation?”',
    uuiHandoffSummary:
      'UUI_CTX: TG_PASS=0.96 | CARD_4812=UNFROZEN | TRAVEL_ALERT=UK_7D | BAL=$8,430.50',
    systemPayloads: [
      { system: 'Core Banking Ledger (z/OS REST)', result: 'Checking Bal: $8,430.50 · Card 4812 Active' },
      { system: 'TalkGuard Passive Biometrics', result: 'Score: 0.96 PASS · Deepfake Check: Clear' },
      { system: 'Salesforce Financial Cloud', result: 'Travel Notice Logged · 0 Open Disputes' },
    ],
  },
  utilities: {
    intentName: 'Outage Reporting & Restoration ETA',
    callerUtterance:
      '“Our power just went out on Oakridge Avenue—is there an outage in our area and when is the crew coming?”',
    asrTokens: '8kHz ASR · Storm noise filter active · 97.9% confidence',
    omiliaReply:
      '“I see an active feeder outage affecting 142 homes on Oakridge Avenue. Smart meter ping confirms no power at your premise; a crew is en route with an estimated restoration of 5:45 PM.”',
    uuiHandoffSummary:
      'UUI_CTX: OMS_TICKET=#OUT-9924 | AMI_PING=OFFLINE | CREW_ETR=17:45 | PRIORITY_MED=FALSE',
    systemPayloads: [
      { system: 'Outage Management GIS (OMS)', result: 'Feeder #18 Fault · Crew #4 Dispatched' },
      { system: 'Smart Meter Telemetry (AMI)', result: 'Last Gasp Received 14:12 · Status: Offline' },
      { system: 'SAP IS-U / Oracle CC&B', result: 'Premise Verified · SMS Outage Opt-In Active' },
    ],
  },
  insurance: {
    intentName: 'Roadside Assistance Dispatch & FNOL Intake',
    callerUtterance:
      '“I blew a tire on I-95 northbound near Exit 42 and need a tow truck sent out right away.”',
    asrTokens: '8kHz Highway Noise ASR · 98.1% confidence',
    omiliaReply:
      '“I’ve verified your Roadside coverage on your 2023 Outback with zero deductible. I just texted a one-tap GPS pin link—tap it to confirm your exact mile marker and dispatch your tow.”',
    uuiHandoffSummary:
      'UUI_CTX: POL=AUTO-77412 | COV_ROADSIDE=ACTIVE($0_DED) | TG_FRAUD=LOW | SMS_GPS=SENT',
    systemPayloads: [
      { system: 'Guidewire ClaimCenter', result: 'Pre-Staged Roadside Incident #RS-4081' },
      { system: 'TalkGuard Fraud Scoring', result: 'ANI Match + Voiceprint Clear (Low Risk)' },
      { system: 'PolicyCenter CRM', result: 'Roadside Coverage Verified · $0 Deductible' },
    ],
  },
  healthcare: {
    intentName: 'Appointment Rescheduling & Co-Pay Check',
    callerUtterance:
      '“I need to move my Thursday cardiology follow-up to Friday morning and check what my specialist co-pay is.”',
    asrTokens: 'HIPAA Zero-Egress ASR · Inline PHI Redacted',
    omiliaReply:
      '“I found an opening with Dr. Patel this Friday at 9:30 AM. Your in-network specialist co-pay is $35, and your deductible is already met. Should I lock in Friday at 9:30 AM?”',
    uuiHandoffSummary:
      'UUI_CTX: FHIR_PAT=REDACTED | SLOT=FRI_0930_PATEL | EDI_271_COPAY=$35 | HIPAA_ZERO_EGRESS=TRUE',
    systemPayloads: [
      { system: 'Epic FHIR R4 Patient Record', result: 'Authenticated DOB/ZIP · Dr. Patel Follow-Up' },
      { system: 'Payer Eligibility (EDI 270/271)', result: 'In-Network Active · Specialist Co-Pay $35' },
      { system: 'Appointment Scheduling Engine', result: 'Held Slot: Friday 09:30 AM (120s Lock)' },
    ],
  },
  telecom: {
    intentName: 'Router Reboot & Line Outage Diagnostics',
    callerUtterance:
      '“My fiber router has been blinking red for ten minutes—can you check if there’s a line fault on my account?”',
    asrTokens: '8kHz ASR · 98.6% alphanumeric accuracy',
    omiliaReply:
      '“I ran a remote ONT line test and confirmed your optical signal is healthy, with no area outage. I’ve triggered a 60-second firmware sync to your gateway—the light should turn solid green shortly.”',
    uuiHandoffSummary:
      'UUI_CTX: ONT_SIGNAL=-18dBm_OK | AREA_OUTAGE=NONE | REMOTE_RESET=TRIGGERED | CRM_CASE=#TC-310',
    systemPayloads: [
      { system: 'Order Management / WMS', result: 'Gateway Serial SN88412 Active · No Swap Pending' },
      { system: 'Network & Router Diagnostics', result: 'Optical Signal OK (-18 dBm) · Reset Sent' },
      { system: 'Salesforce / Billing CRM', result: 'Gigabit Fiber Plan · Ticket #TC-310 Logged' },
    ],
  },
};

export interface TsServerFile {
  key: 'index' | 'package' | 'tsconfig';
  filename: string;
  content: string;
}

export const TS_SERVER_FILES: Record<'index' | 'package' | 'tsconfig', TsServerFile> = {
  index: {
    key: 'index',
    filename: 'src/index.ts',
    content: `import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "omilia-partner-mcp",
  version: "1.1.0",
});

// Tool 1: Architecture & Compliance Fit
server.tool(
  "check_partner_architecture_fit",
  {
    vertical: z.enum(["banking", "utilities", "insurance", "healthcare", "telecom"]).default("banking"),
    ccaas: z.enum(["genesys", "nice", "amazon_connect", "five9"]).default("genesys"),
    sovereignty: z.enum(["saas", "baremetal"]).default("saas")
  },
  async ({ vertical, ccaas, sovereignty }) => {
    const complianceMap: Record<string, string[]> = {
      banking: ["PCI DSS Level 1", "SOC 2 Type II", "GDPR", "DORA Ready"],
      utilities: ["NERC CIP", "Ofgem / PUC Regulatory", "ISO 27001"],
      insurance: ["PCI DSS Level 1", "HIPAA & BAA", "NAIC Model Law"],
      healthcare: ["HIPAA & Executed BAA", "HITRUST CSF", "Zero PHI Egress"],
      telecom: ["PCI DSS Level 1", "ISO 27001", "GDPR / CCPA"]
    };
    const payload = {
      vertical,
      ocpArchitecture: "OCP acts as MCP Client; Customer hosts MCP Server",
      ccaasConnector: \`Native \${ccaas} SIP/UUI Context Handoff\`,
      deployment: sovereignty === "baremetal" ? "OCP Bare Metal (Air-Gapped)" : "OCP SaaS (Certified AWS Perimeter)",
      compliance: complianceMap[vertical],
      zeroFrontierEgress: true
    };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

// Tool 2: Parallel Async Tool Dispatch (<300ms SLA)
server.tool(
  "simulate_parallel_tool_dispatch",
  {
    vertical: z.enum(["banking", "utilities", "insurance", "healthcare", "telecom"]).default("banking")
  },
  async ({ vertical }) => {
    const start = Date.now();
    const results = await Promise.all([
      Promise.resolve({ service: "PrimaryCoreSystem", latencyMs: 195, status: "OK" }),
      Promise.resolve({ service: "TalkGuardBiometrics", latencyMs: 140, status: "VERIFIED" }),
      Promise.resolve({ service: "EnterpriseCRM", latencyMs: 215, status: "OK" })
    ]);
    const payload = {
      vertical,
      orchestration: "ASYNC_PARALLEL_MCP_DISPATCH",
      parallelResolutionMs: 215,
      lexisNativeTtsMs: 42,
      totalLoopMs: 257,
      slaCompliant: true,
      elapsedExecutionMs: Date.now() - start,
      results
    };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

// Tool 3: Deterministic HLEE & SOW Guardrails
server.tool(
  "generate_partner_sow_guardrails",
  {
    vertical: z.string().default("banking"),
    intents: z.number().min(1).max(8).default(4),
    apiReadiness: z.enum(["modern", "mixed", "mainframe"]).default("modern")
  },
  async ({ vertical, intents, apiReadiness }) => {
    const weeks = 3 + Math.ceil(intents * 0.5) + (apiReadiness === "mainframe" ? 2 : apiReadiness === "mixed" ? 1 : 0);
    const payload = {
      vertical,
      phase1TimelineWeeks: weeks,
      guardrails: [
        "80/20 Rule: Phase 1 capped at top 3-5 volume drivers",
        "Sub-300ms orchestration SLA isolated from legacy backend latency",
        "Mandatory HITL approval gate prior to self-learned flow deployment"
      ]
    };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

// Tool 4: Unit Economics TCO & AI Radar 2.0 Report
server.tool(
  "calculate_tco_and_ai_radar_report",
  {
    vertical: z.enum(["banking", "utilities", "insurance", "healthcare", "telecom"]).default("banking"),
    monthlyCallVolume: z.number().min(10000).max(5000000).default(450000),
    baseContainmentPct: z.number().min(0).max(50).default(28),
    targetContainmentPct: z.number().min(25).max(99).default(58),
    omiliaOutcomeRate: z.number().min(0.15).max(1.00).default(0.40),
    ahtSeconds: z.number().min(1).max(720).default(340),
    surgeMultiplier: z.number().min(1.0).max(4.0).default(1.4),
    unitHumanCostPerCall: z.number().min(0.50).max(50).default(3.01)
  },
  async ({ vertical, monthlyCallVolume, baseContainmentPct, targetContainmentPct, omiliaOutcomeRate, ahtSeconds, surgeMultiplier, unitHumanCostPerCall }) => {
    const baseCont = baseContainmentPct / 100;
    const targetCont = Math.max(baseCont + 0.05, targetContainmentPct / 100);
    const diyCont = Math.max(baseCont + 0.08, targetCont - 0.11);
    const effectiveCalls = monthlyCallVolume * surgeMultiplier;
    const legacyMo = (effectiveCalls * (1 - baseCont) * unitHumanCostPerCall) + (effectiveCalls * baseCont * 0.14);
    const omiliaMo = (effectiveCalls * targetCont * omiliaOutcomeRate) + (effectiveCalls * (1 - targetCont) * (unitHumanCostPerCall * 0.83)) + 6500;
    const diyTokenRate = 0.58 * Math.pow(surgeMultiplier, 1.38);
    const diyMo = (effectiveCalls * diyCont * diyTokenRate) + (effectiveCalls * (1 - diyCont) * unitHumanCostPerCall) + 28500;
    const payload = {
      vertical,
      annualLegacyTcoUsd: Math.round(legacyMo * 12),
      annualDiyFrontierLlmTcoUsd: Math.round(diyMo * 12),
      annualOmiliaOcpTcoUsd: Math.round(omiliaMo * 12),
      annualNetSavingsVsLegacyUsd: Math.round(Math.max(0, legacyMo - omiliaMo) * 12),
      threeYearAdvantageVsDiyLlmUsd: Math.round(Math.max(0, diyMo - omiliaMo) * 36),
      effectiveContainmentComparison: {
        legacyBaselinePct: Math.round(baseCont * 100),
        diyFrontierLlmPctWithTokenDrift: Math.round(diyCont * 100),
        omiliaOcpBlendedPct: Math.round(targetCont * 100)
      },
      ahtSeconds,
      omiliaOutcomeRateUsd: omiliaOutcomeRate
    };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

if (process.argv.includes("--http")) {
  http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
    if (req.url === "/mcp" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        const parsed = JSON.parse(body || "{}");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id: parsed.id || 1,
          result: {
            bridge: "LIVE_LOCALHOST_MCP_SERVER",
            method: parsed.method,
            params: parsed.params,
            zeroFrontierEgress: true,
            timestamp: new Date().toISOString()
          }
        }));
      });
      return;
    }
    res.writeHead(404);
    res.end();
  }).listen(3333, () => console.error("omilia-partner-mcp HTTP bridge listening on http://localhost:3333/mcp"));
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}`,
  },
  package: {
    key: 'package',
    filename: 'package.json',
    content: `{
  "name": "omilia-partner-mcp",
  "version": "1.1.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "start:http": "tsx src/index.ts --http"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}`,
  },
  tsconfig: {
    key: 'tsconfig',
    filename: 'tsconfig.json',
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`,
  },
};
