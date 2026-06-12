'use client';
import React, { useState, Suspense } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordFormContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
             setError('Token inválido ou ausente.');
             return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao redefinir senha.');
            }

            setMessage(data.message);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
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

    if (!token) {
         return (
             <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl text-center">
                 <p className="text-red-500">Token de recuperação inválido ou ausente.</p>
                 <a href="/login" className="block mt-4 text-[#0066A1] hover:underline">Voltar para Login</a>
             </div>
         )
    }

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
                            Redefinir Senha
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            Crie uma nova senha para sua conta
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
                            <p className="text-xs mt-1">Redirecionando para login...</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0066A1] focus:border-[#0066A1] transition-colors bg-white/50 focus:bg-white" placeholder="••••••••" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors rounded-xl">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                         <div className="space-y-1">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0066A1] focus:border-[#0066A1] transition-colors bg-white/50 focus:bg-white" placeholder="••••••••" required />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#0066A1] hover:bg-[#005585] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066A1] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                        </button>
                    </form>
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

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
