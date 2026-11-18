import React, { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { TS_SERVER_FILES } from '../data/verticalPresets';

interface TsServerModalProps {
  open: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

type FileTab = 'index' | 'package' | 'tsconfig';

export const TsServerModal: React.FC<TsServerModalProps> = ({ open, onClose, onNotify }) => {
  const [activeFile, setActiveFile] = useState<FileTab>('index');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const fileObj = TS_SERVER_FILES[activeFile];

  const handleDownload = () => {
    const blob = new Blob([fileObj.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileObj.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${fileObj.filename}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fileObj.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onNotify(`Copied ${fileObj.filename}`);
    } catch {
      onNotify(`Could not copy ${fileObj.filename}`);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tsModalTitle"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="tsModalTitle"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-50"
            >
              Local TypeScript MCP Server (<code className="font-mono text-sm">omilia-partner-mcp</code>)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports both <code className="font-mono">stdio</code> (CLI / IDE clients) and Streamable HTTP on port 3333
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy File'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download {fileObj.filename}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-950">
          {(['index', 'package', 'tsconfig'] as FileTab[]).map((tabKey) => {
            const tabFile = TS_SERVER_FILES[tabKey];
            const isActive = activeFile === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveFile(tabKey)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white font-semibold text-teal-700 shadow-xs border border-slate-200 dark:bg-slate-800 dark:text-teal-300 dark:border-slate-700'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tabFile.filename}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <pre className="max-h-[56vh] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 dark:border-slate-800">
            {fileObj.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
