import PptxGenJS from 'pptxgenjs';
import {
  ApiReadiness,
  DealMetadata,
  PartnerMotion,
  PovConfig,
  SovereigntyTier,
  UseCase,
  VerticalPreset,
} from '../data/verticalPresets';
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  getQuadrantMeta,
  getUseCasePsDays,
  HleeResult,
  isHighFeasibilityQuadrant,
  isTopRightQuadrant,
  PaybackAnalysis,
  PovPlanResult,
  RoiInputs,
  RoiResults,
  SensitivityScenario,
} from './calculations';

export interface ExportDeckParams {
  preset: VerticalPreset;
  inputs: RoiInputs;
  results: RoiResults;
  useCases: UseCase[];
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  hlee: HleeResult;
  psDayRate: number;
  payback: PaybackAnalysis;
  sensitivity: SensitivityScenario[];
  dealMeta: DealMetadata;
  motionLabel: string;
  sovereigntyLabel: string;
  povConfig: PovConfig;
  povPlan: PovPlanResult;
}

const C = {
  navy: '0F172A',
  navyMid: '1E293B',
  slateText: '334155',
  muted: '64748B',
  border: 'CBD5E1',
  borderLight: 'E2E8F0',
  bgLight: 'F8FAFC',
  white: 'FFFFFF',
  tealDark: '0F766E',
  teal: '0D9488',
  tealBg: 'F0FDFA',
  tealBorder: '99F6E4',
  emerald: '059669',
  rose: 'BE123C',
  roseBg: 'FFF1F2',
  roseBorder: 'FECDD3',
  amber: 'B45309',
  amberBg: 'FFFBEB',
};

const FONT = 'Aptos';
const MONO = 'Consolas';

function addSlideChrome(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  eyebrow: string,
  title: string,
  subtitle: string,
  slideNum: number,
  totalSlides: number,
  footerTag: string
) {
  slide.background = { color: C.white };

  // Top hairline teal rule
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.06,
    fill: { color: C.tealDark },
    line: { color: C.tealDark, width: 0 },
  });

  // Eyebrow
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.6,
    y: 0.24,
    w: 9.5,
    h: 0.24,
    fontFace: MONO,
    fontSize: 9,
    bold: true,
    color: C.tealDark,
    margin: 0,
  });

  // Main Title
  slide.addText(title, {
    x: 0.6,
    y: 0.48,
    w: 11.6,
    h: 0.42,
    fontFace: FONT,
    fontSize: 22,
    bold: true,
    color: C.navy,
    margin: 0,
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.6,
    y: 0.92,
    w: 12.1,
    h: 0.28,
    fontFace: FONT,
    fontSize: 11,
    color: C.muted,
    margin: 0,
  });

  // Header divider line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 1.25,
    w: 12.13,
    h: 0,
    line: { color: C.borderLight, width: 1 },
  });

  // Footer divider & caption
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 7.05,
    w: 12.13,
    h: 0,
    line: { color: C.borderLight, width: 0.75 },
  });

  slide.addText(footerTag, {
    x: 0.6,
    y: 7.12,
    w: 9.5,
    h: 0.24,
    fontFace: FONT,
    fontSize: 8.5,
    color: C.muted,
    margin: 0,
  });

  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: 11.5,
    y: 7.12,
    w: 1.23,
    h: 0.24,
    align: 'right',
    fontFace: MONO,
    fontSize: 8.5,
    color: C.muted,
    margin: 0,
  });
}

