import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

interface OutputVariableInfo {
  name: string;
  label: string;
  unit: string;
  description: string;
}

interface OutputCategory {
  id: string;
  title: string;
  variables: OutputVariableInfo[];
  isFuturePlaceholder?: boolean;
}

const CATEGORIES: OutputCategory[] = [
  {
    id: 'voltage',
    title: 'Voltage',
    variables: [
      {
        name: 'Terminal voltage [V]',
        label: 'Terminal Voltage',
        unit: 'V',
        description: 'Output potential difference across the battery terminals.',
      },
    ],
  },
  {
    id: 'cell-state',
    title: 'Cell State',
    variables: [
      {
        name: 'Time [s]',
        label: 'Time',
        unit: 's',
        description: 'Simulation timeline.',
      },
      {
        name: 'Current [A]',
        label: 'Current',
        unit: 'A',
        description: 'Electrical current flowing out of the battery.',
      },
    ],
  },
  {
    id: 'concentrations',
    title: 'Concentrations',
    variables: [
      {
        name: 'X-averaged negative particle concentration [mol.m-3]',
        label: 'Neg Particle Concentration',
        unit: 'mol/m\u00b3',
        description: 'Average concentration of lithium ions within negative active particles.',
      },
      {
        name: 'X-averaged positive particle concentration [mol.m-3]',
        label: 'Pos Particle Concentration',
        unit: 'mol/m\u00b3',
        description: 'Average concentration of lithium ions within positive active particles.',
      },
    ],
  },
  {
    id: 'kinetics',
    title: 'Kinetics',
    variables: [],
    isFuturePlaceholder: true,
  },
  {
    id: 'stresses',
    title: 'Stresses',
    variables: [],
    isFuturePlaceholder: true,
  },
];

export const OutputSelectionForm: React.FC = () => {
  const { selectedVariables, toggleVariable } = useSimulationStore();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    voltage: true,
    'cell-state': true,
    concentrations: true,
    kinetics: false,
    stresses: false,
  });

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCardClick = (variableName: string) => {
    toggleVariable(variableName);
  };

  return (
    <div className="space-y-4" id="output-selection-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Output Selection
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full" id="selected-outputs-count">
          Selected: {selectedVariables.length}
        </span>
      </div>

      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const isExpanded = expandedCats[cat.id];
          const hasVariables = cat.variables.length > 0;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 overflow-hidden transition-all duration-200"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                id={`cat-header-${cat.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {cat.title}
                  </span>
                  {hasVariables && (
                    <span className="text-[9px] text-slate-400">
                      ({cat.variables.filter((v) => selectedVariables.includes(v.name)).length}/{cat.variables.length})
                    </span>
                  )}
                  {cat.isFuturePlaceholder && (
                    <span className="text-[9px] text-cyan-500 font-semibold uppercase tracking-widest">
                      Future
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-2">
                  {hasVariables ? (
                    <div className="grid grid-cols-1 gap-2">
                      {cat.variables.map((v) => {
                        const isSelected = selectedVariables.includes(v.name);
                        return (
                          <div
                            key={v.name}
                            onClick={() => handleCardClick(v.name)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all-200 flex items-start justify-between select-none ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500/5 text-cyan-500 dark:text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.05)]'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                            id={`output-card-${v.name.replace(/\s+/g, '-').replace(/[\[\]]/g, '')}`}
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {v.label}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700/50">
                                  {v.unit}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight">
                                {v.description}
                              </p>
                            </div>
                            <div className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500 text-white'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-[10px] font-medium text-slate-400">
                        Reserved for future extension outputs.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default OutputSelectionForm;
