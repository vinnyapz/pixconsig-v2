import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const prefeituraRequest = await prisma.prefeituraRequest.findUnique({
            where: { id },
            include: {
                master: true,
                franqueado: true
            }
        });

        if (!prefeituraRequest) {
            return NextResponse.json(
                { error: 'Solicitação não encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(prefeituraRequest);
    } catch (error) {
        console.error('Error fetching prefeitura request:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar solicitação' },
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
        const { status } = body;

        // Validation
        if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json(
                { error: 'Status inválido' },
                { status: 400 }
            );
        }

        // Get the request first
        const existingRequest = await prisma.prefeituraRequest.findUnique({
            where: { id }
        });

        if (!existingRequest) {
            return NextResponse.json(
                { error: 'Solicitação não encontrada' },
                { status: 404 }
            );
        }

        // If approving, create or link the prefeitura
        if (status === 'APPROVED' && existingRequest.status === 'PENDING') {
            // Check if prefeitura already exists
            let prefeitura = existingRequest.prefeituraId 
                ? await prisma.prefeitura.findUnique({ where: { id: existingRequest.prefeituraId } })
                : await prisma.prefeitura.findFirst({
                    where: {
                        city: existingRequest.city,
                        state: existingRequest.state
                    }
                });

            if (prefeitura) {
                // Link existing prefeitura to the requester
                await prisma.prefeitura.update({
                    where: { id: prefeitura.id },
                    data: existingRequest.requesterType === 'MASTER'
                        ? { masterId: existingRequest.masterId }
                        : { franqueadoId: existingRequest.franqueadoId }
                });
            } else {
                // Create new prefeitura
                prefeitura = await prisma.prefeitura.create({
                    data: {
                        city: existingRequest.city,
                        state: existingRequest.state,
                        cnpj: `${Date.now()}`, // Temporary CNPJ, should be provided in request
                        status: 'ATIVA',
                        masterId: existingRequest.requesterType === 'MASTER' ? existingRequest.masterId : null,
                        franqueadoId: existingRequest.requesterType === 'FRANQUEADO' ? existingRequest.franqueadoId : null
                    }
                });
            }
        }

        const updatedRequest = await prisma.prefeituraRequest.update({
            where: { id },
            data: { status },
            include: {
                master: true,
                franqueado: true
            }
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating prefeitura request:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar solicitação' },
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
        await prisma.prefeituraRequest.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Solicitação removida com sucesso' });
    } catch (error) {
        console.error('Error deleting prefeitura request:', error);
        return NextResponse.json(
            { error: 'Erro ao remover solicitação' },
            { status: 500 }
        );
    }
}
