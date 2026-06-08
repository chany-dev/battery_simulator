// src/components/plots/PlotDashboard.tsx
import React from 'react';
import { Info, Sparkles, Activity, Columns } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ScientificPlot } from './ScientificPlot';
import { ParticleConcentrationPlot } from './ParticleConcentrationPlot';
import { BatteryCellAnimation } from './BatteryCellAnimation';

/* ── Plot categories ──────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'voltage',        label: 'Voltage',         vars: ['Terminal voltage [V]'] },
  { id: 'cell-state',     label: 'Cell State',       vars: ['Current [A]'] },
  { id: 'concentrations', label: 'Concentrations',   vars: [
    'X-averaged negative particle concentration [mol.m-3]',
    'X-averaged positive particle concentration [mol.m-3]',
  ]},
  { id: 'animation',      label: '⚡ Cell Animation', vars: [] }
];

export const PlotDashboard: React.FC = () => {
  const {
    results, status, selectedVariables, theme,
    isSplitView,
    leftActiveTab, rightActiveTab,
    setLeftActiveTab, setRightActiveTab,
  } = useSimulationStore();

  const isIdle       = status === 'idle' && !results;
  const isSimulating = status === 'simulating';
  const hasResults   = !!results;

  const timeData = results?.['Time [s]'] as number[] | undefined;
  const hasTime  = !!timeData?.length;

  // Only show tabs whose variables are selected (plus animation tab if results exist)
  const activeCats = CATEGORIES.filter((cat) => {
    if (cat.id === 'animation') return hasResults;
    return cat.vars.some((v) => selectedVariables.includes(v));
  });

  const safeLeftTab  = activeCats.some((c) => c.id === leftActiveTab)
    ? leftActiveTab : (activeCats[0]?.id ?? '');
  const safeRightTab = activeCats.some((c) => c.id === rightActiveTab)
    ? rightActiveTab : (activeCats[1]?.id ?? activeCats[0]?.id ?? '');

  /* ── helpers ─────────────────────────────────────────────── */
  const getPlotData = (varName: string) =>
    results && selectedVariables.includes(varName) ? results[varName] : undefined;

  const getXAxis = (len: number) =>
    hasTime && timeData
      ? { xData: timeData, label: 'Time [s]' }
      : { xData: Array.from({ length: len }, (_, i) => i), label: 'Step' };

  // Memoized traces to prevent recreation on every activeTimeIndex update (hover/scrub)
  const voltageTraces = React.useMemo(() => {
    if (!results) return [];
    const voltage = results['Terminal voltage [V]'] as number[] | undefined;
    if (!voltage) return [];
    const { xData } = getXAxis(voltage.length);
    return [{ xData, yData: voltage, name: 'Terminal Voltage [V]', color: '#10B981' }];
  }, [results]);

  const cellStateTraces = React.useMemo(() => {
    if (!results) return [];
    const current = results['Current [A]'] as number[] | undefined;
    if (!current) return [];
    const { xData } = getXAxis(current.length);
    return [{ xData, yData: current, name: 'Current [A]', color: '#3B82F6' }];
  }, [results]);

  const concentrationTraces = React.useMemo(() => {
    if (!results) return [];
    const neg = results['X-averaged negative particle concentration [mol.m-3]'];
    const pos = results['X-averaged positive particle concentration [mol.m-3]'];
    const traces = [];
    if (neg) {
      traces.push({
        xData: timeData || [],
        yData: neg as number[][],
        name: 'Negative Electrode Concentration',
        color: '#06B6D4'
      });
    }
    if (pos) {
      traces.push({
        xData: timeData || [],
        yData: pos as number[][],
        name: 'Positive Electrode Concentration',
        color: '#F59E0B'
      });
    }
    return traces;
  }, [results, timeData]);

  const legacyConcentrationTraces = React.useMemo(() => {
    if (!results) return { traces: [], len: 0 };
    const neg = results['X-averaged negative particle concentration [mol.m-3]'];
    const pos = results['X-averaged positive particle concentration [mol.m-3]'];
    const traces = [];
    let len = 0;
    if (neg && !Array.isArray(neg[0])) {
      const rawNeg = neg as number[];
      len = rawNeg.length;
      traces.push({
        xData: getXAxis(len).xData,
        yData: rawNeg,
        name: 'Neg Conc',
        color: '#06B6D4'
      });
    }
    if (pos && !Array.isArray(pos[0])) {
      const rawPos = pos as number[];
      len = rawPos.length;
      traces.push({
        xData: getXAxis(len).xData,
        yData: rawPos,
        name: 'Pos Conc',
        color: '#F59E0B'
      });
    }
    return { traces, len };
  }, [results]);

  /* ── render one tab pane ─────────────────────────────────── */
  const renderTabContent = (catId: string) => {
    if (!results) return null;

    if (catId === 'voltage') {
      if (voltageTraces.length > 0) {
        return (
          <ScientificPlot
            title="Terminal Voltage Discharge Curve"
            traces={voltageTraces}
            xLabel={results?.['Time [s]'] ? 'Time [s]' : 'Step'}
            yLabel="Voltage [V]"
            theme={theme}
          />
        );
      }
    }

    if (catId === 'cell-state') {
      if (cellStateTraces.length > 0) {
        return (
          <ScientificPlot
            title="Simulation Current Profile"
            traces={cellStateTraces}
            xLabel={results?.['Time [s]'] ? 'Time [s]' : 'Step'}
            yLabel="Current [A]"
            theme={theme}
          />
        );
      }
    }

    if (catId === 'concentrations') {
      const neg = results['X-averaged negative particle concentration [mol.m-3]'];
      const pos = results['X-averaged positive particle concentration [mol.m-3]'];
      if (neg || pos) {
        const is2D = (neg && Array.isArray(neg[0])) || (pos && Array.isArray(pos[0]));
        if (is2D) {
          return (
            <ParticleConcentrationPlot
              title="Active Particle Lithium Concentration"
              traces={concentrationTraces}
              xLabel="Time [s]"
              yLabel="Particle Radial Coordinate (r)"
              theme={theme}
            />
          );
        }

        const { traces, len } = legacyConcentrationTraces;
        return (
          <ScientificPlot
            title="X-averaged Particle Concentration"
            traces={traces}
            xLabel={getXAxis(len).label}
            yLabel="Concentration [mol/m³]"
            theme={theme}
          />
        );
      }
    }

    if (catId === 'animation') {
      return <BatteryCellAnimation />;
    }

    return (
      <div className="flex-1 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-400 py-16">
        No variables selected for this tab.
      </div>
    );
  };

  /* ── tab switcher ────────────────────────────────────────── */
  const TabSwitcher = ({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) => (
    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 pb-2 shrink-0 overflow-x-auto">
      {activeCats.map((cat) => {
        const active = cat.id === activeId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
              active
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );

  /* ── empty panel wrapper ─────────────────────────────────── */
  const EmptyPanel = ({ icon: Icon, title, description, pills }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    pills?: { Icon: React.ComponentType<{ className?: string }>; label: string }[];
  }) => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center text-center max-w-sm w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 bg-white dark:bg-slate-800/20">
        <div className="h-14 w-14 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-cyan-500 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{description}</p>
        {pills && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {pills.map(({ Icon: PIcon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <PIcon className="h-3.5 w-3.5 text-cyan-500" />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0 min-w-0 bg-slate-50 dark:bg-slate-950" id="plot-dashboard">

      {/* ── Idle state ──────────────────────────────────── */}
      {isIdle && (
        <EmptyPanel
          icon={Activity}
          title="Ready for Simulation"
          description="Configure parameters in the sidebar, select output variables, then click Run Simulation."
          pills={[
            { Icon: Sparkles, label: 'PyBaMM Solver' },
            { Icon: Info,     label: 'ECharts + D3' },
          ]}
        />
      )}

      {/* ── Simulating loader ────────────────────────────── */}
      {isSimulating && (
        <EmptyPanel
          icon={Activity}
          title="Solving Physics Model…"
          description="Integrating lithium-ion transport equations. This typically completes in 1–3 seconds."
        />
      )}

      {/* ── Results layout ──────────────────────────────── */}
      {hasResults && (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col md:flex-row">

          {/* Panel A */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col p-4 md:p-6 gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-500" />
              {isSplitView ? 'Panel A' : 'Simulation Results'}
            </span>
            {activeCats.length > 0 && (
              <TabSwitcher activeId={safeLeftTab} onSelect={setLeftActiveTab} />
            )}
            <div className="flex-1 overflow-y-auto">
              {renderTabContent(safeLeftTab)}
            </div>
          </div>

          {/* Panel B (split view) */}
          {isSplitView && (
            <div className="flex-1 min-h-0 min-w-0 flex flex-col p-4 md:p-6 gap-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Columns className="h-3.5 w-3.5 text-cyan-500" />
                Panel B
              </span>
              {activeCats.length > 0 && (
                <TabSwitcher activeId={safeRightTab} onSelect={setRightActiveTab} />
              )}
              <div className="flex-1 overflow-y-auto">
                {renderTabContent(safeRightTab)}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default PlotDashboard;
