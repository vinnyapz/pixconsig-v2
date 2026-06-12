import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { RegionalReportResponse, StateReportItem } from '@/types/regional-report';

const STATE_COLORS = [
    '#0066A1', '#10B981', '#F59E0B', '#8B5CF6',
    '#EF4444', '#06B6D4', '#EC4899', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#A855F7',
];

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar loans PAID com state e type
        const paidLoans = await prisma.loan.findMany({
            where: { status: 'PAID' },
            select: {
                amount: true,
                type: true,
                prefeitura: { select: { id: true, state: true } },
            },
        });

        // Agrupar por state
        const stateMap = new Map<string, {
            totalLoans: number;
            servidorPublico: number;
            contratados: number;
            prefeituraIds: Set<string>;
        }>();

        paidLoans.forEach(loan => {
            const st = loan.prefeitura.state;
            if (!stateMap.has(st)) {
                stateMap.set(st, {
                    totalLoans: 0, servidorPublico: 0,
                    contratados: 0, prefeituraIds: new Set(),
                });
            }
            const entry = stateMap.get(st)!;
            entry.totalLoans += loan.amount;
            entry.prefeituraIds.add(loan.prefeitura.id);

            if (loan.type === 'SERVIDOR') {
                entry.servidorPublico += loan.amount;
            } else {
                entry.contratados += loan.amount;
            }
        });

        // Converter para array e ordenar
        const states: StateReportItem[] = Array.from(stateMap.entries())
            .map(([state, data], index) => ({
                state,
                totalLoans: data.totalLoans,
                servidorPublico: data.servidorPublico,
                contratados: data.contratados,
                prefeituras: data.prefeituraIds.size,
                color: STATE_COLORS[index % STATE_COLORS.length],
            }))
            .sort((a, b) => b.totalLoans - a.totalLoans);

        const response: RegionalReportResponse = {
            states,
            summary: {
                totalLoans: states.reduce((s, x) => s + x.totalLoans, 0),
                totalServidor: states.reduce((s, x) => s + x.servidorPublico, 0),
                totalContratados: states.reduce((s, x) => s + x.contratados, 0),
                totalPrefeituras: states.reduce((s, x) => s + x.prefeituras, 0),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching reports/regional:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar relatório regional' },
            { status: 500 }
        );
    }
}
