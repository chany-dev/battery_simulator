// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import {
  Sliders, Beaker, TrendingUp, PlayCircle, Download,
  ChevronDown, ChevronRight, BatteryCharging, X,
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { DesignParametersForm } from '../forms/DesignParametersForm';
import { ExperimentProtocolForm } from '../forms/ExperimentProtocolForm';
import { OutputSelectionForm } from '../forms/OutputSelectionForm';
import { SimulationRunPanel } from '../forms/SimulationRunPanel';
import { ExportResultsPanel } from '../forms/ExportResultsPanel';

interface SidebarProps {
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}

interface SectionDef {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenOnMobile, onCloseMobile }) => {
  const { isSidebarCollapsed, selectedModel, setSelectedModel } = useSimulationStore();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    parameters: true,
    protocols: false,
    outputs: true,
    run: true,
    export: false,
  });

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const sections: SectionDef[] = [
    { id: 'parameters', label: 'Design Parameters',     Icon: Sliders,     content: <DesignParametersForm /> },
    { id: 'protocols',  label: 'Experiment Protocol',   Icon: Beaker,      content: <ExperimentProtocolForm /> },
    { id: 'outputs',    label: 'Output Variables',      Icon: TrendingUp,  content: <OutputSelectionForm /> },
    { id: 'run',        label: 'Run Simulation',        Icon: PlayCircle,  content: <SimulationRunPanel /> },
    { id: 'export',     label: 'Export Results',        Icon: Download,    content: <ExportResultsPanel /> },
  ];

  const body = (
    <div className="h-full flex flex-col" id="sidebar-container">

      {/* ── Brand header ─────────────────────────────────── */}
      <div className="
        px-4 py-4 flex items-center justify-between shrink-0
        border-b border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-900
      ">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <BatteryCharging className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-50 leading-none">ElectroSim</p>
            <p className="text-[9px] font-bold text-cyan-500 tracking-widest uppercase mt-0.5">Simulation Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Model selector ───────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 shrink-0 bg-white dark:bg-slate-900">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1.5">
          Battery Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="
            w-full text-xs font-semibold rounded-lg px-3 py-2 outline-none
            border border-slate-200 dark:border-slate-600
            bg-slate-50 dark:bg-slate-800
            text-slate-800 dark:text-slate-100
            focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500
            transition-colors
          "
          id="model-selector"
        >
          <option value="SPM">SPM — Single Particle Model</option>
          <option value="SPMe" disabled>SPMe — (coming soon)</option>
          <option value="DFN"  disabled>DFN — Doyle Fuller Newman (coming soon)</option>
        </select>
      </div>

      {/* ── Accordion sections ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 bg-white dark:bg-slate-900">
        {sections.map(({ id, label, Icon, content }) => {
          const isOpen = expanded[id];
          return (
            <div
              key={id}
              className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              {/* Section header */}
              <button
                onClick={() => toggle(id)}
                className="
                  w-full flex items-center justify-between px-3 py-2.5 text-left
                  bg-slate-50 dark:bg-slate-800/60
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-colors select-none
                "
                id={`sidebar-section-${id}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isOpen
                      ? 'bg-cyan-500/10 text-cyan-500'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</span>
                </div>
                {isOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                }
              </button>

              {/* Section content */}
              {isOpen && (
                <div className="px-3 pb-3 pt-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  {content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="
        px-4 py-2.5 shrink-0 text-center
        border-t border-slate-200 dark:border-slate-700
        bg-slate-50 dark:bg-slate-800/50
      ">
        <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
          ElectroSim v1.0 · PyBaMM Core Engine
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop permanent sidebar ─────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col h-screen shrink-0
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-700
          transition-all duration-300 overflow-hidden
          ${isSidebarCollapsed ? 'w-0 border-r-0' : 'w-[300px]'}
        `}
      >
        <div className="w-[300px] h-full">{body}</div>
      </aside>

      {/* ── Mobile backdrop ───────────────────────────── */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden"
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-[300px] h-full z-[101] shadow-2xl
          flex flex-col md:hidden transition-transform duration-300
          bg-white dark:bg-slate-900
          ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {body}
      </aside>
    </>
  );
};

export default Sidebar;
