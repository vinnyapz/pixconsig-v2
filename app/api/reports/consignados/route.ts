import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { ConsignadosReportResponse, PercentageVariation } from '@/types/consignados-report';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state') || 'all';
        const period = searchParams.get('period') || 'monthly';

        // 1) Definir range de datas baseado no period
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        let startDate: Date;
        let previousStartDate: Date;

        if (period === 'annual') {
            startDate = new Date(currentYear - 4, 0, 1);
            previousStartDate = new Date(currentYear - 9, 0, 1);
        } else {
            startDate = new Date(currentYear, currentMonth - 11, 1);
            previousStartDate = new Date(currentYear, currentMonth - 23, 1);
        }

        // 2) UMA ÚNICA QUERY: buscar TODOS os loans (período atual + anterior) de uma vez
        const whereClause: any = {
            status: { in: ['PAID', 'PENDING'] },
            date: { gte: previousStartDate }, // Pega tudo desde o período anterior
        };
        if (state !== 'all') {
            whereClause.prefeitura = { state: state.toUpperCase() };
        }

        const [allLoans, availableStatesResult] = await Promise.all([
            prisma.loan.findMany({
                where: whereClause,
                select: {
                    amount: true,
                    type: true,
                    status: true,
                    date: true,
                    prefeitura: { select: { state: true } }
                },
                orderBy: { date: 'asc' }
            }),
            prisma.prefeitura.findMany({
                where: { loans: { some: {} } },
                select: { state: true },
                distinct: ['state'],
                orderBy: { state: 'asc' },
            }),
        ]);

        // 3) Separar loans do período atual e do período anterior
        const currentPeriodLoans = allLoans.filter(l => new Date(l.date) >= startDate);
        const previousPeriodLoans = allLoans.filter(l => {
            const d = new Date(l.date);
            return d < startDate && l.status === 'PAID';
        });

        // 4) Agrupar e processar dados do período atual
        const evolutionMap = new Map<string, { servidorPublico: number, contratados: number, total: number, dateObj: Date }>();

        let totalPendentes = 0;
        let pendingServidor = 0;
        let pendingContratados = 0;

        // Inicializar mapa com todos os meses/anos do range
        if (period === 'monthly') {
            for (let i = 0; i < 12; i++) {
                const d = new Date(currentYear, currentMonth - 11 + i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                evolutionMap.set(key, { servidorPublico: 0, contratados: 0, total: 0, dateObj: d });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                const d = new Date(currentYear - 4 + i, 0, 1);
                const key = String(d.getFullYear());
                evolutionMap.set(key, { servidorPublico: 0, contratados: 0, total: 0, dateObj: d });
            }
        }

        currentPeriodLoans.forEach(loan => {
            const loanDate = new Date(loan.date);
            let key = '';

            if (period === 'monthly') {
                key = `${loanDate.getUTCFullYear()}-${String(loanDate.getUTCMonth() + 1).padStart(2, '0')}`;
            } else {
                key = String(loanDate.getUTCFullYear());
            }

            const amount = loan.amount;

            if (loan.status === 'PENDING') {
                totalPendentes += amount;
                if (loan.type === 'SERVIDOR') pendingServidor += amount;
                else if (loan.type === 'CONTRATADO') pendingContratados += amount;
            } else if (loan.status === 'PAID') {
                if (evolutionMap.has(key)) {
                    const entry = evolutionMap.get(key)!;
                    if (loan.type === 'SERVIDOR') {
                        entry.servidorPublico += amount;
                    } else if (loan.type === 'CONTRATADO') {
                        entry.contratados += amount;
                    }
                    entry.total += amount;
                }
            }
        });

        const evolution = Array.from(evolutionMap.entries()).map(([key, value]) => {
            const monthLabel = period === 'monthly'
                ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(value.dateObj)
                : '';

            return {
                month: period === 'monthly'
                    ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
                    : key,
                year: value.dateObj.getFullYear(),
                servidorPublico: value.servidorPublico,
                contratados: value.contratados,
                total: value.total
            };
        });

        // 5) Calcular totais realizados (PAID)
        const totalServidorPublico = evolution.reduce((acc, curr) => acc + curr.servidorPublico, 0);
        const totalContratados = evolution.reduce((acc, curr) => acc + curr.contratados, 0);
        const totalGeral = totalServidorPublico + totalContratados;

        // 6) Calcular variações usando os loans do período anterior (já filtrados)
        const prevTotalServidorPublico = previousPeriodLoans
            .filter(l => l.type === 'SERVIDOR')
            .reduce((sum, l) => sum + l.amount, 0);

        const prevTotalContratados = previousPeriodLoans
            .filter(l => l.type === 'CONTRATADO')
            .reduce((sum, l) => sum + l.amount, 0);

        const prevTotalGeral = prevTotalServidorPublico + prevTotalContratados;

        const calculateVariation = (current: number, previous: number): PercentageVariation => {
            if (previous === 0) return { value: 100, direction: 'up' };
            const diff = current - previous;
            const percentage = (diff / previous) * 100;
            return {
                value: Math.abs(parseFloat(percentage.toFixed(1))),
                direction: percentage >= 0 ? 'up' : 'down'
            };
        };

        // 7) Current Month
        const currentMonthData = evolution[evolution.length - 1];
        const previousMonthData = evolution[evolution.length - 2] || { total: 0 };

        const currentMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now);

        const currentMonthInfo = {
            monthLabel: currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1),
            total: currentMonthData ? currentMonthData.total : 0,
            servidorPublico: currentMonthData ? currentMonthData.servidorPublico : 0,
            contratados: currentMonthData ? currentMonthData.contratados : 0,
            variationVsPrevious: calculateVariation(
                currentMonthData ? currentMonthData.total : 0,
                previousMonthData.total
            )
        };

        const response: ConsignadosReportResponse = {
            summary: {
                totalGeral,
                totalServidorPublico,
                totalContratados,
                variationTotal: calculateVariation(totalGeral, prevTotalGeral),
                variationServidorPublico: calculateVariation(totalServidorPublico, prevTotalServidorPublico),
                variationContratados: calculateVariation(totalContratados, prevTotalContratados),

                totalPendentes,
                pendingServidor,
                pendingContratados
            },
            evolution,
            distribution: [
                { name: "Servidor Público", value: totalServidorPublico, color: "#0066A1" },
                { name: "Contratados", value: totalContratados, color: "#10B981" },
            ],
            currentMonth: currentMonthInfo,
            availableStates: availableStatesResult.map(s => s.state),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching reports/consignados:', error);
        return NextResponse.json({ error: 'Erro interno ao processar relatório' }, { status: 500 });
    }
}

