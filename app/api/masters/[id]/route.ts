import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const master = await prisma.master.findUnique({
            where: { id }
        });

        if (!master) {
            return NextResponse.json(
                { error: 'Master não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(master);
    } catch (error) {
        console.error('Error fetching master:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar master' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, email, phone, document, address, city, state, zipCode, commissionRate } = body;

        // Validation
        if (!name || !email || !phone) {
            return NextResponse.json(
                { error: 'Nome, email e telefone são obrigatórios' },
                { status: 400 }
            );
        }

        const master = await prisma.master.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                document,
                address,
                city,
                state,
                zipCode,
                commissionRate: typeof commissionRate === 'string' ? parseFloat(commissionRate) : commissionRate
            }
        });

        return NextResponse.json(master);
    } catch (error) {
        console.error('Error updating master:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar master' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find master first to get email
        const master = await prisma.master.findUnique({
            where: { id },
            select: { email: true }
        });

        if (!master) {
            return NextResponse.json(
                { error: 'Master não encontrado' },
                { status: 404 }
            );
        }

        // Transaction to delete both
        await prisma.$transaction(async (tx) => {
            // Delete Master
            await tx.master.delete({
                where: { id }
            });

            // Delete User with same email
            // Use deleteMany to be safe if for some reason user doesn't exist or unique constraint validation quirks
            // But usually findUnique + delete or delete({ where: { email } }) is fine if unique.
            // Using deleteMany prevents error if user not found.
            await tx.user.deleteMany({
                where: { email: master.email, type: 'MASTER' }
            });
        });

        return NextResponse.json({ message: 'Master e usuário removidos com sucesso' });
    } catch (error) {
        console.error('Error deleting master:', error);
        return NextResponse.json(
            { error: 'Erro ao remover master' },
            { status: 500 }
        );
    }
}
