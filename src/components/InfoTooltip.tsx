import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  label: string;
  description: string;
  tcoImpact: string;
  align?: 'left' | 'center' | 'right';
  placement?: 'top' | 'bottom';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  label,
  description,
  tcoImpact,
  align = 'left',
  placement = 'top',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const alignClasses =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  const placementClasses = placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2';

  return (
    <span
      ref={containerRef}
      className="no-print relative inline-flex items-center align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`Explain ${label}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-slate-500 dark:hover:text-teal-400 cursor-pointer"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute ${placementClasses} ${alignClasses} z-50 w-64 sm:w-72 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900 pointer-events-auto`}
        >
          <div className="text-[11px] font-bold text-slate-900 dark:text-slate-50">
            {label}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>
          <div className="mt-2 border-t border-slate-100 pt-1.5 text-[11px] leading-relaxed text-teal-800 dark:border-slate-800 dark:text-teal-300">
            <strong className="font-semibold">TCO Impact:</strong> {tcoImpact}
          </div>
        </div>
      )}
    </span>
  );
};
