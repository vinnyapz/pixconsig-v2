import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, getCurrentFranqueadoId } from '@/lib/auth-server';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let whereWrapper = {};

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (!franqueadoId) {
                return NextResponse.json({ error: 'Franqueado not found' }, { status: 404 });
            }
            whereWrapper = { franqueadoId };
        }

        const requests = await prisma.prefeituraRequest.findMany({
            where: whereWrapper,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                master: true,
                franqueado: true
            }
        });
        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching prefeitura requests:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar solicitações' },
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
            city,
            state,
            requesterType,
            masterId,
            franqueadoId,
            prefeituraId
        } = body;

        // Basic validation
        if (!city || !state || !requesterType) {
            return NextResponse.json(
                { error: 'Cidade, estado e tipo de solicitante são obrigatórios' },
                { status: 400 }
            );
        }

        if (requesterType === 'MASTER' && !masterId) {
            return NextResponse.json(
                { error: 'Master ID é obrigatório para solicitações de master' },
                { status: 400 }
            );
        }

        if (requesterType === 'FRANQUEADO' && (!franqueadoId && session.type !== 'franqueado')) {
            return NextResponse.json(
                { error: 'Franqueado ID é obrigatório para solicitações de franqueado' },
                { status: 400 }
            );
        }

        const prefeituraRequest = await prisma.prefeituraRequest.create({
            data: {
                city,
                state,
                requesterType,
                masterId: requesterType === 'MASTER' ? masterId : null,
                franqueadoId: requesterType === 'FRANQUEADO' ? (session.type === 'franqueado' ? await getCurrentFranqueadoId() : franqueadoId) : null,
                prefeituraId: prefeituraId || null,
                status: 'PENDING'
            },
            include: {
                master: true,
                franqueado: true
            }
        });

        return NextResponse.json(prefeituraRequest, { status: 201 });
    } catch (error) {
        console.error('Error creating prefeitura request:', error);
        return NextResponse.json(
            { error: 'Erro ao criar solicitação' },
            { status: 500 }
        );
    }
}
