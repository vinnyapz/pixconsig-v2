'use client';
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PrefeituraParada {
  id: string;
  city: string;
  state: string;
  status: string;
  diasParada: number;
}

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_ANALISE: 'Aguardando Análise',
  AGUARDANDO_DECRETO: 'Aguardando Decreto',
  PROCESSO_EM_ANDAMENTO: 'Em Andamento',
};

export function AlertasPrefeituras() {
  const [alertas, setAlertas] = useState<PrefeituraParada[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/prefeituras?limit=200')
      .then(r => r.json())
      .then(data => {
        const prefeituras = Array.isArray(data) ? data : data.prefeituras || [];
        const paradas = prefeituras
          .filter((p: any) => ['AGUARDANDO_ANALISE', 'AGUARDANDO_DECRETO', 'PROCESSO_EM_ANDAMENTO'].includes(p.status))
          .map((p: any) => ({
            id: p.id,
            city: p.city,
            state: p.state,
            status: p.status,
            diasParada: Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
          }))
          .filter((p: any) => p.diasParada >= 15)
          .sort((a: any, b: any) => b.diasParada - a.diasParada)
          .slice(0, 5);
        setAlertas(paradas);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visiveis = alertas.filter(a => !dismissed.includes(a.id));

  if (loading || visiveis.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-amber-800">
          {visiveis.length} prefeitura{visiveis.length > 1 ? 's' : ''} parada{visiveis.length > 1 ? 's' : ''} há mais de 15 dias
        </h3>
      </div>
      <div className="space-y-2">
        {visiveis.map(alerta => (
          <div key={alerta.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${alerta.diasParada >= 30 ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {alerta.city} - {alerta.state}
                </p>
                <p className="text-xs text-gray-500">
                  {STATUS_LABELS[alerta.status]} · <span className={`font-medium ${alerta.diasParada >= 30 ? 'text-red-600' : 'text-amber-600'}`}>{alerta.diasParada}d sem atualização</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <button
                onClick={() => router.push(`/prefeituras`)}
                className="text-[#0066A1] hover:text-[#005580] p-1"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDismissed(d => [...d, alerta.id])}
                className="text-gray-300 hover:text-gray-500 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
