import React, { useEffect, useState } from 'react';
import { BatteryCharging, Sparkles } from 'lucide-react';

const SplashScreen: React.FC = () => {
  const [show, setShow] = useState(true);

  // Auto hide after 3.5s (same as App timer) for safety
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-engLight-bg dark:bg-engDark-bg transition-colors duration-500">
      {/* Simple ion animation: two particles moving toward center */}
      <div className="relative w-64 h-64">
        {/* Positive ion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BatteryCharging className="h-12 w-12 text-cyan-500 animate-[spin_2s_linear_infinite]" />
        </div>
        {/* Sparkles around */}
        <div className="absolute inset-0">
          <Sparkles className="h-6 w-6 text-cyan-300 animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
          <Sparkles className="h-5 w-5 text-cyan-400 animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
