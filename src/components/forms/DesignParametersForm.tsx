// src/components/forms/DesignParametersForm.tsx
import React, { useState } from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

const fieldClass = (error?: string) => `
  w-full rounded-l-lg border p-2 text-sm outline-none transition-all
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  ${error
    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
    : 'border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40'}
`;

export const DesignParametersForm: React.FC = () => {
  const { designParameters, setDesignParameters, resetDesignParameters } = useSimulationStore();
  const [errors, setErrors] = useState<{ rn?: string; rp?: string }>({});

  const validate = (key: 'rn' | 'rp', val: number) => {
    const msg = isNaN(val) ? 'Must be a number' : val < 1 || val > 20 ? 'Must be 1–20 µm' : '';
    setErrors((prev) => ({ ...prev, [key]: msg }));
    return msg === '';
  };

  const handleChange = (field: 'negativeParticleRadius' | 'positiveParticleRadius', raw: string) => {
    const num = parseFloat(raw);
    setDesignParameters({ [field]: isNaN(num) ? 0 : num });
    validate(field === 'negativeParticleRadius' ? 'rn' : 'rp', num);
  };

  return (
    <div className="space-y-4 pt-1" id="design-parameters-section">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Particle Radii
        </span>
        <button
          onClick={() => { resetDesignParameters(); setErrors({}); }}
          className="flex items-center gap-1 text-xs font-medium text-cyan-500 hover:text-cyan-400 transition-colors"
          id="btn-reset-params"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </button>
      </div>

      {([ 
        { field: 'negativeParticleRadius', errKey: 'rn', label: 'Negative Electrode', id: 'negative-radius-input' },
        { field: 'positiveParticleRadius', errKey: 'rp', label: 'Positive Electrode', id: 'positive-radius-input' },
      ] as const).map(({ field, errKey, label, id }) => (
        <div key={field} className="space-y-1">
          <div className="flex items-center gap-1">
            <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {label}
            </label>
            <div className="group relative">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-lg bg-slate-900 p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                Particle radius in µm. Valid range: 1.0–20.0 µm.
              </div>
            </div>
          </div>
          <div className="flex rounded-lg overflow-hidden shadow-sm">
            <input
              type="number" step="0.1" id={id}
              value={designParameters[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              className={fieldClass(errors[errKey])}
              placeholder="e.g. 10"
            />
            <span className="flex items-center px-3 text-xs font-bold border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 select-none">
              µm
            </span>
          </div>
          {errors[errKey] && <p className="text-[10px] text-red-500" id={`${errKey}-error`}>{errors[errKey]}</p>}
        </div>
      ))}
    </div>
  );
};

export default DesignParametersForm;
