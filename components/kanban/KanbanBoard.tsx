'use client';
import React, { useEffect, useState } from 'react';
import { Building2, Clock, AlertCircle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrefeituraKanban {
  id: string;
  city: string;
  state: string;
  status: string;
  franqueado?: { name: string } | null;
  master?: { name: string } | null;
  updatedAt: string;
}

const COLUNAS = [
  {
    key: 'AGUARDANDO_ANALISE',
    label: 'Aguardando Análise',
    color: 'border-yellow-400',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  {
    key: 'AGUARDANDO_DECRETO',
    label: 'Aguardando Decreto',
    color: 'border-blue-400',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    icon: FileText,
  },
  {
    key: 'PROCESSO_EM_ANDAMENTO',
    label: 'Em Andamento',
    color: 'border-purple-400',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-800',
    icon: AlertCircle,
  },
  {
    key: 'ATIVA',
    label: 'Ativa',
    color: 'border-green-400',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
  },
  {
    key: 'INATIVA',
    label: 'Inativa',
    color: 'border-gray-400',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
    icon: XCircle,
  },
  {
    key: 'REPROVADA',
    label: 'Reprovada',
    color: 'border-red-400',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
];

function diasDesdeAtualizacao(updatedAt: string) {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function KanbanBoard() {
  const [prefeituras, setPrefeituras] = useState<PrefeituraKanban[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/prefeituras?limit=200')
      .then(r => r.json())
      .then(data => {
        setPrefeituras(Array.isArray(data) ? data : data.prefeituras || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUNAS.map(col => {
          const Icon = col.icon;
          const itens = prefeituras.filter(p => p.status === col.key);
          return (
            <div key={col.key} className="w-64 flex-shrink-0">
              {/* Header da coluna */}
              <div className={cn('rounded-t-xl px-4 py-3 border-t-4 bg-white flex items-center justify-between', col.color)}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', col.badge)}>
                  {itens.length}
                </span>
              </div>

              {/* Cards */}
              <div className={cn('rounded-b-xl min-h-[200px] p-2 space-y-2 border border-t-0 border-gray-200', col.bg)}>
                {itens.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-8">Nenhuma prefeitura</p>
                )}
                {itens.map(p => {
                  const dias = diasDesdeAtualizacao(p.updatedAt);
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-[#0066A1] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {p.city}
                          </p>
                          <p className="text-xs text-gray-500">{p.state}</p>
                        </div>
                      </div>
                      {(p.franqueado || p.master) && (
                        <div className="mt-2 text-xs text-gray-500 truncate">
                          {p.franqueado ? `👤 ${p.franqueado.name}` : p.master ? `👑 ${p.master.name}` : ''}
                        </div>
                      )}
                      <div className={cn(
                        'mt-2 text-xs',
                        dias > 30 ? 'text-red-500 font-medium' : dias > 14 ? 'text-yellow-600' : 'text-gray-400'
                      )}>
                        {dias === 0 ? 'Atualizado hoje' : `${dias}d sem atualização`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
