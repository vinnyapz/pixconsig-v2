import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, getCurrentFranqueadoId } from '@/lib/auth-server';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const prefeituraId = searchParams.get('prefeituraId');

        let whereClause: any = prefeituraId ? { prefeituraId } : {};

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (!franqueadoId) {
                return NextResponse.json({ error: 'Franqueado not found' }, { status: 404 });
            }
            // Add condition that the loan's prefeitura must belong to this franchisee
            whereClause = {
                ...whereClause,
                prefeitura: {
                    franqueadoId
                }
            };
        }

        const loans = await prisma.loan.findMany({
            where: whereClause,
            orderBy: {
                date: 'desc'
            },
            include: {
                prefeitura: {
                    select: {
                        id: true,
                        city: true,
                        state: true
                    }
                }
            }
        });
        return NextResponse.json(loans);
    } catch (error) {
        console.error('Error fetching consignados:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar consignados' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            amount,
            type,
            status,
            date,
            observations,
            prefeituraId
        } = body;

        // Basic validation
        if (!amount || !type || !prefeituraId) {
            return NextResponse.json(
                { error: 'Valor, tipo e prefeitura são obrigatórios' },
                { status: 400 }
            );
        }

        // Validate prefeitura exists
        const prefeitura = await prisma.prefeitura.findUnique({
            where: { id: prefeituraId }
        });

        if (!prefeitura) {
            return NextResponse.json(
                { error: 'Prefeitura não encontrada' },
                { status: 404 }
            );
        }

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (prefeitura.franqueadoId !== franqueadoId) {
                return NextResponse.json(
                    { error: 'Acesso negado a esta prefeitura' },
                    { status: 403 }
                );
            }
        }

        const loan = await prisma.loan.create({
            data: {
                amount: parseFloat(amount),
                type: type.toUpperCase(),
                status: status?.toUpperCase() || 'PENDING',
                date: date ? new Date(date) : new Date(),
                observations: observations || null,
                prefeituraId
            },
            include: {
                prefeitura: {
                    select: {
                        id: true,
                        city: true,
                        state: true
                    }
                }
            }
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error('Error creating consignado:', error);
        return NextResponse.json(
            { error: 'Erro ao criar consignado' },
            { status: 500 }
        );
    }
}
