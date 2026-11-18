import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  HelpCircle,
  RotateCcw,
  Send,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ApiReadiness,
  CompetitorArchetype,
  PartnerMotion,
  SovereigntyTier,
  UseCase,
  VerticalKey,
  VerticalPreset,
} from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  HleeResult,
  isTopRightQuadrant,
  PaybackAnalysis,
  RoiInputs,
  RoiResults,
} from '../utils/calculations';
import { TabKey } from './TopBar';

export interface GuideAction {
  label: string;
  onClick: () => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  actions?: GuideAction[];
}

interface ControlDoc {
  id: string;
  tab: TabKey;
  tabLabel: string;
  name: string;
  currentValue: string;
  whatItDoes: string;
  whyItMatters: string;
  keywords: string[];
  actionLabel?: string;
  onAction?: () => void;
}

interface WorkbenchGuideWidgetProps {
  activeTab: TabKey;
  vertical: VerticalKey;
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  useCases: UseCase[];
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  competitorArchetype: CompetitorArchetype;
  psDayRate: number;
  payback: PaybackAnalysis;
  hlee: HleeResult;
  onSelectTab: (tab: TabKey) => void;
  onChangeVertical: (v: VerticalKey) => void;
  onChangeCompetitor: (c: CompetitorArchetype) => void;
  onUpdateInput: <K extends keyof RoiInputs>(key: K, val: RoiInputs[K]) => void;
  onChangeSovereignty: (s: SovereigntyTier) => void;
  onAddCustomUseCase: (name: string, feas: number, imp: number) => void;
  onOpenBrief: () => void;
  onOpenScenarios: () => void;
  onDownloadCsv: () => void;
  onOpenTsModal: () => void;
}

const TOUR_STEPS: {
  step: number;
  tab: TabKey;
  title: string;
  summary: (ctx: {
    preset: VerticalPreset;
    inputs: RoiInputs;
    results: RoiResults;
    useCases: UseCase[];
    hlee: HleeResult;
  }) => string;
}[] = [
  {
    step: 1,
    tab: 'economics',
    title: 'Step 1 of 4 · Unit Economics & TCO Simulator',
    summary: ({ preset, inputs, results }) =>
      `Viewing ${preset.name} vs. ${results.competitorProfile.title} (${inputs.callVolume.toLocaleString()} calls/mo, ${inputs.surge.toFixed(1)}x surge).\n\nWhat you can tweak here:\n• Competitor Architecture Baseline: toggle Packaged BYOLLM (Cognigy/Kore/Parloa) vs. DIY Hyperscaler (Azure OpenAI/Bedrock).\n• Volume, Baseline vs. Target Containment (${inputs.baseContainment}% → ${inputs.targetContainment}%), Surge (1.0x–4.0x), and Flat Outcome Rate ($${inputs.omiliaOutcomeRate.toFixed(2)}/resolved).\n• Toggle Annual TCO Bars vs. 36-Month Cash Flow (showing Offline Self-Learning compression from Yr1 to Yr3) + Sensitivity stress testing.\n\nLive result: ${formatCurrencyCompact(results.annualNetSavings)}/yr net savings and ${formatCurrencyCompact(results.threeYearDiySavings)} 3-year edge vs. ${results.competitorProfile.shortLabel}.`,
  },
  {
    step: 2,
    tab: 'radar',
    title: 'Step 2 of 4 · AI Radar 2.0 Prioritizer',
    summary: ({ useCases }) => {
      const topRight = useCases.filter(isTopRightQuadrant);
      const included = topRight.filter((u) => u.included !== false);
      return `Plots Feasibility & Data Maturity (X) against Financial & CX Impact (Y).\n\nWhat you can tweak here:\n• Drag any pin directly on the 2×2 matrix—or adjust the Feasibility & Impact sliders in the Inspector—to re-score workflows live.\n• Toggle Phase 1 SOW checkboxes on Top-Right items (≥50F & ≥50I)—currently ${included.length} of ${topRight.length} active.\n• Plot custom prospect call drivers live or clear the canvas for a clean discovery workshop.`;
    },
  },
  {
    step: 3,
    tab: 'scoping',
    title: 'Step 3 of 4 · Partner Deal-Scoping & SOW Guardrails',
    summary: ({ hlee, preset }) =>
      `Converts Radar scope and architecture complexity into a fixed-scope SOW estimate.\n\nWhat you can tweak here:\n• Partner GTM Motion (CCaaS Co-Sell, GSI, or BPO) to tailor the co-sell hook & RACI split.\n• Deployment Sovereignty (OCP SaaS vs. Bare Metal +3 wks/+12 PS days) and Backend API Readiness.\n• PS Blended Day Rate ($/Day) to feed true implementation cost & break-even payback back into Unit Economics.\n\nLive estimate: ${hlee.timelineLabel} (${hlee.psEffortLabel}) under ${preset.compliance.slice(0, 3).join(', ')}.`,
  },
  {
    step: 4,
    tab: 'mcp',
    title: 'Step 4 of 4 · Live MCP Protocol & Call Turn Replay',
    summary: ({ preset }) => {
      const maxMs = Math.max(...preset.mcpSystems.map((s) => s.ms));
      return `Demonstrates OCP as MCP Client calling customer-hosted MCP servers with Zero Frontier Egress.\n\nWhat you can tweak here:\n• Click "Simulate Call Turn" to replay an end-to-end vertical turn (8kHz ASR → Parallel MCP → Lexis <45ms TTS → UUI Handoff).\n• Toggle Localhost HTTP Bridge (:3333/mcp) vs. Embedded JSON-RPC 2.0 runtime and trigger all 5 JSON-RPC actions.\n• Compare the ${maxMs + 42}ms Omilia path against the 1,200ms hang-up line, or download the TypeScript MCP server.`;
    },
  },
];

