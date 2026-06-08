import React, { useState } from 'react';
import { 
  Sliders, 
  Beaker, 
  TrendingUp, 
  PlayCircle, 
  Download, 
  ChevronDown, 
  ChevronRight,
  BatteryCharging,
  X
} from 'lucide-react';
import { DesignParametersForm } from './DesignParametersForm';
import { ExperimentProtocolForm } from './ExperimentProtocolForm';
import { OutputSelectionForm } from './OutputSelectionForm';
import { SimulationRunPanel } from './SimulationRunPanel';
import { ExportResultsPanel } from './ExportResultsPanel';
import { ThemeToggle } from './ThemeToggle';
import { useSimulationStore } from '../store/useSimulationStore';


interface SidebarProps {
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenOnMobile, onCloseMobile }) => {
  const { isSidebarCollapsed, selectedModel, setSelectedModel } = useSimulationStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    parameters: true,
    protocols: true,
    outputs: true,
    run: true,
    export: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sectionHeader = (
    id: string, 
    label: string, 
    Icon: React.ComponentType<any>, 
    isExpanded: boolean
  ) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between px-3 py-2 text-left bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 rounded-xl transition-all border border-slate-200/50 dark:border-slate-800/50 select-none group"
      id={`sidebar-header-${id}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg border transition-colors ${
          isExpanded 
            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' 
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-cyan-500'
        }`}>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {label}
        </span>
      </div>
      {isExpanded ? (
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      )}
    </button>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between" id="sidebar-container">
      {/* Header and Branding */}
      <div className="px-4 py-5 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-cyan-500/10">
            <BatteryCharging className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-50">ElectroSim</span>
            <span className="text-[9px] font-semibold text-cyan-500 tracking-widest uppercase">SPM Simulator</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Close button for mobile menu */}
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="px-4 pt-4">
        <select className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
          <option>SPM Model</option>
          <option>DFN Model</option>
          <option>SPMe Model</option>
        </select>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Section 1: Design Parameters */}
        <div className="space-y-2">
          {sectionHeader('parameters', 'Design Parameters', Sliders, expandedSections.parameters)}
          {expandedSections.parameters && <DesignParametersForm />}
        </div>

        {/* Section 2: Experiment Protocols */}
        <div className="space-y-2">
          {sectionHeader('protocols', 'Experiment Protocols', Beaker, expandedSections.protocols)}
          {expandedSections.protocols && <ExperimentProtocolForm />}
        </div>

        {/* Section 3: Output Selection */}
        <div className="space-y-2">
          {sectionHeader('outputs', 'Output Selection', TrendingUp, expandedSections.outputs)}
          {expandedSections.outputs && <OutputSelectionForm />}
        </div>

        {/* Section 4: Run Simulation */}
        <div className="space-y-2">
          {sectionHeader('run', 'Run Simulation', PlayCircle, expandedSections.run)}
          {expandedSections.run && <SimulationRunPanel />}
        </div>

        {/* Section 5: Export Results */}
        <div className="space-y-2">
          {sectionHeader('export', 'Export Results', Download, expandedSections.export)}
          {expandedSections.export && <ExportResultsPanel />}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 text-center">
        <p className="text-[9px] font-medium text-slate-400">
          ElectroSim v1.0.0 &bull; PyBamm Core Engine
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside 
        className={`hidden md:flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 select-none shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-[300px]'
        }`}
      >
        <div className="w-[300px] h-full flex flex-col justify-between">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenOnMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden animate-fadeIn"
        />
      )}

      {/* Mobile Drawer Container */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[300px] h-full bg-white dark:bg-slate-900 z-[101] shadow-2xl flex flex-col md:hidden transition-transform duration-300 ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
export default Sidebar;
