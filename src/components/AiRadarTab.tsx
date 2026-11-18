import React, { useRef, useState } from 'react';
import { Copy, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { UseCase, VerticalPreset } from '../data/verticalPresets';
import { getQuadrantMeta, isHighFeasibilityQuadrant } from '../utils/calculations';
import { InfoTooltip } from './InfoTooltip';

interface AiRadarTabProps {
  preset: VerticalPreset;
  useCases: UseCase[];
  selectedId: string | null;
  onSelectUseCase: (id: string) => void;
  onToggleInclude: (id: string) => void;
  onUpdateUseCaseScores: (id: string, feas: number, imp: number) => void;
  onDeleteUseCase: (id: string) => void;
  onAddCustomUseCase: (name: string, feas: number, imp: number) => void;
  onClearAll: () => void;
  onRestoreDefaults: () => void;
  onCopyRadarSummary: () => void;
}

type PortfolioFilter = 'all' | 'phase1' | 'deferred';

export const AiRadarTab: React.FC<AiRadarTabProps> = ({
  preset,
  useCases,
  selectedId,
  onSelectUseCase,
  onToggleInclude,
  onUpdateUseCaseScores,
  onDeleteUseCase,
  onAddCustomUseCase,
  onClearAll,
  onRestoreDefaults,
  onCopyRadarSummary,
}) => {
  const [customName, setCustomName] = useState('');
  const [customFeas, setCustomFeas] = useState(78);
  const [customImp, setCustomImp] = useState(84);
  const [filter, setFilter] = useState<PortfolioFilter>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selectedUc = useCases.find((u) => u.id === selectedId) ?? useCases[0] ?? null;

  const filteredUseCases = useCases.filter((uc) => {
    const inPhase1 = isHighFeasibilityQuadrant(uc) && uc.included !== false;
    if (filter === 'phase1') return inPhase1;
    if (filter === 'deferred') return !inPhase1;
    return true;
  });

  const handlePlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    const f = Math.min(99, Math.max(5, Number(customFeas) || 75));
    const i = Math.min(99, Math.max(5, Number(customImp) || 80));
    onAddCustomUseCase(trimmed, f, i);
    setCustomName('');
  };

  // SVG Coordinate System
  const W = 680;
  const H = 440;
  const padL = 54;
  const padR = 24;
  const padT = 26;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const toX = (feas: number) => padL + (feas / 100) * plotW;
  const toY = (imp: number) => padT + ((100 - imp) / 100) * plotH;
  const midX = toX(50);
  const midY = toY(50);

  const toneTextColors: Record<'teal' | 'amber' | 'blue' | 'rose', string> = {
    teal: 'text-teal-700 dark:text-teal-400',
    amber: 'text-amber-700 dark:text-amber-400',
    blue: 'text-sky-700 dark:text-sky-400',
    rose: 'text-rose-700 dark:text-rose-400',
  };

  const getPinStrokeColor = (uc: UseCase) => {
    const q = getQuadrantMeta(uc.feas, uc.imp);
    if (isHighFeasibilityQuadrant(uc) && uc.included === false) {
      return '#64748b';
    }
    if (q.tone === 'teal') return '#0d9488';
    if (q.tone === 'amber') return '#d97706';
    if (q.tone === 'blue') return '#0284c7';
    return '#e11d48';
  };

  const includedCount = useCases.filter((u) => isHighFeasibilityQuadrant(u) && u.included !== false).length;

  const clientToScores = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const svgY = ((clientY - rect.top) / rect.height) * H;
    const rawFeas = Math.round(((svgX - padL) / plotW) * 100);
    const rawImp = Math.round(100 - ((svgY - padT) / plotH) * 100);
    return {
      feas: Math.min(99, Math.max(5, rawFeas)),
      imp: Math.min(99, Math.max(5, rawImp)),
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 print:block print:space-y-4 gap-6 items-start">
        {/* Left 7 Columns: 2x2 Matrix + Custom Use-Case Builder */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                    AI Radar 2.0: Feasibility &amp; Data Maturity vs. Strategic Impact
                  </h2>
                  <InfoTooltip
                    label="AI Radar 2.0 Matrix"
                    description="Drag any pin across quadrants to re-score Feasibility & Impact live. Both Top-Right Immediate Funding (≥50F/≥50I) and Bottom-Right Quick Wins (RAG/FAQ ≥50F) are eligible for Hybrid POV & Phase 1 SOW."
                    tcoImpact="Pins dragged below 50 Feasibility automatically defer to Phase 2+, removing PS overruns from Phase 1 HLEE."
                    placement="bottom"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {preset.name} · {useCases.length} plotted ({includedCount} in Phase 1 / Hybrid SOW) · Drag pins to re-score
                </p>
              </div>
              <div className="no-print flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClearAll}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/40 whitespace-nowrap cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={onRestoreDefaults}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reload Defaults
                </button>
              </div>
            </div>

            {/* Interactive SVG 2x2 Matrix */}
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="block w-full h-auto select-none touch-none"
                role="img"
                aria-label="AI Radar 2.0 2x2 use case prioritization matrix"
              >
                {/* Top-Right Phase 1 Funding Zone */}
                <rect
                  x={midX}
                  y={padT}
                  width={padL + plotW - midX}
                  height={midY - padT}
                  className="fill-teal-500/8 dark:fill-teal-400/10"
                />
                {/* Bottom-Right Quick Wins (Hybrid-Eligible High Feasibility) */}
                <rect
                  x={midX}
                  y={midY}
                  width={padL + plotW - midX}
                  height={padT + plotH - midY}
                  className="fill-sky-500/6 dark:fill-sky-400/8"
                />
                {/* Top-Left Training Wheels Zone */}
                <rect
                  x={padL}
                  y={padT}
                  width={midX - padL}
                  height={midY - padT}
                  className="fill-amber-500/5 dark:fill-amber-400/5"
                />

                {/* Gridlines */}
                {[25, 75].map((tick) => (
                  <g key={tick}>
                    <line
                      x1={toX(tick)}
                      y1={padT}
                      x2={toX(tick)}
                      y2={padT + plotH}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="1"
                    />
                    <line
                      x1={padL}
                      y1={toY(tick)}
                      x2={padL + plotW}
                      y2={toY(tick)}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Outer Border */}
                <rect
                  x={padL}
                  y={padT}
                  width={plotW}
                  height={plotH}
                  fill="none"
                  className="stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="1"
                />

                {/* 50 / 50 Midpoint Dividers */}
                <line
                  x1={midX}
                  y1={padT}
                  x2={midX}
                  y2={padT + plotH}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <line
                  x1={padL}
                  y1={midY}
                  x2={padL + plotW}
                  y2={midY}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Quadrant Headers */}
                <text
                  x={midX + 12}
                  y={padT + 18}
                  className="fill-teal-700 dark:fill-teal-400 text-[11px] font-bold"
                >
                  Phase 1 Immediate Funding (≥50F, ≥50I)
                </text>
                <text
                  x={padL + 12}
                  y={padT + 18}
                  className="fill-amber-700 dark:fill-amber-400 text-[11px] font-semibold"
                >
                  Phase 2 Training Wheels (HITL)
                </text>
                <text
                  x={midX + 12}
                  y={padT + plotH - 10}
                  className="fill-sky-700 dark:fill-sky-400 text-[11px] font-medium"
                >
                  Quick Wins · Hybrid-Eligible (RAG / FAQ ≥50F)
                </text>
                <text
                  x={padL + 12}
                  y={padT + plotH - 10}
                  className="fill-slate-500 dark:fill-slate-400 text-[11px] font-medium"
                >
                  Defer / Deprioritize
                </text>

                {/* Axis Titles */}
                <text
                  x={padL + plotW / 2}
                  y={H - 12}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-400 text-[11px] font-semibold"
                >
                  Feasibility &amp; Backend API / Data Maturity (0–100) →
                </text>
                <text
                  x={16}
                  y={padT + plotH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 16 ${padT + plotH / 2})`}
                  className="fill-slate-600 dark:fill-slate-400 text-[11px] font-semibold"
                >
                  Financial &amp; CX Impact (0–100) →
                </text>

                {/* Plotted Use Case Nodes */}
                {useCases.map((uc, idx) => {
                  const cx = toX(uc.feas);
                  const cy = toY(uc.imp);
                  const isSelected = selectedUc?.id === uc.id;
                  const isHovered = hoveredId === uc.id;
                  const inHighFeas = isHighFeasibilityQuadrant(uc);
                  const isExcluded = inHighFeas && uc.included === false;
                  const color = getPinStrokeColor(uc);
                  const alignRight = uc.feas > 74;
                  const labelX = alignRight ? cx - 12 : cx + 12;
                  const anchor = alignRight ? 'end' : 'start';
                  const shortLabel = uc.name.length > 26 ? `${uc.name.slice(0, 24)}…` : uc.name;

                  const isDraggingThis = draggingId === uc.id;

                  return (
                    <g
                      key={uc.id}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDraggingId(uc.id);
                        onSelectUseCase(uc.id);
                      }}
                      onPointerMove={(e) => {
                        if (draggingId !== uc.id) return;
                        const nextScores = clientToScores(e.clientX, e.clientY);
                        if (nextScores && (nextScores.feas !== uc.feas || nextScores.imp !== uc.imp)) {
                          onUpdateUseCaseScores(uc.id, nextScores.feas, nextScores.imp);
                        }
                      }}
                      onPointerUp={(e) => {
                        if (draggingId === uc.id) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                          setDraggingId(null);
                        }
                      }}
                      onPointerCancel={() => {
                        if (draggingId === uc.id) setDraggingId(null);
                      }}
                      onMouseEnter={() => setHoveredId(uc.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
                      opacity={isExcluded ? 0.5 : 1}
                    >
                      {isSelected && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={14}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected || isHovered || isDraggingThis ? 8.5 : 7}
                        fill={color}
                        className="stroke-white dark:stroke-slate-900"
                        strokeWidth="2"
                      />
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        className="fill-white text-[8.5px] font-mono font-bold pointer-events-none"
                      >
                        {idx + 1}
                      </text>
                      <text
                        x={labelX}
                        y={cy + 3.5}
                        textAnchor={anchor}
                        className={`text-[10.5px] pointer-events-none ${
                          isSelected
                            ? 'fill-slate-900 dark:fill-slate-50 font-bold'
                            : 'fill-slate-700 dark:fill-slate-300 font-medium'
                        }`}
                      >
                        {isDraggingThis ? `${shortLabel} (${uc.feas}F/${uc.imp}I)` : shortLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Plot Custom Prospect Use Case Live */}
          <section className="no-print rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                Plot Custom Prospect Use Case Live
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add client-specific call drivers during live discovery workshops
              </p>
            </div>

            <form onSubmit={handlePlotSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <label
                    htmlFor="inpCustomUcName"
                    className="text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Use Case Name
                  </label>
                  <InfoTooltip
                    label="Custom Use Case Name"
                    description="Adds a prospect-specific call driver to the AI Radar 2.0 portfolio during live discovery."
                    tcoImpact="Top-Right placements immediately expand Phase 1 SOW scope and drive the containment lift behind your TCO savings."
                  />
                </div>
                <input
                  id="inpCustomUcName"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Smart Meter Outage Callback"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-1 mb-1">
                  <label
                    htmlFor="inpCustomUcFeas"
                    className="text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Feasibility
                  </label>
                  <InfoTooltip
                    label="Feasibility & Data Score (0–100)"
                    description="Measures backend API readiness, transcript availability, and integration complexity."
                    tcoImpact="Scores ≥50 qualify for Phase 1 SOW (≥75F = +2 PS days; 50–74F = +3 PS days). Scores <50 defer to Phase 2 to protect PS margins."
                    align="center"
                  />
                </div>
                <input
                  id="inpCustomUcFeas"
                  type="number"
                  min={5}
                  max={99}
                  value={customFeas}
                  onChange={(e) => setCustomFeas(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-1 mb-1">
                  <label
                    htmlFor="inpCustomUcImp"
                    className="text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Impact
                  </label>
                  <InfoTooltip
                    label="Financial & CX Impact (0–100)"
                    description="Estimates inbound call-volume share, AHT savings, and customer experience upside."
                    tcoImpact="Scores ≥50 paired with ≥50 Feasibility place the driver in Immediate Funding—unlocking TCO savings in Phase 1."
                    align="right"
                  />
                </div>
                <input
                  id="inpCustomUcImp"
                  type="number"
                  min={5}
                  max={99}
                  value={customImp}
                  onChange={(e) => setCustomImp(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Plot
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right 5 Columns: Inspector + Portfolio List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Runtime & Rollout Inspector */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Runtime &amp; Rollout Inspector</span>
                <InfoTooltip
                  label="Runtime & Rollout Inspector"
                  description="Shows the selected intent's Omilia Runtime Tier, Phased 'Training Wheels' rollout steps, and mandatory Glass Box & HITL governance gates."
                  tcoImpact="High-Feasibility intents (Top-Right + Bottom-Right) toggle directly in/out of Phase 1 SOW and Hybrid POV plans."
                  placement="bottom"
                />
              </div>
              {selectedUc && (
                <div className="no-print flex items-center gap-2">
                  {isHighFeasibilityQuadrant(selectedUc) && (
                    <button
                      type="button"
                      onClick={() => onToggleInclude(selectedUc.id)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        selectedUc.included !== false
                          ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {selectedUc.included !== false ? 'Included in Phase 1 / Hybrid' : 'Excluded (Click to Include)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteUseCase(selectedUc.id)}
                    aria-label={`Delete ${selectedUc.name}`}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {selectedUc ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className={`font-semibold ${toneTextColors[getQuadrantMeta(selectedUc.feas, selectedUc.imp).tone]}`}>
                      {getQuadrantMeta(selectedUc.feas, selectedUc.imp).label}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      Feasibility {selectedUc.feas}/100 · Impact {selectedUc.imp}/100
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
                    {selectedUc.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {selectedUc.desc}
                  </p>
                </div>

                {/* Live Score Sliders (Synced with Pin Dragging & HLEE Scoping) */}
                <div className="no-print grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        Feasibility
                        <InfoTooltip
                          label="Live Feasibility Rescore"
                          description="Move slider or drag pin horizontally. Crossing ≥50F & ≥50I moves driver into Phase 1 SOW and updates HLEE PS Days."
                          tcoImpact="Scores ≥75F reduce delivery complexity (+2 PS Days vs. +3 PS Days for 50–74F)."
                        />
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {selectedUc.feas}
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label={`Feasibility score for ${selectedUc.name}`}
                      min={5}
                      max={99}
                      value={selectedUc.feas}
                      onChange={(e) =>
                        onUpdateUseCaseScores(selectedUc.id, Number(e.target.value), selectedUc.imp)
                      }
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        Impact
                        <InfoTooltip
                          label="Live Impact Rescore"
                          description="Move slider or drag pin vertically to re-evaluate call volume and CX upside during discovery."
                          tcoImpact="High-impact drivers placed in Immediate Funding prioritize containment capture in Phase 1."
                          align="right"
                        />
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {selectedUc.imp}
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label={`Impact score for ${selectedUc.name}`}
                      min={5}
                      max={99}
                      value={selectedUc.imp}
                      onChange={(e) =>
                        onUpdateUseCaseScores(selectedUc.id, selectedUc.feas, Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <dl className="divide-y divide-slate-100 border-t border-slate-100 text-xs dark:divide-slate-800 dark:border-slate-800">
                  <div className="py-3">
                    <dt className="font-semibold text-teal-700 dark:text-teal-400 mb-1">
                      Recommended Omilia Runtime Tier
                    </dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{selectedUc.runtime}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phased &ldquo;Training Wheels&rdquo; Rollout Plan
                    </dt>
                    <dd className="leading-relaxed text-slate-600 dark:text-slate-400">{selectedUc.rollout}</dd>
                  </div>
                  <div className="pt-3">
                    <dt className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      Glass Box &amp; HITL Governance Gate
                    </dt>
                    <dd className="leading-relaxed text-slate-600 dark:text-slate-400">{selectedUc.gov}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Use Cases Plotted</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add a custom prospect use case on the left or reload the {preset.shortName} defaults.
                </p>
                <button
                  type="button"
                  onClick={onRestoreDefaults}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reload Default Use Cases
                </button>
              </div>
            )}
          </section>

          {/* Vertical Use-Case Portfolio List — hidden in print because Complete Discovery Specifications table below prints all items unclipped */}
          <section className="no-print rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                    Vertical Use-Case Portfolio
                  </h3>
                  <InfoTooltip
                    label="Phase 1 / Hybrid SOW Checkboxes"
                    description="Checkboxes toggle whether High-Feasibility drivers (Top-Right Immediate Funding + Bottom-Right Quick Wins, ≥50F) are included in Phase 1 & Hybrid POV scope."
                    tcoImpact="Including high-feasibility Top-Right and Bottom-Right intents accelerates Day-1 deflection and feeds POV / Phase 1 PS Days."
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {useCases.length} intents · {includedCount} scoped in Phase 1 / Hybrid
                </p>
              </div>

              <div className="no-print inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-950">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'phase1', label: 'Phase 1 / Hybrid' },
                    { key: 'deferred', label: 'Phase 2+' },
                  ] as { key: PortfolioFilter; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      filter === tab.key
                        ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUseCases.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No use cases match the current filter.
                </div>
              ) : (
                filteredUseCases.map((uc) => {
                  const inHighFeas = isHighFeasibilityQuadrant(uc);
                  const isIncluded = inHighFeas && uc.included !== false;
                  const isSelected = selectedUc?.id === uc.id;
                  const q = getQuadrantMeta(uc.feas, uc.imp);

                  return (
                    <div
                      key={uc.id}
                      onClick={() => onSelectUseCase(uc.id)}
                      className={`flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-teal-50/80 dark:bg-teal-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {inHighFeas ? (
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            aria-label={`Include ${uc.name} in Phase 1 SOW`}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => onToggleInclude(uc.id)}
                            className="h-3.5 w-3.5 rounded accent-teal-600 cursor-pointer shrink-0"
                          />
                        ) : (
                          <span
                            className="w-3.5 text-center text-[11px] text-slate-400 shrink-0"
                            title="Feasibility <50 (Phase 2/3)"
                          >
                            —
                          </span>
                        )}
                        <span
                          className={`truncate text-xs font-medium ${
                            inHighFeas && !isIncluded
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {uc.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-mono text-[11px] tabular-nums font-medium ${toneTextColors[q.tone]}`}>
                          {uc.feas}F / {uc.imp}I
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUseCase(uc.id);
                          }}
                          aria-label={`Delete ${uc.name}`}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="no-print mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Export PDF
              </button>
              <button
                type="button"
                onClick={onCopyRadarSummary}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Summary
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Print-Only Complete Matrix */}
      <section className="print-only print:break-before-page rounded-xl border border-slate-300 bg-white p-5">
        <h3 className="font-display text-sm font-bold text-slate-900">
          AI Radar 2.0 — Complete Discovery Specifications ({preset.name})
        </h3>
        <table className="mt-3 w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600">
              <th className="py-2 pr-4">Use Case &amp; Scope Status</th>
              <th className="py-2 pr-4">Scores &amp; Quadrant</th>
              <th className="py-2 pr-4">Recommended Runtime Tier</th>
              <th className="py-2">Rollout &amp; Governance Gate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {useCases.map((uc) => {
              const q = getQuadrantMeta(uc.feas, uc.imp);
              const isHighFeas = isHighFeasibilityQuadrant(uc);
              const status =
                isHighFeas && uc.included !== false
                  ? 'Phase 1 / Hybrid SOW Included'
                  : isHighFeas
                  ? 'High-Feasibility (Excluded)'
                  : 'Phase 2/3';
              return (
                <tr key={uc.id}>
                  <td className="py-2 pr-4 font-medium">
                    {uc.name}
                    <div className="text-[11px] text-slate-500">{status}</div>
                  </td>
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {uc.feas}F / {uc.imp}I · {q.label}
                  </td>
                  <td className="py-2 pr-4">{uc.runtime}</td>
                  <td className="py-2 text-[11px] text-slate-600">
                    <div>{uc.rollout}</div>
                    <div className="mt-0.5 text-slate-500">{uc.gov}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};
