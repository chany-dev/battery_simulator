import React, { useState } from 'react';
import { FileSpreadsheet, FileJson, FileText, Image, Sparkles } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const ExportResultsPanel: React.FC = () => {
  const { results, status } = useSimulationStore();
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const hasResults = status === 'success' && results !== null;

  const handleExport = (format: string) => {
    if (!hasResults) return;
    
    // UI only for now: show Toast notice
    setActiveToast(format);
    setTimeout(() => {
      setActiveToast(null);
    }, 3000);
  };

  return (
    <div className="space-y-4" id="export-results-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Export Results
        </h3>
        {hasResults && (
          <span className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-0.5">
            <Sparkles className="h-2.5 w-2.5" />
            Ready
          </span>
        )}
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2 relative">
        {/* Export Plots */}
        <button
          onClick={() => handleExport('Plots')}
          disabled={!hasResults}
          className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2.5 transition-all select-none ${
            hasResults
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-500/5 hover:border-cyan-500/30 text-slate-700 dark:text-slate-200'
              : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-800/10 cursor-not-allowed'
          }`}
          id="btn-export-plots"
        >
          <Image className="h-4 w-4 text-cyan-500 shrink-0" />
          <span>Export Plots</span>
        </button>

        {/* Export CSV */}
        <button
          onClick={() => handleExport('CSV')}
          disabled={!hasResults}
          className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2.5 transition-all select-none ${
            hasResults
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-500/5 hover:border-cyan-500/30 text-slate-700 dark:text-slate-200'
              : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-800/10 cursor-not-allowed'
          }`}
          id="btn-export-csv"
        >
          <FileSpreadsheet className="h-4 w-4 text-cyan-500 shrink-0" />
          <span>Export CSV Data</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={() => handleExport('JSON')}
          disabled={!hasResults}
          className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2.5 transition-all select-none ${
            hasResults
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-500/5 hover:border-cyan-500/30 text-slate-700 dark:text-slate-200'
              : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-800/10 cursor-not-allowed'
          }`}
          id="btn-export-json"
        >
          <FileJson className="h-4 w-4 text-cyan-500 shrink-0" />
          <span>Export JSON Results</span>
        </button>

        {/* Export Report */}
        <button
          onClick={() => handleExport('Report')}
          disabled={!hasResults}
          className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2.5 transition-all select-none ${
            hasResults
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-500/5 hover:border-cyan-500/30 text-slate-700 dark:text-slate-200'
              : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-800/10 cursor-not-allowed'
          }`}
          id="btn-export-report"
        >
          <FileText className="h-4 w-4 text-cyan-500 shrink-0" />
          <span>Export PDF Report</span>
        </button>

        {/* Floating Toast Notice */}
        {activeToast && (
          <div className="absolute inset-x-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-center text-[10px] text-cyan-400 font-semibold animate-bounce z-50">
            Exporting {activeToast} is coming soon! This feature is being integrated with our report compiler.
          </div>
        )}
      </div>
    </div>
  );
};
export default ExportResultsPanel;
