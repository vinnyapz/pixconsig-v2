
import { prisma } from '@/lib/prisma';
import {
    DashboardSummaryResponse,
    PrefeituraStatsData,
    LoanChartItem,
    RankingItem,
    RankingData,
    StatCardData
} from '@/types/dashboard';

// ============================================
// Helper: Resolver masterId/franqueadoId a partir do email do User
// ============================================
export async function getMasterIdByEmail(email: string): Promise<string | null> {
    const master = await prisma.master.findUnique({ where: { email } });
    return master?.id || null;
}

export async function getFranqueadoIdByEmail(email: string): Promise<string | null> {
    const franqueado = await prisma.franqueado.findUnique({ where: { email } });
    return franqueado?.id || null;
}

// ============================================
// Formatador de moeda (reutilizado em rankings)
// ============================================
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// ============================================
// 1. Contagem de Prefeituras por Status
// ============================================
export async function getPrefeituraStats(
    scope: 'global' | 'master' | 'franqueado',
    entityId?: string
): Promise<PrefeituraStatsData> {
    const whereClause: any = {};

    if (scope === 'master' && entityId) {
        // Master vê suas prefeituras diretas + as dos seus franqueados
        whereClause.OR = [
            { masterId: entityId },
            { franqueado: { masterId: entityId } }
        ];
    } else if (scope === 'franqueado' && entityId) {
        whereClause.franqueadoId = entityId;
    }

    // Status que contam como "active" para o card
    const activeStatuses = ['ATIVA'];
    // Status que contam como "pending" (em andamento)
    const pendingStatuses = ['AGUARDANDO_ANALISE', 'AGUARDANDO_DECRETO', 'PROCESSO_EM_ANDAMENTO'];
    // Status que contam como "inactive"
    const inactiveStatuses = ['INATIVA', 'REPROVADA'];
    // AGUARDANDO_ANALISE é EXCLUÍDO do total (decisão confirmada)

    const [activeCount, pendingCount, inactiveCount] = await Promise.all([
        prisma.prefeitura.count({
            where: { ...whereClause, status: { in: activeStatuses as any } }
        }),
        prisma.prefeitura.count({
            where: { ...whereClause, status: { in: pendingStatuses as any } }
        }),
        prisma.prefeitura.count({
            where: { ...whereClause, status: { in: inactiveStatuses as any } }
        }),
    ]);

    return {
        total: activeCount + pendingCount + inactiveCount,
        active: activeCount,
        pending: pendingCount,
        inactive: inactiveCount
    };
}

// ============================================
// 2. Consignados do Mês Atual (PAID) + Variação vs Mês Anterior
// ============================================
export async function getLoanStats(
    scope: 'global' | 'master' | 'franqueado',
    entityId?: string
): Promise<StatCardData> {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const prevMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));

    const scopeFilter: any = {};
    if (scope === 'master' && entityId) {
        scopeFilter.prefeitura = {
            OR: [
                { masterId: entityId },
                { franqueado: { masterId: entityId } }
            ]
        };
    } else if (scope === 'franqueado' && entityId) {
        scopeFilter.prefeitura = { franqueadoId: entityId };
    }

    const [currentMonth, prevMonth] = await Promise.all([
        prisma.loan.aggregate({
            where: {
                status: 'PAID',
                date: { gte: currentMonthStart },
                ...scopeFilter
            },
            _sum: { amount: true },
        }),
        prisma.loan.aggregate({
            where: {
                status: 'PAID',
                date: { gte: prevMonthStart, lt: currentMonthStart },
                ...scopeFilter
            },
            _sum: { amount: true },
        })
    ]);

    const currentValue = currentMonth._sum.amount || 0;
    const prevValue = prevMonth._sum.amount || 0;

    let trendValue = 0;
    let isPositive = true;
    if (prevValue > 0) {
        trendValue = parseFloat((((currentValue - prevValue) / prevValue) * 100).toFixed(1));
        isPositive = trendValue >= 0;
        trendValue = Math.abs(trendValue);
    } else if (currentValue > 0) {
        trendValue = 100;
    }

    return {
        title: 'Consignados (Mês)',
        value: formatCurrency(currentValue),
        trend: { value: trendValue, isPositive },
        description: 'vs mês anterior'
    };
}

