import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Info } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import type { StepType, ExperimentStep } from '../types';

export const ExperimentProtocolForm: React.FC = () => {
  const { protocolSteps, addProtocolStep, removeProtocolStep, updateProtocolStep } = useSimulationStore();
  const [stepErrors, setStepErrors] = useState<Record<string, Record<string, string>>>({});

  const validateField = (stepId: string, field: string, value: number) => {
    let error = '';
    if (isNaN(value)) {
      error = 'Invalid number';
    } else {
      if (field === 'dischargeRate') {
        if (value <= 0 || value > 10) error = 'C-rate must be > 0 and \u2264 10';
      } else if (field === 'cutoffVoltage') {
        if (value < 2.0 || value > 4.5) error = 'Voltage must be between 2.0V and 4.5V';
      } else if (field === 'temperature') {
        if (value < -50 || value > 200) error = 'Temp must be between -50\u00b0C and 200\u00b0C';
      }
    }

    setStepErrors(prev => ({
      ...prev,
      [stepId]: {
        ...(prev[stepId] || {}),
        [field]: error
      }
    }));
  };

  const handleFieldChange = (id: string, field: keyof ExperimentStep, valStr: string) => {
    const numericVal = parseFloat(valStr);
    updateProtocolStep(id, { [field]: isNaN(numericVal) ? 0 : numericVal });
    validateField(id, field, numericVal);
  };

  const handleAddStep = () => {
    addProtocolStep({
      type: 'discharge',
      dischargeRate: 1.0,
      cutoffVoltage: 2.8,
      temperature: 25.0,
      duration: 60
    });
  };

  // Find the first discharge step which represents the active simulation protocol in the current backend
  const activeDischargeIndex = protocolSteps.findIndex(s => s.type === 'discharge');

  return (
    <div className="space-y-4" id="experiment-protocols-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Experiment Protocols
        </h3>
        <button
          onClick={handleAddStep}
          className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 font-medium transition-colors border border-cyan-500/30 hover:border-cyan-500 px-2.5 py-1 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10"
          id="btn-add-step"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Step
        </button>
      </div>

      {/* Info notice about current backend capabilities */}
      {protocolSteps.length > 1 && (
        <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] leading-relaxed flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
          <div>
            <span className="font-semibold">Multi-step protocol warning:</span> The current SPM simulator backend models a single continuous discharge. The simulator will execute using the first <span className="font-semibold underline">Discharge</span> step in the list (highlighted in cyan).
          </div>
        </div>
      )}

      {/* Timeline visualization */}
      {protocolSteps.length > 0 && (
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40">
          <p className="text-[10px] font-semibold text-slate-400 mb-3 uppercase tracking-wider">Protocol Timeline</p>
          <div className="flex items-center flex-wrap gap-2">
            {protocolSteps.map((step, index) => {
              const isExecuted = step.type === 'discharge' && index === activeDischargeIndex;
              return (
                <React.Fragment key={step.id}>
                  <div 
                    className={`flex flex-col px-3 py-2 rounded-lg border text-center transition-all ${
                      isExecuted
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-medium shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-400'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider opacity-60">Step {index + 1}</span>
                    <span className="text-xs font-semibold capitalize">{step.type}</span>
                    {step.type === 'discharge' && (
                      <span className="text-[9px] mt-0.5">{step.dischargeRate}C / {step.cutoffVoltage}V</span>
                    )}
                  </div>
                  {index < protocolSteps.length - 1 && (
                    <div className="h-px w-4 bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {protocolSteps.map((step, index) => {
          const isExecuted = step.type === 'discharge' && index === activeDischargeIndex;
          const errors = stepErrors[step.id] || {};

          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border transition-all ${
                isExecuted
                  ? 'border-cyan-500/40 bg-white dark:bg-slate-800/50 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 opacity-70 hover:opacity-95'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isExecuted ? 'bg-cyan-500' : 'bg-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Step {index + 1}:
                  </span>
                  <select
                    value={step.type}
                    onChange={(e) => updateProtocolStep(step.id, { type: e.target.value as StepType })}
                    className="bg-transparent border-0 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-0 cursor-pointer p-0 capitalize"
                  >
                    <option value="discharge">Discharge</option>
                    <option value="charge" disabled>Charge (Coming Soon)</option>
                    <option value="rest" disabled>Rest (Coming Soon)</option>
                  </select>
                </div>
                {protocolSteps.length > 1 && (
                  <button
                    onClick={() => removeProtocolStep(step.id)}
                    className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                    title="Remove step"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {step.type === 'discharge' ? (
                <div className="grid grid-cols-3 gap-2">
                  {/* Discharge Rate */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                      C-Rate
                      <span title="Discharge rate in C. 1C drains the battery in 1 hour.">
                        <HelpCircle className="h-3 w-3 text-slate-500" />
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={step.dischargeRate || ''}
                      onChange={(e) => handleFieldChange(step.id, 'dischargeRate', e.target.value)}
                      className={`w-full rounded border bg-transparent p-1.5 text-xs outline-none ${
                        errors.dischargeRate ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-cyan-500'
                      }`}
                    />
                    {errors.dischargeRate && (
                      <p className="text-[9px] text-red-500">{errors.dischargeRate}</p>
                    )}
                  </div>

                  {/* Cutoff Voltage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                      Cutoff [V]
                      <span title="Voltage at which simulation stops.">
                        <HelpCircle className="h-3 w-3 text-slate-500" />
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={step.cutoffVoltage || ''}
                      onChange={(e) => handleFieldChange(step.id, 'cutoffVoltage', e.target.value)}
                      className={`w-full rounded border bg-transparent p-1.5 text-xs outline-none ${
                        errors.cutoffVoltage ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-cyan-500'
                      }`}
                    />
                    {errors.cutoffVoltage && (
                      <p className="text-[9px] text-red-500">{errors.cutoffVoltage}</p>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                      Temp [°C]
                      <span title="Simulation cell temperature.">
                        <HelpCircle className="h-3 w-3 text-slate-500" />
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={step.temperature || ''}
                      onChange={(e) => handleFieldChange(step.id, 'temperature', e.target.value)}
                      className={`w-full rounded border bg-transparent p-1.5 text-xs outline-none ${
                        errors.temperature ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-cyan-500'
                      }`}
                    />
                    {errors.temperature && (
                      <p className="text-[9px] text-red-500">{errors.temperature}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-[10px] text-slate-400">
                  Select parameters for this experimental step.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ExperimentProtocolForm;