export const WorkbenchGuideWidget: React.FC<WorkbenchGuideWidgetProps> = ({
  activeTab,
  preset,
  inputs,
  results,
  useCases,
  partnerMotion,
  sovereignty,
  apiReadiness,
  competitorArchetype,
  psDayRate,
  payback,
  hlee,
  onSelectTab,
  onChangeVertical,
  onChangeCompetitor,
  onUpdateInput,
  onChangeSovereignty,
  onAddCustomUseCase,
  onOpenBrief,
  onOpenScenarios,
  onDownloadCsv,
  onOpenTsModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [widgetMode, setWidgetMode] = useState<'chat' | 'controls'>('chat');
  const [controlsFilterTab, setControlsFilterTab] = useState<TabKey | 'all'>('all');
  const [inputText, setInputText] = useState('');
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Welcome to the Omilia Partner Workbench. I can walk you through all 4 tabs, explain what every slider, toggle, and selector tweaks (and why), or run live scenarios for ${preset.shortName}.\n\nAsk about any specific control—like "Why tweak surge?" or "Explain every control on this tab"—or switch to "Controls & Why" above to browse all settings.`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && widgetMode === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, widgetMode]);

  const topRightCount = useCases.filter(isTopRightQuadrant).length;
  const includedCount = useCases.filter((u) => isTopRightQuadrant(u) && u.included !== false).length;
  const maxParallelMs = Math.max(...preset.mcpSystems.map((s) => s.ms));

  // Complete, live-synced catalog of every tweakable control in the workbench
  const controlDocs: ControlDoc[] = [
    {
      id: 'vertical',
      tab: 'economics',
      tabLabel: 'Global',
      name: 'Industry Vertical Selector',
      currentValue: preset.name,
      whatItDoes:
        'Switches baseline call volumes, containment rates, AHT, peak surge multipliers, compliance standards, backend MCP systems, and discovery use cases.',
      whyItMatters:
        'Anchors your live pitch in the buyer’s exact industry benchmarks (e.g., 3.2x storm spikes in Utilities vs. 1.4x fraud spikes in Banking) instead of generic assumptions.',
      keywords: ['vertical', 'industry', 'banking', 'utilities', 'insurance', 'healthcare', 'telecom', 'preset'],
      actionLabel: 'Switch to Utilities (3.2x)',
      onAction: () => onChangeVertical('utilities'),
    },
    {
      id: 'competitorBaseline',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Competitor Architecture Baseline (BYOLLM vs. DIY Hyperscaler)',
      currentValue: results.competitorProfile.shortLabel,
      whatItDoes:
        'Switches the market comparison baseline between Packaged BYOLLM Platforms (NiCE Cognigy, Kore.ai, Parloa) and DIY Hyperscaler / Frontier Stacks (Azure OpenAI / AWS Bedrock + Twilio/Connect).',
      whyItMatters:
        'Lets partners benchmark Omilia’s vertically integrated sovereign stack accurately against either metered pass-through orchestrators ($180K–$300K PS + token/ASR/TTS fees) or custom DIY engineering builds ($450K–$750K + 40% drift tax).',
      keywords: [
        'competitor',
        'byollm',
        'cognigy',
        'kore',
        'parloa',
        'hyperscaler',
        'bedrock',
        'openai',
        'azure',
        'baseline',
        'neutral',
        'lock-in',
        'egress',
      ],
      actionLabel:
        competitorArchetype === 'byollm'
          ? 'Compare vs. DIY Hyperscaler'
          : 'Compare vs. Packaged BYOLLM',
      onAction: () => {
        onSelectTab('economics');
        onChangeCompetitor(competitorArchetype === 'byollm' ? 'diy_hyperscaler' : 'byollm');
      },
    },
    {
      id: 'callVolume',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Monthly Inbound Call Volume',
      currentValue: `${inputs.callVolume.toLocaleString()} calls/mo`,
      whatItDoes:
        'Sets baseline monthly inbound call volume (50,000 to 2,000,000) before applying the peak surge multiplier.',
      whyItMatters:
        'Establishes total contact center scale and determines how fixed platform costs ($6.5K/mo Omilia vs. competitor license or 40% drift overhead) amortize across interactions.',
      keywords: ['volume', 'call volume', 'inbound', 'calls'],
      actionLabel: 'Go to Unit Economics',
      onAction: () => onSelectTab('economics'),
    },
    {
      id: 'baseContainment',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Baseline Legacy IVR Containment',
      currentValue: `${inputs.baseContainment}%`,
      whatItDoes:
        'Defines the share of calls already deflected by the legacy DTMF/IVR system (priced at $0.14/call); the remaining calls go to human agents.',
      whyItMatters:
        'Sets an honest starting baseline. Setting this accurately prevents double-counting savings already achieved by legacy touch-tone menus.',
      keywords: ['baseline', 'legacy', 'ivr', 'base containment'],
    },
    {
      id: 'targetContainment',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Target Omilia OCP Containment',
      currentValue: `${inputs.targetContainment}%`,
      whatItDoes:
        `Sets Omilia’s blended deterministic + agentic containment rate. ${results.competitorProfile.shortLabel} trails by ${Math.round(results.competitorProfile.containmentLag * 100)} pts due to latency dead-air and 8kHz acoustic gaps.`,
      whyItMatters:
        'Primary lever for call deflection savings, equivalent FTEs freed, and monthly hours reclaimed. Even a +5% containment lift significantly shifts annual net savings.',
      keywords: ['target containment', 'containment', 'lift', 'deflection', 'blended', 'bootstrapping'],
    },
    {
      id: 'omiliaOutcomeRate',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Omilia Outcome Rate & Self-Learning Compression',
      currentValue: `$${inputs.omiliaOutcomeRate.toFixed(2)} → $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)} Yr3`,
      whatItDoes:
        'Sets Year 1 flat outcome pricing ($0.15–$1.00/resolved) with zero pass-through token/ASR/TTS fees, then applies Offline Self-Learning compression (-10% Yr2, -18% Yr3) over 36 months.',
      whyItMatters:
        'Proves how Omilia eliminates multi-turn token volatility today and lowers effective unit cost over 3 years by codifying recurring agentic patterns into deterministic micro-flows.',
      keywords: [
        'outcome rate',
        'outcome pricing',
        'price',
        'pricing',
        'resolved',
        'self-learning',
        'compression',
        'micro-flow',
      ],
    },
    {
      id: 'ahtAcw',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Average Handle Time (AHT) & After-Call Work (ACW)',
      currentValue: `${inputs.aht}s AHT + ${inputs.acw}s ACW`,
      whatItDoes:
        'Sets average talk/hold duration (1–720s) plus post-call wrap-up time (0–240s) for calls handled by live agents.',
      whyItMatters:
        'Longer handle times raise the loaded human cost per call and magnify the value of both full deflection and TalkGuard / CSR CoPilot time reductions.',
      keywords: ['aht', 'acw', 'handle time', 'after-call', 'after call', 'wrap'],
    },
    {
      id: 'surge',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Seasonal / Outage Peak Surge Multiplier',
      currentValue: `${inputs.surge.toFixed(1)}x`,
      whatItDoes:
        `Multiplies monthly volume (1.0x–4.0x) and triggers a nonlinear surge^${results.competitorProfile.surgeExponent.toFixed(2)} metered usage / token penalty on ${results.competitorProfile.shortLabel}.`,
      whyItMatters:
        `Demonstrates why ${results.competitorProfile.shortLabel} bills spike unpredictably during peak volume or deep RAG turns—while Omilia’s flat outcome rate holds steady.`,
      keywords: ['surge', 'peak', 'multiplier', 'storm', 'spike', 'diy', 'llm', 'token', 'rag'],
      actionLabel: 'Test 2.5x Surge',
      onAction: () => {
        onSelectTab('economics');
        onUpdateInput('surge', 2.5);
      },
    },
    {
      id: 'laborShaping',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Labor Cost Shaping (Presets, Wage, Burden, Occupancy)',
      currentValue: `$${inputs.wage}/hr · ${inputs.burden}% burden · ${inputs.occupancy}% occ`,
      whatItDoes:
        'Computes loaded human cost/call bottom-up: wage × (1 + burden) × occupancy × ((AHT + ACW) / 3600). Includes 1-click Onshore, Nearshore, and Offshore presets.',
      whyItMatters:
        'Tailors the ROI model to the buyer’s real staffing footprint so finance teams trust the labor savings baseline.',
      keywords: ['wage', 'burden', 'overhead', 'occupancy', 'onshore', 'nearshore', 'offshore', 'labor'],
    },
    {
      id: 'cfoOverride',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Direct CFO Cost-per-Call Override',
      currentValue: inputs.cfoOverride ? `Active ($${inputs.cfoOverrideVal.toFixed(2)}/call)` : 'Off (bottom-up math)',
      whatItDoes:
        'Bypasses the bottom-up wage/burden/occupancy calculation and plugs in a finance-approved flat dollar cost per human call.',
      whyItMatters:
        'Eliminates formula debates in executive CFO meetings when the client already has an audited internal cost-per-call number.',
      keywords: ['cfo', 'override', 'cost-per-call', 'cost per call', 'finance'],
    },
    {
      id: 'talkguard',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'TalkGuard Passive Voice Biometrics',
      currentValue: inputs.talkguard ? `Enabled (-${preset.roi.talkguardSec}s)` : 'Disabled',
      whatItDoes:
        `Toggles passive background voice authentication & anti-deepfake screening, saving ${preset.roi.talkguardSec}s of KBA interrogation on escalated calls.`,
      whyItMatters:
        'Compresses the cost of calls that STILL escalate to agents while blocking synthetic voice cloning and ANI spoofing.',
      keywords: ['talkguard', 'biometric', 'voice biometric', 'kba', 'fraud', 'deepfake'],
    },
    {
      id: 'copilot',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'CSR CoPilot Real-Time Agent Assist',
      currentValue: inputs.copilot ? `Enabled (-${preset.roi.copilotSec}s ACW)` : 'Disabled',
      whatItDoes:
        `Toggles real-time agent assist & auto-summarization, reducing After-Call Work by ${preset.roi.copilotSec}s on every escalated call.`,
      whyItMatters:
        'Proves value across 100% of inbound traffic—not just contained calls—by reclaiming wrap-up capacity for live agents.',
      keywords: ['copilot', 'agent assist', 'summariz', 'csr'],
    },
    {
      id: 'workforce',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: 'Workforce Sizing & Auto-Fit FTEs',
      currentValue: `${inputs.agents.toLocaleString()} agents · ${inputs.shiftHours}h/d · ${inputs.workDays}d/mo`,
      whatItDoes:
        'Converts total hours reclaimed into Days/Mo per Agent Saved and Equivalent FTEs Freed. "Auto-Fit FTEs" sizes agents to residual uncontained volume.',
      whyItMatters:
        'Turns abstract dollar savings into operational staffing metrics (attrition absorption, overtime reduction, or reallocation to high-value queues).',
      keywords: ['fte', 'ftes', 'agents', 'auto-fit', 'autofit', 'shift', 'work days', 'capacity'],
    },
    {
      id: 'cashflowPayback',
      tab: 'economics',
      tabLabel: 'Unit Economics',
      name: '36-Month Cash Flow, Payback & Sensitivity Matrix',
      currentValue:
        payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} mo payback` : 'N/A',
      whatItDoes:
        'Plots cumulative 36-month spend including upfront Phase 1 PS investment and adds a ±10% Containment Sensitivity view alongside CFO Breakdown.',
      whyItMatters:
        'Answers two top CFO objections in one click: exact months to recover Phase 1 implementation spend and downside protection if containment lands 10% below target.',
      keywords: ['payback', 'cash flow', 'cashflow', 'break-even', 'breakeven', 'sensitivity', '36-month'],
      actionLabel: 'Open Unit Economics',
      onAction: () => onSelectTab('economics'),
    },
    {
      id: 'radarPins',
      tab: 'radar',
      tabLabel: 'AI Radar',
      name: 'Draggable Radar Pins, Score Sliders & SOW Checkboxes',
      currentValue: `${includedCount}/${topRightCount} Top-Right included`,
      whatItDoes:
        'Drag any pin on the 2×2 matrix—or tweak Feasibility & Impact sliders inside the Inspector—to move workflows between Phase 1 and Phase 2 and recompute HLEE PS Days.',
      whyItMatters:
        'Enforces strict 80/20 discipline live with stakeholders: if a prospect reveals a legacy dependency mid-meeting, dragging Feasibility below 50 defers it out of Phase 1 SOW automatically.',
      keywords: ['radar', 'pin', 'drag', 'quadrant', 'checkbox', 'phase 1', 'training wheels', 'runtime', 'rescore'],
      actionLabel: 'Open AI Radar',
      onAction: () => onSelectTab('radar'),
    },
    {
      id: 'customUc',
      tab: 'radar',
      tabLabel: 'AI Radar',
      name: 'Plot Custom Prospect Use Case Live',
      currentValue: `${useCases.length} intents plotted`,
      whatItDoes:
        'Adds a client-specific call driver with Feasibility (5–99) and Impact (5–99) scores. Scores ≥75F add +2 PS days; 50–74F add +3 PS days.',
      whyItMatters:
        'Turns live discovery calls into an interactive workshop where prospects see immediately whether a workflow belongs in Phase 1 or Phase 2.',
      keywords: ['custom', 'plot', 'add use case', 'feasibility', 'impact', 'discovery'],
      actionLabel: 'Plot Sample Use Case',
      onAction: () => {
        onSelectTab('radar');
        onAddCustomUseCase('Voice Biometric Fraud Reset', 86, 89);
      },
    },
    {
      id: 'gtmMotion',
      tab: 'scoping',
      tabLabel: 'Deal Scoping',
      name: 'Partner GTM Motion',
      currentValue: partnerMotion.toUpperCase(),
      whatItDoes:
        'Switches between CCaaS Co-Sell, Global Systems Integrator (GSI), and BPO Managed CX, updating the co-sell hook and RACI delivery ownership.',
      whyItMatters:
        'Aligns the pitch and SOW boundaries with partner incentives (unblocking CCaaS migrations, scaling GSI practices, or protecting BPO margins).',
      keywords: ['gtm', 'motion', 'ccaas', 'gsi', 'bpo', 'raci', 'co-sell'],
      actionLabel: 'Open Deal Scoping',
      onAction: () => onSelectTab('scoping'),
    },
    {
      id: 'sovereignty',
      tab: 'scoping',
      tabLabel: 'Deal Scoping',
      name: 'Deployment Sovereignty Tier',
      currentValue: sovereignty === 'baremetal' ? 'OCP Bare Metal' : 'OCP SaaS',
      whatItDoes:
        'Toggles Managed AWS Certified Walled Garden (SaaS) vs. On-Prem / Air-Gapped (Bare Metal, which adds +3 weeks & +12 PS days).',
      whyItMatters:
        'Quantifies the InfoSec and infrastructure effort for air-gapped deployments upfront so partners do not under-scope PS hours.',
      keywords: ['sovereignty', 'saas', 'bare metal', 'baremetal', 'air-gapped', 'on-prem'],
      actionLabel: sovereignty === 'saas' ? 'Test Bare Metal (+3 Wks)' : 'Switch to OCP SaaS',
      onAction: () => {
        onSelectTab('scoping');
        onChangeSovereignty(sovereignty === 'saas' ? 'baremetal' : 'saas');
      },
    },
    {
      id: 'intentSlider',
      tab: 'scoping',
      tabLabel: 'Deal Scoping',
      name: 'Phase 1 Bounded Intents & PS Blended Day Rate',
      currentValue: `${includedCount} Intents · $${psDayRate.toLocaleString()}/d`,
      whatItDoes:
        'Adjusts active Top-Right Radar intents (8 base PS days + 2–3 PS days per intent) and prices PS Days using your Blended Day Rate.',
      whyItMatters:
        'Feeds total upfront implementation dollars back into Unit Economics so Break-Even Payback and 36-month cash flow reflect true partner services pricing.',
      keywords: ['bounded intents', 'intent count', 'hlee', 'ps days', 'ps rate', 'day rate', 'timeline', 'weeks', 'sow'],
    },
    {
      id: 'apiReadiness',
      tab: 'scoping',
      tabLabel: 'Deal Scoping',
      name: 'Backend API & Middleware Readiness',
      currentValue: apiReadiness,
      whatItDoes:
        'Selects Modern REST/MCP-Ready (+0), Mixed REST + SOAP (+1 wk / +4 PS days), or Legacy Mainframe z/OS/3270 (+2 wks / +8 PS days + middleware gate).',
      whyItMatters:
        'Protects sub-300ms voice SLA and PS margins by gating 3270 screen-scraping out of scope until a REST/MCP facade is exposed.',
      keywords: ['api readiness', 'middleware', 'soap', 'mainframe', 'rest', 'graphql', '3270'],
    },
    {
      id: 'mcpBridge',
      tab: 'mcp',
      tabLabel: 'MCP Inspector',
      name: 'Live Call Turn Replay, Localhost Bridge & RPC Actions',
      currentValue: `${maxParallelMs + 42}ms Omilia total`,
      whatItDoes:
        'Simulates an end-to-end voice turn (ASR → Parallel MCP → Lexis TTS → UUI Handoff) alongside Embedded JSON-RPC 2.0 or http://localhost:3333/mcp tool calls.',
      whyItMatters:
        'Proves sub-300ms parallel MCP fan-out + Lexis TTS (<45ms) well under the 1,200ms caller hang-up threshold—with Zero Frontier Egress.',
      keywords: ['mcp', 'localhost', 'bridge', '3333', 'waterfall', 'latency', '1200', '300ms', 'lexis', 'json-rpc', 'typescript', 'replay', 'call turn', 'uui'],
      actionLabel: 'Open MCP Inspector',
      onAction: () => onSelectTab('mcp'),
    },
    {
      id: 'scenariosCsv',
      tab: 'economics',
      tabLabel: 'Global',
      name: 'Shareable Scenario URLs, Saved Deals & CSV Export',
      currentValue: `${formatCurrencyCompact(payback.implementationCost)} PS · Ready`,
      whatItDoes:
        'Encodes full workbench state into a shareable ?s= link, saves named deal profiles in localStorage, adds prospect/partner metadata in Deal Brief, and exports a full .csv workbook.',
      whyItMatters:
        'Enables champions, SEs, and CFO reviewers to reopen exact deal models, compare accounts, and audit all numbers inside Excel.',
      keywords: ['share', 'url', 'link', 'save', 'profile', 'scenario', 'csv', 'metadata', 'prospect', 'export'],
      actionLabel: 'Open Scenarios',
      onAction: onOpenScenarios,
    },
  ];

  const appendTurn = (userText: string, reply: Omit<ChatMessage, 'id' | 'role'>) => {
    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      { id: uid, role: 'user', text: userText },
      { id: aid, role: 'assistant', ...reply },
    ]);
  };

  const runTourStep = (stepNumber: number) => {
    const def = TOUR_STEPS.find((s) => s.step === stepNumber);
    if (!def) return;
    setTourStep(stepNumber);
    setWidgetMode('chat');
    onSelectTab(def.tab);

    const nextStep = stepNumber < 4 ? stepNumber + 1 : null;
    const actions: GuideAction[] = nextStep
      ? [
          {
            label: `Next: Step ${nextStep} of 4`,
            onClick: () => runTourStep(nextStep),
          },
          {
            label: 'Explain All Controls on This Tab',
            onClick: () => handleQuickPrompt(`Explain every control on ${def.tab}`),
          },
        ]
      : [
          { label: 'Open Executive Deal Brief', onClick: onOpenBrief },
          { label: 'Browse All Controls', onClick: () => setWidgetMode('controls') },
        ];

    setMessages((prev) => [
      ...prev,
      {
        id: `tour-${stepNumber}-${Date.now()}`,
        role: 'assistant',
        text: `${def.title}\n\n${def.summary({ preset, inputs, results, useCases, hlee })}`,
        actions,
      },
    ]);
  };

  const formatTabControlsSummary = (tab: TabKey): Omit<ChatMessage, 'id' | 'role'> => {
    const tabItems = controlDocs.filter((c) => c.tab === tab);
    const tabNames: Record<TabKey, string> = {
      economics: 'Unit Economics & TCO Simulator',
      radar: 'AI Radar 2.0 Prioritizer',
      scoping: 'Partner Deal-Scoping & SOW Guardrails',
      mcp: 'Live MCP Protocol Inspector',
    };
    const lines = tabItems
      .map(
        (c, i) =>
          `${i + 1}. ${c.name} (${c.currentValue})\n   • What it tweaks: ${c.whatItDoes}\n   • Why it matters: ${c.whyItMatters}`
      )
      .join('\n\n');

    return {
      text: `Every control you can tweak on ${tabNames[tab]}:\n\n${lines}`,
      actions: [
        { label: `Go to ${tabNames[tab].split(' ')[0]}`, onClick: () => onSelectTab(tab) },
        {
          label: 'Open Interactive Controls List',
          onClick: () => {
            setControlsFilterTab(tab);
            setWidgetMode('controls');
          },
        },
      ],
    };
  };

  const buildReplyForQuery = (rawQuery: string): Omit<ChatMessage, 'id' | 'role'> => {
    const q = rawQuery.toLowerCase();

    // A. Full breakdown of every control on active or named tab
    if (
      q.includes('every control') ||
      q.includes('all controls') ||
      q.includes('each thing') ||
      q.includes('what can i tweak') ||
      q.includes('everything i can tweak') ||
      q.includes('all inputs') ||
      q.includes('all sliders')
    ) {
      const targetTab: TabKey = q.includes('radar')
        ? 'radar'
        : q.includes('scop') || q.includes('sow') || q.includes('hlee')
        ? 'scoping'
        : q.includes('mcp') || q.includes('inspector')
        ? 'mcp'
        : q.includes('econ') || q.includes('tco') || q.includes('roi')
        ? 'economics'
        : activeTab;
      return formatTabControlsSummary(targetTab);
    }

    // B. Guided Tour
    if (q.includes('tour') || q.includes('walkthrough') || q.includes('walk me') || q.includes('how to use')) {
      setTourStep(1);
      onSelectTab('economics');
      return {
        text: `${TOUR_STEPS[0].title}\n\n${TOUR_STEPS[0].summary({ preset, inputs, results, useCases, hlee })}`,
        actions: [
          { label: 'Next: Step 2 (AI Radar)', onClick: () => runTourStep(2) },
          { label: 'Explain Every Unit Economics Control', onClick: () => handleQuickPrompt('Explain every control on economics') },
        ],
      };
    }

    // C. Match specific control(s) from controlDocs by keyword
    const scoredControls = controlDocs
      .map((doc) => {
        const hits = doc.keywords.filter((kw) => q.includes(kw)).length;
        return { doc, hits };
      })
      .filter((item) => item.hits > 0)
      .sort((a, b) => b.hits - a.hits);

    if (scoredControls.length > 0 && (q.includes('tweak') || q.includes('why') || q.includes('explain') || q.includes('what') || q.includes('how') || scoredControls[0].hits >= 1)) {
      const topMatches = scoredControls.slice(0, 2).map((s) => s.doc);
      const primary = topMatches[0];
      const text = topMatches
        .map(
          (c) =>
            `${c.name} [${c.tabLabel} — Current: ${c.currentValue}]\n• What it tweaks: ${c.whatItDoes}\n• Why it matters: ${c.whyItMatters}`
        )
        .join('\n\n');

      const actions: GuideAction[] = [];
      if (primary.onAction && primary.actionLabel) {
        actions.push({ label: primary.actionLabel, onClick: primary.onAction });
      } else {
        actions.push({ label: `Go to ${primary.tabLabel}`, onClick: () => onSelectTab(primary.tab) });
      }
      actions.push({
        label: 'View All Controls & Why',
        onClick: () => {
          setControlsFilterTab(primary.tab);
          setWidgetMode('controls');
        },
      });

      return { text, actions };
    }

    // D. Export / Brief / Print / Scenarios / CSV
    if (
      q.includes('export') ||
      q.includes('brief') ||
      q.includes('pdf') ||
      q.includes('print') ||
      q.includes('csv') ||
      q.includes('share') ||
      q.includes('scenario')
    ) {
      return {
        text: `You can share scenarios via URL (?s=...), save named deal profiles locally in the Scenarios modal, add Prospect/Partner/CCaaS metadata inside Executive Deal Brief, and download a full .csv model for Excel or CFO review.`,
        actions: [
          { label: 'Open Executive Deal Brief', onClick: onOpenBrief },
          { label: 'Save / Share Scenarios', onClick: onOpenScenarios },
          { label: 'Download CSV Model', onClick: onDownloadCsv },
        ],
      };
    }

    // E. Fallback: Helpful guide + quick path to Controls & Why
    return {
      text: `I can walk you through the 4 workbench views or explain what any slider, toggle, or selector changes and why.\n\nTry asking about a specific setting (like "Why tweak surge?", "How is payback calculated?", "Can I drag Radar pins?", or "How do Scenarios & CSV work?") or open the Controls & Why reference tab above.`,
      actions: [
        { label: 'Start 4-Step Tour', onClick: () => runTourStep(1) },
        {
          label: 'Explain Every Control on Current Tab',
          onClick: () => handleQuickPrompt(`Explain every control on ${activeTab}`),
        },
      ],
    };
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');
    setWidgetMode('chat');
    appendTurn(trimmed, buildReplyForQuery(trimmed));
  };

  const handleQuickPrompt = (promptText: string) => {
    setWidgetMode('chat');
    appendTurn(promptText, buildReplyForQuery(promptText));
  };

  const contextPrompts: Record<TabKey, string[]> = {
    economics: [
      'Explain Packaged BYOLLM vs. DIY Hyperscaler',
      'How does Self-Learning compress unit costs?',
      'Explain every control on economics',
    ],
    radar: [
      'Explain every control on radar',
      'How does pin dragging affect SOW?',
      'Plot a custom prospect driver',
    ],
    scoping: [
      'Explain every control on scoping',
      'How do PS Days & Day Rate link to ROI?',
      'Why does Bare Metal add 3 weeks?',
    ],
    mcp: [
      'Explain every control on mcp',
      'How does Call Turn Replay work?',
      'Why does <300ms MCP matter?',
    ],
  };

  const handleResetChat = () => {
    setTourStep(null);
    setWidgetMode('chat');
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        text: `Guide reset for ${preset.name}. Ask what any control tweaks (and why), start the 4-step tour, or switch to "Controls & Why" to browse every setting.`,
      },
    ]);
  };

  const displayedControls =
    controlsFilterTab === 'all'
      ? controlDocs
      : controlDocs.filter((c) => c.tab === controlsFilterTab);

  return (
    <div className="no-print fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <section
          aria-label="Interactive Workbench Walkthrough Assistant"
          className="mb-3 flex w-[calc(100vw-2.5rem)] sm:w-[440px] max-h-[76vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Compass className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="font-display text-xs font-bold text-slate-900 dark:text-slate-50 truncate">
                    Workbench Guide
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {preset.shortName} · {tourStep ? `Tour Step ${tourStep}/4` : 'Interactive Reference'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => runTourStep(1)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-teal-400 dark:hover:bg-teal-950/50 cursor-pointer whitespace-nowrap"
                >
                  4-Step Tour
                </button>
                <button
                  type="button"
                  onClick={handleResetChat}
                  aria-label="Reset conversation"
                  title="Reset conversation"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close guide"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mode Switcher: Guide & Chat vs. Controls & Why */}
            <div className="mt-2.5 flex items-center gap-1 rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setWidgetMode('chat')}
                className={`flex-1 rounded-md px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  widgetMode === 'chat'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Guide &amp; Q&amp;A
              </button>
              <button
                type="button"
                onClick={() => {
                  setControlsFilterTab(activeTab);
                  setWidgetMode('controls');
                }}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  widgetMode === 'controls'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Controls &amp; Why ({controlDocs.length})
              </button>
            </div>
          </div>

          {widgetMode === 'chat' ? (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-teal-700 text-white dark:bg-teal-600'
                          : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.actions.map((act) => (
                          <button
                            key={act.label}
                            type="button"
                            onClick={act.onClick}
                            className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-950 cursor-pointer whitespace-nowrap"
                          >
                            {act.label}
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Contextual Quick Prompts */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex flex-wrap gap-1.5">
                  {contextPrompts[activeTab].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-teal-500 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-300 cursor-pointer whitespace-nowrap"
                    >
                      <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Complete Controls & Why Reference Browser */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'economics', label: 'Economics' },
                    { key: 'radar', label: 'Radar' },
                    { key: 'scoping', label: 'Scoping' },
                    { key: 'mcp', label: 'MCP' },
                  ] as { key: TabKey | 'all'; label: string }[]
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setControlsFilterTab(t.key)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      controlsFilterTab === t.key
                        ? 'bg-teal-700 text-white dark:bg-teal-600'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-4 dark:divide-slate-800">
                {displayedControls.map((doc) => (
                  <div key={doc.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50">
                        {doc.name}
                      </h3>
                      <span className="font-mono text-[10.5px] tabular-nums text-teal-700 dark:text-teal-400 shrink-0">
                        {doc.currentValue}
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">Tweaks:</strong>{' '}
                      {doc.whatItDoes}
                    </p>
                    <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-400">
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">Why:</strong>{' '}
                      {doc.whyItMatters}
                    </p>
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10.5px] text-slate-400">{doc.tabLabel}</span>
                      <div className="flex items-center gap-2">
                        {doc.onAction && doc.actionLabel && (
                          <button
                            type="button"
                            onClick={doc.onAction}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline dark:text-teal-400 cursor-pointer"
                          >
                            {doc.actionLabel}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTab(doc.tab);
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                        >
                          Show tab
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 flex items-center justify-between">
                <span>Live values sync as you edit the workbench.</span>
                <button
                  type="button"
                  onClick={onOpenTsModal}
                  className="font-medium text-teal-700 hover:underline dark:text-teal-400 cursor-pointer"
                >
                  MCP Source
                </button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about any slider, toggle, or formula..."
              aria-label="Ask the workbench guide"
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send message"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:opacity-40 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>
      )}

      {/* Compact Floating Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Workbench Guide' : 'Open Workbench Guide'}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-900 px-4 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-slate-800 dark:border-slate-700 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        {isOpen ? 'Close Guide' : 'Walkthrough Guide'}
      </button>
    </div>
  );
};
