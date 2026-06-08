// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Menu, BatteryCharging, PanelLeftClose, PanelLeftOpen, Columns } from 'lucide-react';

import { Sidebar }       from './components/layout/Sidebar';
import { PlotDashboard } from './components/plots/PlotDashboard';
import SplashScreen      from './components/ui/SplashScreen';
import { useSimulationStore } from './store/useSimulationStore';

export const App: React.FC = () => {
  const {
    theme,
    isSidebarCollapsed, setSidebarCollapsed,
    isSplitView, setSplitView,
    selectedVariables,
    isSplashVisible, setSplashVisible,
  } = useSimulationStore();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Show splash screen only once on mount
  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Split view eligibility: need ≥ 2 distinct result categories selected
  const activeCategoryCount = [
    selectedVariables.includes('Terminal voltage [V]'),
    selectedVariables.some((v) => ['Time [s]', 'Current [A]'].includes(v)),
    selectedVariables.some((v) => v.startsWith('X-averaged')),
  ].filter(Boolean).length;

  const canSplit = activeCategoryCount >= 2;

  useEffect(() => {
    if (!canSplit && isSplitView) setSplitView(false);
  }, [canSplit, isSplitView, setSplitView]);

  if (isSplashVisible) return <SplashScreen />;

  const isDark = theme === 'dark';

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100 grid-bg-dark' : 'bg-slate-50 text-slate-900 grid-bg-light'
      }`}
      id="main-app-container"
    >
      {/* ── Sidebar ──────────────────────────────────────── */}
      <Sidebar isOpenOnMobile={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

      {/* ── Main workspace ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Top header bar ───────────────────────────── */}
        <header className={`
          flex items-center justify-between px-4 py-3 shrink-0 z-10
          border-b transition-colors duration-200
          ${isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'}
          shadow-sm
        `}>
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className={`md:hidden p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
              id="mobile-menu-btn"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden md:flex p-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              id="desktop-sidebar-toggle-btn"
            >
              {isSidebarCollapsed
                ? <PanelLeftOpen  className="h-4 w-4 text-cyan-500" />
                : <PanelLeftClose className="h-4 w-4" />
              }
            </button>

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                <BatteryCharging className="h-4 w-4 text-white" />
              </div>
              <span className={`hidden sm:block text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                ElectroSim Simulation Studio
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Split view button */}
            <button
              onClick={() => setSplitView(!isSplitView)}
              disabled={!canSplit}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all select-none ${
                isSplitView
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                  : canSplit
                  ? isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  : isDark
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title={canSplit ? 'Toggle side-by-side comparison' : 'Select variables from 2+ categories to enable'}
              id="split-view-toggle-btn"
            >
              <Columns className="h-4 w-4" />
              <span className="hidden sm:inline">Split View</span>
            </button>
          </div>
        </header>

        {/* ── Plot dashboard ───────────────────────────── */}
        <main className="flex-1 h-full min-h-0 min-w-0 overflow-hidden">
          <PlotDashboard />
        </main>
      </div>
    </div>
  );
};

export default App;
