import React from 'react';
import { AnalysisState } from '../types';

interface AnalysisProgressProps {
  state: AnalysisState;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ state }) => {
  if (state.status === 'idle') return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emerald-400 font-medium animate-pulse">
          {state.status === 'error' ? 'Análisis Fallido' : state.currentStepDescription}
        </h3>
        <span className="text-slate-500 text-sm font-mono">{state.progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${state.progress}%` }}
        />
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {state.logs.slice(-3).map((log, i) => (
          <div key={i} className="flex items-start text-sm text-slate-400">
            <svg className="w-4 h-4 mr-2 mt-0.5 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="opacity-80">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisProgress;