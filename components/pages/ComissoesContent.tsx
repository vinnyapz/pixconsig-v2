'use client';
import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { DollarSign, TrendingUp, Users, Building2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { ExportButton } from '@/components/common/ExportButton';

interface ComissaoItem {
  prefeituraId: string;
  prefeituraCity: string;
  prefeituraState: string;
  loanId: string;
  loanAmount: number;
  loanType: string;
  loanDate: string;
  commissionRate: number;
  commissionAmount: number;
  masterName?: string;
  franqueadoName?: string;
}

interface ComissoesData {
  totalCommission: number;
  totalLoans: number;
  commissionRate: number;
  items: ComissaoItem[];
  byMonth: { month: string; value: number }[];
}

export function ComissoesContent() {
  const { userType } = useAuth();
  const [data, setData] = useState<ComissoesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/comissoes?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = [2024, 2025, 2026];

  return (
    <PageLayout title="Extrato de Comissões" subtitle="Acompanhe suas comissões por prefeitura e empréstimo">
      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066A1]"
        >
          {months.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066A1]"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Total de Comissões</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.totalCommission || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Volume de Empréstimos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.totalLoans || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Taxa de Comissão</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data?.commissionRate || 0}%
              </p>
            </div>
          </div>

          {/* Tabela de extrato */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Detalhamento por Empréstimo</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{data?.items?.length || 0} registros</span>
                <ExportButton
                  data={data?.items || []}
                  filename={`comissoes-${months[month-1]}-${year}`}
                  columns={[
                    { key: 'prefeituraCity', label: 'Prefeitura' },
                    { key: 'prefeituraState', label: 'Estado' },
                    { key: 'loanType', label: 'Tipo' },
                    { key: 'loanDate', label: 'Data' },
                    { key: 'loanAmount', label: 'Valor Empréstimo' },
                    { key: 'commissionRate', label: 'Taxa (%)' },
                    { key: 'commissionAmount', label: 'Comissão' },
                  ]}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Prefeitura</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-right">Valor Empréstimo</th>
                    <th className="px-4 py-3 text-right">Taxa</th>
                    <th className="px-4 py-3 text-right">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                        Nenhuma comissão encontrada para este período
                      </td>
                    </tr>
                  ) : (
                    (data?.items || []).map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-gray-800">{item.prefeituraCity}</div>
                          <div className="text-xs text-gray-400">{item.prefeituraState}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.loanType === 'SERVIDOR' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.loanType === 'SERVIDOR' ? 'Servidor' : 'Contratado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(item.loanDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                          {formatCurrency(item.loanAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {item.commissionRate}%
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                          {formatCurrency(item.commissionAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {(data?.items || []).length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">Total do Período</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-green-600">
                        {formatCurrency(data?.totalCommission || 0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
