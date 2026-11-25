import React, { useState } from 'react';
import { BookmarkPlus, Check, FolderOpen, Link2, Trash2, X } from 'lucide-react';
import { VERTICAL_PRESETS } from '../data/verticalPresets';
import { SavedDealProfile } from '../utils/scenarioStorage';
import { InfoTooltip } from './InfoTooltip';

interface ScenariosModalProps {
  open: boolean;
  onClose: () => void;
  savedDeals: SavedDealProfile[];
  currentVerticalName: string;
  onSaveDeal: (name: string) => void;
  onLoadDeal: (deal: SavedDealProfile) => void;
  onDeleteDeal: (id: string) => void;
  onCopyShareLink: () => void;
}

export const ScenariosModal: React.FC<ScenariosModalProps> = ({
  open,
  onClose,
  savedDeals,
  currentVerticalName,
  onSaveDeal,
  onLoadDeal,
  onDeleteDeal,
  onCopyShareLink,
}) => {
  const [dealName, setDealName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) return;
    onSaveDeal(dealName.trim());
    setDealName('');
  };

  const handleCopyLink = () => {
    onCopyShareLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenariosModalTitle"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="scenariosModalTitle"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-50"
            >
              Saved Deal Profiles &amp; Shareable Scenario Link
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Snapshots persist locally in your browser · Share links encode full workbench state
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Shareable Link Box */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <span>Share Live Scenario URL</span>
                <InfoTooltip
                  label="Shareable Scenario Link"
                  description="Encodes your entire deal configuration—sliders, Competitor Baseline, BYOLLM Flagship/Mini tier, AI Radar pins, POV charter, and PS day rate—into a self-contained ?s= URL."
                  tcoImpact="Lets partners and SEs open the exact same TCO business case and 10-slide deck export without needing a backend login."
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Includes active {currentVerticalName} sliders, BYOLLM tier, Radar pins, POV charter, and PS rate
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copiedLink ? 'Link Copied' : 'Copy Scenario Link'}
            </button>
          </div>

          {/* Save Current Deal Form */}
          <form onSubmit={handleSave} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="inpScenarioName"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Save Current State as Browser Profile
              </label>
              <InfoTooltip
                label="Browser Deal Profiles"
                description="Stores named prospect snapshots locally in your browser so you can switch cleanly between active accounts."
                tcoImpact="Preserves custom sliders, BYOLLM stack selection, Radar pin positions, and POV scope for instant recall."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="inpScenarioName"
                type="text"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder={`e.g., Acme ${currentVerticalName} Phase 1`}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!dealName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Save Snapshot
              </button>
            </div>
          </form>

          {/* Saved Deals List */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Saved Profiles ({savedDeals.length})
            </div>
            {savedDeals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No deal snapshots saved yet. Save a configuration above to revisit it anytime.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {savedDeals.map((deal) => {
                  const vertName = VERTICAL_PRESETS[deal.payload.vertical]?.shortName ?? deal.payload.vertical;
                  const dateLabel = new Date(deal.savedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {deal.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {vertName} · {deal.payload.inputs.callVolume.toLocaleString()} calls/mo ·{' '}
                          {deal.payload.inputs.surge.toFixed(1)}x · Saved {dateLabel}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadDeal(deal);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-teal-400 dark:hover:bg-teal-950/50 cursor-pointer"
                        >
                          <FolderOpen className="h-3 w-3" />
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDeal(deal.id)}
                          aria-label={`Delete ${deal.name}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
