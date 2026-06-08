// src/store/useSimulationStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { DesignParameters, ExperimentStep, Theme } from '../types';
import { apiService } from '../services/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export type SimStatus = 'idle' | 'simulating' | 'success' | 'error';

export interface SimulationState {
  // ── Design Parameters ──
  designParameters: DesignParameters;
  setDesignParameters: (params: Partial<DesignParameters>) => void;
  resetDesignParameters: () => void;

  // ── Experiment Protocol ──
  protocolSteps: ExperimentStep[];
  addProtocolStep: (step: Omit<ExperimentStep, 'id'>) => void;
  removeProtocolStep: (id: string) => void;
  updateProtocolStep: (id: string, step: Partial<ExperimentStep>) => void;

  // ── Output Variables ──
  selectedVariables: string[];
  toggleVariable: (variable: string) => void;

  // ── Theme ──
  theme: Theme;
  setTheme: (t: Theme) => void;

  // ── Layout ──
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
  isSplitView: boolean;
  setSplitView: (s: boolean) => void;
  leftActiveTab: string;
  setLeftActiveTab: (tab: string) => void;
  rightActiveTab: string;
  setRightActiveTab: (tab: string) => void;

  // ── Model Selection (future DFN / SPMe) ──
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // ── Splash Screen ──
  isSplashVisible: boolean;
  setSplashVisible: (visible: boolean) => void;

  // ── Simulation Execution ──
  isRunning: boolean;
  isSimulating: boolean;
  status: SimStatus;
  errorMessage: string | null;
  results: Record<string, number[] | number[][]> | null;
  activeTimeIndex: number;
  simulationProgress: number;
  setSimulationProgress: (p: number) => void;
  setIsSimulating: (val: boolean) => void;
  runSimulation: () => Promise<void>;
  clearResults: () => void;
  setActiveTimeIndex: (idx: number) => void;
}

// ──────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────
const DEFAULT_DESIGN_PARAMS: DesignParameters = {
  negativeParticleRadius: 10.0,
  positiveParticleRadius: 10.0,
};

const DEFAULT_PROTOCOL_STEP: ExperimentStep = {
  id: 'default-step',
  type: 'discharge',
  dischargeRate: 1.0,
  cutoffVoltage: 2.8,
  temperature: 25.0,
  duration: 60,
};

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────
export const useSimulationStore = create<SimulationState>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Design Parameters ──
        designParameters: DEFAULT_DESIGN_PARAMS,
        setDesignParameters: (params) =>
          set((s) => ({
            designParameters: { ...s.designParameters, ...params },
          })),
        resetDesignParameters: () =>
          set({ designParameters: DEFAULT_DESIGN_PARAMS }),

        // ── Experiment Protocol ──
        protocolSteps: [DEFAULT_PROTOCOL_STEP],
        addProtocolStep: (step) =>
          set((s) => ({
            protocolSteps: [
              ...s.protocolSteps,
              { ...step, id: crypto.randomUUID() },
            ],
          })),
        removeProtocolStep: (id) =>
          set((s) => ({
            protocolSteps: s.protocolSteps.filter((st) => st.id !== id),
          })),
        updateProtocolStep: (id, step) =>
          set((s) => ({
            protocolSteps: s.protocolSteps.map((st) =>
              st.id === id ? { ...st, ...step } : st
            ),
          })),

        // ── Output Variables ──
        selectedVariables: [],
        toggleVariable: (variable) =>
          set((s) => ({
            selectedVariables: s.selectedVariables.includes(variable)
              ? s.selectedVariables.filter((v) => v !== variable)
              : [...s.selectedVariables, variable],
          })),

        // ── Theme ──
        theme: 'light',
        setTheme: (t) => {
          if (t === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          set({ theme: t });
        },

        // ── Layout ──
        isSidebarCollapsed: false,
        setSidebarCollapsed: (c) => set({ isSidebarCollapsed: c }),
        isSplitView: false,
        setSplitView: (s) => set({ isSplitView: s }),
        leftActiveTab: 'voltage',
        setLeftActiveTab: (tab) => set({ leftActiveTab: tab }),
        rightActiveTab: 'cell-state',
        setRightActiveTab: (tab) => set({ rightActiveTab: tab }),

        // ── Model Selection ──
        selectedModel: 'SPM',
        setSelectedModel: (model) => set({ selectedModel: model }),

        // ── Splash Screen (never persisted – always shows on fresh load) ──
        isSplashVisible: true,
        setSplashVisible: (visible) => set({ isSplashVisible: visible }),

        // ── Simulation Execution ──
        isRunning: false,
        isSimulating: false,
        status: 'idle',
        errorMessage: null,
        results: null,
        activeTimeIndex: 0,
        simulationProgress: 0,
        setSimulationProgress: (p) => set({ simulationProgress: p }),
        setIsSimulating: (val) => set({ isSimulating: val }),
        setActiveTimeIndex: (idx) => set({ activeTimeIndex: idx }),

        runSimulation: async () => {
          const { designParameters, protocolSteps, selectedVariables } = get();
          set({
            isRunning: true,
            isSimulating: true,
            status: 'simulating',
            errorMessage: null,
            results: null,
            activeTimeIndex: 0,
            simulationProgress: 0,
          });
          try {
            const response = await apiService.runSimulation(
              designParameters,
              protocolSteps,
              selectedVariables
            );
            if (response.success) {
              set({
                results: response.data,
                status: 'success',
                simulationProgress: 100,
                activeTimeIndex: 0,
              });
            } else {
              set({
                status: 'error',
                errorMessage: 'Simulation returned no data.',
              });
            }
          } catch (err: any) {
            set({
              status: 'error',
              errorMessage: err.message || 'Unknown error occurred.',
            });
          } finally {
            set({ isRunning: false, isSimulating: false });
          }
        },

        clearResults: () =>
          set({
            results: null,
            status: 'idle',
            errorMessage: null,
            activeTimeIndex: 0,
            simulationProgress: 0,
          }),
      }),
      {
        name: 'electrosim-store',
        // Only persist user configuration — not transient state
        partialize: (state) => ({
          designParameters: state.designParameters,
          protocolSteps: state.protocolSteps,
          selectedVariables: state.selectedVariables,
          theme: state.theme,
          selectedModel: state.selectedModel,
          isSidebarCollapsed: state.isSidebarCollapsed,
        }),
        onRehydrateStorage: () => (state) => {
          // Re-apply dark class from persisted theme
          if (state?.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },
      }
    )
  )
);
