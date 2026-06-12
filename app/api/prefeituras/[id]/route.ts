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
        let whereWrapper: any = { id };

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (!franqueadoId) {
                return NextResponse.json({ error: 'Franqueado not found' }, { status: 404 });
            }
            whereWrapper = { id, franqueadoId };
        }

        const prefeitura = await prisma.prefeitura.findFirst({
            where: whereWrapper,
            include: {
                master: true,
                franqueado: true,
                loans: true,
                files: true,
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!prefeitura) {
            return NextResponse.json(
                { error: 'Prefeitura não encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(prefeitura);
    } catch (error) {
        console.error('Error fetching prefeitura:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar prefeitura' },
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

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            const existing = await prisma.prefeitura.findUnique({
                where: { id },
                select: { franqueadoId: true }
            });

            if (!existing || existing.franqueadoId !== franqueadoId) {
                return NextResponse.json({ error: 'Prefeitura não encontrada' }, { status: 404 });
            }
        }

        const body = await request.json();
        const {
            city,
            state,
            cnpj,
            status,
            mayorName,
            population,
            address,
            zipCode,
            contactName,
            contactEmail,
            contactPhone,
            masterId,
            franqueadoId,
            rejectionReason
        } = body;

        // Validation
        if (!city || !state) {
            return NextResponse.json(
                { error: 'Cidade e estado são obrigatórios' },
                { status: 400 }
            );
        }

        // Check for duplicate CNPJ if provided
        if (cnpj) {
            const existingWithCnpj = await prisma.prefeitura.findUnique({
                where: { cnpj }
            });

            if (existingWithCnpj && existingWithCnpj.id !== id) {
                return NextResponse.json(
                    { error: 'CNPJ já cadastrado' },
                    { status: 400 }
                );
            }
        }

        // Parse population safely
        let parsedPopulation = null;
        if (population !== undefined && population !== null && population !== '') {
            const parsed = parseInt(String(population));
            if (!isNaN(parsed)) {
                parsedPopulation = parsed;
            }
        }

        const prefeitura = await prisma.prefeitura.update({
            where: { id },
            data: {
                city,
                state,
                cnpj: cnpj || null,
                status,
                mayorName,
                population: parsedPopulation,
                address,
                zipCode,
                contactName,
                contactEmail,
                contactPhone,
                masterId: masterId || null,
                franqueadoId: franqueadoId || null,
                rejectionReason: rejectionReason || null
            },
            include: {
                master: true,
                franqueado: true,
                loans: true,
                files: true,
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        return NextResponse.json(prefeitura);
    } catch (error) {
        console.error('Error updating prefeitura:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar prefeitura' },
            { status: 500 } // Keep as 500 for now, or check for specific prisma codes
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

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            const existing = await prisma.prefeitura.findUnique({
                where: { id },
                select: { franqueadoId: true }
            });

            if (!existing || existing.franqueadoId !== franqueadoId) {
                return NextResponse.json({ error: 'Prefeitura não encontrada' }, { status: 404 });
            }
        }

        await prisma.prefeitura.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Prefeitura removida com sucesso' });
    } catch (error) {
        console.error('Error deleting prefeitura:', error);
        return NextResponse.json(
            { error: 'Erro ao remover prefeitura' },
            { status: 500 }
        );
    }
}
