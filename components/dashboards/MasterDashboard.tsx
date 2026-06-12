'use client';
import React from 'react';
import { StatCard } from '@/components/StatCard';
import { RankingCard } from '@/components/RankingCard';
import { LoanChart } from '@/components/LoanChart';
import { AchievementTimeline } from '@/components/AchievementTimeline';
import { PageLayout } from '@/components/layout/PageLayout';
import {
    DollarSign,
    Users,
    Target
} from 'lucide-react';
import { ConsolidatedPrefeiturasCard } from '@/components/ConsolidatedPrefeiturasCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PendingActionsAlert } from '@/components/common/PendingActionsAlert';

export function MasterDashboard() {
    const { userType } = useAuth();
    const isMaster = userType === 'master';
    const { data, isLoading, error } = useDashboardData();

    if (isLoading) {
        return (
            <PageLayout title="Visão Geral" subtitle="Carregando dados...">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066A1]" />
                </div>
            </PageLayout>
        );
    }

    if (error || !data) {
        return (
            <PageLayout title="Visão Geral" subtitle="">
                <div className="text-center py-12 text-red-500">
                    <p>Erro ao carregar dados: {error}</p>
                </div>
            </PageLayout>
        );
    }

    // Cálculos de Metas baseados nos dados reais
    const currentPrefeituras = data.goals?.currentPrefeituras || 0;
    const goalPrefeituras = data.goals?.goalPrefeituras || 100;
    const currentMonth = data.goals?.currentMonth || 1;
    const totalMonths = data.goals?.totalMonths || 12;

    const remainingPrefeituras = Math.max(0, goalPrefeituras - currentPrefeituras);
    const remainingMonths = totalMonths - currentMonth;
    const averagePerMonth = remainingMonths > 0 ? remainingPrefeituras / remainingMonths : 0;
    const progressPercentage = Math.min((currentPrefeituras / goalPrefeituras) * 100, 100);

    const styles = isMaster ? {
        card: "bg-gradient-to-br from-[#36454F] to-[#1c1c1e] text-[#E5E4E2] border-[#4A5568]/50 shadow-lg shadow-[#00D9FF]/10 hover:shadow-[#00D9FF]/20 transition-all duration-200",
        statsIconBg: "bg-gradient-to-br from-[#00D9FF] to-[#00A8CC] shadow-lg shadow-[#00D9FF]/30",
        statsIcon: "text-[#1c1c1e]",
        textPrimary: "text-[#E5E4E2]",
        textSecondary: "text-[#C0C0C0]",
        footer: "bg-gradient-to-r from-[#36454F] to-[#4A5568] px-5 py-3 border-t border-[#4A5568]/30",
        trendPositive: "text-[#00D9FF]",
        progressBg: "bg-[#1c1c1e]",
        progressFill: "bg-gradient-to-r from-[#00D9FF] to-[#00A8CC] shadow-lg shadow-[#00D9FF]/50",
        badgeBg: "bg-[#1c1c1e]/50 border-[#4A5568]/30"
    } : {
        card: "bg-white text-gray-900 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200",
        statsIconBg: "bg-[#0066A1]/10",
        statsIcon: "text-[#0066A1]",
        textPrimary: "text-gray-900",
        textSecondary: "text-gray-500",
        footer: "bg-gray-50 px-5 py-3 border-t border-gray-100",
        trendPositive: "text-green-600",
        progressBg: "bg-gray-200",
        progressFill: "bg-[#0066A1]",
        badgeBg: "bg-gray-50 border-gray-100"
    };

    return (
        <PageLayout
            title="Visão Geral"
            subtitle="Acompanhe o desempenho da sua franquia e franqueados."
        >
            <PendingActionsAlert />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title={data.loanStats.title}
                    value={data.loanStats.value}
                    trend={data.loanStats.trend}
                    description={data.loanStats.description}
                    icon={<DollarSign className="h-6 w-6" />}
                    userType={userType || 'master'}
                />

                {/* Consolidated Prefeituras Card */}
                <ConsolidatedPrefeiturasCard
                    total={data.prefeituraStats.total}
                    pending={data.prefeituraStats.pending}
                    active={data.prefeituraStats.active}
                    inactive={data.prefeituraStats.inactive}
                    userType="master"
                    title="Total Prefeituras"
                />

                <StatCard
                    title={data.thirdCard.title}
                    value={data.thirdCard.value}
                    icon={<Users className="h-6 w-6" />}
                    description={data.thirdCard.description}
                    userType={userType || 'master'}
                />

                <div className={`overflow-hidden rounded-xl border ${styles.card}`}>
                    <div className="p-5">
                        <div className="flex items-center mb-4">
                            <div className={`flex-shrink-0 p-3 rounded-lg ${styles.statsIconBg}`}>
                                <Target className={`h-6 w-6 ${styles.statsIcon}`} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${styles.textSecondary}`}>
                                    Metas de Prefeituras
                                </p>
                                <p className={`text-2xl font-bold mt-1 ${styles.textPrimary}`}>
                                    {currentPrefeituras} / {goalPrefeituras}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className={`flex justify-between text-xs mb-2 ${styles.textSecondary}`}>
                                <span>Progresso Anual</span>
                                <span className={`font-semibold ${isMaster ? 'text-[#00D9FF]' : 'text-[#0066A1]'}`}>
                                    {progressPercentage.toFixed(0)}%
                                </span>
                            </div>
                            <div className={`w-full rounded-full h-3 overflow-hidden ${styles.progressBg}`}>
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${styles.progressFill}`}
                                    style={{ width: `${progressPercentage}%` }}>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`rounded-lg p-3 border ${styles.badgeBg}`}>
                                <p className={`text-xs mb-1 ${styles.textSecondary}`}>Faltam</p>
                                <p className={`text-xl font-bold ${styles.textPrimary}`}>{remainingPrefeituras}</p>
                                <p className={`text-xs mt-0.5 ${styles.textSecondary}`}>prefeituras</p>
                            </div>
                            <div className={`rounded-lg p-3 border ${styles.badgeBg}`}>
                                <p className={`text-xs mb-1 ${styles.textSecondary}`}>Tempo restante</p>
                                <p className={`text-xl font-bold ${styles.textPrimary}`}>{remainingMonths}</p>
                                <p className={`text-xs mt-0.5 ${styles.textSecondary}`}>meses</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs mb-1 ${styles.textSecondary}`}>Média necessária/mês</p>
                                <p className={`text-2xl font-bold ${isMaster ? 'text-[#00D9FF]' : 'text-[#0066A1]'}`}>
                                    {averagePerMonth.toFixed(1)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs mb-1 ${styles.textSecondary}`}>Para atingir</p>
                                <p className={`text-lg font-semibold ${styles.textPrimary}`}>{goalPrefeituras} prefeituras</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`md:col-span-2 rounded-xl border overflow-hidden ${styles.card}`}>
                    <AchievementTimeline
                        currentAmount={data.totalAccumulatedLoans || 0}
                        userType={userType || 'master'}
                    />
                </div>
            </div>

            {/* Loan Chart */}
            <div className="mb-8">
                <div className={`rounded-xl border overflow-hidden ${styles.card}`}>
                    <LoanChart data={data.loanChartData} userType={userType || 'master'} />
                </div>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`rounded-xl border overflow-hidden ${styles.card}`}>
                    <RankingCard
                        title="Ranking de Consignados por Franqueado"
                        items={data.rankings?.loanRanking || []}
                        type="money"
                        userType={userType || 'master'}
                    />
                </div>
                <div className={`rounded-xl border overflow-hidden ${styles.card}`}>
                    <RankingCard
                        title="Ranking de Cadastro de Prefeituras por Franqueado"
                        items={data.rankings?.cityRanking || []}
                        type="count"
                        userType={userType || 'master'}
                    />
                </div>
            </div>
        </PageLayout>
    );
}
