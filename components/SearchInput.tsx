import React, { useState } from 'react';

interface SearchInputProps {
  onSearch: (term: string) => void;
  isSearching: boolean;
}

const EXAMPLES = [
  "Apps de Shopify",
  "Bienes Raíces",
  "Legal Tech",
  "SaaS B2B"
];

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isSearching }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSearching) {
      onSearch(input.trim());
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-24 pb-16">
      <div className="text-center mb-12 max-w-4xl px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
          Encuentra Problemas <br />
          <span className="text-slate-500">Que Valgan la Pena</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
          Deja de adivinar. Analiza quejas reales, frustraciones y patrones emergentes de toda la web. Obtén pruebas validadas para tu próxima empresa.
        </p>
      </div>

      <div className="w-full max-w-3xl px-4 relative group z-10">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <form onSubmit={handleSubmit} className="relative flex items-center bg-[#0B0F15] border border-white/10 p-2 rounded-2xl shadow-2xl transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50">
          <div className="pl-5 pr-2 text-slate-500 select-none pointer-events-none">
             ej., 
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSearching}
            className="flex-grow bg-transparent border-none text-slate-200 text-lg px-0 py-4 focus:outline-none placeholder-slate-600 w-full font-medium"
            placeholder='"Herramientas de IA para gimnasios"'
          />
          <button
            type="submit"
            disabled={!input.trim() || isSearching}
            className={`flex-shrink-0 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center border border-white/5 ${
              input.trim() && !isSearching
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isSearching ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizando...
              </span>
            ) : (
              <span>Encontrar Problemas &rarr;</span>
            )}
          </button>
        </form>
      </div>

      <div className="mt-10 flex items-center justify-center space-x-4 text-sm">
        <span className="font-bold uppercase tracking-wider text-indigo-500/80 text-[11px]">Popular:</span>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-slate-500 font-medium">
          {EXAMPLES.map((ex, i) => (
            <React.Fragment key={ex}>
              <button
                onClick={() => {
                  setInput(ex);
                  if (!isSearching) onSearch(ex);
                }}
                disabled={isSearching}
                className="hover:text-indigo-300 transition-colors cursor-pointer border-b border-transparent hover:border-indigo-500/50 pb-0.5"
              >
                {ex}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchInput;