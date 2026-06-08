export interface DesignParameters {
  negativeParticleRadius: number; // in micrometers (um) in UI
  positiveParticleRadius: number; // in micrometers (um) in UI
}

export type StepType = 'discharge' | 'charge' | 'rest';

export interface ExperimentStep {
  id: string;
  type: StepType;
  dischargeRate: number; // in C
  cutoffVoltage: number; // in V
  temperature: number;   // in °C
  duration?: number;      // in minutes
}

export interface OutputSelection {
  variables: string[];
}

export interface SimulationRequest {
  model: string;
  design_parameters: {
    negative_particle_radius: number; // in meters
    positive_particle_radius: number; // in meters
  };
  experiment_protocol: {
    discharge_rate: number; // in C
    temperature: number;    // in °C
    cutoff_voltage: number;  // in V
  };
  output_selection: {
    variables: string[];
  };
}

export interface SimulationResponse {
  success: boolean;
  data: Record<string, number[] | number[][]>;
}

export type Theme = 'dark' | 'light';

export interface SimulationState {
  // Config state
  designParameters: DesignParameters;
  protocolSteps: ExperimentStep[];
  selectedVariables: string[];
  theme: Theme;
  
  // Layout state
  isSidebarCollapsed: boolean;
  isSplitView: boolean;
  leftActiveTab: string;
  rightActiveTab: string;
  
  // Execution state
  isRunning: boolean;
  status: 'idle' | 'simulating' | 'success' | 'error';
  errorMessage: string | null;
  results: Record<string, number[] | number[][]> | null;
  activeTimeIndex: number;
  
  // Actions
  setDesignParameters: (params: Partial<DesignParameters>) => void;
  resetDesignParameters: () => void;
  addProtocolStep: (step: Omit<ExperimentStep, 'id'>) => void;
  removeProtocolStep: (id: string) => void;
  updateProtocolStep: (id: string, step: Partial<ExperimentStep>) => void;
  toggleVariable: (variable: string) => void;
  setTheme: (theme: Theme) => void;
  
  // Layout actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSplitView: (split: boolean) => void;
  setLeftActiveTab: (tab: string) => void;
  setRightActiveTab: (tab: string) => void;
  
  // Execution actions
  runSimulation: () => Promise<void>;
  clearResults: () => void;
  setActiveTimeIndex: (idx: number) => void;
}
