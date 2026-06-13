"use client";
import React, { useState, useEffect } from "react";
import { Shield, FlaskConical, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export function SuperAdminTab() {
    const [maintenanceActive, setMaintenanceActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings/maintenance')
            .then(r => r.json())
            .then(data => setMaintenanceActive(data.active))
            .catch(() => toast.error("Erro ao carregar configurações"))
            .finally(() => setLoading(false));
    }, []);

    const toggleMaintenance = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !maintenanceActive }),
            });

            if (!res.ok) throw new Error("Erro ao salvar");

            const data = await res.json();
            setMaintenanceActive(data.active);
            toast.success(data.message);
        } catch {
            toast.error("Erro ao alterar modo manutenção");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-yellow-50/50">
                    <Shield className="h-5 w-5 text-yellow-600" />
                    <h2 className="text-lg font-semibold text-yellow-700">Painel SuperAdmin</h2>
                    <span className="ml-auto text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full font-medium">
                        Acesso restrito
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    {/* Modo Manutenção / Teste */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-start gap-3">
                            <FlaskConical className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Modo Teste (Manutenção)</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Quando ativado, nenhuma notificação é enviada para Masters e Franqueados.
                                    Use durante testes para não incomodar os usuários reais.
                                </p>
                                {maintenanceActive && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                                        🔴 Notificações suspensas
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={toggleMaintenance}
                            disabled={loading || saving}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                maintenanceActive
                                    ? 'bg-orange-500 focus:ring-orange-500'
                                    : 'bg-gray-200 focus:ring-gray-400'
                            } disabled:opacity-50`}
                            aria-label="Toggle modo manutenção"
                        >
                            {saving ? (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                                </span>
                            ) : (
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        maintenanceActive ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <strong>Como funciona:</strong> com o modo teste ativo, todas as ações do sistema
                        (mudança de status, mensagens, follow-ups) continuam funcionando normalmente,
                        mas nenhuma notificação é disparada para Masters ou Franqueados.
                        Desative quando terminar os testes.
                    </div>
                </div>
            </div>
        </div>
    );
}
