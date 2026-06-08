import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const SimulationRunPanel: React.FC = () => {
  const { 
    runSimulation, 
    isRunning, 
    status, 
    errorMessage, 
    selectedVariables,
    designParameters,
    protocolSteps,
    clearResults
  } = useSimulationStore();
  const [runTime, setRunTime] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  // Timer effect to track simulation time
  useEffect(() => {
    if (isRunning) {
      const start = Date.now();
      const interval = setInterval(() => {
        setRunTime((Date.now() - start) / 1000);
      }, 100);
      setTimerInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isRunning]);

  // Reset timer on run start
  useEffect(() => {
    if (isRunning) {
      setRunTime(0);
    }
  }, [isRunning]);

  // Quick frontend validation check to block submission
  const hasErrors = 
    designParameters.negativeParticleRadius < 1.0 || designParameters.negativeParticleRadius > 20.0 ||
    designParameters.positiveParticleRadius < 1.0 || designParameters.positiveParticleRadius > 20.0 ||
    protocolSteps.some(s => s.type === 'discharge' && (s.dischargeRate <= 0 || s.dischargeRate > 10 || s.cutoffVoltage < 2.0 || s.cutoffVoltage > 4.5 || s.temperature < -50 || s.temperature > 200)) ||
    selectedVariables.length === 0;

  const handleRun = () => {
    if (hasErrors || isRunning) return;
    runSimulation();
  };

  return (
    <div className="space-y-4" id="run-simulation-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Run Simulation
        </h3>
        {status !== 'idle' && (
          <button
            onClick={clearResults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 font-medium transition-colors"
            title="Reset simulation status"
          >
            <RefreshCcw className="h-3 w-3" />
            Reset Status
          </button>
        )}
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
        {/* Large Prominent Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning || hasErrors}
          className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 select-none ${
            isRunning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : hasErrors
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed border border-slate-400/10'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold shadow-lg shadow-cyan-500/20 active:scale-[0.98] animate-pulse-cyan'
          }`}
          id="btn-run-simulation"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Simulating ({runTime.toFixed(1)}s)
            </>
          ) : (
            <>
              <Play className="h-4.5 w-4.5 fill-current" />
              Run Simulation
            </>
          )}
        </button>

        {/* Error / Warning info if inputs are invalid */}
        {hasErrors && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 dark:text-yellow-400 text-[10px] leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              Please fix parameter validation errors or select at least one output variable before executing the simulation.
            </div>
          </div>
        )}

        {/* Status notifications */}
        {status === 'simulating' && (
          <div className="p-3.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Executing SPMSimulator...</span>
              <span className="text-[10px] opacity-80">Solving electrochemical differential equations in PyBamm backend.</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="p-3.5 rounded-lg border border-green-500/20 bg-green-500/5 text-green-500 text-xs flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
            <div className="flex flex-col">
              <span className="font-semibold">Simulation Succeeded</span>
              <span className="text-[10px] opacity-80">Solved successfully in {runTime.toFixed(2)}s. Interactive plots generated.</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex flex-col">
              <span className="font-semibold">Simulation Failed</span>
              <span className="text-[10px] opacity-80 break-all">{errorMessage || 'An error occurred during runtime.'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SimulationRunPanel;
