import React from 'react';
import { Problem } from '../types';

interface ProblemDetailProps {
  problem: Problem | null;
  onClose: () => void;
}

const ProblemDetail: React.FC<ProblemDetailProps> = ({ problem, onClose }) => {
  if (!problem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl font-bold text-emerald-400">{Math.round(problem.signal_score)}</span>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Puntaje de Señal</span>
                <span className="text-xs text-emerald-600">Alta Confianza</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{problem.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Main Description */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Análisis</h3>
            <p className="text-lg text-slate-300 leading-relaxed">
              {problem.description}
            </p>
          </section>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
               <div className="text-sm text-slate-500 mb-1">Intensidad del Dolor</div>
               <div className="text-xl font-bold text-white">{problem.pain_intensity}/10</div>
               <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                 <div className="bg-red-500 h-full" style={{width: `${problem.pain_intensity * 10}%`}}></div>
               </div>
             </div>
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
               <div className="text-sm text-slate-500 mb-1">Frecuencia</div>
               <div className="text-xl font-bold text-white">{problem.frequency}/10</div>
               <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                 <div className="bg-blue-500 h-full" style={{width: `${problem.frequency * 10}%`}}></div>
               </div>
             </div>
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
               <div className="text-sm text-slate-500 mb-1">¿Dispuesto a Pagar?</div>
               <div className={`text-xl font-bold ${problem.indicators.willingness_to_pay ? 'text-emerald-400' : 'text-slate-400'}`}>
                 {problem.indicators.willingness_to_pay ? 'DETECTADO' : 'POCO CLARO'}
               </div>
             </div>
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
               <div className="text-sm text-slate-500 mb-1">Tendencia</div>
               <div className="text-xl font-bold text-white capitalize">
                {problem.indicators.trend === 'growing' ? 'Creciente' : 
                 problem.indicators.trend === 'stable' ? 'Estable' : 
                 problem.indicators.trend === 'declining' ? 'Decreciente' : 'Desconocida'}
               </div>
             </div>
          </div>

          {/* Quotes */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Voz del Cliente</h3>
            <div className="grid gap-4">
              {problem.key_quotes.map((quote, idx) => (
                <div key={idx} className="bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500 italic text-slate-300">
                  "{quote}"
                </div>
              ))}
            </div>
          </section>

          {/* Sources */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Fuentes de Evidencia</h3>
            <div className="space-y-2">
              {problem.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${source.platform === 'Reddit' ? 'bg-orange-900/50 text-orange-400' : ''}
                      ${source.platform === 'HN' ? 'bg-orange-600/20 text-orange-500' : ''}
                      ${source.platform === 'IndieHackers' ? 'bg-blue-900/50 text-blue-400' : ''}
                    `}>
                      {source.platform}
                    </span>
                    <span className="text-sm text-slate-300 truncate group-hover:text-emerald-400 transition-colors">{source.title}</span>
                  </div>
                  <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cerrar
          </button>
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(problem.title + ' problem solution')}`}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center"
          >
            <span>Investigar Soluciones</span>
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;