// src/components/ui/ThemeToggle.tsx
import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useSimulationStore();

  // Sync .dark class on html element whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="
        p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500
        bg-slate-100 hover:bg-slate-200 text-slate-700
        dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200
      "
      aria-label="Toggle theme"
      id="theme-toggle-btn"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
