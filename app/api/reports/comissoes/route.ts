import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { ComissoesReportResponse, ComissoesHistoryItem, CommissionByAgent } from '@/types/comissoes-report';

export async function GET(request: Request) {
    try {
        // 1) Autenticação (igual consignados)
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2) Query params
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state') || 'all';
        const period = searchParams.get('period') || 'monthly';

        // 3) Definir range de datas (COPIAR LÓGICA de consignados linhas 18-31)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let startDate: Date;
        if (period === 'annual') {
            startDate = new Date(currentYear - 4, 0, 1);
        } else {
            startDate = new Date(currentYear, currentMonth - 11, 1);
        }

        // 4) Construir whereClause para Loans PAID
        const loanWhereClause: any = {
            status: 'PAID',
            date: { gte: startDate },
        };
        if (state !== 'all') {
            loanWhereClause.prefeitura = { state: state.toUpperCase() };
        }

        // 5) Query principal: buscar Loans com relations 
        const [paidLoans, availableStatesResult] = await Promise.all([
            prisma.loan.findMany({
                where: loanWhereClause,
                select: {
                    amount: true,
                    date: true,
                    prefeitura: {
                        select: {
                            state: true,
                            masterId: true,
                            franqueadoId: true,
                            master: { select: { id: true, name: true, commissionRate: true } },
                            franqueado: { select: { id: true, name: true, commissionRate: true } },
                        }
                    }
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

        // 6) Agregar por mês/ano para o histórico (AreaChart)
        // Usar Map<string, { totalCommission, masterCommission, franqueadoCommission, dateObj }>
        // Inicializar o mapa com todos os meses/anos do range (COPIAR padrão linhas 77-89)
        const historyMap = new Map<string, {
            totalCommission: number; masterCommission: number;
            franqueadoCommission: number; dateObj: Date
        }>();

        // Inicializar mapa (igualzinho ao consignados)
        if (period === 'monthly') {
            for (let i = 0; i < 12; i++) {
                const d = new Date(currentYear, currentMonth - 11 + i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                historyMap.set(key, { totalCommission: 0, masterCommission: 0, franqueadoCommission: 0, dateObj: d });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                const d = new Date(currentYear - 4 + i, 0, 1);
                historyMap.set(String(d.getFullYear()), { totalCommission: 0, masterCommission: 0, franqueadoCommission: 0, dateObj: d });
            }
        }

        // 7) Agregar por agente para a tabela
        // Usar Map<string, CommissionByAgent>
        const agentsMap = new Map<string, CommissionByAgent>();

        let totalMasterComm = 0;
        let totalFranqueadoComm = 0;
        let totalLoansValue = 0;

        // 8) Iterar sobre os empréstimos (loop principal)
        paidLoans.forEach(loan => {
            const loanDate = new Date(loan.date);
            const key = period === 'monthly'
                ? `${loanDate.getUTCFullYear()}-${String(loanDate.getUTCMonth() + 1).padStart(2, '0')}`
                : String(loanDate.getUTCFullYear());

            const pref = loan.prefeitura;
            totalLoansValue += loan.amount;

            // Calcular comissão do Master (se existir)
            if (pref.master) {
                const masterComm = loan.amount * (pref.master.commissionRate / 100);
                totalMasterComm += masterComm;

                // Atualizar historyMap
                if (historyMap.has(key)) {
                    const entry = historyMap.get(key)!;
                    entry.masterCommission += masterComm;
                    entry.totalCommission += masterComm;
                }

                // Atualizar agentsMap
                const masterId = `master-${pref.master.id}`;
                if (!agentsMap.has(masterId)) {
                    agentsMap.set(masterId, {
                        id: pref.master.id,
                        name: pref.master.name,
                        role: 'Master',
                        commissionRate: pref.master.commissionRate,
                        totalLoans: 0,
                        totalCommission: 0,
                    });
                }
                const masterAgent = agentsMap.get(masterId)!;
                masterAgent.totalLoans += loan.amount;
                masterAgent.totalCommission += masterComm;
            }

            // Calcular comissão do Franqueado (se existir)
            if (pref.franqueado) {
                const franqComm = loan.amount * (pref.franqueado.commissionRate / 100);
                totalFranqueadoComm += franqComm;

                if (historyMap.has(key)) {
                    const entry = historyMap.get(key)!;
                    entry.franqueadoCommission += franqComm;
                    entry.totalCommission += franqComm;
                }

                const franqId = `franqueado-${pref.franqueado.id}`;
                if (!agentsMap.has(franqId)) {
                    agentsMap.set(franqId, {
                        id: pref.franqueado.id,
                        name: pref.franqueado.name,
                        role: 'Franqueado',
                        commissionRate: pref.franqueado.commissionRate,
                        totalLoans: 0,
                        totalCommission: 0,
                    });
                }
                const franqAgent = agentsMap.get(franqId)!;
                franqAgent.totalLoans += loan.amount;
                franqAgent.totalCommission += franqComm;
            }
        });

        // 9) Formatar dados para a resposta
        const history: ComissoesHistoryItem[] = Array.from(historyMap.entries()).map(([key, value]) => {
            const monthLabel = period === 'monthly'
                ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(value.dateObj)
                : '';
            return {
                month: period === 'monthly'
                    ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
                    : key,
                year: value.dateObj.getFullYear(),
                totalCommission: value.totalCommission,
                masterCommission: value.masterCommission,
                franqueadoCommission: value.franqueadoCommission,
                originalDate: value.dateObj,
            };
        });

        const agents = Array.from(agentsMap.values())
            .sort((a, b) => b.totalCommission - a.totalCommission);

        // 10) Montar resposta
        const response: ComissoesReportResponse = {
            summary: {
                totalCommission: totalMasterComm + totalFranqueadoComm,
                totalMasterCommission: totalMasterComm,
                totalFranqueadoCommission: totalFranqueadoComm,
                totalLoansValue,
            },
            history,
            agents,
            availableStates: availableStatesResult.map(s => s.state),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching reports/comissoes:', error);
        return NextResponse.json({ error: 'Erro interno ao processar relatório de comissões' }, { status: 500 });
    }
}
