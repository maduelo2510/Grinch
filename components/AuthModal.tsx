import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'signin' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(initialView === 'signup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialView === 'signup');
      setMessage(null);
      // Reset fields optional
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up with Password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`.trim(),
            },
          },
        });
        if (error) throw error;
        
        // Si Supabase devuelve una sesión (email confirm off o auto-confirm), cerramos modal y entramos.
        if (data.session) {
          onClose();
        } else {
          // Si no hay sesión, es porque requiere confirmación de email
          setMessage({ type: 'success', text: '¡Cuenta creada! Verifica tu correo para continuar.' });
        }

      } else {
        // Sign In with Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
          onClose(); // Cerrar modal y mostrar dashboard
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error de autenticación' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#050505] border border-white/10 w-full max-w-[420px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 pt-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {isSignUp ? 'Únete a SignalFinder' : 'Bienvenido de nuevo'}
            </h2>
            <p className="text-slate-500 text-xs">
              {isSignUp 
                ? 'Descubre oportunidades validadas hoy.' 
                : 'Ingresa tus credenciales para acceder.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* First Name / Last Name Row */}
            {isSignUp && (
              <div className="flex space-x-3">
                <div className="w-1/2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required={isSignUp}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-transparent focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-700"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    required={isSignUp}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-transparent focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-700"
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}
            
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1D21] border border-transparent focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-700"
                placeholder="nombre@ejemplo.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1D21] border border-transparent focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-700"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-xs flex items-center ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <span className="mr-2 text-base">{message.type === 'success' ? '✓' : '⚠'}</span>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] hover:bg-[#4338ca] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm"
            >
              {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs">
              {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className="ml-1.5 text-indigo-400 hover:text-white font-bold transition-colors"
              >
                {isSignUp ? 'Iniciar Sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;