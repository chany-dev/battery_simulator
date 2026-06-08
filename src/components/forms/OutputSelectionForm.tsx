// src/components/forms/OutputSelectionForm.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

interface VarInfo { name: string; label: string; unit: string; description: string; }
interface Category { id: string; title: string; variables: VarInfo[]; isFuture?: boolean; }

const CATEGORIES: Category[] = [
  {
    id: 'voltage', title: 'Voltage',
    variables: [{ name: 'Terminal voltage [V]', label: 'Terminal Voltage', unit: 'V', description: 'Output potential across battery terminals.' }],
  },
  {
    id: 'cell-state', title: 'Cell State',
    variables: [
      { name: 'Time [s]',     label: 'Time',    unit: 's', description: 'Simulation timeline (x-axis).' },
      { name: 'Current [A]', label: 'Current', unit: 'A', description: 'Electrical current from battery.' },
    ],
  },
  {
    id: 'concentrations', title: 'Concentrations',
    variables: [
      { name: 'X-averaged negative particle concentration [mol.m-3]', label: 'Neg Particle Conc', unit: 'mol/m³', description: 'Avg Li⁺ in negative active particles.' },
      { name: 'X-averaged positive particle concentration [mol.m-3]', label: 'Pos Particle Conc', unit: 'mol/m³', description: 'Avg Li⁺ in positive active particles.' },
    ],
  },
  { id: 'kinetics', title: 'Kinetics',  variables: [], isFuture: true },
  { id: 'stresses', title: 'Stresses',  variables: [], isFuture: true },
];

export const OutputSelectionForm: React.FC = () => {
  const { selectedVariables, toggleVariable } = useSimulationStore();
  const [open, setOpen] = useState<Record<string, boolean>>({
    voltage: true, 'cell-state': true, concentrations: true, kinetics: false, stresses: false,
  });

  return (
    <div className="space-y-2 pt-1" id="output-selection-section">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Variables
        </span>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full" id="selected-outputs-count">
          {selectedVariables.length} selected
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const isOpen = open[cat.id];
        const selected = cat.variables.filter((v) => selectedVariables.includes(v.name)).length;
        return (
          <div key={cat.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setOpen((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              id={`cat-header-${cat.id}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.title}</span>
                {cat.variables.length > 0 && (
                  <span className="text-[9px] text-slate-400">({selected}/{cat.variables.length})</span>
                )}
                {cat.isFuture && (
                  <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-wider">Soon</span>
                )}
              </div>
              {isOpen
                ? <ChevronUp   className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              }
            </button>

            {/* Content */}
            {isOpen && (
              <div className="px-3 pt-2 pb-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                {cat.variables.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                    Reserved for future outputs.
                  </p>
                ) : cat.variables.map((v) => {
                  const sel = selectedVariables.includes(v.name);
                  return (
                    <div
                      key={v.name}
                      onClick={() => toggleVariable(v.name)}
                      className={`flex items-start justify-between p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                        sel
                          ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/30'
                      }`}
                      id={`output-card-${v.name.replace(/[\s[\]]/g, '-')}`}
                    >
                      <div className="space-y-0.5 pr-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold ${sel ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {v.label}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-600">
                            {v.unit}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{v.description}</p>
                      </div>
                      <div className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-all mt-0.5 ${
                        sel ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {sel && <Check className="h-3 w-3 text-white stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OutputSelectionForm;
