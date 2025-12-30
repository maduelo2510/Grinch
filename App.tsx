import React, { useState, useEffect } from 'react';
import SearchInput from './components/SearchInput';
import AnalysisProgress from './components/AnalysisProgress';
import ProblemCard from './components/ProblemCard';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import { AnalysisState, Problem } from './types';
import { generateSearchQueries, analyzeSignals } from './services/geminiService';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const { user, loading: authLoading, profile, refreshProfile } = useAuth();
  
  // Estado para controlar apertura y MODO (login vs signup)
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: 'signin' | 'signup' }>({
    isOpen: false,
    view: 'signin'
  });
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    currentStepDescription: '',
    progress: 0,
    logs: []
  });
  const [problems, setProblems] = useState<Problem[]>([]);

  // Manejar retorno de Stripe (success / canceled)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');

    if (success) {
      // Refrescar perfil para traer is_pro / créditos actualizados
      refreshProfile();
      // Limpiar parámetros de la URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (canceled) {
      // Solo limpiamos la URL; podrías mostrar un toast si quieres
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshProfile]);

  const openAuth = (view: 'signin' | 'signup') => {
    setAuthModal({ isOpen: true, view });
  };

  const closeAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  const addLog = (msg: string) => {
    setAnalysisState(prev => ({
      ...prev,
      logs: [...prev.logs, msg]
    }));
  };

  const updateProgress = (step: number, totalSteps: number, description: string) => {
    setAnalysisState(prev => ({
      ...prev,
      progress: Math.round((step / totalSteps) * 100),
      currentStepDescription: description
    }));
  };

  const handleSearch = async (topic: string) => {
    if (!user) {
      openAuth('signup'); // Si intenta buscar sin cuenta, llevar a registro
      return;
    }

    // Reset State
    setProblems([]);
    setAnalysisState({
      status: 'generating_queries',
      currentStepDescription: 'Iniciando Agente de IA...',
      progress: 5,
      logs: [`Tema recibido: "${topic}"`]
    });

    try {
      // Step 1: Generate Queries
      updateProgress(1, 4, 'Generando consultas de búsqueda optimizadas...');
      addLog('Consultando a Gemini para jerga específica de la plataforma...');
      
      const queries = await generateSearchQueries(topic);
      
      addLog(`Se generaron ${queries.reddit_queries.length + queries.hn_queries.length} vectores de búsqueda únicos.`);
      
      // Step 2: "Search" (Simulated/API calls)
      setAnalysisState(prev => ({ ...prev, status: 'searching' }));
      updateProgress(2, 4, 'Escaneando Reddit, HN e IndieHackers...');
      
      // Artificial delay
      addLog(`Escaneando Reddit por: "${queries.reddit_queries[0]}"...`);
      await new Promise(r => setTimeout(r, 800));
      addLog(`Escaneando Hacker News por: "${queries.hn_queries[0]}"...`);
      await new Promise(r => setTimeout(r, 800));
      addLog(`Escaneando IndieHackers por: "${queries.ih_queries[0]}"...`);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Analysis
      setAnalysisState(prev => ({ ...prev, status: 'analyzing' }));
      updateProgress(3, 4, 'Extrayendo puntos de dolor y calculando métricas...');
      addLog('Analizando sentimiento y brechas de mercado...');

      const detectedProblems = await analyzeSignals(topic, queries);

      // Sort by signal score
      const sortedProblems = detectedProblems.sort((a, b) => b.signal_score - a.signal_score);

      setProblems(sortedProblems);
      updateProgress(4, 4, 'Análisis Completo');
      setAnalysisState(prev => ({ ...prev, status: 'complete' }));
      addLog(`Identificadas ${sortedProblems.length} oportunidades validadas.`);

      // Step 4: Track Usage (Increment Credits via RPC)
      try {
        const { error } = await supabase.rpc('increment_credits', { row_id: user.id });
        if (!error) {
          refreshProfile(); // Update UI instantly
        }
      } catch (err) {
        console.error("Error tracking credits", err);
      }

    } catch (error: any) {
      console.error(error);
      setAnalysisState(prev => ({
        ...prev,
        status: 'error',
        logs: [...prev.logs, `Error: ${error.message || 'Ocurrió un error desconocido'}`]
      }));
    }
  };

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-slate-500">Cargando...</div>;

  return (
    <div className="min-h-screen bg-black text-slate-200 selection:bg-indigo-500/30 font-sans flex flex-col">
      
      {/* Navbar */}
      <nav className="w-full border-b border-slate-900/50 bg-black/50 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] group-hover:shadow-[0_0_25px_rgba(79,70,229,0.7)] transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Signal<span className="text-slate-400">Finder</span>.ai</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <button 
                  onClick={() => openAuth('signin')}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
                >
                  Iniciar sesión
                </button>
                <button 
                  onClick={() => openAuth('signup')}
                  className="px-6 py-2 bg-white text-slate-950 text-sm font-bold rounded-full hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
                >
                  Empezar
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col">
        
        {/* Main Search Area */}
        <SearchInput 
          onSearch={handleSearch} 
          isSearching={['generating_queries', 'searching', 'analyzing'].includes(analysisState.status)} 
        />

        {/* Progress Display */}
        <div className="max-w-3xl mx-auto w-full">
          <AnalysisProgress state={analysisState} />
        </div>

        {/* Results Area */}
        {analysisState.status === 'complete' && problems.length > 0 && (
          <div className="mt-16 mb-20 animate-in slide-in-from-bottom-10 fade-in duration-700 max-w-5xl mx-auto w-full">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Oportunidades Validadas</h2>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  CLASIFICADO POR FUERZA DE SEÑAL Y POTENCIAL COMERCIAL
                </p>
              </div>
              <div className="bg-indigo-900/30 border border-indigo-900 px-4 py-2 rounded-full">
                <span className="text-sm font-bold text-indigo-400">● {problems.length} PROBLEMAS ENCONTRADOS</span>
              </div>
            </div>

            <div className="space-y-4">
              {problems.map((problem, index) => (
                <ProblemCard 
                  key={problem.id} 
                  problem={problem} 
                  rank={index + 1}
                />
              ))}
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900/50 mt-auto bg-black/40">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <div className="flex flex-col mb-6 md:mb-0 items-center md:items-start">
            <div className="flex items-center space-x-2 mb-2">
               <div className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
               </div>
               <span className="font-bold text-slate-300">SignalFinder.ai</span>
            </div>
            <p className="tracking-[0.2em] uppercase text-[10px] text-slate-600 font-bold">Motor de Inteligencia de Negocios Validado</p>
          </div>
          
          <div className="flex space-x-8 tracking-widest uppercase font-bold text-[10px] text-slate-600">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">Precios</a>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuth} 
        initialView={authModal.view}
      />
    </div>
  );
};

export default App;