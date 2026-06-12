'use client';
import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Target, TrendingUp, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Meta {
  id: string;
  month: number;
  year: number;
  targetCount: number;
  targetAmount: number;
  franqueado?: { id: string; name: string } | null;
  master?: { id: string; name: string } | null;
}

interface Progresso {
  prefeituraCount: number;
  loanAmount: number;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MetasContent() {
  const { userType } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [progresso, setProgresso] = useState<Progresso>({ prefeituraCount: 0, loanAmount: 0 });
  const isAdmin = userType === 'admin';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/metas?month=${month}&year=${year}`).then(r => r.json()),
      fetch(`/api/dashboard/summary`).then(r => r.json()),
    ]).then(([metasData, summaryData]) => {
      setMetas(Array.isArray(metasData) ? metasData : []);
      setProgresso({
        prefeituraCount: summaryData?.prefeituraStats?.active || 0,
        loanAmount: summaryData?.loanStats?.rawValue || 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [month, year]);

  const totalTargetCount = metas.reduce((s, m) => s + m.targetCount, 0);
  const totalTargetAmount = metas.reduce((s, m) => s + m.targetAmount, 0);
  const pctCount = totalTargetCount > 0 ? Math.min(100, Math.round((progresso.prefeituraCount / totalTargetCount) * 100)) : 0;
  const pctAmount = totalTargetAmount > 0 ? Math.min(100, Math.round((progresso.loanAmount / totalTargetAmount) * 100)) : 0;

  return (
    <PageLayout title="Metas" subtitle="Acompanhe o progresso das metas do período">
      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066A1]"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066A1]"
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
        </div>
      ) : metas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma meta definida para este período</p>
          {isAdmin && <p className="text-sm text-gray-400 mt-1">Configure metas nas configurações do sistema</p>}
        </div>
      ) : (
        <>
          {/* Cards de progresso geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Prefeituras Captadas</span>
                </div>
                <span className={`text-sm font-bold ${pctCount >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                  {pctCount}%
                </span>
              </div>
              <ProgressBar value={progresso.prefeituraCount} max={totalTargetCount} color={pctCount >= 100 ? 'bg-green-500' : 'bg-blue-500'} />
              <p className="text-xs text-gray-400 mt-2">
                {progresso.prefeituraCount} de {totalTargetCount} prefeituras
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Volume Financeiro</span>
                </div>
                <span className={`text-sm font-bold ${pctAmount >= 100 ? 'text-green-600' : 'text-purple-600'}`}>
                  {pctAmount}%
                </span>
              </div>
              <ProgressBar value={progresso.loanAmount} max={totalTargetAmount} color={pctAmount >= 100 ? 'bg-green-500' : 'bg-purple-500'} />
              <p className="text-xs text-gray-400 mt-2">
                R$ {(progresso.loanAmount / 1000).toFixed(0)}k de R$ {(totalTargetAmount / 1000).toFixed(0)}k
              </p>
            </div>
          </div>

          {/* Lista de metas por franqueado/master */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Metas por Pessoa</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {metas.map(meta => (
                <div key={meta.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-800">
                        {meta.franqueado?.name || meta.master?.name || 'Geral'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {meta.franqueado ? 'Franqueado' : meta.master ? 'Master' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{meta.targetCount} prefeituras</p>
                      <p className="text-xs text-gray-400">R$ {(meta.targetAmount / 1000).toFixed(0)}k em volume</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
