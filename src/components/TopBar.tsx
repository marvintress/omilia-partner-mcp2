import React from 'react';
import { FileText } from 'lucide-react';

export type TabKey = 'economics' | 'radar' | 'scoping' | 'mcp';

interface TopBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenBrief: () => void;
}

const NAV_ITEMS: { key: TabKey; label: string }[] = [
  { key: 'economics', label: 'Unit Economics' },
  { key: 'radar', label: 'AI Radar' },
  { key: 'scoping', label: 'Deal Scoping' },
  { key: 'mcp', label: 'MCP Inspector' },
];

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onSelectTab, onOpenBrief }) => {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('economics');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-sm"
        >
          Omilia Partner Workbench
        </a>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav aria-label="Primary workbench views" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectTab(item.key)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-sm ${
                  isActive
                    ? 'text-teal-700 dark:text-teal-400 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-teal-600 dark:bg-teal-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenBrief}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Export Deal Brief
          </button>
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <nav
        aria-label="Mobile workbench views"
        className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-slate-200 px-4 py-1.5 dark:border-slate-800"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-semibold dark:bg-teal-950/60 dark:text-teal-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
