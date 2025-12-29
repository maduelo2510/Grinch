import React, { useState } from 'react';
import { Problem } from '../types';

interface ProblemCardProps {
  problem: Problem;
  rank: number;
}

const MetricBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col space-y-1">
    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-500">
      <span>{label}</span>
      <span className="text-white">{(value || 0)}/10</span>
    </div>
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value || 0) * 10}%` }}></div>
    </div>
  </div>
);

const ProblemCard: React.FC<ProblemCardProps> = ({ problem, rank }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Formatear score a 1 decimal (ej. 8.5). Handle undefined gracefully.
  const score = typeof problem.signal_score === 'number' ? problem.signal_score : 0;
  const formattedScore = (score > 10 ? score / 10 : score).toFixed(1);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6 transition-all hover:border-slate-700">
      
      {/* Main Card Content */}
      <div className="p-6 md:p-8">
        
        {/* Header: Rank & Score */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              #{rank} PUNTO DE DOLOR IDENTIFICADO
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white leading-tight max-w-3xl">
              {problem.title}
            </h3>
          </div>
          
          <div className="flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl p-3 min-w-[80px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Puntaje</span>
            <span className="text-3xl font-bold text-orange-500">{formattedScore}</span>
            <span className="text-[10px] text-slate-600">/ 10</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <MetricBar label="Frecuencia" value={problem.frequency} color="bg-blue-500" />
          <MetricBar label="Intensidad" value={problem.pain_intensity} color="bg-red-500" />
          <MetricBar label="Solubilidad" value={problem.solvability} color="bg-green-500" />
          <MetricBar label="Monetización" value={problem.monetizability} color="bg-yellow-500" />
        </div>

        {/* Recommendation Box */}
        <div className="bg-[#1e1e2e] border border-indigo-900/30 rounded-xl p-5 flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Siguiente Paso Recomendado</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {problem.solution_opportunity || "Investigar soluciones existentes y buscar brechas."}
            </p>
          </div>
        </div>

        {/* Expand Toggle */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider"
        >
          {isExpanded ? 'Ocultar Evidencia y Análisis' : 'Ver Evidencia y Análisis'}
          <svg className={`w-4 h-4 ml-2 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-black/20 p-6 md:p-8 animate-in slide-in-from-top-2">
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Column 1: Evidence */}
            <div>
              <h4 className="flex items-center text-sm font-bold text-slate-200 mb-4">
                <span className="text-lg mr-2">❝</span> Evidencia Real
              </h4>
              <div className="space-y-4">
                {problem.key_quotes && problem.key_quotes.length > 0 ? problem.key_quotes.slice(0, 2).map((quote, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-sm italic text-slate-300 mb-3">"{quote}"</p>
                    {problem.sources && problem.sources[idx] && (
                       <a href={problem.sources[idx].url} target="_blank" rel="noreferrer" className="flex items-center text-[10px] text-slate-500 hover:text-emerald-400 uppercase font-bold tracking-wide">
                         {problem.sources[idx].platform} - Ver Discusión
                         <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                         </svg>
                       </a>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 italic">No hay citas directas disponibles.</p>
                )}
              </div>
            </div>

            {/* Column 2: Competitive Landscape */}
            <div>
              <h4 className="flex items-center text-sm font-bold text-slate-200 mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Panorama Competitivo
              </h4>
              <div className="space-y-3">
                {problem.competitors?.map((comp, idx) => (
                  <div key={idx} className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-300">{comp.name}</h5>
                      <p className="text-xs text-slate-500 mt-1"><span className="font-bold text-red-400/80">GAP:</span> {comp.gap}</p>
                    </div>
                  </div>
                ))}
                {(!problem.competitors || problem.competitors.length === 0) && (
                  <p className="text-xs text-slate-500">No se detectaron competidores directos claros.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemCard;