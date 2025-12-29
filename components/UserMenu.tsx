import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserMenu: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || !profile) return null;

  // Get initials
  const initials = profile.full_name 
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email?.substring(0, 2).toUpperCase();

  // Calcular créditos restantes (Default a 5 si no existe límite en DB)
  const limit = profile.credits_limit ?? 5;
  const used = profile.credits_used ?? 0;
  const creditsLeft = Math.max(0, limit - used);

  return (
    <div className="flex items-center space-x-6">
      {/* Credits Badge - Visible always in Navbar */}
      <div className="hidden md:flex items-center justify-center px-4 py-2 bg-[#1E1E2E] border border-indigo-500/30 rounded-lg shadow-sm">
        <span className="text-[11px] font-black text-indigo-400 tracking-widest uppercase">
          {creditsLeft} Credits Left
        </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 focus:outline-none group"
        >
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 transition-all ${profile.is_pro ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400' : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'}`}>
            {initials}
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
            
            {/* Header Mobile Only info */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="text-sm font-bold text-white truncate">{profile.full_name || 'Usuario'}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
            
            {/* Credits Info in Menu (Mobile fallback mostly) */}
            <div className="px-5 py-3 md:hidden">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Créditos disponibles</span>
                <span className="text-indigo-400 font-bold">{creditsLeft}/{limit}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500" style={{ width: `${(creditsLeft / limit) * 100}%` }}></div>
              </div>
            </div>

            <div className="border-t border-slate-800 my-1 md:hidden"></div>

            <button className="w-full text-left px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center">
              <svg className="w-4 h-4 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </button>
            
            {!profile.is_pro && (
               <button className="w-full text-left px-5 py-2.5 text-sm text-emerald-400 hover:bg-slate-800 transition-colors font-bold flex items-center">
                 <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
                 Mejorar a PRO
               </button>
            )}
            
            <div className="border-t border-slate-800 my-1"></div>
            
            <button 
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="w-full text-left px-5 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;