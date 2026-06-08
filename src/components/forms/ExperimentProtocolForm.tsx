// src/components/forms/ExperimentProtocolForm.tsx
import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Info } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { StepType, ExperimentStep } from '../../types';

const inputClass = (err?: string) => `
  w-full rounded border p-1.5 text-xs outline-none transition-all
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-100
  ${err
    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
    : 'border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'}
`;

export const ExperimentProtocolForm: React.FC = () => {
  const { protocolSteps, addProtocolStep, removeProtocolStep, updateProtocolStep } = useSimulationStore();
  const [stepErrors, setStepErrors] = useState<Record<string, Record<string, string>>>({});

  const validate = (stepId: string, field: string, value: number) => {
    let err = '';
    if (isNaN(value)) err = 'Invalid';
    else if (field === 'dischargeRate' && (value <= 0 || value > 10)) err = '0 < C ≤ 10';
    else if (field === 'cutoffVoltage' && (value < 2.0 || value > 4.5)) err = '2.0–4.5 V';
    else if (field === 'temperature'   && (value < -50 || value > 200))  err = '-50–200 °C';
    setStepErrors((prev) => ({ ...prev, [stepId]: { ...(prev[stepId] || {}), [field]: err } }));
  };

  const handleChange = (id: string, field: keyof ExperimentStep, raw: string) => {
    const num = parseFloat(raw);
    updateProtocolStep(id, { [field]: isNaN(num) ? 0 : num });
    validate(id, field as string, num);
  };

  const activeIdx = protocolSteps.findIndex((s) => s.type === 'discharge');

  return (
    <div className="space-y-3 pt-1" id="experiment-protocols-section">

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => addProtocolStep({ type: 'discharge', dischargeRate: 1.0, cutoffVoltage: 2.8, temperature: 25, duration: 60 })}
          className="flex items-center gap-1 text-xs font-semibold text-cyan-500 hover:text-cyan-400 border border-cyan-500/30 hover:border-cyan-500 px-2.5 py-1 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 transition-all"
          id="btn-add-step"
        >
          <Plus className="h-3.5 w-3.5" /> Add Step
        </button>
      </div>

      {/* Multi-step warning */}
      {protocolSteps.length > 1 && (
        <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 dark:text-blue-300 text-[10px] flex gap-1.5">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          Only the first <span className="font-bold underline">Discharge</span> step is sent to the backend.
        </div>
      )}

      {/* Step cards */}
      {protocolSteps.map((step, idx) => {
        const isActive = step.type === 'discharge' && idx === activeIdx;
        const errs = stepErrors[step.id] || {};
        return (
          <div key={step.id} className={`rounded-xl border p-3 transition-all ${
            isActive
              ? 'border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-950/30'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 opacity-75'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-cyan-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Step {idx + 1}:</span>
                <select
                  value={step.type}
                  onChange={(e) => updateProtocolStep(step.id, { type: e.target.value as StepType })}
                  className="bg-transparent border-0 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-0 cursor-pointer capitalize p-0"
                >
                  <option value="discharge">Discharge</option>
                  <option value="charge" disabled>Charge</option>
                  <option value="rest"   disabled>Rest</option>
                </select>
              </div>
              {protocolSteps.length > 1 && (
                <button
                  onClick={() => removeProtocolStep(step.id)}
                  className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {step.type === 'discharge' && (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { field: 'dischargeRate', label: 'C-Rate',   tip: 'Discharge rate in C.' },
                  { field: 'cutoffVoltage', label: 'Cutoff V', tip: 'Stop voltage in V.' },
                  { field: 'temperature',   label: 'Temp °C',  tip: 'Cell temperature.' },
                ] as const).map(({ field, label, tip }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                      {label}
                      <span title={tip}><HelpCircle className="h-3 w-3" /></span>
                    </label>
                    <input
                      type="number" step="0.1"
                      value={step[field as keyof ExperimentStep] as number || ''}
                      onChange={(e) => handleChange(step.id, field, e.target.value)}
                      className={inputClass(errs[field])}
                    />
                    {errs[field] && <p className="text-[9px] text-red-500">{errs[field]}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExperimentProtocolForm;
