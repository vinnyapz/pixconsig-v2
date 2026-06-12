import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, getCurrentFranqueadoId, getCurrentMasterId } from '@/lib/auth-server';
import { createSystemMessage, notifyAdmins } from '@/lib/notification-helpers';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let whereWrapper: any = {};

        if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (!franqueadoId) {
                return NextResponse.json({ error: 'Franqueado not found' }, { status: 404 });
            }
            whereWrapper = { franqueadoId };
        } else if (session.type === 'master') {
            const masterId = await getCurrentMasterId();
            if (!masterId) {
                return NextResponse.json({ error: 'Master not found' }, { status: 404 });
            }
            whereWrapper = {
                OR: [
                    { masterId: masterId },
                    { franqueado: { masterId: masterId } }
                ]
            };
        }

        const prefeituras = await prisma.prefeitura.findMany({
            where: whereWrapper,
            orderBy: {
                city: 'asc'
            },
            include: {
                master: true,
                franqueado: true,
                loans: true,
                files: true,
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });
        return NextResponse.json(prefeituras);
    } catch (error) {
        console.error('Error fetching prefeituras:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar prefeituras' },
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
            franqueadoId
        } = body;

        // Basic validation
        if (!city || !state) {
            return NextResponse.json(
                { error: 'Cidade e estado são obrigatórios' },
                { status: 400 }
            );
        }

        if (session.type !== 'franqueado' && !franqueadoId && !masterId) {
            return NextResponse.json(
                { error: 'É necessário vincular a um Master ou Franqueado' },
                { status: 400 }
            );
        }

        // Check for duplicate CNPJ only if provided
        if (cnpj) {
            const existingPrefeitura = await prisma.prefeitura.findUnique({
                where: { cnpj }
            });

            if (existingPrefeitura) {
                return NextResponse.json(
                    { error: 'CNPJ já cadastrado' },
                    { status: 400 }
                );
            }
        }

        const prefeitura = await prisma.prefeitura.create({
            data: {
                city,
                state,
                cnpj: cnpj || null, // Convert empty string to null
                status: 'AGUARDANDO_ANALISE',
                mayorName,
                population: population ? parseInt(population) : null,
                address,
                zipCode,
                contactName,
                contactEmail,
                contactPhone,
                masterId: masterId || null,
                franqueadoId: session.type === 'franqueado' ? await getCurrentFranqueadoId() : (franqueadoId || null)
            },
            include: {
                master: true,
                franqueado: true,
                loans: true,
                files: true,
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        // Mensagem de sistema no chat
        try {
            await createSystemMessage(
                prefeitura.id,
                `📋 Prefeitura ${city} - ${state} foi solicitada e está aguardando análise.`
            );
        } catch (e) {
            console.error('Erro ao criar mensagem de sistema:', e);
        }

        // Notificar ADMINs
        try {
            await notifyAdmins(
                'Nova Prefeitura Solicitada',
                `A prefeitura ${city} - ${state} foi cadastrada e aguarda análise.`,
                `/prefeituras/gestao`
            );
        } catch (e) {
            console.error('Erro ao notificar admins:', e);
        }

        return NextResponse.json(prefeitura, { status: 201 });
    } catch (error) {
        console.error('Error creating prefeitura:', error);
        return NextResponse.json(
            { error: 'Erro ao criar prefeitura' },
            { status: 500 }
        );
    }
}
