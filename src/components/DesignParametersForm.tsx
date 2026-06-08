import React, { useState } from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const DesignParametersForm: React.FC = () => {
  const { designParameters, setDesignParameters, resetDesignParameters } = useSimulationStore();
  const [errors, setErrors] = useState<{ rn?: string; rp?: string }>({});

  const validate = (name: 'rn' | 'rp', value: number) => {
    let errMsg = '';
    // 1e-6 m to 2e-5 m equals 1.0 um to 20.0 um
    if (isNaN(value)) {
      errMsg = 'Must be a valid number';
    } else if (value < 1.0 || value > 20.0) {
      errMsg = 'Must be between 1.0 and 20.0 \u03bcm';
    }
    setErrors(prev => ({ ...prev, [name]: errMsg }));
    return errMsg === '';
  };

  const handleInputChange = (field: 'negativeParticleRadius' | 'positiveParticleRadius', valStr: string) => {
    const numericVal = parseFloat(valStr);
    const errField = field === 'negativeParticleRadius' ? 'rn' : 'rp';
    
    // Update store even if invalid so user can see what they type, but validation holds run
    setDesignParameters({ [field]: isNaN(numericVal) ? 0 : numericVal });
    validate(errField, numericVal);
  };

  const handleReset = () => {
    resetDesignParameters();
    setErrors({});
  };

  return (
    <div className="space-y-4" id="design-parameters-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Design Parameters
        </h3>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
          title="Reset to defaults"
          id="btn-reset-params"
        >
          <RefreshCw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-4">
        {/* Negative Particle Radius */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="negative-radius-input" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              Negative Particle Radius
              <div className="group relative">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help hover:text-slate-300" />
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-900 p-2 text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 shadow-lg font-normal">
                  Radius of the negative electrode active material particles ($R_n$). Range: 1.0 to 20.0 &mu;m.
                </div>
              </div>
            </label>
            <span className="text-[10px] text-slate-400">Limit: 1 - 20 &mu;m</span>
          </div>
          <div className="relative flex rounded-lg shadow-sm">
            <input
              type="number"
              step="0.1"
              id="negative-radius-input"
              value={designParameters.negativeParticleRadius || ''}
              onChange={(e) => handleInputChange('negativeParticleRadius', e.target.value)}
              className={`w-full rounded-l-lg border bg-transparent p-2 text-sm outline-none focus:ring-1 transition-all ${
                errors.rn 
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
              }`}
              placeholder="e.g. 10"
            />
            <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-500 font-semibold select-none">
              &mu;m
            </span>
          </div>
          {errors.rn && (
            <p className="text-[10px] font-medium text-red-500" id="rn-error">{errors.rn}</p>
          )}
        </div>

        {/* Positive Particle Radius */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="positive-radius-input" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              Positive Particle Radius
              <div className="group relative">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help hover:text-slate-300" />
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-900 p-2 text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 shadow-lg font-normal">
                  Radius of the positive electrode active material particles ($R_p$). Range: 1.0 to 20.0 &mu;m.
                </div>
              </div>
            </label>
            <span className="text-[10px] text-slate-400">Limit: 1 - 20 &mu;m</span>
          </div>
          <div className="relative flex rounded-lg shadow-sm">
            <input
              type="number"
              step="0.1"
              id="positive-radius-input"
              value={designParameters.positiveParticleRadius || ''}
              onChange={(e) => handleInputChange('positiveParticleRadius', e.target.value)}
              className={`w-full rounded-l-lg border bg-transparent p-2 text-sm outline-none focus:ring-1 transition-all ${
                errors.rp 
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
              }`}
              placeholder="e.g. 10"
            />
            <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-500 font-semibold select-none">
              &mu;m
            </span>
          </div>
          {errors.rp && (
            <p className="text-[10px] font-medium text-red-500" id="rp-error">{errors.rp}</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default DesignParametersForm;
