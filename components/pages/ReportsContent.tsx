"use client";

import React, { useState } from "react";
import {
  BarChart3,
  DollarSign,
  MapPin,
  Building2,
  Users,
  TrendingUp,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { formatCurrency, cn } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { UserType } from "@/types";
import { useRegionalReport } from "@/hooks/useRegionalReport";
import { useMastersReport } from "@/hooks/useMastersReport";
import { RegionalPieChart, RegionalStateTable } from "@/components/reports/regional";
import { MastersRankingTable } from "@/components/reports/masters";

import { useConsignadosReport } from "@/hooks/useConsignadosReport";
import { useComissoesReport } from "@/hooks/useComissoesReport";
import {
  ConsignadosMetrics,
  ConsignadosChartDistribution,
  ConsignadosChartEvolution,
  ConsignadosMonthDetail,
} from "@/components/reports/consignados";
import {
  CommissionsHistoryChart,
  CommissionsTable,
} from "@/components/reports/comissoes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReportsContent() {
  const { userType } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState("monthly");
  const [stateFilter, setStateFilter] = useState("all");

  const { data: consignadosData, isLoading, error } = useConsignadosReport(
    stateFilter,
    period
  );

  const {
    data: comissoesData,
    isLoading: isLoadingComissoes,
    error: errorComissoes,
  } = useComissoesReport(stateFilter, period);

  const { data: regionalData, isLoading: isLoadingRegional, error: errorRegional } = useRegionalReport();
  const { data: mastersData, isLoading: isLoadingMasters, error: errorMasters } = useMastersReport(period);

  const tabs = [
    { id: 0, label: "Consignados", icon: <DollarSign className="h-4 w-4" /> },
    { id: 1, label: "Comissões", icon: <FileText className="h-4 w-4" /> },
    { id: 2, label: "Regional", icon: <MapPin className="h-4 w-4" /> },
    { id: 3, label: "Masters", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  if (!userType) return null;

  return (
    <PageLayout
      title="Relatórios Gerenciais"
      subtitle="Análise detalhada e indicadores de performance"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-x-auto">
        <div className="flex border-b border-gray-200 min-w-max">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="ghost"
              className={cn(
                "flex items-center gap-2 px-6 py-6 h-auto text-sm font-medium transition-colors border-b-2 rounded-none",
                activeTab === tab.id
                  ? "border-[#0066A1] text-[#0066A1] bg-blue-50/50 hover:bg-blue-50/70"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              {tab.icon} {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* TAB 1: CONSOLIDADO DE CONSIGNADOS */}
        {activeTab === 0 && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Filtrar por Estado:
                  </span>
                </div>

                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Todos os Estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Estados</SelectItem>
                    {(consignadosData?.availableStates || []).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {stateFilter !== "all" && (
                  <Button
                    onClick={() => setStateFilter("all")}
                    variant="link"
                    className="text-sm text-[#0066A1] hover:text-[#005585] font-medium h-auto p-0"
                  >
                    Limpar filtro
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
                {error}
              </div>
            ) : (
              consignadosData && (
                <>
                  <ConsignadosMetrics
                    totalGeral={consignadosData.summary.totalGeral}
                    totalPendentes={consignadosData.summary.totalPendentes}
                    totalServidorPublico={
                      consignadosData.summary.totalServidorPublico
                    }
                    pendingServidor={consignadosData.summary.pendingServidor}
                    totalContratados={consignadosData.summary.totalContratados}
                    pendingContratados={
                      consignadosData.summary.pendingContratados
                    }
                    variationTotal={consignadosData.summary.variationTotal}
                    variationServidorPublico={
                      consignadosData.summary.variationServidorPublico
                    }
                    variationContratados={
                      consignadosData.summary.variationContratados
                    }
                  />

                  {/* Gráfico de Distribuição por Tipo e Evolução */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ConsignadosChartDistribution
                      data={consignadosData.distribution}
                    />
                    <ConsignadosChartEvolution
                      data={consignadosData.evolution}
                      period={period}
                      onPeriodChange={setPeriod}
                    />
                  </div>

                  {/* Mês Atual - Detalhamento */}
                  <ConsignadosMonthDetail data={consignadosData.currentMonth} />
                </>
              )
            )}
          </div>
        )}

        {/* TAB 2: ANÁLISE DE COMISSÕES */}
        {/* TAB 2: ANÁLISE DE COMISSÕES */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Filtrar por Estado:
                  </span>
                </div>

                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Todos os Estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Estados</SelectItem>
                    {(comissoesData?.availableStates || []).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {stateFilter !== "all" && (
                  <Button
                    onClick={() => setStateFilter("all")}
                    variant="link"
                    className="text-sm text-[#0066A1] hover:text-[#005585] font-medium h-auto p-0"
                  >
                    Limpar filtro
                  </Button>
                )}
              </div>
            </div>

            {isLoadingComissoes ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
              </div>
            ) : errorComissoes ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
                {errorComissoes}
              </div>
            ) : (
              comissoesData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Total de Comissões
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(comissoesData.summary.totalCommission)}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Comissões Masters
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(
                          comissoesData.summary.totalMasterCommission,
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Comissões Franqueados
                      </p>
                      <p className="text-2xl font-bold text-[#0066A1]">
                        {formatCurrency(
                          comissoesData.summary.totalFranqueadoCommission,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CommissionsHistoryChart
                      data={comissoesData.history}
                      period={period}
                      onPeriodChange={setPeriod}
                    />
                    <CommissionsTable agents={comissoesData.agents} />
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* TAB 3: PERFORMANCE REGIONAL */}
        {activeTab === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {isLoadingRegional ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
              </div>
            ) : errorRegional ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
                {errorRegional}
              </div>
            ) : (
              regionalData && (
                <>
                  <RegionalPieChart states={regionalData.states} />
                  <RegionalStateTable states={regionalData.states} />
                </>
              )
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#0066A1] mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Oportunidades de Expansão
              </h3>
              <p className="text-blue-800 mb-4">
                Estados com alto potencial econômico mas baixa penetração de
                prefeituras cadastradas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-bold text-gray-900 mb-1">Goiás (GO)</div>
                  <p className="text-sm text-gray-600">
                    Apenas 2 prefeituras cadastradas. Potencial para +15 cidades
                    acima de 50k habitantes.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-bold text-gray-900 mb-1">
                    Espírito Santo (ES)
                  </div>
                  <p className="text-sm text-gray-600">
                    Sem cobertura atual. Região estratégica com alta demanda de
                    consignado.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="font-bold text-gray-900 mb-1">
                    Mato Grosso (MT)
                  </div>
                  <p className="text-sm text-gray-600">
                    Setor agro forte, prefeituras com alta arrecadação.
                    Prioridade para Q3.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PERFORMANCE DE MASTERS */}
        {activeTab === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {isLoadingMasters ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
              </div>
            ) : errorMasters ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
                {errorMasters}
              </div>
            ) : (
              mastersData && <MastersRankingTable masters={mastersData.masters} />
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
