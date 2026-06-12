
import { UserType } from '@/types';

// ============================================
// Props para StatCard
// ============================================
export interface StatCardData {
    title: string;
    value: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
}

// ============================================
// Props para ConsolidatedPrefeiturasCard
// ============================================
export interface PrefeituraStatsData {
    total: number;
    active: number;
    pending: number;
    inactive: number;
}

// ============================================
// Props para LoanChart (formato MonthData)
// ============================================
export interface LoanChartItem {
    month: string;   // Ex: "Jan 2026", "Fev 2026"
    value: number;   // Total PAID no mês
}

// ============================================
// Props para RankingCard
// ============================================
export interface RankingItem {
    id: string;
    name: string;
    value: string;   // Formatado: "R$ 850.000" ou "8 prefeituras"
}

export interface RankingData {
    loanRanking: RankingItem[];   // Top 5 por consignados PAID
    cityRanking: RankingItem[];   // Top 5 por nº de prefeituras
}

// ============================================
// Resposta completa da API /api/dashboard/summary
// ============================================
export interface DashboardSummaryResponse {
    // Card "Consignados (Mês)" — soma PAID do mês atual
    loanStats: StatCardData;

    // Card "Total Prefeituras" / "Minhas Prefeituras"
    prefeituraStats: PrefeituraStatsData;

    // Card "Total Masters" (admin) | "Total Franqueados" (master)
    // | "Comissões a Receber" (franqueado)
    thirdCard: StatCardData;

    // Gráfico de barras — últimos 12 meses
    loanChartData: LoanChartItem[];

    // Rankings (apenas admin e master)
    rankings?: RankingData;

    // Metas (apenas master e franqueado)
    goals?: {
        currentPrefeituras: number;
        goalPrefeituras: number;
        currentMonth: number;      // Mês atual (1-12)
        totalMonths: number;       // 12
    };

    // AchievementTimeline (apenas master e franqueado)
    totalAccumulatedLoans?: number;
}

// ============================================
// Tipos para Gestão de Metas (/settings)
// ============================================
export interface GoalSettingItem {
    entityId: string;
    entityName: string;
    entityType: 'master' | 'franqueado';
    goalPrefeituras: number;
    currentPrefeituras: number;
}

export interface GoalsSettingsResponse {
    goals: GoalSettingItem[];
}
