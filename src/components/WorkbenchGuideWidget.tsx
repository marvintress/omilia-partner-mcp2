import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  HelpCircle,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import {
  ApiReadiness,
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
  hlee: HleeResult;
  onSelectTab: (tab: TabKey) => void;
  onChangeVertical: (v: VerticalKey) => void;
  onUpdateInput: <K extends keyof RoiInputs>(key: K, val: RoiInputs[K]) => void;
  onChangeSovereignty: (s: SovereigntyTier) => void;
  onAddCustomUseCase: (name: string, feas: number, imp: number) => void;
  onOpenBrief: () => void;
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
      `You are viewing ${preset.name} at ${inputs.callVolume.toLocaleString()} calls/mo and a ${inputs.surge.toFixed(1)}x peak surge.\n\n• Adjust volume, baseline vs. target containment (${inputs.baseContainment}% → ${inputs.targetContainment}%), and outcome pricing ($${inputs.omiliaOutcomeRate.toFixed(2)}/resolved) on the left.\n• Use Onshore / Nearshore / Offshore presets or toggle CFO Override for finance-approved unit cost ($${results.unitHumanCost.toFixed(2)}/call).\n• Right now, Omilia delivers ${formatCurrencyCompact(results.annualNetSavings)}/yr net savings and ${formatCurrencyCompact(results.threeYearDiySavings)} 3-year TCO advantage over DIY Frontier LLMs.`,
  },
  {
    step: 2,
    tab: 'radar',
    title: 'Step 2 of 4 · AI Radar 2.0 Prioritizer',
    summary: ({ useCases }) => {
      const topRight = useCases.filter(isTopRightQuadrant);
      const included = topRight.filter((u) => u.included !== false);
      return `The 2×2 matrix plots Feasibility & Data Maturity (X-axis) against Financial & CX Impact (Y-axis).\n\n• Click any numbered pin to inspect its Recommended Omilia Runtime Tier, Phased "Training Wheels" rollout, and Glass Box governance gate.\n• Only Top-Right Quadrant items (≥50F and ≥50I) feed into Phase 1 Deal Scoping—currently ${included.length} of ${topRight.length} Top-Right intents are active.\n• Use "Plot Custom Prospect Use Case Live" below the chart during discovery workshops.`;
    },
  },
  {
    step: 3,
    tab: 'scoping',
    title: 'Step 3 of 4 · Partner Deal-Scoping & SOW Guardrails',
    summary: ({ hlee, preset }) =>
      `This view turns your Radar selections into a fixed-scope SOW estimate.\n\n• Pick Partner GTM Motion (CCaaS Co-Sell, GSI, or BPO), Deployment Sovereignty (SaaS vs. Bare Metal), and Backend API Readiness.\n• Your current Phase 1 HLEE estimate is ${hlee.timelineLabel} (${hlee.psEffortLabel}) with ${preset.compliance.slice(0, 3).join(', ')} compliance guardrails and a clear Partner vs. Omilia RACI matrix.`,
  },
  {
    step: 4,
    tab: 'mcp',
    title: 'Step 4 of 4 · Live MCP Protocol & Glass Box Inspector',
    summary: ({ preset }) => {
      const maxMs = Math.max(...preset.mcpSystems.map((s) => s.ms));
      return `Omilia OCP acts as the MCP Client calling customer-hosted MCP servers with zero frontier LLM egress.\n\n• Click any of the 5 JSON-RPC 2.0 actions to inspect live outbound requests and governance-audited responses.\n• The Voice Latency Budget Waterfall compares sequential DIY LLM chaining against Omilia's parallel async dispatch (${maxMs + 42}ms total vs. the 1,200ms caller hang-up threshold).\n• Click "View / Download TS Server" to export the runnable Node/TypeScript MCP server.`;
    },
  },
];

