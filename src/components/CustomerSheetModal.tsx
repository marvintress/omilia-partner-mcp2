import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { VERTICAL_PRESETS } from '../data/verticalPresets';
import {
  CustomerSheetSeedState,
  downloadBlankCsvTemplate,
  downloadCustomerSpreadsheet,
  ParsedCustomerIntake,
  parseCustomerSpreadsheet,
} from '../utils/customerSheet';
import { InfoTooltip } from './InfoTooltip';

interface CustomerSheetModalProps {
  open: boolean;
  onClose: () => void;
  seedState: CustomerSheetSeedState;
  onApplyIntake: (parsed: ParsedCustomerIntake) => void;
}

export const CustomerSheetModal: React.FC<CustomerSheetModalProps> = ({
  open,
  onClose,
  seedState,
  onApplyIntake,
}) => {
  const [templateMode, setTemplateMode] = useState<'seeded' | 'blank'>('seeded');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedCustomerIntake | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const preset = VERTICAL_PRESETS[seedState.vertical];

  const handleDownloadXlsx = async () => {
    setIsDownloading(true);
    setParseError(null);
    try {
      await downloadCustomerSpreadsheet(seedState, templateMode);
    } catch {
      setParseError('Unable to generate the Excel workbook in this browser. Try CSV download.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCsv = () => {
    setParseError(null);
    downloadBlankCsvTemplate(seedState, templateMode);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setParsedPreview(null);
    try {
      const result = await parseCustomerSpreadsheet(file, seedState.vertical);
      setParsedPreview(result);
    } catch (err) {
      setParseError(
        err instanceof Error
          ? err.message
          : 'Could not read this spreadsheet. Please ensure it is a valid .xlsx or .csv file.'
      );
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleApply = () => {
    if (!parsedPreview) return;
    onApplyIntake(parsedPreview);
    setParsedPreview(null);
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customerSheetModalTitle"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileSpreadsheet className="h-5 w-5 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2
                id="customerSheetModalTitle"
                className="font-display text-base font-bold text-slate-900 dark:text-slate-50 truncate"
              >
                Customer Discovery Sheet (.xlsx / .csv)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download a customer-ready questionnaire, collect discovery inputs, and upload to configure all 5 tabs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer sheet modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Step 1: Download Shareable Spreadsheet */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    1. Download Customer Intake Spreadsheet
                  </h3>
                  <InfoTooltip
                    label="Pre-filled vs. Blank Customer Sheet"
                    description="Pre-fill exports your current workbench assumptions (including Competitor Baseline & BYOLLM Flagship/Mini Stack Tier, POV settings, and Radar drivers) so the customer validates or adjusts them. Blank Customer Form leaves editable cells empty while keeping dropdowns and guidance."
                    tcoImpact="Captures verified customer volumes, AHT, wages, stack tier, and call drivers asynchronously before modeling CFO payback."
                  />
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Includes 3 Excel tabs: <span className="font-medium text-slate-700 dark:text-slate-300">Customer Discovery</span> (with dropdowns),{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">Use Cases (Call Drivers)</span>, and{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">Reference &amp; Benchmarks</span>.
                </p>
              </div>

              <div
                role="group"
                aria-label="Template Pre-fill Mode"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setTemplateMode('seeded')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    templateMode === 'seeded'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Pre-fill {preset.shortName} Values
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateMode('blank')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    templateMode === 'blank'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Blank Customer Form
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => void handleDownloadXlsx()}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {isDownloading ? 'Building Workbook...' : 'Download Excel Questionnaire (.xlsx)'}
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download CSV
              </button>
            </div>
          </section>

          <div className="border-t border-slate-200 dark:border-slate-800" />

          {/* Step 2: Upload Completed Customer Sheet */}
          <section className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  2. Upload Completed Customer Spreadsheet
                </h3>
                <InfoTooltip
                  label="Round-Trip Upload & Benchmark Fallback"
                  description="Parses Microsoft Excel (.xlsx), Google Sheets exports, or CSV templates — restoring Competitor Baseline, BYOLLM Flagship/Mini tier, POV charter, and call drivers. Blank numeric cells fall back to sector preset defaults."
                  tcoImpact="Pre-populates every slider, HLEE timeline, POV charter, and PowerPoint slide in one click with a preview gate before overwriting."
                />
              </div>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                Any blank cells automatically inherit the selected vertical’s industry benchmarks. You’ll preview all parsed numbers before applying.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="sr-only"
              id="customerSheetFileInput"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-teal-600 bg-teal-50/70 dark:border-teal-500 dark:bg-teal-950/30'
                  : 'border-slate-300 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50'
              }`}
            >
              <Upload
                className="mx-auto h-6 w-6 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isParsing
                  ? 'Reading spreadsheet...'
                  : 'Drop completed .xlsx or .csv here, or browse from disk'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Supports Excel (.xlsx) from Microsoft Excel / Google Sheets and CSV templates
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Choose Spreadsheet
                </button>
              </div>
            </div>

            {parseError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedPreview && (
              <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4 space-y-3 dark:border-teal-900/60 dark:bg-teal-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-50 truncate">
                      Ready to Import: {parsedPreview.fileName}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                      {parsedPreview.fieldsAppliedCount} discovery inputs parsed ·{' '}
                      {parsedPreview.useCasesUpdatedCount > 0
                        ? `${parsedPreview.useCasesUpdatedCount} call drivers from sheet`
                        : `${parsedPreview.useCases.length} vertical default call drivers`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParsedPreview(null)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer whitespace-nowrap"
                  >
                    Clear Preview
                  </button>
                </div>

                <dl className="divide-y divide-slate-200/80 rounded-md border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                  {parsedPreview.summaryRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-3.5 py-2 text-xs"
                    >
                      <dt className="font-medium text-slate-500 dark:text-slate-400">{row.label}</dt>
                      <dd className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 text-right">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {parsedPreview.warnings.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
                    <div className="font-semibold">Normalization Notes:</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {parsedPreview.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Apply Customer Inputs to Workbench
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
