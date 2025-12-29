import React from 'react';
import { Problem } from '../types';

interface SignalMatrixProps {
  problems: Problem[];
  onSelectProblem: (problem: Problem) => void;
}

const SignalMatrix: React.FC<SignalMatrixProps> = ({ problems, onSelectProblem }) => {
  // Constants for plotting
  const MATRIX_SIZE = 100; // percent

  // Helper to determine color based on signal score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 shadow-emerald-500/40';
    if (score >= 60) return 'bg-emerald-600 shadow-emerald-600/20';
    if (score >= 40) return 'bg-yellow-500 shadow-yellow-500/20';
    return 'bg-slate-500';
  };

  const getZoneLabel = (x: number, y: number) => {
    if (x > 50 && y > 50) return "ZONA DE ORO";
    if (x <= 50 && y > 50) return "NICHO";
    if (x > 50 && y <= 50) return "COMMODITY";
    return "RUIDO";
  };

  return (
    <div className="w-full h-[600px] bg-slate-800/50 border border-slate-700 rounded-2xl relative overflow-hidden mb-12 select-none">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-px bg-slate-700/50 absolute top-1/2"></div>
        <div className="h-full w-px bg-slate-700/50 absolute left-1/2"></div>
      </div>

      {/* Axis Labels */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 -translate-x-full rotate-270 text-xs font-bold text-slate-500 tracking-widest whitespace-nowrap origin-right">
        INTENSIDAD DEL DOLOR
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500 tracking-widest">
        FRECUENCIA
      </div>
      
      {/* Quadrant Labels (Watermarks) */}
      <div className="absolute top-4 right-4 text-emerald-500/10 font-black text-4xl">MINA DE ORO</div>
      <div className="absolute top-4 left-4 text-slate-600/10 font-black text-4xl">NICHO</div>
      <div className="absolute bottom-4 right-4 text-slate-600/10 font-black text-4xl">VOLUMEN</div>
      <div className="absolute bottom-4 left-4 text-slate-700/10 font-black text-4xl">IGNORAR</div>

      {/* Plot Area */}
      <div className="absolute inset-12">
        {problems.map((prob) => {
          // Normalize 0-10 scale to percentage
          const x = prob.frequency * 10;
          const y = prob.pain_intensity * 10;
          const colorClass = getScoreColor(prob.signal_score);

          return (
            <button
              key={prob.id}
              onClick={() => onSelectProblem(prob)}
              className={`absolute group transform -translate-x-1/2 translate-y-1/2 transition-all duration-300 hover:z-50 hover:scale-110 focus:outline-none`}
              style={{
                left: `${x}%`,
                bottom: `${y}%`,
              }}
            >
              {/* The Dot */}
              <div className={`w-6 h-6 rounded-full border-2 border-slate-900 ${colorClass} shadow-lg flex items-center justify-center relative`}>
                 <span className="text-[10px] font-bold text-white">{Math.round(prob.signal_score)}</span>
              </div>

              {/* Tooltip Card (visible on hover) */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity w-64 pointer-events-none z-50">
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 shadow-2xl text-left">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-bold text-emerald-400 tracking-wider">
                      {getZoneLabel(x, y)}
                    </p>
                    <div className="flex space-x-1">
                      {prob.indicators.willingness_to_pay && <span>💰</span>}
                      {prob.indicators.workarounds_detected && <span>🔧</span>}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-tight mb-2">
                    {prob.title}
                  </h4>
                  <div className="flex items-center text-[10px] text-slate-400 space-x-2">
                    <span>Dolor: {prob.pain_intensity}</span>
                    <span>Frec: {prob.frequency}</span>
                  </div>
                </div>
                {/* Arrow */}
                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-600 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SignalMatrix;