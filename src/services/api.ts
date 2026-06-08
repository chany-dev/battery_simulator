import axios from 'axios';
import type { SimulationRequest, SimulationResponse, DesignParameters, ExperimentStep } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for physics simulations
});

export const apiService = {
  /**
   * Run battery simulation
   */
  async runSimulation(
    designParams: DesignParameters,
    steps: ExperimentStep[],
    variables: string[]
  ): Promise<SimulationResponse> {
    // 1. Find the first discharge step in the protocol to send to current backend
    const dischargeStep = steps.find(s => s.type === 'discharge') || {
      dischargeRate: 1.0,
      cutoffVoltage: 2.5,
      temperature: 25.0,
    };

    // 2. Map frontend parameters to backend API schema format
    // Backend expects radii in meters (le=2e-5, ge=1e-6)
    // Frontend provides them in micrometers (um)
    const requestData: SimulationRequest = {
      model: 'spm',
      design_parameters: {
        negative_particle_radius: designParams.negativeParticleRadius * 1e-6,
        positive_particle_radius: designParams.positiveParticleRadius * 1e-6,
      },
      experiment_protocol: {
        discharge_rate: dischargeStep.dischargeRate,
        temperature: dischargeStep.temperature,
        cutoff_voltage: dischargeStep.cutoffVoltage,
      },
      output_selection: {
        variables: variables,
      },
    };

    try {
      const response = await apiClient.post<SimulationResponse>('/simulate', requestData);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'An error occurred during simulation execution');
    }
  },
};
