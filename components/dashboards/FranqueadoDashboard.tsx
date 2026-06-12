'use client';
import React from 'react';
import { StatCard } from '@/components/StatCard';
import { LoanChart } from '@/components/LoanChart';
import { AchievementTimeline } from '@/components/AchievementTimeline';
import { PageLayout } from '@/components/layout/PageLayout';
import { ConsolidatedPrefeiturasCard } from '@/components/ConsolidatedPrefeiturasCard';
import { DollarSign, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PendingActionsAlert } from '@/components/common/PendingActionsAlert';

export function FranqueadoDashboard() {
    const { userType } = useAuth();
    const { data, isLoading, error } = useDashboardData();

    if (isLoading) {
        return (
            <PageLayout title="Meu Desempenho" subtitle="Carregando dados...">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066A1]" />
                </div>
            </PageLayout>
        );
    }

    if (error || !data) {
        return (
            <PageLayout title="Meu Desempenho" subtitle="">
                <div className="text-center py-12 text-red-500">
                    <p>Erro ao carregar dados: {error}</p>
                </div>
            </PageLayout>
        );
    }

    // Cálculos de Metas baseados nos dados reais
    const currentPrefeituras = data.goals?.currentPrefeituras || 0;
    const goalPrefeituras = data.goals?.goalPrefeituras || 10;
    const currentMonth = data.goals?.currentMonth || 1;
    const totalMonths = data.goals?.totalMonths || 12;

    const remainingPrefeituras = Math.max(0, goalPrefeituras - currentPrefeituras);
    const remainingMonths = totalMonths - currentMonth;
    const averagePerMonth = remainingMonths > 0 ? remainingPrefeituras / remainingMonths : 0;
    const progressPercentage = Math.min((currentPrefeituras / goalPrefeituras) * 100, 100);
    const isGoalAchieved = currentPrefeituras >= goalPrefeituras;

    return (
        <PageLayout
            title="Meu Desempenho"
            subtitle="Acompanhe suas metas e resultados individuais."
        >
            <PendingActionsAlert />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title={data.loanStats.title}
                    value={data.loanStats.value}
                    trend={data.loanStats.trend}
                    description={data.loanStats.description}
                    icon={<DollarSign className="h-6 w-6" />}
                    userType={userType || 'franqueado'}
                />

                {/* Consolidated Prefeituras Card */}
                <ConsolidatedPrefeiturasCard
                    total={data.prefeituraStats.total}
                    pending={data.prefeituraStats.pending}
                    active={data.prefeituraStats.active}
                    inactive={data.prefeituraStats.inactive}
                    userType={userType || 'franqueado'}
                    title="Minhas Prefeituras"
                />

                <StatCard
                    title={data.thirdCard.title}
                    value={data.thirdCard.value}
                    trend={data.thirdCard.trend}
                    description={data.thirdCard.description}
                    icon={<Target className="h-6 w-6" />}
                    userType={userType || 'franqueado'}
                />
            </div>

            {/* Metas e Conquistas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
                    <div className="p-5">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 p-3 rounded-lg bg-[#0066A1]/10 text-[#0066A1]">
                                <Target className="h-6 w-6" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <p className="text-sm font-medium text-gray-500 truncate">
                                    Metas de Prefeituras
                                </p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {currentPrefeituras} / {goalPrefeituras}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                <span>Progresso Anual</span>
                                <span className={`font-semibold ${isGoalAchieved ? 'text-green-600' : 'text-[#0066A1]'}`}>
                                    {progressPercentage.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${isGoalAchieved ? 'bg-green-500' : 'bg-[#0066A1]'}`}
                                    style={{ width: `${progressPercentage}%` }}>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Faltam</p>
                                <p className="text-xl font-bold text-gray-900">{remainingPrefeituras}</p>
                                <p className="text-xs text-gray-500 mt-0.5">prefeituras</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Tempo restante</p>
                                <p className="text-xl font-bold text-gray-900">{remainingMonths}</p>
                                <p className="text-xs text-gray-500 mt-0.5">meses</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Média necessária/mês</p>
                                <p className={`text-2xl font-bold ${isGoalAchieved ? 'text-green-600' : 'text-[#0066A1]'}`}>
                                    {isGoalAchieved ? '✓ Meta atingida!' : averagePerMonth.toFixed(1)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Para atingir</p>
                                <p className="text-lg font-semibold text-gray-900">{goalPrefeituras} prefeituras</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 h-full">
                    <AchievementTimeline
                        currentAmount={data.totalAccumulatedLoans || 0}
                        userType={userType || 'franqueado'}
                    />
                </div>
            </div>

            <div className="mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Evolução dos Consignados</h3>
                            <p className="text-sm text-gray-500">Histórico dos últimos 12 meses</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                            <TrendingUp className="h-4 w-4" />
                            +12.5% vs ano anterior
                        </div>
                    </div>
                    <LoanChart data={data.loanChartData} userType={userType || 'franqueado'} />
                </div>
            </div>
        </PageLayout>
    );
}