export const WorkbenchGuideWidget: React.FC<WorkbenchGuideWidgetProps> = ({
  activeTab,
  vertical,
  preset,
  inputs,
  results,
  useCases,
  partnerMotion,
  sovereignty,
  apiReadiness,
  hlee,
  onSelectTab,
  onChangeVertical,
  onUpdateInput,
  onChangeSovereignty,
  onAddCustomUseCase,
  onOpenBrief,
  onOpenTsModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Welcome to the Omilia Partner Workbench. I can walk you through all 4 views, explain the TCO and HLEE math using your live ${preset.shortName} numbers, or run quick scenarios. Where would you like to start?`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
    onSelectTab(def.tab);

    const nextStep = stepNumber < 4 ? stepNumber + 1 : null;
    const actions: GuideAction[] = nextStep
      ? [
          {
            label: `Next: Step ${nextStep} of 4`,
            onClick: () => runTourStep(nextStep),
          },
        ]
      : [
          {
            label: 'Open Executive Deal Brief',
            onClick: onOpenBrief,
          },
          {
            label: 'Restart Tour',
            onClick: () => runTourStep(1),
          },
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

  const buildReplyForQuery = (rawQuery: string): Omit<ChatMessage, 'id' | 'role'> => {
    const q = rawQuery.toLowerCase();

    // 1. Guided Tour intent
    if (q.includes('tour') || q.includes('walkthrough') || q.includes('walk me') || q.includes('start') || q.includes('how to use')) {
      setTourStep(1);
      onSelectTab('economics');
      return {
        text: `${TOUR_STEPS[0].title}\n\n${TOUR_STEPS[0].summary({ preset, inputs, results, useCases, hlee })}`,
        actions: [{ label: 'Next: Step 2 (AI Radar)', onClick: () => runTourStep(2) }],
      };
    }

    // 2. Surge / DIY Frontier LLM math
    if (q.includes('surge') || q.includes('diy') || q.includes('llm') || q.includes('token') || q.includes('storm')) {
      return {
        text: `During peak spikes, DIY Frontier LLM stacks suffer a nonlinear token retry and context-bloat penalty modeled as surge^1.38 (currently ×${Math.pow(inputs.surge, 1.38).toFixed(2)} at ${inputs.surge.toFixed(1)}x load), plus $28,500/mo orchestration overhead and lower effective containment (${Math.round(results.diyContainment * 100)}%).\n\nOmilia stays on flat outcome pricing ($${inputs.omiliaOutcomeRate.toFixed(2)}/resolved), saving ${formatCurrencyCompact(results.threeYearDiySavings)} over 3 years for ${preset.shortName}.`,
        actions: [
          {
            label: 'View Unit Economics',
            onClick: () => onSelectTab('economics'),
          },
          {
            label: 'Try 3.2x Utilities Storm Surge',
            onClick: () => {
              onChangeVertical('utilities');
              onSelectTab('economics');
            },
          },
        ],
      };
    }

    // 3. TCO / Savings / Labor / TalkGuard / CoPilot / FTE
    if (
      q.includes('tco') ||
      q.includes('saving') ||
      q.includes('roi') ||
      q.includes('cost') ||
      q.includes('fte') ||
      q.includes('talkguard') ||
      q.includes('copilot') ||
      q.includes('cfo') ||
      q.includes('agent')
    ) {
      return {
        text: `For ${preset.name} (${inputs.callVolume.toLocaleString()} calls/mo × ${inputs.surge.toFixed(1)}x surge):\n\n• Loaded Human Cost: $${results.unitHumanCost.toFixed(2)}/call ${inputs.cfoOverride ? '(CFO Direct Override active)' : `(from $${inputs.wage}/hr + ${inputs.burden}% burden @ ${inputs.occupancy}% occupancy)`}.\n• TalkGuard saves ${results.tgSecSaved}s KBA time; CSR CoPilot cuts ${results.cpSecSaved}s ACW on escalated calls.\n• Result: ${formatCurrencyCompact(results.annualNetSavings)}/yr net savings and ${Math.round(results.ftesFreed).toLocaleString()} equivalent FTEs freed (${results.daysSavedPerAgentMo.toFixed(1)} days/agent/mo).`,
        actions: [
          { label: 'Go to Unit Economics', onClick: () => onSelectTab('economics') },
          {
            label: 'Simulate 2.5x Surge',
            onClick: () => {
              onSelectTab('economics');
              onUpdateInput('surge', 2.5);
            },
          },
        ],
      };
    }

    // 4. AI Radar / Quadrant / Custom Use Case
    if (
      q.includes('radar') ||
      q.includes('use case') ||
      q.includes('quadrant') ||
      q.includes('plot') ||
      q.includes('training wheels') ||
      q.includes('custom')
    ) {
      const topRightCount = useCases.filter(isTopRightQuadrant).length;
      const includedCount = useCases.filter((u) => isTopRightQuadrant(u) && u.included !== false).length;
      return {
        text: `AI Radar 2.0 separates discovery candidates into 4 quadrants:\n\n• Top-Right (≥50F, ≥50I): Immediate Funding — feeds Phase 1 Deal Scoping (${includedCount}/${topRightCount} active).\n• Top-Left (<50F, ≥50I): Phase 2 "Training Wheels" with HITL gates.\n• Bottom-Right (≥50F, <50I): Quick Wins via Voice-Safe RAG.\n• Bottom-Left: Defer.\n\nClick any pin to inspect its rollout plan or plot a new prospect driver below the matrix.`,
        actions: [
          { label: 'Open AI Radar', onClick: () => onSelectTab('radar') },
          {
            label: 'Plot Sample Phase 1 Driver',
            onClick: () => {
              onSelectTab('radar');
              onAddCustomUseCase('Voice Biometric Fraud Reset', 86, 89);
            },
          },
        ],
      };
    }

    // 5. Deal Scoping / HLEE / SOW / RACI / Bare Metal / Motion
    if (
      q.includes('scope') ||
      q.includes('scoping') ||
      q.includes('hlee') ||
      q.includes('sow') ||
      q.includes('raci') ||
      q.includes('bare metal') ||
      q.includes('saas') ||
      q.includes('guardrail') ||
      q.includes('mainframe') ||
      q.includes('ps days')
    ) {
      return {
        text: `Your Phase 1 Deal Scope is driven directly by checked Top-Right Radar items plus architecture complexity:\n\n• Current Motion: ${partnerMotion.toUpperCase()} · Tier: ${sovereignty === 'baremetal' ? 'Bare Metal (+3 wks, +12 PS days)' : 'OCP SaaS'} · APIs: ${apiReadiness}.\n• Current HLEE Estimate: ${hlee.timelineLabel} (${hlee.psEffortLabel}).\n• Guardrails enforce the 80/20 rule, sub-300ms MCP orchestration isolation, and explicit RACI ownership.`,
        actions: [
          { label: 'Open Deal Scoping', onClick: () => onSelectTab('scoping') },
          {
            label: sovereignty === 'saas' ? 'Test Bare Metal (+3 Wks)' : 'Switch to OCP SaaS',
            onClick: () => {
              onSelectTab('scoping');
              onChangeSovereignty(sovereignty === 'saas' ? 'baremetal' : 'saas');
            },
          },
        ],
      };
    }

    // 6. MCP / Latency / Waterfall / TypeScript Server / Zero Egress
    if (
      q.includes('mcp') ||
      q.includes('latency') ||
      q.includes('waterfall') ||
      q.includes('300ms') ||
      q.includes('1200') ||
      q.includes('typescript') ||
      q.includes('localhost') ||
      q.includes('egress') ||
      q.includes('json')
    ) {
      const maxMs = Math.max(...preset.mcpSystems.map((s) => s.ms));
      const seqMs = preset.mcpSystems.reduce((acc, s) => acc + s.ms, 0) + 640 + 210;
      return {
        text: `In Omilia's architecture, OCP acts as the MCP Client calling customer-hosted MCP servers inside your compliance perimeter (Zero Frontier Egress).\n\n• Sequential DIY LLM chaining takes ~${seqMs.toLocaleString()}ms — exceeding the 1,200ms caller hang-up threshold.\n• Omilia parallel async MCP fan-out (${maxMs}ms) + Lexis TTS (42ms) finishes in ${maxMs + 42}ms.\n• You can also download the runnable TypeScript MCP server (stdio + HTTP :3333).`,
        actions: [
          { label: 'Open MCP Inspector', onClick: () => onSelectTab('mcp') },
          { label: 'View TypeScript Server', onClick: onOpenTsModal },
        ],
      };
    }

    // 7. Export / Brief / PDF / Vertical switching
    if (q.includes('export') || q.includes('brief') || q.includes('pdf') || q.includes('print') || q.includes('share')) {
      return {
        text: `You can export a synchronized dossier at any time:\n\n• Click "Export Deal Brief" in the top bar for a plain-text executive summary combining your ROI metrics, Phase 1 Radar scope, and HLEE guardrails.\n• Click "Print Report" in the workspace bar to generate a landscape PDF report across your active view.`,
        actions: [
          { label: 'Open Executive Deal Brief', onClick: onOpenBrief },
          { label: 'Print / Save PDF', onClick: () => window.print() },
        ],
      };
    }

    if (q.includes('vertical') || q.includes('banking') || q.includes('utilities') || q.includes('insurance') || q.includes('health') || q.includes('telecom')) {
      const target: VerticalKey | null = q.includes('util')
        ? 'utilities'
        : q.includes('insur')
        ? 'insurance'
        : q.includes('health')
        ? 'healthcare'
        : q.includes('tele')
        ? 'telecom'
        : q.includes('bank')
        ? 'banking'
        : null;

      if (target) {
        onChangeVertical(target);
        return {
          text: `Switched the entire workbench to ${target.charAt(0).toUpperCase() + target.slice(1)}. All ROI baselines, AI Radar use cases, compliance guardrails, and MCP latency systems are now updated.`,
        };
      }
      return {
        text: `Use the Industry Vertical bar at the top to switch in one click between Banking, Utilities, Insurance, Healthcare, and Telecom & Retail. Every tab updates automatically.`,
      };
    }

    // Default helpful fallback
    return {
      text: `You are currently on the ${
        activeTab === 'economics'
          ? 'Unit Economics'
          : activeTab === 'radar'
          ? 'AI Radar 2.0'
          : activeTab === 'scoping'
          ? 'Partner Deal Scoping'
          : 'MCP Protocol Inspector'
      } tab for ${preset.name}.\n\nAsk me about ROI & surge formulas, AI Radar quadrants, HLEE PS day estimates, or the sub-300ms MCP waterfall—or start the 4-step guided tour.`,
      actions: [
        { label: 'Start 4-Step Tour', onClick: () => runTourStep(1) },
        { label: 'Explain Current Tab', onClick: () => runTourStep(activeTab === 'economics' ? 1 : activeTab === 'radar' ? 2 : activeTab === 'scoping' ? 3 : 4) },
      ],
    };
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');
    appendTurn(trimmed, buildReplyForQuery(trimmed));
  };

  const handleQuickPrompt = (promptText: string) => {
    appendTurn(promptText, buildReplyForQuery(promptText));
  };

  const contextPrompts: Record<TabKey, string[]> = {
    economics: [
      'Start 4-step walkthrough',
      'Explain DIY LLM surge penalty',
      'How are FTEs & savings calculated?',
    ],
    radar: [
      'Start 4-step walkthrough',
      'How do quadrants affect Phase 1?',
      'Plot a sample Phase 1 use case',
    ],
    scoping: [
      'Start 4-step walkthrough',
      'How are PS Days calculated?',
      'What happens with Bare Metal?',
    ],
    mcp: [
      'Start 4-step walkthrough',
      'Why does <300ms MCP matter?',
      'How do I run the TypeScript server?',
    ],
  };

  const handleResetChat = () => {
    setTourStep(null);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        text: `Guide reset for ${preset.name}. Pick a quick question below, start the 4-step tour, or ask how any calculation works.`,
      },
    ]);
  };

  return (
    <div className="no-print fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <section
          aria-label="Interactive Workbench Walkthrough Assistant"
          className="mb-3 flex w-[calc(100vw-2.5rem)] sm:w-[410px] max-h-[72vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="font-display text-xs font-bold text-slate-900 dark:text-slate-50 truncate">
                  Workbench Guide
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {preset.shortName} · {tourStep ? `Tour Step ${tourStep}/4` : 'Interactive Walkthrough'}
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

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
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

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask how a metric, tab, or guardrail works..."
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
