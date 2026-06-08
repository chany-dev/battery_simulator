// src/components/ui/SplashScreen.tsx
import React from 'react';
import { BatteryCharging } from 'lucide-react';

const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors">
    {/* Animated battery icon */}
    <div className="relative flex items-center justify-center mb-8">
      <div className="absolute h-24 w-24 rounded-full border-4 border-cyan-500/20 animate-ping" />
      <div className="absolute h-16 w-16 rounded-full border-4 border-cyan-500/40 animate-pulse" />
      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
        <BatteryCharging className="h-6 w-6 text-white animate-pulse" />
      </div>
    </div>

    {/* Branding */}
    <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
      ElectroSim
    </h1>
    <p className="text-xs font-semibold text-cyan-500 tracking-widest uppercase mt-1">
      Battery Simulation Studio
    </p>

    {/* Loading bar */}
    <div className="mt-10 w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
    </div>
    <p className="text-[10px] text-slate-400 mt-3 tracking-wide">Initializing physics engine…</p>
  </div>
);

export default SplashScreen;
