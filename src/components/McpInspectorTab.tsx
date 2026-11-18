import React, { useEffect, useRef, useState } from 'react';
import { Check, Code2, Copy, Play } from 'lucide-react';
import {
  ApiReadiness,
  CALL_TURN_SCENARIOS,
  PartnerMotion,
  SovereigntyTier,
  UseCase,
  VerticalPreset,
} from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  getQuadrantMeta,
  HleeResult,
  isHighFeasibilityQuadrant,
  PaybackAnalysis,
  RoiInputs,
  RoiResults,
} from '../utils/calculations';
import { InfoTooltip } from './InfoTooltip';

interface McpInspectorTabProps {
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  payback: PaybackAnalysis;
  useCases: UseCase[];
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  hlee: HleeResult;
  onOpenTsModal: () => void;
  onNotify: (msg: string) => void;
}

type RpcAction = 'tools/list' | 'parallel' | 'arch' | 'sow' | 'tco_radar';

export const McpInspectorTab: React.FC<McpInspectorTabProps> = ({
  preset,
  inputs,
  results,
  payback,
  useCases,
  partnerMotion,
  sovereignty,
  apiReadiness,
  hlee,
  onOpenTsModal,
  onNotify,
}) => {
  const [useBridge, setUseBridge] = useState(false);
  const [transportStatus, setTransportStatus] = useState(
    'Embedded JSON-RPC 2.0 Runtime (Offline Ready)'
  );
  const [activeAction, setActiveAction] = useState<RpcAction>('parallel');
  const [rpcId, setRpcId] = useState(1);
  const [reqJson, setReqJson] = useState('');
  const [resJson, setResJson] = useState('');
  const [copiedPane, setCopiedPane] = useState<'req' | 'res' | null>(null);
  const [replayStage, setReplayStage] = useState<number>(4);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimersRef = useRef<number[]>([]);

  const comp = results.competitorProfile;
  const scenario = CALL_TURN_SCENARIOS[preset.key];
  const maxParallelMs = Math.max(...preset.mcpSystems.map((s) => s.ms));
  const lexisTtsMs = 42;
  const totalOmiliaMs = maxParallelMs + lexisTtsMs;
  const backendSeqMs = preset.mcpSystems.reduce((acc, s) => acc + s.ms, 0);
  const externalAsrMs = comp.key === 'byollm' ? 380 : 520;
  const orchestratorLlmMs = comp.key === 'byollm' ? 890 : 1420;
  const externalTtsMs = comp.key === 'byollm' ? 320 : 410;
  const seqSumMs = externalAsrMs + orchestratorLlmMs + backendSeqMs + externalTtsMs;
  const scaleMax = Math.max(seqSumMs, 2200);
  const thresholdPct = (1200 / scaleMax) * 100;

  const clearReplayTimers = () => {
    replayTimersRef.current.forEach((id) => window.clearTimeout(id));
    replayTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearReplayTimers();
  }, []);

  useEffect(() => {
    clearReplayTimers();
    setIsReplaying(false);
    setReplayStage(4);
  }, [preset.key]);

  const handleSimulateCallTurn = () => {
    clearReplayTimers();
    setIsReplaying(true);
    setReplayStage(1);
    const t1 = window.setTimeout(() => setReplayStage(2), 380);
    const t2 = window.setTimeout(() => setReplayStage(3), 820);
    const t3 = window.setTimeout(() => {
      setReplayStage(4);
      setIsReplaying(false);
    }, 1240);
    replayTimersRef.current = [t1, t2, t3];
  };

  const executeRpc = async (action: RpcAction, nextId: number) => {
    setActiveAction(action);
    let requestPayload: Record<string, unknown> = {};
    let simulatedResponse: Record<string, unknown> = {};

    const includedList = useCases.filter((u) => isHighFeasibilityQuadrant(u) && u.included !== false);

    if (action === 'tools/list') {
      requestPayload = {
        jsonrpc: '2.0',
        id: nextId,
        method: 'tools/list',
        params: { verticalContext: preset.key },
      };
      simulatedResponse = {
        jsonrpc: '2.0',
        id: nextId,
        result: {
          tools: [
            {
              name: 'check_partner_architecture_fit',
              description:
                'Validates CCaaS connector, compliance perimeter, and zero-egress OCP deployment topology.',
              inputSchema: {
                type: 'object',
                properties: {
                  vertical: { type: 'string' },
                  ccaas: { type: 'string' },
                  sovereignty: { type: 'string' },
                },
                required: ['vertical', 'ccaas'],
              },
            },
            {
              name: 'simulate_parallel_tool_dispatch',
              description:
                "Executes parallel async backend lookups under Omilia's <300ms voice latency SLA.",
              inputSchema: {
                type: 'object',
                properties: {
                  vertical: { type: 'string' },
                  systems: { type: 'array', items: { type: 'string' } },
                },
                required: ['vertical'],
              },
            },
            {
              name: 'generate_partner_sow_guardrails',
              description: 'Computes deterministic HLEE timeline, RACI matrix, and 80/20 SOW guardrails.',
              inputSchema: {
                type: 'object',
                properties: {
                  vertical: { type: 'string' },
                  intents: { type: 'number' },
                  apiReadiness: { type: 'string' },
                },
                required: ['vertical', 'intents'],
              },
            },
            {
              name: 'calculate_tco_and_ai_radar_report',
              description:
                'Returns CFO Unit Economics TCO breakdown (Legacy vs. Packaged BYOLLM / DIY Hyperscaler vs. Omilia OCP) and AI Radar 2.0 prioritization report.',
              inputSchema: {
                type: 'object',
                properties: {
                  vertical: { type: 'string' },
                  monthlyCallVolume: { type: 'number' },
                  baseContainmentPct: { type: 'number' },
                  targetContainmentPct: { type: 'number' },
                  omiliaOutcomeRate: { type: 'number' },
                  surgeMultiplier: { type: 'number' },
                },
                required: ['vertical'],
              },
            },
          ],
        },
      };
    } else if (action === 'parallel') {
      requestPayload = {
        jsonrpc: '2.0',
        id: nextId,
        method: 'tools/call',
        params: {
          name: 'simulate_parallel_tool_dispatch',
          arguments: {
            vertical: preset.name,
            systems: preset.mcpSystems.map((s) => s.name),
            dispatchMode: 'ASYNC_PARALLEL_NON_BLOCKING',
          },
        },
      };
      simulatedResponse = {
        jsonrpc: '2.0',
        id: nextId,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  vertical: preset.name,
                  dispatchStrategy: 'Parallel Async MCP Fan-Out',
                  toolResolutionMs: maxParallelMs,
                  lexisNativeTtsMs: lexisTtsMs,
                  totalTurnaroundMs: totalOmiliaMs,
                  competitorSequentialMs: seqSumMs,
                  slaTargetMs: 300,
                  slaCompliant: totalOmiliaMs < 300,
                  systemsInvoked: preset.mcpSystems.map((s) => ({
                    system: s.name,
                    latencyMs: s.ms,
                    status: 'OK',
                  })),
                },
                null,
                2
              ),
            },
          ],
          governanceAudit: {
            zeroFrontierEgress: true,
            piiMaskedInLogs: true,
            schemaValidated: true,
          },
        },
      };
    } else if (action === 'arch') {
      requestPayload = {
        jsonrpc: '2.0',
        id: nextId,
        method: 'tools/call',
        params: {
          name: 'check_partner_architecture_fit',
          arguments: {
            vertical: preset.name,
            ccaas: partnerMotion,
            sovereignty,
          },
        },
      };
      simulatedResponse = {
        jsonrpc: '2.0',
        id: nextId,
        result: {
          vertical: preset.name,
          ocpRole: 'MCP Client (Host) inside Certified Walled Garden',
          customerRole: `Hosts MCP Server wrapping ${preset.backendStack.split(',')[0]}`,
          authProtocol: 'OAuth 2.0 Client Credentials + mTLS',
          complianceVerified: preset.compliance,
          zeroFrontierEgress: true,
        },
      };
    } else if (action === 'tco_radar') {
      requestPayload = {
        jsonrpc: '2.0',
        id: nextId,
        method: 'tools/call',
        params: {
          name: 'calculate_tco_and_ai_radar_report',
          arguments: {
            vertical: preset.key,
            monthlyCallVolume: inputs.callVolume,
            baseContainmentPct: inputs.baseContainment,
            targetContainmentPct: inputs.targetContainment,
            omiliaOutcomeRate: inputs.omiliaOutcomeRate,
            surgeMultiplier: inputs.surge,
          },
        },
      };
      simulatedResponse = {
        jsonrpc: '2.0',
        id: nextId,
        result: {
          vertical: preset.name,
          unitEconomicsTcoSummary: {
            competitorBaseline: `${comp.title} (${comp.examples})`,
            annualHardPnlSavings: formatCurrencyCompact(results.annualNetSavings),
            hardPnlLaborRealizationPct: `${results.laborRealizationPct}%`,
            reclaimedNonLayoffCapacityValue: `${formatCurrencyCompact(results.annualCapacityReinvestedValue)}/yr`,
            monthlyNetSavings: formatCurrencyCompact(results.monthlyNetSavings),
            threeYearAdvantageVsCompetitor: formatCurrencyCompact(payback.threeYearCompetitorSavings),
            breakEvenPaybackMonths:
              payback.paybackMonths !== null
                ? `${payback.paybackMonths.toFixed(1)} months (incl. ${payback.omiliaBuildMonths.toFixed(1)}m build + 2m ramp)`
                : 'N/A',
            containmentLift: `+${results.containmentLiftPct}%`,
            resolvedCallsPerMonth: `${Math.round(results.omiliaAutomatedCalls).toLocaleString()} calls/mo`,
            agentDaysSavedPerMonth: `${results.daysSavedPerAgentMo.toFixed(1)} days`,
            equivalentFtesFreed: `${Math.round(results.ftesFreed).toLocaleString()} FTEs`,
            loadedHumanUnitCost: `$${results.unitHumanCost.toFixed(2)}/call`,
            omiliaOutcomeRate: `$${inputs.omiliaOutcomeRate.toFixed(2)}/resolved`,
          },
          aiRadarPortfolio: {
            totalPlottedUseCases: useCases.length,
            phase1HighFeasIncludedCount: includedList.length,
            phase1IncludedUseCases: includedList.map((u) => ({
              name: u.name,
              feasibility: u.feas,
              impact: u.imp,
              runtimeTier: u.runtime,
              rolloutPlan: u.rollout,
            })),
            allPlottedUseCases: useCases.map((u) => ({
              name: u.name,
              quadrant: getQuadrantMeta(u.feas, u.imp).label,
              feasibility: u.feas,
              impact: u.imp,
              includedInPhase1Sow: isHighFeasibilityQuadrant(u) && u.included !== false,
            })),
          },
        },
      };
    } else {
      const includedNames = includedList.map((u) => u.name);
      requestPayload = {
        jsonrpc: '2.0',
        id: nextId,
        method: 'tools/call',
        params: {
          name: 'generate_partner_sow_guardrails',
          arguments: {
            vertical: preset.name,
            intents: includedNames.length,
            includedUseCases: includedNames,
            apiReadiness,
          },
        },
      };
      simulatedResponse = {
        jsonrpc: '2.0',
        id: nextId,
        result: {
          vertical: preset.name,
          estimatedTimeline: hlee.timelineLabel,
          estimatedPsEffort: hlee.psEffortLabel,
          includedPhase1UseCases: includedNames,
          guardrails: [
            '80/20 Rule: Phase 1 capped at top 3-5 volume drivers',
            'Sub-300ms orchestration SLA isolated from customer legacy backend latency',
            'Mandatory HITL approval gate before self-learned flow promotion',
          ],
        },
      };
    }

    setReqJson(JSON.stringify(requestPayload, null, 2));

    if (useBridge) {
      try {
        const res = await fetch('http://localhost:3333/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        const json = await res.json();
        setResJson(JSON.stringify(json, null, 2));
        setTransportStatus('Connected LIVE to http://localhost:3333/mcp');
        return;
      } catch {
        setTransportStatus('Localhost :3333 unreachable — fell back to Embedded Runtime');
      }
    } else {
      setTransportStatus('Embedded JSON-RPC 2.0 Runtime (Offline Ready)');
    }

    setResJson(JSON.stringify(simulatedResponse, null, 2));
  };

  useEffect(() => {
    void executeRpc(activeAction, rpcId);
    // Re-sync trace when vertical, competitor baseline, or transport bridge toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.key, comp.key, useBridge]);

  const handleRunAction = (action: RpcAction) => {
    const next = rpcId + 1;
    setRpcId(next);
    void executeRpc(action, next);
  };

  const handleCopyJson = async (pane: 'req' | 'res', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPane(pane);
      setTimeout(() => setCopiedPane(null), 1600);
      onNotify(pane === 'req' ? 'Copied Outbound JSON-RPC Request' : 'Copied Inbound JSON-RPC Response');
    } catch {
      onNotify('Copy failed');
    }
  };

  const actions: { key: RpcAction; label: string; primary?: boolean }[] = [
    { key: 'tools/list', label: '1. tools/list' },
    { key: 'parallel', label: '2. Parallel Async Dispatch (<300ms)', primary: true },
    { key: 'arch', label: '3. Check Architecture Fit' },
    { key: 'sow', label: '4. Generate SOW Guardrails' },
    { key: 'tco_radar', label: '5. Request TCO & AI Radar Report', primary: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 print:block print:space-y-5 gap-6 items-start">
      {/* Left 6 Columns: Orchestration Controls & Latency Waterfall */}
      <div className="lg:col-span-6 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  MCP Client Orchestration &amp; Transport
                </h2>
                <InfoTooltip
                  label="MCP Client Orchestration"
                  description="Demonstrates OCP acting as an outbound MCP Client calling customer-hosted MCP servers inside the sovereign perimeter without sending prompts or PII to external frontier LLMs."
                  tcoImpact="Eliminates frontier API hops, cutting turn latency below 1,200ms and preserving containment savings."
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                OCP acts as MCP Client calling customer-hosted MCP servers
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenTsModal}
              className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Code2 className="h-3.5 w-3.5" />
              View / Download TS Server
            </button>
          </div>

          {/* Localhost Bridge Toggle */}
          <div className="mt-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <label htmlFor="chkLocalhostBridge" className="cursor-pointer">
                  Localhost HTTP Bridge (<code className="font-mono text-[11px]">http://localhost:3333/mcp</code>)
                </label>
                <InfoTooltip
                  label="Localhost HTTP Bridge"
                  description="Routes JSON-RPC 2.0 tool calls to a locally running omilia-partner-mcp Node server, falling back seamlessly to the embedded runtime if offline."
                  tcoImpact="Validates real sub-300ms parallel MCP tool execution—preventing the >1,200ms dead-air delays that cause caller hang-ups and lost containment savings."
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {transportStatus}
              </div>
            </div>
            <input
              id="chkLocalhostBridge"
              type="checkbox"
              checked={useBridge}
              onChange={(e) => setUseBridge(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
            />
          </div>

          {/* RPC Method Triggers */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
              <span>Live JSON-RPC 2.0 Actions</span>
              <InfoTooltip
                label="JSON-RPC 2.0 Tool Actions"
                description="Executes live MCP client requests synced with your active vertical, Unit Economics sliders, and AI Radar Phase 1 scope."
                tcoImpact="Action 5 generates the exact CFO TCO & Radar JSON report consumed by external partner agents without leaking PII to frontier LLMs."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((act) => {
                const isSelected = activeAction === act.key;
                return (
                  <button
                    key={act.key}
                    type="button"
                    onClick={() => handleRunAction(act.key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-teal-700 text-white dark:bg-teal-600'
                        : act.primary
                        ? 'border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-950'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Play className="h-3 w-3" />
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Latency Budget Waterfall */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Voice Latency Budget Waterfall
                  </h3>
                  <InfoTooltip
                    label="Voice Latency Budget Waterfall"
                    description="Contrasts Omilia's Parallel Async MCP fan-out + <45ms Lexis TTS against multi-hop sequential chains (External ASR -> Frontier LLM -> APIs -> External TTS) relative to the 1,200ms caller hang-up line."
                    tcoImpact="Eliminates the 1.8s–3.5s dead air that causes caller barge-in failures and depresses competitor containment by 6–11 points."
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Measured against the 1,200ms Caller Hang-Up Threshold · {preset.shortName} Stack
                </p>
              </div>
            </div>

            <div className="relative space-y-5 pt-2">
              {/* 1,200ms Caller Hang-Up Threshold Vertical Line */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 bottom-0 z-10 border-l border-dashed border-rose-500/70"
                style={{ left: `${Math.min(96, thresholdPct)}%` }}
              >
                <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  1,200ms Hang-Up
                </span>
              </div>

              {/* Competitor Multi-Hop / Sequential Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className="font-medium text-rose-700 dark:text-rose-400">
                    {comp.key === 'byollm'
                      ? `${comp.shortLabel} Multi-Hop (${comp.examples})`
                      : `${comp.shortLabel} Sequential Chain`}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400 shrink-0">
                    {seqSumMs.toLocaleString()} ms ({comp.turnLatencyLabel})
                  </span>
                </div>
                <div className="flex h-7 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <div
                    className="flex items-center justify-center bg-rose-700 text-[10px] font-mono font-semibold text-white truncate px-1"
                    style={{ width: `${(externalAsrMs / scaleMax) * 100}%` }}
                    title={`External ASR/STT: ${externalAsrMs}ms`}
                  >
                    ASR {externalAsrMs}ms
                  </div>
                  <div
                    className="flex items-center justify-center bg-rose-500 text-[10px] font-mono font-semibold text-white truncate px-1"
                    style={{ width: `${(orchestratorLlmMs / scaleMax) * 100}%` }}
                    title={`Orchestrator + Frontier LLM: ${orchestratorLlmMs}ms`}
                  >
                    LLM {orchestratorLlmMs}ms
                  </div>
                  {preset.mcpSystems.map((sys) => (
                    <div
                      key={sys.name}
                      className="flex items-center justify-center text-[10px] font-mono font-semibold text-white truncate px-1"
                      style={{
                        width: `${(sys.ms / scaleMax) * 100}%`,
                        backgroundColor: sys.color,
                      }}
                      title={`${sys.name}: ${sys.ms}ms`}
                    >
                      {sys.ms}ms
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-center bg-amber-500 text-[10px] font-mono font-semibold text-slate-950 truncate px-1"
                    style={{ width: `${(externalTtsMs / scaleMax) * 100}%` }}
                    title={`External TTS: ${externalTtsMs}ms`}
                  >
                    TTS {externalTtsMs}ms
                  </div>
                </div>
              </div>

              {/* Omilia Parallel Async MCP + Lexis TTS Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-teal-700 dark:text-teal-400">
                    Omilia OCP Parallel Async MCP + Lexis TTS (&lt;45ms)
                  </span>
                  <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {totalOmiliaMs} ms ({maxParallelMs}ms MCP + {lexisTtsMs}ms Lexis)
                  </span>
                </div>
                <div className="flex h-7 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <div
                    className="flex items-center justify-center bg-teal-600 text-[10px] font-mono font-semibold text-white truncate px-1.5"
                    style={{ width: `${(maxParallelMs / scaleMax) * 100}%` }}
                    title={`Parallel Async MCP Fan-Out: ${maxParallelMs}ms`}
                  >
                    Parallel MCP ({maxParallelMs}ms)
                  </div>
                  <div
                    className="flex items-center justify-center bg-emerald-600 text-[10px] font-mono font-semibold text-white truncate px-1"
                    style={{ width: `${(lexisTtsMs / scaleMax) * 100}%` }}
                    title={`Lexis TTS: ${lexisTtsMs}ms`}
                  >
                    Lexis
                  </div>
                </div>
              </div>
            </div>

            {/* Systems Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              {preset.mcpSystems.map((sys) => (
                <span key={sys.name} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: sys.color }}
                  />
                  <span>{sys.name}</span>
                  <span className="font-mono tabular-nums">({sys.ms}ms)</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive End-to-End Live Call Turn Replay */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  End-to-End Live Call Turn Replay
                </h2>
                <InfoTooltip
                  label="End-to-End Call Turn Replay"
                  description="Steps through a real vertical voice turn from 8kHz Speech Capture to Parallel Async MCP Fan-Out, Lexis Native TTS playback, and SIP UUI warm-transfer context."
                  tcoImpact="Demonstrates both automated resolution speed and CoPilot ACW savings if a call escalates to a human agent."
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {scenario.intentName} · {totalOmiliaMs}ms Omilia vs. {seqSumMs.toLocaleString()}ms {comp.shortLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSimulateCallTurn}
              className="no-print inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" />
              {isReplaying ? 'Replaying Turn...' : 'Simulate Call Turn'}
            </button>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            {/* Stage 1: Caller ASR */}
            <div
              className={`rounded-lg border p-3.5 transition-opacity duration-200 ${
                replayStage >= 1
                  ? 'border-slate-200 bg-slate-50/70 opacity-100 dark:border-slate-800 dark:bg-slate-950/60'
                  : 'border-slate-100 opacity-35 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  01 · CALLER SPEECH CAPTURE
                </span>
                <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {scenario.asrTokens}
                </span>
              </div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {scenario.callerUtterance}
              </p>
            </div>

            {/* Stage 2: Parallel MCP Fan-Out */}
            <div
              className={`rounded-lg border p-3.5 transition-opacity duration-200 ${
                replayStage >= 2
                  ? 'border-slate-200 bg-slate-50/70 opacity-100 dark:border-slate-800 dark:bg-slate-950/60'
                  : 'border-slate-100 opacity-35 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  02 · PARALLEL ASYNC MCP FAN-OUT
                </span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                  Resolved in {maxParallelMs}ms concurrent
                </span>
              </div>
              <div className="space-y-1.5">
                {scenario.systemPayloads.map((item, idx) => {
                  const msVal = preset.mcpSystems[idx]?.ms ?? maxParallelMs;
                  return (
                    <div
                      key={item.system}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-200/70 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-800"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.system}{' '}
                        <span className="font-mono text-[10.5px] tabular-nums text-slate-500">
                          ({msVal}ms)
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {item.result}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 3: Lexis Native TTS Reply */}
            <div
              className={`rounded-lg border p-3.5 transition-opacity duration-200 ${
                replayStage >= 3
                  ? 'border-teal-200 bg-teal-50/50 opacity-100 dark:border-teal-900/60 dark:bg-teal-950/30'
                  : 'border-slate-100 opacity-35 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  03 · LEXIS NATIVE TTS REPLY
                </span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  +42ms TTS ({totalOmiliaMs}ms total loop)
                </span>
              </div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {scenario.omiliaReply}
              </p>
            </div>

            {/* Stage 4: Warm Transfer UUI */}
            <div
              className={`rounded-lg border p-3 transition-opacity duration-200 ${
                replayStage >= 4
                  ? 'border-slate-200 bg-slate-50 opacity-100 dark:border-slate-800 dark:bg-slate-950'
                  : 'border-slate-100 opacity-35 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                  04 · SIP / UUI WARM HANDOFF CONTEXT (IF ESCALATED TO COPILOT)
                </span>
              </div>
              <code className="block font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                {scenario.uuiHandoffSummary}
              </code>
            </div>
          </div>
        </section>
      </div>

      {/* Right 6 Columns: Glass Box JSON-RPC 2.0 Audit Wire Trace */}
      <div className="lg:col-span-6 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  Glass Box JSON-RPC 2.0 Audit Wire Trace
                </h2>
                <InfoTooltip
                  label="Glass Box JSON-RPC 2.0 Audit Trace"
                  description="Inspects the exact schema-validated request/response payloads exchanged between OCP (MCP Client) and customer-hosted MCP servers with PII masking."
                  tcoImpact="Gives InfoSec & Architecture Review Boards verifiable proof that customer PII never leaves the sovereign perimeter."
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Schema-validated · RBAC-scoped · Zero third-party LLM egress
              </p>
            </div>
            <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Zero Frontier Egress
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Outbound Request */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Outbound MCP Request (OCP Client → Customer MCP Server)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyJson('req', reqJson)}
                  className="no-print inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copiedPane === 'req' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedPane === 'req' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-56 overflow-auto print:max-h-none print:overflow-visible rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-[11.5px] leading-relaxed text-sky-300 dark:border-slate-800">
                {reqJson}
              </pre>
            </div>

            {/* Inbound Response */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Inbound MCP Response &amp; Governance Audit Metadata
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyJson('res', resJson)}
                  className="no-print inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copiedPane === 'res' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedPane === 'res' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-72 overflow-auto print:max-h-none print:overflow-visible rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-[11.5px] leading-relaxed text-emerald-300 dark:border-slate-800">
                {resJson}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
