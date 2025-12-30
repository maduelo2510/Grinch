import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { userId: user.id }
            });
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Error iniciando checkout:', err);
            alert('No se pudo iniciar el proceso de pago. Asegúrate de tener las claves de Stripe configuradas en Supabase.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden"
            onClick={onClose}
        >
            <div className="min-h-full w-full flex items-center justify-center p-4 md:p-8">
                <div
                    className="bg-[#050505] border border-white/10 w-full max-w-[760px] rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 relative p-8 md:p-14"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-20"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Mejorar a Pro</h2>
                        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">Desbloquea búsquedas ilimitadas y funciones avanzadas de análisis.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center">
                            <h3 className="text-xl font-bold text-white mb-2">Gratis</h3>
                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-slate-500 ml-1 text-sm">/mes</span>
                            </div>

                            <ul className="space-y-4 mb-10 w-full">
                                {[
                                    "10 búsquedas por mes",
                                    "Análisis de problemas básicos",
                                    "Soporte de la comunidad",
                                    "Historial de 7 días"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-sm text-slate-500">
                                        <svg className="w-4 h-4 mr-3 text-slate-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full py-4 bg-white/5 text-slate-600 font-bold rounded-2xl cursor-default mt-auto text-sm border border-white/5">
                                Plan Actual
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-[#0A0D12] border-2 border-indigo-500/50 rounded-3xl p-8 flex flex-col items-center relative shadow-[0_0_40px_rgba(79,70,229,0.15)]">
                            <div className="absolute -top-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ring-4 ring-[#050505]">
                                Más Popular
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl font-bold text-white">$10</span>
                                <span className="text-slate-500 ml-1 text-sm">/mes</span>
                            </div>

                            <ul className="space-y-4 mb-10 w-full">
                                {[
                                    "Búsquedas Ilimitadas",
                                    "Análisis de AI Avanzado",
                                    "Soporte Prioritario",
                                    "Historial Ilimitado",
                                    "Exportación a CSV",
                                    "Acceso anticipado"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-sm text-slate-200">
                                        <svg className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 mt-auto text-sm"
                            >
                                {loading ? 'Procesando...' : 'Mejorar a Pro'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 text-center flex items-center justify-center text-slate-600 text-[11px] md:text-sm">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="opacity-80 font-medium">Pago seguro procesado por Stripe • Cancela en cualquier momento</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UpgradeModal;
