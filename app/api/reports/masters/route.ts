import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { MastersReportResponse, MasterPerformanceItem } from '@/types/masters-report';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'monthly';

        // Calcular datas para período atual e anterior
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let currentStart: Date, previousStart: Date, previousEnd: Date;
        if (period === 'annual') {
            currentStart = new Date(Date.UTC(currentYear, 0, 1));
            previousStart = new Date(Date.UTC(currentYear - 1, 0, 1));
            previousEnd = new Date(Date.UTC(currentYear, 0, 1));
        } else {
            currentStart = new Date(Date.UTC(currentYear, currentMonth, 1));
            previousStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
            previousEnd = new Date(Date.UTC(currentYear, currentMonth, 1));
        }

        // Buscar masters com contagens
        const masters = await prisma.master.findMany({
            select: {
                id: true,
                name: true,
                _count: { select: { prefeituras: true, franqueados: true } },
            },
        });

        // Para cada master, calcular loans PAID atual e anterior
        const masterItems: MasterPerformanceItem[] = await Promise.all(
            masters.map(async (master: any) => {
                const [currentLoans, previousLoans] = await Promise.all([
                    prisma.loan.aggregate({
                        where: {
                            status: 'PAID',
                            date: { gte: currentStart },
                            OR: [
                                { prefeitura: { masterId: master.id } },
                                { prefeitura: { franqueado: { masterId: master.id } } }
                            ],
                        },
                        _sum: { amount: true },
                    }),
                    prisma.loan.aggregate({
                        where: {
                            status: 'PAID',
                            date: { gte: previousStart, lt: previousEnd },
                            OR: [
                                { prefeitura: { masterId: master.id } },
                                { prefeitura: { franqueado: { masterId: master.id } } }
                            ],
                        },
                        _sum: { amount: true },
                    }),
                ]);

                const current = currentLoans._sum.amount || 0;
                const previous = previousLoans._sum.amount || 0;
                const growth = previous > 0
                    ? ((current - previous) / previous) * 100
                    : current > 0 ? 100 : 0;

                return {
                    id: master.id,
                    name: master.name,
                    totalLoans: current,
                    prefeituraCount: master._count.prefeituras,
                    franqueadoCount: master._count.franqueados,
                    growth: Math.round(growth),
                };
            })
        );

        // Ordenar por totalLoans desc
        masterItems.sort((a: any, b: any) => b.totalLoans - a.totalLoans);

        // Buscar total geral de loans PAID para todos
        const totalAllLoans = await prisma.loan.aggregate({
            where: { status: 'PAID', date: { gte: currentStart } },
            _sum: { amount: true },
        });

        const response: MastersReportResponse = {
            masters: masterItems,
            summary: {
                totalMasters: masters.length,
                totalLoans: totalAllLoans._sum.amount || 0,
                totalPrefeituras: masterItems.reduce((s: any, m: any) => s + m.prefeituraCount, 0),
                totalFranqueados: masterItems.reduce((s: any, m: any) => s + m.franqueadoCount, 0),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching reports/masters:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar relatório de masters' },
            { status: 500 }
        );
    }
}
