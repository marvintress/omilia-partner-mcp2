import React from 'react';
import { Moon, Printer, Sun } from 'lucide-react';
import { VERTICAL_PRESETS, VerticalKey, VerticalPreset } from '../data/verticalPresets';

interface WorkspaceBarProps {
  vertical: VerticalKey;
  preset: VerticalPreset;
  onChangeVertical: (v: VerticalKey) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onPrint: () => void;
}

const VERTICAL_ORDER: VerticalKey[] = ['banking', 'utilities', 'insurance', 'healthcare', 'telecom'];

export const WorkspaceBar: React.FC<WorkspaceBarProps> = ({
  vertical,
  preset,
  onChangeVertical,
  isDark,
  onToggleTheme,
  onPrint,
}) => {
  return (
    <div className="no-print border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-3">
        {/* Left: 1-Click Industry Vertical Switcher + Unboxed Compliance Metadata */}
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div
            role="group"
            aria-label="Industry Vertical Selector"
            className="hidden lg:inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950"
          >
            {VERTICAL_ORDER.map((key) => {
              const item = VERTICAL_PRESETS[key];
              const active = vertical === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangeVertical(key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {item.shortName}
                </button>
              );
            })}
          </div>

          {/* Mobile / Tablet Compact Select */}
          <div className="lg:hidden">
            <label htmlFor="mobileVerticalSelect" className="sr-only">
              Industry Vertical
            </label>
            <select
              id="mobileVerticalSelect"
              value={vertical}
              onChange={(e) => onChangeVertical(e.target.value as VerticalKey)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {VERTICAL_ORDER.map((key) => (
                <option key={key} value={key}>
                  {VERTICAL_PRESETS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span>{preset.compliance.slice(0, 3).join(' · ')}</span>
            <span aria-hidden="true">·</span>
            <span>Zero Frontier Egress</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Lexis TTS &lt;45ms</span>
          </div>
        </div>

        {/* Right: Print & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print Report
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
