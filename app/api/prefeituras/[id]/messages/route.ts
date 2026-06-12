import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

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

        const messages = await prisma.prefeituraMessage.findMany({
            where: { prefeituraId: id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await request.json();

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Mensagem não pode ser vazia' }, { status: 400 });
        }

        // Buscar nome do remetente
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { name: true },
        });

        const message = await prisma.prefeituraMessage.create({
            data: {
                content: content.trim(),
                senderName: user?.name || session.email,
                senderType: session.type.toUpperCase() as any, // Assumindo enum compatível
                senderId: session.id,
                prefeituraId: id,
            },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
    }
}