export async function downloadValuePropDeck(params: ExportDeckParams): Promise<string> {
  const {
    preset,
    inputs,
    results,
    useCases,
    partnerMotion,
    sovereignty,
    apiReadiness,
    hlee,
    psDayRate,
    payback,
    sensitivity,
    dealMeta,
    motionLabel,
    sovereigntyLabel,
    povConfig,
    povPlan,
  } = params;

  const comp = results.competitorProfile;
  const includedUseCases = useCases.filter((uc) => isTopRightQuadrant(uc) && uc.included !== false);
  const deferredCount = useCases.length - includedUseCases.length;

  const maxParallelMs = Math.max(...preset.mcpSystems.map((s) => s.ms));
  const lexisTtsMs = 42;
  const totalOmiliaMs = maxParallelMs + lexisTtsMs;
  const backendSeqMs = preset.mcpSystems.reduce((acc, s) => acc + s.ms, 0);
  const externalAsrMs = comp.key === 'byollm' ? 380 : 520;
  const orchestratorLlmMs = comp.key === 'byollm' ? 890 : 1420;
  const externalTtsMs = comp.key === 'byollm' ? 320 : 410;
  const seqSumMs = externalAsrMs + orchestratorLlmMs + backendSeqMs + externalTtsMs;

  const prospectTitle = dealMeta.prospectName.trim() || `${preset.shortName} Enterprise Account`;
  const partnerTitle = dealMeta.partnerName.trim() || 'Partner Delivery Team';
  const ccaasTitle = dealMeta.ccaasPlatform.trim() || 'Enterprise CCaaS (Neutral)';
  const ownerTitle = dealMeta.dealOwner.trim() || 'Partner Architect';
  const footerTag = `Omilia Partner Workbench · ${prospectTitle} · ${preset.shortName} vs. ${comp.shortLabel}`;
  const totalSlides = 10;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
  pptx.author = ownerTitle;
  pptx.company = partnerTitle;
  pptx.subject = `Omilia Enterprise CX Value Proposition — ${preset.name}`;
  pptx.title = `${prospectTitle} — Omilia Value Proposition & Business Case`;

  // =========================================================================
  // SLIDE 1: TITLE & EXECUTIVE VALUE PROPOSITION
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.navy };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.08,
      fill: { color: C.teal },
      line: { color: C.teal, width: 0 },
    });

    slide.addText('OMILIA PARTNER WORKBENCH · CONFIGURED EXECUTIVE VALUE PROPOSITION', {
      x: 0.75,
      y: 0.68,
      w: 11.8,
      h: 0.28,
      fontFace: MONO,
      fontSize: 10.5,
      bold: true,
      color: '5EEAD4',
      margin: 0,
    });

    slide.addText(`${prospectTitle}\nAutonomous CX & Sovereign AI Business Case`, {
      x: 0.75,
      y: 1.1,
      w: 11.8,
      h: 1.5,
      fontFace: FONT,
      fontSize: 32,
      bold: true,
      color: C.white,
      margin: 0,
    });

    slide.addText(
      `Industry Vertical: ${preset.name}   |   Competitive Baseline: ${comp.title} (${comp.examples})\nGTM Motion: ${motionLabel}   |   Deployment: ${sovereigntyLabel}`,
      {
        x: 0.75,
        y: 2.75,
        w: 11.8,
        h: 0.7,
        fontFace: FONT,
        fontSize: 12.5,
        color: 'CBD5E1',
        margin: 0,
      }
    );

    const kpis = [
      {
        label: 'ANNUAL NET SAVINGS',
        val: formatCurrencyCompact(results.annualNetSavings),
        sub: `${formatCurrencyCompact(results.monthlyNetSavings)}/mo vs. Legacy`,
        accent: '5EEAD4',
      },
      {
        label: `3-YR VS. ${comp.shortLabel.toUpperCase()}`,
        val: formatCurrencyCompact(payback.threeYearCompetitorSavings),
        sub: `@ ${inputs.surge.toFixed(1)}x surge · Self-Learning`,
        accent: '34D399',
      },
      {
        label: 'BREAK-EVEN PAYBACK',
        val: payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} mos` : 'N/A',
        sub: `${formatCurrencyFull(payback.implementationCost)} (${hlee.psDays} PS Days)`,
        accent: C.white,
      },
      {
        label: 'PHASE 1 TIME-TO-VALUE',
        val: hlee.timelineLabel,
        sub: `${includedUseCases.length} Top-Right Intents · 96%+ Day-1 NLU`,
        accent: '5EEAD4',
      },
    ];

    kpis.forEach((k, i) => {
      const cardX = 0.75 + i * 3.0;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 3.9,
        w: 2.82,
        h: 1.75,
        rectRadius: 0.08,
        fill: { color: C.navyMid },
        line: { color: '334155', width: 1 },
      });
      slide.addText(k.label, {
        x: cardX + 0.18,
        y: 4.08,
        w: 2.46,
        h: 0.25,
        fontFace: MONO,
        fontSize: 8.5,
        bold: true,
        color: '94A3B8',
        margin: 0,
      });
      slide.addText(k.val, {
        x: cardX + 0.18,
        y: 4.42,
        w: 2.46,
        h: 0.55,
        fontFace: FONT,
        fontSize: 25,
        bold: true,
        color: k.accent,
        margin: 0,
      });
      slide.addText(k.sub, {
        x: cardX + 0.18,
        y: 5.05,
        w: 2.46,
        h: 0.4,
        fontFace: FONT,
        fontSize: 9.5,
        color: 'CBD5E1',
        margin: 0,
      });
    });

    slide.addShape(pptx.ShapeType.line, {
      x: 0.75,
      y: 6.25,
      w: 11.83,
      h: 0,
      line: { color: '334155', width: 1 },
    });

    slide.addText(
      `Partner: ${partnerTitle}   ·   Target CCaaS: ${ccaasTitle}   ·   Deal Owner: ${ownerTitle}\nCompliance Perimeter: ${preset.compliance.join(' · ')}`,
      {
        x: 0.75,
        y: 6.42,
        w: 11.83,
        h: 0.55,
        fontFace: FONT,
        fontSize: 10,
        color: '94A3B8',
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 1:\n` +
        `This deck was generated directly from the Omilia Partner Workbench for ${prospectTitle} (${preset.name}).\n` +
        `Key narrative: Benchmark Omilia's Vertically Integrated Sovereign Stack against both the current Legacy IVR baseline and ${comp.title} (${comp.examples}).\n` +
        `Lead with the four executive outcomes: ${formatCurrencyCompact(results.annualNetSavings)}/yr net savings, ${formatCurrencyCompact(payback.threeYearCompetitorSavings)} 3-year advantage vs. ${comp.shortLabel}, ${payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)}-month` : 'N/A'} break-even payback, and ${hlee.timelineLabel} time-to-value.`
    );
  }

  // =========================================================================
  // SLIDE 2: WHY LEGACY IVR & METERED COMPETITOR STACKS STALL
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '01 · MARKET REALITY & COMPETITIVE BASELINE',
      `Why Legacy IVR & ${comp.title} Erode Margin`,
      `Evaluated at ${inputs.callVolume.toLocaleString()} base calls/mo × ${inputs.surge.toFixed(1)}x peak surge (${Math.round(results.effectiveMonthlyCalls).toLocaleString()} effective calls/mo)`,
      2,
      totalSlides,
      footerTag
    );

    // Left Card: Legacy Baseline
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 1.5,
      w: 5.9,
      h: 4.15,
      rectRadius: 0.08,
      fill: { color: C.bgLight },
      line: { color: C.border, width: 1 },
    });
    slide.addText('STATUS QUO · LEGACY DTMF / IVR BASELINE', {
      x: 0.85,
      y: 1.7,
      w: 5.4,
      h: 0.26,
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: C.muted,
      margin: 0,
    });
    slide.addText(`${formatCurrencyCompact(results.annualLegacy)} / yr Run-Rate`, {
      x: 0.85,
      y: 2.02,
      w: 5.4,
      h: 0.42,
      fontFace: FONT,
      fontSize: 21,
      bold: true,
      color: C.navy,
      margin: 0,
    });
    slide.addText(
      [
        {
          text: `• Low Containment (${Math.round(results.baseCont * 100)}%): `,
          options: { bold: true, color: C.navy },
        },
        {
          text: `${Math.round(100 - results.baseCont * 100)}% of calls still escalate to live agents at $${results.unitHumanCost.toFixed(2)} loaded cost per call.`,
          options: { color: C.slateText },
        },
      ],
      { x: 0.85, y: 2.6, w: 5.4, h: 0.62, fontFace: FONT, fontSize: 11, margin: 0 }
    );
    slide.addText(
      [
        {
          text: `• Escalation Tax: `,
          options: { bold: true, color: C.navy },
        },
        {
          text: `${formatCurrencyFull(results.legacyHumanCostMo)}/mo in live labor spend with zero TalkGuard KBA compression or CSR CoPilot auto-wrap.`,
          options: { color: C.slateText },
        },
      ],
      { x: 0.85, y: 3.3, w: 5.4, h: 0.62, fontFace: FONT, fontSize: 11, margin: 0 }
    );
    slide.addText(
      [
        {
          text: `• Surge Fragility: `,
          options: { bold: true, color: C.navy },
        },
        {
          text: `During ${inputs.surge.toFixed(1)}x seasonal/outage surges, queue abandonment spikes because rigid touch-tone menus cannot reason across multi-step intents.`,
          options: { color: C.slateText },
        },
      ],
      { x: 0.85, y: 4.0, w: 5.4, h: 0.72, fontFace: FONT, fontSize: 11, margin: 0 }
    );

    // Right Card: Selected Competitor Baseline
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.83,
      y: 1.5,
      w: 5.9,
      h: 4.15,
      rectRadius: 0.08,
      fill: { color: C.roseBg },
      line: { color: C.roseBorder, width: 1 },
    });
    slide.addText(`COMPETITOR BASELINE · ${comp.examples.toUpperCase()}`, {
      x: 7.08,
      y: 1.7,
      w: 5.4,
      h: 0.26,
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: C.rose,
      margin: 0,
    });
    slide.addText(
      `${formatCurrencyCompact(results.annualDiy)} / yr (${comp.setupRangeLabel} Setup)`,
      {
        x: 7.08,
        y: 2.02,
        w: 5.4,
        h: 0.42,
        fontFace: FONT,
        fontSize: 19,
        bold: true,
        color: C.rose,
        margin: 0,
      }
    );
    slide.addText(
      [
        {
          text: `• Commercial Volatility: `,
          options: { bold: true, color: C.navy },
        },
        {
          text: comp.commercialSummary,
          options: { color: C.slateText },
        },
      ],
      { x: 7.08, y: 2.58, w: 5.4, h: 0.92, fontFace: FONT, fontSize: 10.5, margin: 0 }
    );
    slide.addText(
      [
        {
          text: `• Architectural Friction: `,
          options: { bold: true, color: C.navy },
        },
        {
          text: comp.architectureSummary,
          options: { color: C.slateText },
        },
      ],
      { x: 7.08, y: 3.55, w: 5.4, h: 0.92, fontFace: FONT, fontSize: 10.5, margin: 0 }
    );
    slide.addText(
      [
        {
          text: `• Effective Variable Unit Rate @ ${inputs.surge.toFixed(1)}x Surge: `,
          options: { bold: true, color: C.rose },
        },
        {
          text: `$${results.diyPerCallVariableRate.toFixed(2)}/call + ${comp.maintenanceTaxLabel} (${Math.round(results.diyContainment * 100)}% eff. containment).`,
          options: { color: C.navy },
        },
      ],
      { x: 7.08, y: 4.55, w: 5.4, h: 0.72, fontFace: FONT, fontSize: 10.5, margin: 0 }
    );

    // Bottom Executive Callout
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 5.85,
      w: 12.13,
      h: 0.95,
      rectRadius: 0.08,
      fill: { color: C.tealBg },
      line: { color: C.tealBorder, width: 1 },
    });
    slide.addText(
      `WHY THIS BASELINE MATTERS: ${comp.shortLabel} forces CFOs to absorb both ${comp.setupRangeLabel} upfront (${comp.timeToValueLabel} time-to-value) AND unbounded variable metering (${comp.turnLatencyLabel}, ${comp.egressLabel}). Omilia eliminates multi-vendor tax while hitting ${Math.round(results.targetCont * 100)}% blended containment.`,
      {
        x: 0.85,
        y: 6.02,
        w: 11.65,
        h: 0.62,
        fontFace: FONT,
        fontSize: 10.5,
        bold: false,
        color: C.navy,
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 2:\n` +
        `Use this slide to reframe the competitive conversation away from generic "AI chatbot" comparisons.\n` +
        `• In the workbench, we switched the Competitor Architecture Baseline to "${comp.title}" (${comp.examples}).\n` +
        `• Walk the prospect through the hidden commercial & technical taxes: metered pass-through LLM/ASR/TTS fees (or 40% schema-drift maintenance for DIY Hyperscaler stacks), multi-hop latency above the 1,200ms caller hang-up threshold, and CCaaS ecosystem lock-in.`
    );
  }

  // =========================================================================
  // SLIDE 3: OMILIA VERTICALLY INTEGRATED SOVEREIGN STACK
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '02 · OMILIA VALUE PROPOSITION',
      'Vertically Integrated Sovereign Stack vs. Multi-Vendor Chains',
      'Single-vendor acoustic ASR, deterministic + agentic NLU, Lexis neural TTS, and TalkGuard biometrics inside one perimeter',
      3,
      totalSlides,
      footerTag
    );

    const pillars = [
      {
        tag: 'LATENCY SLA',
        title: 'Sub-1s Voice Latency (<45ms Lexis TTS)',
        body: `Native 8kHz telephony ASR + parallel MCP tool calls + <45ms Lexis TTS deliver ${totalOmiliaMs}ms turns vs. ${comp.turnLatencyLabel} on ${comp.shortLabel}.`,
        metric: `${totalOmiliaMs}ms vs. ${seqSumMs}ms`,
      },
      {
        tag: 'DATA SOVEREIGNTY',
        title: 'Zero Third-Party Data Egress',
        body: `No prompts, PII, or PCI transcripts leave your certified perimeter (${preset.compliance.slice(0, 3).join(', ')}, FedRAMP-ready) vs. ${comp.egressLabel}.`,
        metric: 'Zero Frontier Egress',
      },
      {
        tag: 'FRAUD & KBA SHIELD',
        title: 'Native TalkGuard Passive Biometrics',
        body: `Authenticates callers passively in the background and blocks deepfake voice cloning—saving ${preset.roi.talkguardSec}s per escalated call with zero separate vendor license.`,
        metric: `-${preset.roi.talkguardSec}s Escalated KBA`,
      },
      {
        tag: 'PORTABILITY',
        title: '100% CCaaS Neutrality & Portability',
        body: `Certified native SIP/UUI connectors across Genesys Cloud, NICE CXone, AWS Connect, and RingCentral—zero ${comp.ecosystemLabel.toLowerCase()}.`,
        metric: 'Zero CCaaS Lock-In',
      },
    ];

    pillars.forEach((p, i) => {
      const cardX = 0.6 + i * 3.1;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 1.5,
        w: 2.9,
        h: 3.65,
        rectRadius: 0.08,
        fill: { color: C.white },
        line: { color: C.border, width: 1 },
      });
      slide.addText(p.tag, {
        x: cardX + 0.18,
        y: 1.72,
        w: 2.54,
        h: 0.24,
        fontFace: MONO,
        fontSize: 8.5,
        bold: true,
        color: C.tealDark,
        margin: 0,
      });
      slide.addText(p.title, {
        x: cardX + 0.18,
        y: 2.02,
        w: 2.54,
        h: 0.62,
        fontFace: FONT,
        fontSize: 13,
        bold: true,
        color: C.navy,
        margin: 0,
      });
      slide.addText(p.body, {
        x: cardX + 0.18,
        y: 2.75,
        w: 2.54,
        h: 1.65,
        fontFace: FONT,
        fontSize: 10.5,
        color: C.slateText,
        margin: 0,
      });
      slide.addShape(pptx.ShapeType.line, {
        x: cardX + 0.18,
        y: 4.55,
        w: 2.54,
        h: 0,
        line: { color: C.borderLight, width: 0.75 },
      });
      slide.addText(p.metric, {
        x: cardX + 0.18,
        y: 4.68,
        w: 2.54,
        h: 0.3,
        fontFace: MONO,
        fontSize: 10,
        bold: true,
        color: C.emerald,
        margin: 0,
      });
    });

    // Bottom Commercial Model Bar
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 5.4,
      w: 12.13,
      h: 1.38,
      rectRadius: 0.08,
      fill: { color: C.navy },
      line: { color: C.navy, width: 0 },
    });
    slide.addText('COMMERCIAL & TIME-TO-VALUE ENGINE: OUTCOME PRICING + AI BOOTSTRAPPING', {
      x: 0.85,
      y: 5.58,
      w: 11.6,
      h: 0.24,
      fontFace: MONO,
      fontSize: 9,
      bold: true,
      color: '5EEAD4',
      margin: 0,
    });
    slide.addText(
      `• Outcome-Based Commercials: Flat $${inputs.omiliaOutcomeRate.toFixed(2)}/resolved interaction in Year 1 (compressing to $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)} by Year 3 via Offline Self-Learning) with zero token, ASR, or TTS pass-through fees.\n• AI Bootstrapping (96%+ Day-1 NLU / 90%+ Task Resolution): Generates production dialogs directly from historical call transcripts & OpenAPI specs—going live in ${hlee.timelineLabel} vs. ${comp.timeToValueLabel}.`,
      {
        x: 0.85,
        y: 5.9,
        w: 11.6,
        h: 0.75,
        fontFace: FONT,
        fontSize: 10.5,
        color: 'E2E8F0',
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 3:\n` +
        `This slide connects Omilia's technical architecture directly to CFO & CTO buying criteria.\n` +
        `Emphasize the "Vertically Integrated" difference: competitors stitch together 3–5 separate vendors (CCaaS + Orchestrator + External ASR + Frontier LLM + External TTS), multiplying latency, egress, and usage fees. Omilia delivers one sovereign stack.`
    );
  }

  // =========================================================================
  // SLIDE 4: CONFIGURED UNIT ECONOMICS & ANNUALIZED TCO SUMMARY
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '03 · UNIT ECONOMICS & TCO COMPARISON',
      `Annualized & 3-Year TCO Impact — ${preset.shortName}`,
      `Loaded Human Unit Cost: $${results.unitHumanCost.toFixed(2)}/call ${
        inputs.cfoOverride
          ? '(Direct CFO Override)'
          : `($${inputs.wage}/hr · ${inputs.burden}% burden · ${inputs.occupancy}% occ · ${inputs.aht}s AHT + ${inputs.acw}s ACW)`
      }`,
      4,
      totalSlides,
      footerTag
    );

    // Left: Native Bar Chart comparing Annualized Year 1 Spend ($M)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 1.48,
      w: 5.4,
      h: 5.25,
      rectRadius: 0.08,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
    });
    slide.addText('Annualized Yr-1 Run-Rate TCO ($M)', {
      x: 0.82,
      y: 1.66,
      w: 4.9,
      h: 0.3,
      fontFace: FONT,
      fontSize: 12,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    slide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: 'Annual Platform & AI Spend ($M)',
          labels: ['Legacy Baseline', comp.tableHeader, 'Omilia Sovereign'],
          values: [
            Number((results.legacyPlatformSpendMo * 12 / 1_000_000).toFixed(2)),
            Number((results.diyPlatformSpendMo * 12 / 1_000_000).toFixed(2)),
            Number((results.omiliaPlatformSpendMo * 12 / 1_000_000).toFixed(2)),
          ],
        },
        {
          name: 'Residual Agent Labor ($M)',
          labels: ['Legacy Baseline', comp.tableHeader, 'Omilia Sovereign'],
          values: [
            Number((results.legacyHumanCostMo * 12 / 1_000_000).toFixed(2)),
            Number((results.diyHumanCostMo * 12 / 1_000_000).toFixed(2)),
            Number((results.omiliaHumanCostMo * 12 / 1_000_000).toFixed(2)),
          ],
        },
      ],
      {
        x: 0.78,
        y: 2.05,
        w: 5.05,
        h: 4.45,
        barDir: 'col',
        barGrouping: 'stacked',
        chartColors: [C.tealDark, '64748B'],
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 9,
        valAxisLabelFormatCode: '$#,##0.0"M"',
        valAxisLabelFontSize: 9,
        catAxisLabelFontSize: 9.5,
        showValue: true,
        dataLabelFormatCode: '$#,##0.00"M"',
        dataLabelFontSize: 8.5,
        dataLabelColor: C.white,
        valGridLine: { color: C.borderLight, size: 0.5 },
      }
    );

    // Right: CFO Comparison Table + Clarifying Footnote
    const tableRows: PptxGenJS.TableRow[] = [
      [
        {
          text: 'Financial / Architectural Metric',
          options: { bold: true, fill: { color: C.bgLight }, color: C.navy },
        },
        {
          text: 'Legacy IVR',
          options: { bold: true, align: 'right', fill: { color: C.bgLight }, color: C.muted },
        },
        {
          text: comp.tableHeader,
          options: { bold: true, align: 'right', fill: { color: C.bgLight }, color: C.rose },
        },
        {
          text: 'Omilia Sovereign',
          options: { bold: true, align: 'right', fill: { color: C.tealBg }, color: C.tealDark },
        },
      ],
      [
        { text: 'Upfront PS / Build & Time-to-Value', options: { bold: true } },
        { text: '$0 (Sunk)', options: { align: 'right', fontFace: MONO } },
        {
          text: `${formatCurrencyCompact(payback.competitorSetupCost)}\n(${comp.timeToValueLabel})`,
          options: { align: 'right', fontFace: MONO, color: C.rose },
        },
        {
          text: `${formatCurrencyFull(payback.implementationCost)}\n(${hlee.timelineLabel})`,
          options: { align: 'right', fontFace: MONO, bold: true, color: C.tealDark },
        },
      ],
      [
        { text: 'Effective Containment Rate', options: { bold: true } },
        { text: `${Math.round(results.baseCont * 100)}%`, options: { align: 'right', fontFace: MONO } },
        {
          text: `${Math.round(results.diyContainment * 100)}% (latency drop)`,
          options: { align: 'right', fontFace: MONO },
        },
        {
          text: `${Math.round(results.targetCont * 100)}% Blended\n(90%+ Task Res / 96%+ NLU)`,
          options: { align: 'right', fontFace: MONO, bold: true, color: C.tealDark },
        },
      ],
      [
        { text: 'Monthly Platform, Metering & Maint.', options: { bold: true } },
        { text: formatCurrencyFull(results.legacyPlatformSpendMo), options: { align: 'right', fontFace: MONO } },
        {
          text: formatCurrencyFull(results.diyPlatformSpendMo),
          options: { align: 'right', fontFace: MONO, color: C.rose },
        },
        {
          text: formatCurrencyFull(results.omiliaPlatformSpendMo),
          options: { align: 'right', fontFace: MONO, bold: true, color: C.tealDark },
        },
      ],
      [
        { text: 'Residual Human Escalation / mo', options: { bold: true } },
        { text: formatCurrencyFull(results.legacyHumanCostMo), options: { align: 'right', fontFace: MONO } },
        { text: formatCurrencyFull(results.diyHumanCostMo), options: { align: 'right', fontFace: MONO } },
        { text: formatCurrencyFull(results.omiliaHumanCostMo), options: { align: 'right', fontFace: MONO } },
      ],
      [
        { text: '3-Year Cumulative Total Spend', options: { bold: true, fill: { color: C.bgLight } } },
        {
          text: formatCurrencyCompact(payback.threeYearLegacyTotal),
          options: { align: 'right', fontFace: MONO, bold: true, fill: { color: C.bgLight } },
        },
        {
          text: formatCurrencyCompact(payback.threeYearDiyTotal),
          options: { align: 'right', fontFace: MONO, bold: true, color: C.rose, fill: { color: C.bgLight } },
        },
        {
          text: formatCurrencyCompact(payback.threeYearOmiliaTotal),
          options: { align: 'right', fontFace: MONO, bold: true, color: C.emerald, fill: { color: C.tealBg } },
        },
      ],
      [
        { text: 'Latency, Egress & Lock-In', options: { bold: true } },
        { text: 'Legacy IVR', options: { align: 'right' } },
        {
          text: `${comp.turnLatencyLabel}\n${comp.egressLabel}`,
          options: { align: 'right', color: C.rose },
        },
        {
          text: '<1s (<45ms Lexis)\nZero Egress · Neutral',
          options: { align: 'right', bold: true, color: C.emerald },
        },
      ],
    ];

    slide.addTable(tableRows, {
      x: 6.22,
      y: 1.48,
      w: 6.51,
      colW: [2.16, 1.15, 1.5, 1.7],
      fontFace: FONT,
      fontSize: 9.2,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.06, 0.08, 0.06, 0.08],
      valign: 'middle',
    });

    slide.addText(
      'Note: Blended Containment measures total contact-center-wide call deflection across all inbound traffic, while 96%+ Day-1 NLU and 90%+ Task Resolution reflect Day-1 AI Bootstrapped intent accuracy and in-scope workflow completion.',
      {
        x: 6.22,
        y: 6.18,
        w: 6.51,
        h: 0.6,
        fontFace: FONT,
        fontSize: 8.5,
        italic: true,
        color: C.muted,
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 4:\n` +
        `Walk the CFO through the unit economics table:\n` +
        `1) Annual net savings vs. Legacy is ${formatCurrencyCompact(results.annualNetSavings)} (${Math.round(results.ftesFreed)} FTEs freed / ${results.daysSavedPerAgentMo.toFixed(1)} days/agent/mo).\n` +
        `2) Note the distinction in the footnote: ${Math.round(results.targetCont * 100)}% Blended Containment applies across the entire contact center, while Day-1 NLU accuracy (96%+) and in-scope Task Resolution (90%+) measure scoped workflow performance.`
    );
  }

  // =========================================================================
  // SLIDE 5: 36-MONTH CASH FLOW, SELF-LEARNING COMPRESSION & SENSITIVITY
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '04 · 36-MONTH CASH FLOW & DOWNSIDE SENSITIVITY',
      'Cumulative 3-Year Spend Trajectory & Break-Even Payback',
      `Break-even achieved in ${
        payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} months` : 'N/A'
      } · 3-Yr Cumulative Savings vs. ${comp.shortLabel}: ${formatCurrencyCompact(payback.threeYearCompetitorSavings)}`,
      5,
      totalSlides,
      footerTag
    );

    // Left: Native Line Chart of 36-month cumulative spend ($M)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 1.48,
      w: 7.2,
      h: 5.25,
      rectRadius: 0.08,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
    });
    slide.addText('Cumulative 36-Month Spend Curve ($M, Incl. Setup & Self-Learning)', {
      x: 0.82,
      y: 1.66,
      w: 6.75,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11.5,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    const labels = payback.points.map((pt) => `M${pt.month}`);
    slide.addChart(
      pptx.ChartType.line,
      [
        {
          name: 'Legacy Baseline',
          labels,
          values: payback.points.map((pt) => Number((pt.legacyCumulative / 1_000_000).toFixed(2))),
        },
        {
          name: comp.shortLabel,
          labels,
          values: payback.points.map((pt) => Number((pt.diyCumulative / 1_000_000).toFixed(2))),
        },
        {
          name: 'Omilia Sovereign Stack',
          labels,
          values: payback.points.map((pt) => Number((pt.omiliaCumulative / 1_000_000).toFixed(2))),
        },
      ],
      {
        x: 0.78,
        y: 2.02,
        w: 6.85,
        h: 4.5,
        chartColors: ['64748B', C.rose, C.tealDark],
        lineSize: 2.5,
        lineDataSymbol: 'circle',
        lineDataSymbolSize: 5,
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 9.5,
        valAxisLabelFormatCode: '$#,##0.0"M"',
        valAxisLabelFontSize: 9,
        catAxisLabelFontSize: 9,
        valGridLine: { color: C.borderLight, size: 0.5 },
      }
    );

    // Top-Right Card: Offline Self-Learning Compression
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.0,
      y: 1.48,
      w: 4.73,
      h: 2.32,
      rectRadius: 0.08,
      fill: { color: C.tealBg },
      line: { color: C.tealBorder, width: 1 },
    });
    slide.addText('OFFLINE SELF-LEARNING COST COMPRESSION', {
      x: 8.22,
      y: 1.66,
      w: 4.3,
      h: 0.24,
      fontFace: MONO,
      fontSize: 8.5,
      bold: true,
      color: C.tealDark,
      margin: 0,
    });
    slide.addText(
      `Yr 1: $${payback.omiliaUnitRatesByYear.yr1.toFixed(2)}  →  Yr 2: $${payback.omiliaUnitRatesByYear.yr2.toFixed(2)}  →  Yr 3: $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)}`,
      {
        x: 8.22,
        y: 2.0,
        w: 4.3,
        h: 0.38,
        fontFace: MONO,
        fontSize: 12.5,
        bold: true,
        color: C.navy,
        margin: 0,
      }
    );
    slide.addText(
      `Why it compresses: Omilia's Closed-Loop Self-Learning continuously discovers recurring conversational patterns offline and promotes them—with mandatory human approval—into deterministic micro-flows, lowering effective unit cost 10% in Yr 2 and 18% by Yr 3 while competitor token costs climb.`,
      {
        x: 8.22,
        y: 2.48,
        w: 4.3,
        h: 1.15,
        fontFace: FONT,
        fontSize: 9.8,
        color: C.slateText,
        margin: 0,
      }
    );

    // Bottom-Right: Sensitivity Matrix (±10%)
    slide.addText('Containment Sensitivity Matrix (±10% Execution Bands)', {
      x: 8.0,
      y: 3.98,
      w: 4.73,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    const sensRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Scenario', options: { bold: true, fill: { color: C.bgLight }, color: C.navy } },
        { text: 'Cont.', options: { bold: true, align: 'right', fill: { color: C.bgLight } } },
        { text: 'Annual Net', options: { bold: true, align: 'right', fill: { color: C.bgLight } } },
        { text: '3-Yr Edge', options: { bold: true, align: 'right', fill: { color: C.bgLight } } },
        { text: 'Payback', options: { bold: true, align: 'right', fill: { color: C.bgLight } } },
      ],
      ...sensitivity.map((s, idx) => {
        const bg = idx === 1 ? { color: C.tealBg } : undefined;
        return [
          { text: s.label, options: { bold: idx === 1, fill: bg } },
          { text: `${s.targetContainmentPct}%`, options: { align: 'right' as const, fontFace: MONO, fill: bg } },
          {
            text: formatCurrencyCompact(s.annualNetSavings),
            options: { align: 'right' as const, fontFace: MONO, bold: idx === 1, fill: bg },
          },
          {
            text: formatCurrencyCompact(s.threeYearVsCompetitor),
            options: { align: 'right' as const, fontFace: MONO, fill: bg },
          },
          {
            text: s.paybackMonths !== null ? `${s.paybackMonths.toFixed(1)}m` : 'N/A',
            options: { align: 'right' as const, fontFace: MONO, fill: bg },
          },
        ];
      }),
    ];

    slide.addTable(sensRows, {
      x: 8.0,
      y: 4.32,
      w: 4.73,
      colW: [1.45, 0.68, 0.92, 0.92, 0.76],
      fontFace: FONT,
      fontSize: 8.8,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.07, 0.06, 0.07, 0.06],
      valign: 'middle',
    });

    slide.addText(
      `Downside Protection: Even in the Conservative (-10%) band, Phase 1 recovers its ${formatCurrencyFull(payback.implementationCost)} PS investment in ${
        sensitivity[0]?.paybackMonths !== null ? `${sensitivity[0].paybackMonths.toFixed(1)} months` : 'N/A'
      }.`,
      {
        x: 8.0,
        y: 6.18,
        w: 4.73,
        h: 0.52,
        fontFace: FONT,
        fontSize: 9,
        color: C.muted,
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 5:\n` +
        `How 36-Month Break-Even is calculated: Month 0 starts at upfront Phase 1 PS (${formatCurrencyFull(payback.implementationCost)} for Omilia vs. ${formatCurrencyFull(payback.competitorSetupCost)} for ${comp.shortLabel}). Every month thereafter adds monthly run-rate spend.\n` +
        `Payback occurs at ${payback.paybackMonths !== null ? `${payback.paybackMonths.toFixed(1)} months` : 'N/A'} = Implementation Cost ÷ Monthly Net Savings.\n` +
        `Highlight the sensitivity table to show CFOs downside protection even if containment lands 10% below target.`
    );
  }

  // =========================================================================
  // SLIDE 6: WORKBENCH FEATURE WALKTHROUGH — LEVERS & WHY THEY MATTER
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '05 · WORKBENCH CAPABILITY WALKTHROUGH',
      'What Each Configured Lever Tweaks & Why It Matters',
      'Designed as an executive walkthrough linking every workbench control directly to Omilia’s commercial and technical proposition',
      6,
      totalSlides,
      footerTag
    );

    const walkthroughRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Workbench Feature / Lever', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'Configured Setting', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'What It Controls', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        {
          text: 'Why It Matters Against the Proposition',
          options: { bold: true, fill: { color: C.navy }, color: '5EEAD4' },
        },
      ],
      [
        { text: 'Competitor Baseline & Surge Shield', options: { bold: true, color: C.navy } },
        { text: `${comp.shortLabel}\n${inputs.surge.toFixed(1)}x Surge`, options: { fontFace: MONO, color: C.tealDark } },
        {
          text: 'Selects BYOLLM vs. DIY Hyperscaler cost mechanics & applies seasonal/outage volume spikes (1.0x–4.0x).',
        },
        {
          text: `Proves why competitor token/ASR/TTS usage explodes nonlinearly (surge^${comp.surgeExponent.toFixed(2)}) during peaks while Omilia stays flat.`,
        },
      ],
      [
        { text: 'Blended Containment & AI Bootstrapping', options: { bold: true, color: C.navy, fill: { color: C.bgLight } } },
        {
          text: `${inputs.baseContainment}% → ${inputs.targetContainment}%\n(+${results.containmentLiftPct}% Lift)`,
          options: { fontFace: MONO, color: C.tealDark, fill: { color: C.bgLight } },
        },
        {
          text: 'Moves calls from Legacy DTMF + live agents into Omilia deterministic + agentic containment.',
          options: { fill: { color: C.bgLight } },
        },
        {
          text: `Primary deflection engine: shifts $${results.unitHumanCost.toFixed(2)} agent calls to flat $${inputs.omiliaOutcomeRate.toFixed(2)} resolution with 96%+ Day-1 NLU.`,
          options: { fill: { color: C.bgLight } },
        },
      ],
      [
        { text: 'Outcome Pricing & Self-Learning', options: { bold: true, color: C.navy } },
        {
          text: `$${payback.omiliaUnitRatesByYear.yr1.toFixed(2)} → $${payback.omiliaUnitRatesByYear.yr3.toFixed(2)}/res`,
          options: { fontFace: MONO, color: C.emerald },
        },
        {
          text: 'Sets Year 1 price per resolved intent ($0.15–$1.00) and models Year 2 (-10%) & Year 3 (-18%) compression.',
        },
        {
          text: 'Zero pass-through token or compute billing; CFOs pay only for completed outcomes while unit costs fall over 36 mos.',
        },
      ],
      [
        { text: 'TalkGuard Passive Biometrics', options: { bold: true, color: C.navy, fill: { color: C.bgLight } } },
        {
          text: inputs.talkguard ? `On (-${preset.roi.talkguardSec}s KBA)` : 'Disabled',
          options: { fontFace: MONO, color: C.tealDark, fill: { color: C.bgLight } },
        },
        {
          text: 'Toggles passive voice authentication & deepfake screening across escalated calls.',
          options: { fill: { color: C.bgLight } },
        },
        {
          text: 'Monetizes calls that STILL escalate to agents by removing KBA interrogation and stopping synthetic voice fraud.',
          options: { fill: { color: C.bgLight } },
        },
      ],
      [
        { text: 'CSR CoPilot Real-Time Assist', options: { bold: true, color: C.navy } },
        {
          text: inputs.copilot ? `On (-${preset.roi.copilotSec}s ACW)` : 'Disabled',
          options: { fontFace: MONO, color: C.tealDark },
        },
        {
          text: 'Compresses After-Call Work (ACW) with automated live disposition & wrap-up summaries.',
        },
        {
          text: 'Expands ROI across 100% of inbound call volume—delivering value on complex escalations as well as full self-service.',
        },
      ],
      [
        { text: 'Workforce Capacity & Payback', options: { bold: true, color: C.navy, fill: { color: C.bgLight } } },
        {
          text: `${Math.round(results.ftesFreed).toLocaleString()} FTEs Freed\n(${results.daysSavedPerAgentMo.toFixed(1)} d/mo)`,
          options: { fontFace: MONO, color: C.tealDark, fill: { color: C.bgLight } },
        },
        {
          text: 'Maps reclaimed hours against active agent headcount, shift hours, and blended PS implementation cost.',
          options: { fill: { color: C.bgLight } },
        },
        {
          text: 'Translates abstract cost savings into real staffing plans (overtime reduction, attrition absorption, or sales reallocation).',
          options: { fill: { color: C.bgLight } },
        },
      ],
    ];

    slide.addTable(walkthroughRows, {
      x: 0.6,
      y: 1.48,
      w: 12.13,
      colW: [2.45, 1.85, 3.65, 4.18],
      fontFace: FONT,
      fontSize: 9.5,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.07, 0.09, 0.07, 0.09],
      valign: 'middle',
    });

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 6:\n` +
        `This slide acts as a feature-by-feature guide for walking stakeholders through the workbench.\n` +
        `Every row ties a specific UI control directly to the live configured value and its strategic "why" so a partner can smoothly explain each dial during an executive briefing.`
    );
  }

  // =========================================================================
  // SLIDE 7: AI RADAR 2.0 PORTFOLIO & 80/20 PHASE 1 SCOPE FENCE
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '06 · AI RADAR 2.0 DISCOVERY & 80/20 DISCIPLINE',
      `Use-Case Portfolio & Phase 1 / Hybrid Scope (${includedUseCases.length} Included)`,
      'Pairs High-Feasibility Top-Right workflows (≥50F/≥50I) + Bottom-Right RAG Quick Wins (≥50F) while gating <50F workflows to Phase 2',
      7,
      totalSlides,
      footerTag
    );

    const displayedUcs = useCases.slice(0, 7);
    const radarRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Scoped Use Case', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'Score', options: { bold: true, align: 'center', fill: { color: C.navy }, color: C.white } },
        { text: 'Quadrant & Phase', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'Runtime Architecture Tier', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'Phase 1 SOW', options: { bold: true, align: 'right', fill: { color: C.navy }, color: '5EEAD4' } },
      ],
      ...displayedUcs.map((uc, idx) => {
        const q = getQuadrantMeta(uc.feas, uc.imp);
        const included = isHighFeasibilityQuadrant(uc) && uc.included !== false;
        const rowBg = included ? { color: C.tealBg } : idx % 2 === 1 ? { color: C.bgLight } : undefined;
        return [
          { text: uc.name, options: { bold: included, color: C.navy, fill: rowBg } },
          {
            text: `${uc.feas}F / ${uc.imp}I`,
            options: { align: 'center' as const, fontFace: MONO, fill: rowBg },
          },
          {
            text: q.label,
            options: {
              bold: included,
              color: included ? C.tealDark : C.muted,
              fill: rowBg,
            },
          },
          { text: uc.runtime, options: { fill: rowBg } },
          {
            text: included ? `Included (+${getUseCasePsDays(uc)} PS d)` : 'Phase 2/3 Gate',
            options: {
              align: 'right' as const,
              fontFace: MONO,
              bold: included,
              color: included ? C.emerald : C.muted,
              fill: rowBg,
            },
          },
        ];
      }),
    ];

    slide.addTable(radarRows, {
      x: 0.6,
      y: 1.48,
      w: 12.13,
      colW: [3.2, 1.2, 2.35, 3.68, 1.7],
      fontFace: FONT,
      fontSize: 9.5,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.08, 0.09, 0.08, 0.09],
      valign: 'middle',
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 5.9,
      w: 12.13,
      h: 0.92,
      rectRadius: 0.08,
      fill: { color: C.bgLight },
      line: { color: C.border, width: 1 },
    });
    slide.addText(
      `WHY AI RADAR 2.0 MATTERS: ${includedUseCases.length} High-Feasibility (Top-Right + Bottom-Right) use case${
        includedUseCases.length === 1 ? '' : 's'
      } form the bounded Phase 1 / Hybrid SOW (${hlee.psEffortLabel} · ${hlee.timelineLabel}). ${
        deferredCount > 0
          ? `${deferredCount} lower-readiness (<50F) workflow${deferredCount === 1 ? '' : 's'} remain gated to Phase 2 ("Training Wheels")`
          : 'All plotted workflows meet Phase 1 readiness'
      }${useCases.length > 7 ? ` (showing top 7 of ${useCases.length} plotted items; full list in CSV export)` : ''}—eliminating scope creep before kickoff.`,
      {
        x: 0.85,
        y: 6.06,
        w: 11.63,
        h: 0.6,
        fontFace: FONT,
        fontSize: 10,
        color: C.slateText,
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 7:\n` +
        `AI Radar 2.0 protects both the client and the delivery partner from boiling the ocean.\n` +
        `In the workbench, you can drag any pin on the 2×2 matrix or toggle its Phase 1 / Hybrid SOW checkbox—and the HLEE timeline and PS Days update live.\n` +
        `Top-Right workflows (≥50F & ≥50I) run on Deterministic miniApps® + AI Bootstrapping; Bottom-Right workflows (≥50F & <50I) deliver Week-1 Voice-Safe RAG Quick Wins; lower-feasibility (<50F) workflows wait in Phase 2 Training Wheels.`
    );
  }

  // =========================================================================
  // SLIDE 8: INITIAL POV / POC CHARTER & MUTUAL ACTION PLAN
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '07 · INITIAL POV / POC CHARTER & MUTUAL ACTION PLAN',
      `AI-Bootstrapped POV Validation Plan (${povPlan.povDurationLabel})`,
      `Prove ${povConfig.nluTargetPct}%+ Day-1 NLU, ${povConfig.taskTargetPct}%+ Task Resolution & <${povConfig.latencyTargetMs}ms Latency vs. ${povPlan.competitorPovDurationLabel} on ${comp.shortLabel}`,
      8,
      totalSlides,
      footerTag
    );

    const povSummaryCards = [
      { label: 'POV TIMELINE', val: povPlan.povDurationLabel, sub: `vs. ${povPlan.competitorPovDurationLabel}` },
      {
        label: povConfig.scopeStrategy === 'hybrid' ? 'HYBRID HERO SCOPE' : 'HERO SCOPE LOCKED',
        val: `${povPlan.heroIntents.length} Hero ${povPlan.heroIntents.length === 1 ? 'Intent' : 'Intents'}`,
        sub:
          povPlan.heroIntents
            .map((u) => `${u.name} (${isTopRightQuadrant(u) ? 'TR' : 'BR'})`)
            .join(' · ') || povPlan.scopeStrategyLabel,
      },
      {
        label: 'COMMERCIAL & CREDIT',
        val: povPlan.effectiveFeeUsd === 0 ? '$0 (Co-Sell)' : formatCurrencyFull(povPlan.effectiveFeeUsd),
        sub:
          povPlan.phase1CreditUsd > 0
            ? `${formatCurrencyFull(povPlan.phase1CreditUsd)} credited 100% to Phase 1`
            : povConfig.commercialModel === 'paid_pilot'
            ? 'Production-Path Pilot'
            : 'Strict 80/20 cap',
      },
      { label: 'BACKEND ISOLATION', val: povPlan.infosecGateRisk.split(' ')[0], sub: povPlan.backendIsolationLabel },
    ];

    povSummaryCards.forEach((c, i) => {
      const cardX = 0.6 + i * 3.1;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 1.46,
        w: 2.9,
        h: 1.15,
        rectRadius: 0.08,
        fill: { color: C.bgLight },
        line: { color: C.border, width: 1 },
      });
      slide.addText(c.label, {
        x: cardX + 0.15,
        y: 1.58,
        w: 2.6,
        h: 0.2,
        fontFace: MONO,
        fontSize: 8.2,
        bold: true,
        color: C.tealDark,
        margin: 0,
      });
      slide.addText(c.val, {
        x: cardX + 0.15,
        y: 1.82,
        w: 2.6,
        h: 0.34,
        fontFace: FONT,
        fontSize: 15,
        bold: true,
        color: C.navy,
        margin: 0,
      });
      slide.addText(c.sub, {
        x: cardX + 0.15,
        y: 2.18,
        w: 2.6,
        h: 0.36,
        fontFace: FONT,
        fontSize: 8.2,
        color: C.muted,
        margin: 0,
      });
    });

    // Left: Quantitative Exit Criteria Scorecard
    slide.addText('Signed Binary Exit Criteria Scorecard', {
      x: 0.6,
      y: 2.78,
      w: 6.4,
      h: 0.26,
      fontFace: FONT,
      fontSize: 11,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    const gateRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Exit Gate', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'Pass Target', options: { bold: true, fill: { color: C.navy }, color: '5EEAD4' } },
        { text: 'Verification Method', options: { bold: true, fill: { color: C.navy }, color: C.white } },
      ],
      ...povPlan.exitGates.map((g, idx) => {
        const bg = idx % 2 === 1 ? { color: C.bgLight } : undefined;
        return [
          { text: g.metric, options: { bold: true, fill: bg } },
          { text: g.threshold, options: { fontFace: MONO, bold: true, color: C.emerald, fill: bg } },
          { text: g.measurement, options: { fill: bg } },
        ];
      }),
    ];

    slide.addTable(gateRows, {
      x: 0.6,
      y: 3.1,
      w: 6.55,
      colW: [2.15, 1.45, 2.95],
      fontFace: FONT,
      fontSize: 8.8,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.06, 0.08, 0.06, 0.08],
      valign: 'middle',
    });

    // Right: 3-Week Sprint Plan + Conversion Clause
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.38,
      y: 2.78,
      w: 5.35,
      h: 4.02,
      rectRadius: 0.08,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
    });

    slide.addText('WEEK-BY-WEEK EXECUTION & CONVERSION TRIGGER', {
      x: 7.6,
      y: 2.95,
      w: 4.9,
      h: 0.24,
      fontFace: MONO,
      fontSize: 8.5,
      bold: true,
      color: C.tealDark,
      margin: 0,
    });

    const sprintLines = povPlan.sprintWeeks
      .map((w) => `${w.weekLabel} — ${w.title} (${w.owner})\n  • ${w.deliverables.join('\n  • ')}`)
      .join('\n\n');

    slide.addText(sprintLines, {
      x: 7.6,
      y: 3.24,
      w: 4.9,
      h: 2.45,
      fontFace: FONT,
      fontSize: 8.8,
      color: C.slateText,
      margin: 0,
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.6,
      y: 5.82,
      w: 4.9,
      h: 0.84,
      rectRadius: 0.06,
      fill: { color: C.tealBg },
      line: { color: C.tealBorder, width: 1 },
    });
    slide.addText(`Conversion Clause: ${povPlan.conversionClause}`, {
      x: 7.74,
      y: 5.9,
      w: 4.62,
      h: 0.68,
      fontFace: FONT,
      fontSize: 8.6,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 8:\n` +
        `This slide prevents endless, unpaid POC drift by establishing a mutual action plan.\n` +
        `1) Strategy: ${povPlan.scopeStrategyLabel}. Combining the top-feasibility Top-Right transactional workflow + Bottom-Right RAG Quick Win inside a ${povPlan.povDurationLabel} sandbox (${povPlan.infosecGateRisk}) avoids InfoSec bottlenecks.\n` +
        `2) Agree on binary Exit Gates upfront (${povConfig.nluTargetPct}% NLU, ${povConfig.taskTargetPct}% Task Res, <${povConfig.latencyTargetMs}ms Latency, 0 Frontier Egress) that trigger Phase 1 SOW conversion.`
    );
  }

  // =========================================================================
  // SLIDE 9: PARTNER DEAL-SCOPING, HLEE EFFORT & SOW GUARDRAILS
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '08 · PHASE 1 DELIVERY & SOW GOVERNANCE',
      'Partner Deal-Scoping, HLEE Effort & Commercial Guardrails',
      `Fixed-scope Phase 1 delivery model synchronized with ${partnerMotion.toUpperCase()} motion and ${sovereignty === 'baremetal' ? 'Bare Metal' : 'OCP SaaS'} sovereignty`,
      9,
      totalSlides,
      footerTag
    );

    const apiLabels: Record<ApiReadiness, string> = {
      modern: 'Modern REST / GraphQL (+0 Wks)',
      mixed: 'Mixed REST + Legacy SOAP (+1 Wk / +4 PS d)',
      mainframe: 'Mainframe / 3270 Middleware Gate (+2 Wks / +8 PS d)',
    };

    const metaCards = [
      { label: 'PHASE 1 TIMELINE', val: hlee.timelineLabel, sub: `${includedUseCases.length} bounded intents` },
      {
        label: 'HLEE PS INVESTMENT',
        val: formatCurrencyFull(payback.implementationCost),
        sub: `${hlee.psDays} PS Days @ $${psDayRate.toLocaleString()}/d`,
      },
      {
        label: 'DEPLOYMENT TIER',
        val: sovereignty === 'baremetal' ? 'OCP Bare Metal' : 'OCP SaaS',
        sub: sovereignty === 'baremetal' ? 'Air-Gapped (+3 Wks / +12 PS d)' : 'Managed Certified Walled Garden',
      },
      {
        label: 'API READINESS',
        val: apiReadiness.toUpperCase(),
        sub: apiLabels[apiReadiness],
      },
    ];

    metaCards.forEach((m, i) => {
      const cardX = 0.6 + i * 3.1;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 1.48,
        w: 2.9,
        h: 1.25,
        rectRadius: 0.08,
        fill: { color: C.bgLight },
        line: { color: C.border, width: 1 },
      });
      slide.addText(m.label, {
        x: cardX + 0.16,
        y: 1.62,
        w: 2.58,
        h: 0.22,
        fontFace: MONO,
        fontSize: 8.5,
        bold: true,
        color: C.tealDark,
        margin: 0,
      });
      slide.addText(m.val, {
        x: cardX + 0.16,
        y: 1.9,
        w: 2.58,
        h: 0.36,
        fontFace: FONT,
        fontSize: 16,
        bold: true,
        color: C.navy,
        margin: 0,
      });
      slide.addText(m.sub, {
        x: cardX + 0.16,
        y: 2.32,
        w: 2.58,
        h: 0.3,
        fontFace: FONT,
        fontSize: 9,
        color: C.muted,
        margin: 0,
      });
    });

    // Left: RACI Matrix
    slide.addText('Delivery RACI Ownership Split', {
      x: 0.6,
      y: 2.92,
      w: 5.9,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11.5,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    const raciRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Workstream', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: 'Omilia', options: { bold: true, fill: { color: C.navy }, color: '5EEAD4' } },
        { text: 'Partner / Customer', options: { bold: true, fill: { color: C.navy }, color: C.white } },
      ],
      ...hlee.raciRows.map((r, i) => {
        const bg = i % 2 === 1 ? { color: C.bgLight } : undefined;
        return [
          { text: r.workstream, options: { bold: true, fill: bg } },
          { text: r.omiliaRole, options: { color: C.tealDark, fill: bg } },
          { text: r.partnerRole, options: { fill: bg } },
        ];
      }),
    ];

    slide.addTable(raciRows, {
      x: 0.6,
      y: 3.24,
      w: 6.1,
      colW: [2.1, 1.95, 2.05],
      fontFace: FONT,
      fontSize: 9,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.07, 0.08, 0.07, 0.08],
      valign: 'middle',
    });

    // Right: SOW Guardrails + Partner Hook
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.95,
      y: 2.92,
      w: 5.78,
      h: 3.88,
      rectRadius: 0.08,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
    });
    slide.addText('CO-SELL HOOK & COMMERCIAL SOW GUARDRAILS', {
      x: 7.18,
      y: 3.12,
      w: 5.32,
      h: 0.24,
      fontFace: MONO,
      fontSize: 8.5,
      bold: true,
      color: C.tealDark,
      margin: 0,
    });
    slide.addText(hlee.positioningHook, {
      x: 7.18,
      y: 3.42,
      w: 5.32,
      h: 0.65,
      fontFace: FONT,
      fontSize: 10,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    const guardrailsText = hlee.guardrails.map((g, i) => `${i + 1}. ${g}`).join('\n\n');
    slide.addText(guardrailsText, {
      x: 7.18,
      y: 4.15,
      w: 5.32,
      h: 2.5,
      fontFace: FONT,
      fontSize: 9.2,
      color: C.slateText,
      margin: 0,
    });

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 8:\n` +
        `This slide turns discovery into an executable Statement of Work.\n` +
        `Explain why each scoping selector matters: Switching between OCP SaaS and Bare Metal adds +3 weeks / +12 PS days for air-gapped InfoSec validation; Legacy Mainframe/3270 requires a REST/MCP facade gate so screen-scraping never threatens sub-300ms voice SLAs.`
    );
  }

  // =========================================================================
  // SLIDE 10: LIVE MCP SOVEREIGN ARCHITECTURE & SUB-1s LATENCY PROOF
  // =========================================================================
  {
    const slide = pptx.addSlide();
    addSlideChrome(
      slide,
      pptx,
      '09 · TECHNICAL PROOF & SECURITY PERIMETER',
      'Live MCP Orchestration & Sub-1s Voice Latency Architecture',
      `OCP acts as MCP Client inside a certified perimeter calling ${preset.shortName} backend MCP servers with Zero Frontier Egress`,
      10,
      totalSlides,
      footerTag
    );

    // Left: Latency Waterfall Comparison Table
    slide.addText('Voice Latency Budget vs. 1,200ms Caller Hang-Up Threshold', {
      x: 0.6,
      y: 1.48,
      w: 6.4,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11.5,
      bold: true,
      color: C.navy,
      margin: 0,
    });

    const latencyRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Voice Turn Pipeline Stage', options: { bold: true, fill: { color: C.navy }, color: C.white } },
        { text: comp.shortLabel, options: { bold: true, align: 'right', fill: { color: C.navy }, color: 'FDA4AF' } },
        { text: 'Omilia OCP', options: { bold: true, align: 'right', fill: { color: C.navy }, color: '5EEAD4' } },
      ],
      [
        { text: 'Telephony Acoustic ASR (8kHz)', options: { bold: true } },
        { text: `${externalAsrMs} ms (External STT)`, options: { align: 'right', fontFace: MONO, color: C.rose } },
        { text: '0 ms Incremental (Native)', options: { align: 'right', fontFace: MONO, color: C.tealDark } },
      ],
      [
        { text: 'Intent Reasoning & Orchestration', options: { bold: true, fill: { color: C.bgLight } } },
        {
          text: `${orchestratorLlmMs} ms (LLM + Hop)`,
          options: { align: 'right', fontFace: MONO, color: C.rose, fill: { color: C.bgLight } },
        },
        {
          text: 'Deterministic + In-Core',
          options: { align: 'right', fontFace: MONO, color: C.tealDark, fill: { color: C.bgLight } },
        },
      ],
      [
        { text: `Backend Lookup (${preset.mcpSystems.length} Systems)`, options: { bold: true } },
        {
          text: `${backendSeqMs} ms (Sequential)`,
          options: { align: 'right', fontFace: MONO, color: C.rose },
        },
        {
          text: `${maxParallelMs} ms (Parallel MCP)`,
          options: { align: 'right', fontFace: MONO, bold: true, color: C.tealDark },
        },
      ],
      [
        { text: 'Speech Synthesis (TTS)', options: { bold: true, fill: { color: C.bgLight } } },
        {
          text: `${externalTtsMs} ms (External TTS)`,
          options: { align: 'right', fontFace: MONO, color: C.rose, fill: { color: C.bgLight } },
        },
        {
          text: `${lexisTtsMs} ms (Lexis Native)`,
          options: { align: 'right', fontFace: MONO, bold: true, color: C.emerald, fill: { color: C.bgLight } },
        },
      ],
      [
        { text: 'Total End-to-End Turnaround', options: { bold: true, fill: { color: C.tealBg } } },
        {
          text: `${seqSumMs.toLocaleString()} ms (Dead Air)`,
          options: { align: 'right', fontFace: MONO, bold: true, color: C.rose, fill: { color: C.roseBg } },
        },
        {
          text: `${totalOmiliaMs} ms (<1,200ms SLA)`,
          options: { align: 'right', fontFace: MONO, bold: true, color: C.emerald, fill: { color: C.tealBg } },
        },
      ],
    ];

    slide.addTable(latencyRows, {
      x: 0.6,
      y: 1.82,
      w: 6.45,
      colW: [2.55, 1.95, 1.95],
      fontFace: FONT,
      fontSize: 9.2,
      color: C.slateText,
      border: { type: 'solid', pt: 0.5, color: C.borderLight },
      margin: [0.08, 0.08, 0.08, 0.08],
      valign: 'middle',
    });

    slide.addText(
      `Caller Hang-Up Threshold: 1,200ms. Omilia clears all ${preset.mcpSystems.length} backend calls concurrently (${maxParallelMs}ms) + Lexis TTS (${lexisTtsMs}ms) = ${totalOmiliaMs}ms total.`,
      {
        x: 0.6,
        y: 4.85,
        w: 6.45,
        h: 0.45,
        fontFace: FONT,
        fontSize: 9,
        color: C.muted,
        margin: 0,
      }
    );

    // Right: Vertical Backend MCP Stack & Glass Box Governance
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.3,
      y: 1.48,
      w: 5.43,
      h: 5.32,
      rectRadius: 0.08,
      fill: { color: C.navy },
      line: { color: C.navy, width: 0 },
    });

    slide.addText(`${preset.shortName.toUpperCase()} MCP SERVER TARGETS & GLASS BOX AUDIT`, {
      x: 7.55,
      y: 1.72,
      w: 4.93,
      h: 0.24,
      fontFace: MONO,
      fontSize: 8.8,
      bold: true,
      color: '5EEAD4',
      margin: 0,
    });

    slide.addText('Customer Backend Systems Polled in Parallel:', {
      x: 7.55,
      y: 2.08,
      w: 4.93,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11,
      bold: true,
      color: C.white,
      margin: 0,
    });

    const sysLines = preset.mcpSystems.map((s) => `• ${s.name}  —  ${s.ms}ms async`).join('\n');
    slide.addText(sysLines, {
      x: 7.55,
      y: 2.42,
      w: 4.93,
      h: 1.2,
      fontFace: MONO,
      fontSize: 9.8,
      color: 'E2E8F0',
      margin: 0,
    });

    slide.addShape(pptx.ShapeType.line, {
      x: 7.55,
      y: 3.72,
      w: 4.93,
      h: 0,
      line: { color: '334155', width: 1 },
    });

    slide.addText('Glass Box & Sovereign Governance Guarantees:', {
      x: 7.55,
      y: 3.88,
      w: 4.93,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11,
      bold: true,
      color: C.white,
      margin: 0,
    });

    slide.addText(
      `1. Zero Frontier LLM Egress: PII/PCI never leaves ${sovereignty === 'baremetal' ? 'your on-prem DC' : 'certified AWS walled garden'}.\n\n2. OAuth 2.0 + mTLS & Schema Validation: Every JSON-RPC 2.0 MCP call is RBAC-scoped and PII-masked in audit logs.\n\n3. SIP / UUI Warm Handoff: Escalations carry full verified intent, biometric score, and summary to live CSR CoPilot agents.\n\nStack: ${preset.backendStack}`,
      {
        x: 7.55,
        y: 4.22,
        w: 4.93,
        h: 2.4,
        fontFace: FONT,
        fontSize: 9.5,
        color: 'CBD5E1',
        margin: 0,
      }
    );

    slide.addNotes(
      `SPEAKER NOTES — SLIDE 9:\n` +
        `Close the technical architecture discussion with this live MCP Inspector proof.\n` +
        `Explain the key security boundary: OCP acts as the MCP Client inside Omilia's certified perimeter and calls the customer's MCP Server via OAuth 2.0 + mTLS—never routing sensitive audio or PII to third-party frontier model APIs.`
    );
  }

  const slug = (dealMeta.prospectName || preset.shortName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fileName = `omilia-value-prop-${slug || 'workbench'}.pptx`;

  await pptx.writeFile({ fileName, compression: true });
  return fileName;
}
