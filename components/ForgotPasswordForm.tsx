'use client';
import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

export function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao solicitar recuperação.');
            }

            setMessage(data.message);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ocorreu um erro desconhecido.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20" style={{
            background: 'linear-gradient(to right, #EAEBEC, #F9F9FA)'
        }}>

            <div className="p-8 space-y-8">
                <div className="flex justify-center mb-8">
                    <img src="/logo-grupo.jpg" alt="Grupo Raman Logo" className="h-24 object-contain rounded-lg" />
                </div>

                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Recuperar Senha
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            Digite seu email para receber o link de recuperação
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0066A1] focus:border-[#0066A1] transition-colors bg-white/50 focus:bg-white" placeholder="seu@email.com" required />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#0066A1] hover:bg-[#005585] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066A1] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                            {isLoading ? 'Enviando...' : 'Enviar Email'}
                        </button>
                    </form>

                     <div className="flex items-center justify-center text-sm">
                        <a href="/login" className="flex items-center font-medium text-gray-600 hover:text-[#0066A1] transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para o login
                        </a>
                    </div>
                </div>
            </div>
             <div className="bg-white/80 px-8 py-4 border-t border-gray-100 text-center rounded-b-2xl">
                <p className="text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Grupo Raman. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
