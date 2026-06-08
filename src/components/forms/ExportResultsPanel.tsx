// src/components/forms/ExportResultsPanel.tsx
import React, { useState } from 'react';
import { FileSpreadsheet, FileJson, FileText, Image, Sparkles } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

const EXPORTS = [
  { key: 'Plots',  label: 'Export Plots',       Icon: Image },
  { key: 'CSV',    label: 'Export CSV Data',     Icon: FileSpreadsheet },
  { key: 'JSON',   label: 'Export JSON Results', Icon: FileJson },
  { key: 'Report', label: 'Export PDF Report',   Icon: FileText },
] as const;

export const ExportResultsPanel: React.FC = () => {
  const { results, status } = useSimulationStore();
  const [toast, setToast] = useState<string | null>(null);

  const hasResults = status === 'success' && results !== null;

  const handleExport = (key: string) => {
    if (!hasResults) return;
    setToast(key);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-3 pt-1" id="export-results-section">
      {/* Status badge */}
      {hasResults && (
        <div className="flex justify-end">
          <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Results Ready
          </span>
        </div>
      )}

      {/* Buttons */}
      <div className="relative space-y-1.5">
        {EXPORTS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => handleExport(key)}
            disabled={!hasResults}
            className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2.5 transition-all select-none ${
              hasResults
                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-500/5 hover:border-cyan-500/30 text-slate-700 dark:text-slate-200'
                : 'border-slate-100 dark:border-slate-700/50 text-slate-400 dark:text-slate-600 bg-transparent cursor-not-allowed'
            }`}
            id={`btn-export-${key.toLowerCase()}`}
          >
            <Icon className="h-4 w-4 text-cyan-500 shrink-0" />
            {label}
          </button>
        ))}

        {/* Toast */}
        {toast && (
          <div className="absolute inset-x-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-center text-[10px] text-cyan-400 font-semibold z-50">
            {toast} export coming soon — feature is being compiled.
          </div>
        )}
      </div>

      {!hasResults && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1">
          Run a simulation to enable export.
        </p>
      )}
    </div>
  );
};

export default ExportResultsPanel;
