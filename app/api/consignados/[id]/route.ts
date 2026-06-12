import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, getCurrentFranqueadoId } from '@/lib/auth-server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const loan = await prisma.loan.findUnique({
            where: { id },
            include: {
                prefeitura: {
                    select: {
                        id: true,
                        city: true,
                        state: true,
                        franqueadoId: true // Fetch franqueadoId to check ownership
                    }
                }
            }
        });

        if (loan && session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (loan.prefeitura.franqueadoId !== franqueadoId) {
                return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
            }
        }

        if (!loan) {
            return NextResponse.json(
                { error: 'Consignado não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(loan);
    } catch (error) {
        console.error('Error fetching consignado:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar consignado' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            amount,
            type,
            status,
            date,
            observations
        } = body;

        // Check if loan exists and fetch prefeitura.franqueadoId
        const existingLoan = await prisma.loan.findUnique({
            where: { id },
            include: {
                prefeitura: {
                    select: { franqueadoId: true }
                }
            }
        });

        if (!existingLoan) {
            return NextResponse.json(
                { error: 'Consignado não encontrado' },
                { status: 404 }
            );
        }

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (existingLoan.prefeitura.franqueadoId !== franqueadoId) {
                return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
            }
        }

        const loan = await prisma.loan.update({
            where: { id },
            data: {
                amount: amount ? parseFloat(amount) : existingLoan.amount,
                type: type ? type.toUpperCase() : existingLoan.type,
                status: status ? status.toUpperCase() : existingLoan.status,
                date: date ? new Date(date) : existingLoan.date,
                observations: observations !== undefined ? observations : existingLoan.observations
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

        return NextResponse.json(loan);
    } catch (error) {
        console.error('Error updating consignado:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar consignado' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if loan exists
        const existingLoan = await prisma.loan.findUnique({
            where: { id },
            include: {
                prefeitura: {
                    select: { franqueadoId: true }
                }
            }
        });

        if (!existingLoan) {
            return NextResponse.json(
                { error: 'Consignado não encontrado' },
                { status: 404 }
            );
        }

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (existingLoan.prefeitura.franqueadoId !== franqueadoId) {
                return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
            }
        }

        await prisma.loan.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Consignado removido com sucesso' });
    } catch (error) {
        console.error('Error deleting consignado:', error);
        return NextResponse.json(
            { error: 'Erro ao remover consignado' },
            { status: 500 }
        );
    }
}
