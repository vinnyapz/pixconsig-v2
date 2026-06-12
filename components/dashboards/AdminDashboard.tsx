'use client';
import React from 'react';
import { StatCard } from '@/components/StatCard';
import { RankingCard } from '@/components/RankingCard';
import { LoanChart } from '@/components/LoanChart';
import { PageLayout } from '@/components/layout/PageLayout';
import { ConsolidatedPrefeiturasCard } from '@/components/ConsolidatedPrefeiturasCard';
import { DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PendingActionsAlert } from '@/components/common/PendingActionsAlert';
import { AlertasPrefeituras } from '@/components/common/AlertasPrefeituras';

export function AdminDashboard() {
    const { userType } = useAuth();
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

    return (
        <PageLayout
            title="Visão Geral"
            subtitle="Acompanhe os principais indicadores do sistema."
        >
            <PendingActionsAlert />
            <AlertasPrefeituras />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title={data.loanStats.title}
                    value={data.loanStats.value}
                    trend={data.loanStats.trend}
                    description={data.loanStats.description}
                    icon={<DollarSign className="h-6 w-6" />}
                    userType={userType || 'admin'}
                />

                {/* Consolidated Prefeituras Card */}
                <ConsolidatedPrefeiturasCard
                    total={data.prefeituraStats.total}
                    pending={data.prefeituraStats.pending}
                    active={data.prefeituraStats.active}
                    inactive={data.prefeituraStats.inactive}
                    userType={userType || 'admin'}
                    title="Total Prefeituras"
                />

                <StatCard
                    title={data.thirdCard.title}
                    value={data.thirdCard.value}
                    icon={<Users className="h-6 w-6" />}
                    description={data.thirdCard.description}
                    userType={userType || 'admin'}
                />
            </div>

            {/* Loan Chart - Full Width */}
            <div className="mb-8">
                <LoanChart data={data.loanChartData} userType={userType || 'admin'} />
            </div>

            {/* Rankings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RankingCard
                    title="Ranking de Consignados por Master"
                    items={data.rankings?.loanRanking || []}
                    type="money"
                    userType={userType || 'admin'}
                />
                <RankingCard
                    title="Ranking de Cadastro de Prefeituras"
                    items={data.rankings?.cityRanking || []}
                    type="count"
                    userType={userType || 'admin'}
                />
            </div>
        </PageLayout>
    );
}