// ============================================
// 3. Evolução de Consignados — Últimos 12 Meses (para LoanChart)
// ============================================
export async function getLoanChartData(
    scope: 'global' | 'master' | 'franqueado',
    entityId?: string
): Promise<LoanChartItem[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const scopeFilter: any = {};
    if (scope === 'master' && entityId) {
        scopeFilter.prefeitura = {
            OR: [
                { masterId: entityId },
                { franqueado: { masterId: entityId } }
            ]
        };
    } else if (scope === 'franqueado' && entityId) {
        scopeFilter.prefeitura = { franqueadoId: entityId };
    }

    const loans = await prisma.loan.findMany({
        where: {
            status: 'PAID',
            date: { gte: startDate },
            ...scopeFilter
        },
        select: { amount: true, date: true }
    });

    // Inicializar mapa com 12 meses
    const monthMap = new Map<string, { label: string; value: number }>();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(d);
        monthMap.set(key, {
            label: label.charAt(0).toUpperCase() + label.slice(1),
            value: 0
        });
    }

    loans.forEach(loan => {
        const d = new Date(loan.date);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(key)) {
            monthMap.get(key)!.value += loan.amount;
        }
    });

    return Array.from(monthMap.values()).map(m => ({
        month: m.label,
        value: m.value
    }));
}

// ============================================
// 4. Rankings — Top 5 (apenas Admin e Master)
// ============================================
export async function getRankings(
    scope: 'global' | 'master',
    entityId?: string
): Promise<RankingData> {
    if (scope === 'global') {
        return getAdminRankings();
    } else {
        return getMasterRankings(entityId!);
    }
}

