// src/components/forms/SimulationRunPanel.tsx
import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

export const SimulationRunPanel: React.FC = () => {
  const {
    runSimulation, isRunning, status, errorMessage,
    selectedVariables, designParameters, protocolSteps, clearResults,
  } = useSimulationStore();

  const [runTime, setRunTime] = useState(0);

  useEffect(() => {
    if (!isRunning) { setRunTime(0); return; }
    const start = Date.now();
    const iv = setInterval(() => setRunTime((Date.now() - start) / 1000), 100);
    return () => clearInterval(iv);
  }, [isRunning]);

  const hasErrors =
    designParameters.negativeParticleRadius < 1 || designParameters.negativeParticleRadius > 20 ||
    designParameters.positiveParticleRadius  < 1 || designParameters.positiveParticleRadius  > 20 ||
    protocolSteps.some((s) =>
      s.type === 'discharge' &&
      (s.dischargeRate <= 0 || s.dischargeRate > 10 || s.cutoffVoltage < 2 || s.cutoffVoltage > 4.5 || s.temperature < -50 || s.temperature > 200)
    ) ||
    selectedVariables.length === 0;

  return (
    <div className="space-y-3 pt-1" id="run-simulation-section">

      {/* Reset link */}
      {status !== 'idle' && (
        <div className="flex justify-end">
          <button
            onClick={clearResults}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <RefreshCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={() => !hasErrors && !isRunning && runSimulation()}
        disabled={isRunning || hasErrors}
        className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all select-none ${
          isRunning
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : hasErrors
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.98] animate-pulse-cyan'
        }`}
        id="btn-run-simulation"
      >
        {isRunning
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Simulating ({runTime.toFixed(1)}s)</>
          : <><Play   className="h-4 w-4 fill-current"  /> Run Simulation</>
        }
      </button>

      {/* Validation warning */}
      {hasErrors && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[10px] flex gap-1.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          Fix parameter errors or select at least one output variable.
        </div>
      )}

      {/* Status banners */}
      {status === 'simulating' && (
        <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-500 dark:text-cyan-400 text-xs flex items-center gap-2 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <div>
            <p className="font-semibold">Executing SPM Solver…</p>
            <p className="text-[10px] opacity-75">Integrating electrochemical equations via PyBaMM.</p>
          </div>
        </div>
      )}
      {status === 'success' && (
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Simulation Succeeded</p>
            <p className="text-[10px] opacity-75">Solved in {runTime.toFixed(2)}s. Interactive plots generated.</p>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Simulation Failed</p>
            <p className="text-[10px] opacity-75 break-all">{errorMessage ?? 'An unknown error occurred.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationRunPanel;