async function getAdminRankings(): Promise<RankingData> {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    const masters = await prisma.master.findMany({
        select: {
            id: true,
            name: true,
            state: true,
            _count: { select: { prefeituras: true } }
        }
    });

    const loanRanking: RankingItem[] = await Promise.all(
        masters.map(async (master) => {
            const loans = await prisma.loan.aggregate({
                where: {
                    status: 'PAID',
                    date: { gte: currentMonthStart },
                    OR: [
                        { prefeitura: { masterId: master.id } },
                        { prefeitura: { franqueado: { masterId: master.id } } }
                    ]
                },
                _sum: { amount: true }
            });
            return {
                id: master.id,
                name: `${master.name} (${master.state || 'N/A'})`,
                value: formatCurrency(loans._sum.amount || 0)
            };
        })
    );
    loanRanking.sort((a, b) => {
        const valA = parseFloat(a.value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const valB = parseFloat(b.value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        return valB - valA;
    });

    const cityRanking: RankingItem[] = masters
        .map(m => ({
            id: m.id,
            name: `${m.name} (${m.state || 'N/A'})`,
            value: `${m._count.prefeituras} prefeituras`
        }))
        .sort((a, b) => {
            const countA = parseInt(a.value) || 0;
            const countB = parseInt(b.value) || 0;
            return countB - countA;
        });

    return {
        loanRanking: loanRanking.slice(0, 5),
        cityRanking: cityRanking.slice(0, 5)
    };
}

async function getMasterRankings(masterId: string): Promise<RankingData> {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    const franqueados = await prisma.franqueado.findMany({
        where: { masterId },
        select: {
            id: true,
            name: true,
            _count: { select: { prefeituras: true } }
        }
    });

    const loanRanking: RankingItem[] = await Promise.all(
        franqueados.map(async (franqueado) => {
            const loans = await prisma.loan.aggregate({
                where: {
                    status: 'PAID',
                    date: { gte: currentMonthStart },
                    prefeitura: { franqueadoId: franqueado.id }
                },
                _sum: { amount: true }
            });
            return {
                id: franqueado.id,
                name: franqueado.name,
                value: formatCurrency(loans._sum.amount || 0)
            };
        })
    );
    loanRanking.sort((a, b) => {
        const valA = parseFloat(a.value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const valB = parseFloat(b.value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        return valB - valA;
    });

    const cityRanking: RankingItem[] = franqueados
        .map(f => ({
            id: f.id,
            name: f.name,
            value: `${f._count.prefeituras} prefeituras`
        }))
        .sort((a, b) => {
            const countA = parseInt(a.value) || 0;
            const countB = parseInt(b.value) || 0;
            return countB - countA;
        });

    return {
        loanRanking: loanRanking.slice(0, 5),
        cityRanking: cityRanking.slice(0, 5)
    };
}

// ============================================
// 5. Third Card Data (variável por tipo)
// ============================================
async function getAdminThirdCard(): Promise<StatCardData> {
    const totalMasters = await prisma.master.count();
    return {
        title: 'Total Masters',
        value: String(totalMasters),
        description: 'Ativos na plataforma'
    };
}

async function getMasterThirdCard(masterId: string): Promise<StatCardData> {
    const totalFranqueados = await prisma.franqueado.count({
        where: { masterId }
    });
    return {
        title: 'Total de Franqueados',
        value: String(totalFranqueados),
        description: 'Ativos na sua equipe'
    };
}

async function getFranqueadoThirdCard(franqueadoId: string): Promise<StatCardData> {
    // CORREÇÃO: Comissões a Receber = PENDING loans (GERAL, sem filtro de mês) × taxa de comissão
    const franqueado = await prisma.franqueado.findUnique({
        where: { id: franqueadoId },
        select: { commissionRate: true }
    });
    const rate = franqueado?.commissionRate || 10;

    const pendingLoans = await prisma.loan.aggregate({
        where: {
            status: 'PENDING',
            prefeitura: { franqueadoId }
        },
        _sum: { amount: true }
    });

    const pendingTotal = pendingLoans._sum.amount || 0;
    const commission = (pendingTotal * rate) / 100;

    return {
        title: 'Comissões a Receber',
        value: formatCurrency(commission),
        description: `${formatCurrency(pendingTotal)} em pendentes (${rate}%)`,
    };
}

// ============================================
// 6. Total Acumulado (para AchievementTimeline)
// ============================================
async function getTotalAccumulatedLoans(
    scope: 'master' | 'franqueado',
    entityId: string
): Promise<number> {
    const scopeFilter: any = {};
    if (scope === 'master') {
        scopeFilter.OR = [
            { prefeitura: { masterId: entityId } },
            { prefeitura: { franqueado: { masterId: entityId } } }
        ];
    } else {
        scopeFilter.prefeitura = { franqueadoId: entityId };
    }

    const result = await prisma.loan.aggregate({
        where: { status: 'PAID', ...scopeFilter },
        _sum: { amount: true }
    });
    return result._sum.amount || 0;
}

// ============================================
// 7. Helper: Buscar meta de prefeituras do AppSetting
// ============================================
async function getGoalPrefeituras(
    entityType: 'master' | 'franqueado',
    entityId: string
): Promise<number> {
    const key = `${entityType}_goal_prefeituras_${entityId}`;
    const setting = await prisma.appSetting.findUnique({ where: { key } }).catch(() => null);
    // Padrão: 100 para Master, 10 para Franqueado
    const defaultGoal = entityType === 'master' ? 100 : 10;
    return setting ? parseInt(setting.value) : defaultGoal;
}

// ============================================
// 8. Função Principal — getDashboardSummary
// ============================================
export async function getDashboardSummary(
    userType: string,
    userEmail: string
): Promise<DashboardSummaryResponse> {
    const type = userType.toUpperCase();

    if (type === 'ADMIN' || type === 'SUPERADMIN') {
        const [loanStats, prefeituraStats, thirdCard, loanChartData, rankings] = await Promise.all([
            getLoanStats('global'),
            getPrefeituraStats('global'),
            getAdminThirdCard(),
            getLoanChartData('global'),
            getRankings('global')
        ]);
        return { loanStats, prefeituraStats, thirdCard, loanChartData, rankings };
    }

    if (type === 'MASTER') {
        const masterId = await getMasterIdByEmail(userEmail);
        if (!masterId) throw new Error('Master não encontrado para o email: ' + userEmail);

        const [loanStats, prefeituraStats, thirdCard, loanChartData, rankings, totalAccumulatedLoans, goalPrefeituras] =
            await Promise.all([
                getLoanStats('master', masterId),
                getPrefeituraStats('master', masterId),
                getMasterThirdCard(masterId),
                getLoanChartData('master', masterId),
                getRankings('master', masterId),
                getTotalAccumulatedLoans('master', masterId),
                getGoalPrefeituras('master', masterId)
            ]);

        const now = new Date();
        return {
            loanStats, prefeituraStats, thirdCard, loanChartData, rankings,
            totalAccumulatedLoans,
            goals: {
                currentPrefeituras: prefeituraStats.total,
                goalPrefeituras,
                currentMonth: now.getMonth() + 1,
                totalMonths: 12
            }
        };
    }

    // FRANQUEADO
    const franqueadoId = await getFranqueadoIdByEmail(userEmail);
    if (!franqueadoId) throw new Error('Franqueado não encontrado para o email: ' + userEmail);

    const [loanStats, prefeituraStats, thirdCard, loanChartData, totalAccumulatedLoans, goalPrefeituras] =
        await Promise.all([
            getLoanStats('franqueado', franqueadoId),
            getPrefeituraStats('franqueado', franqueadoId),
            getFranqueadoThirdCard(franqueadoId),
            getLoanChartData('franqueado', franqueadoId),
            getTotalAccumulatedLoans('franqueado', franqueadoId),
            getGoalPrefeituras('franqueado', franqueadoId)
        ]);

    const now = new Date();
    return {
        loanStats, prefeituraStats, thirdCard, loanChartData,
        totalAccumulatedLoans,
        goals: {
            currentPrefeituras: prefeituraStats.total,
            goalPrefeituras,
            currentMonth: now.getMonth() + 1,
            totalMonths: 12
        }
    };
}
