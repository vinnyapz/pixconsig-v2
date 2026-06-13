import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { notifyAdmins, notifyPrefeituraOwner } from '@/lib/notification-helpers';

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

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { name: true },
        });

        const message = await prisma.prefeituraMessage.create({
            data: {
                content: content.trim(),
                senderName: user?.name || session.email,
                senderType: session.type.toUpperCase() as any,
                senderId: session.id,
                prefeituraId: id,
            },
        });

        // Buscar prefeitura para montar notificação
        const prefeitura = await prisma.prefeitura.findUnique({
            where: { id },
            select: { city: true, state: true },
        });

        const senderName = user?.name || session.email;
        const title = `💬 Nova mensagem em ${prefeitura?.city || 'prefeitura'}`;
        const notifContent = `${senderName}: "${content.trim().substring(0, 80)}${content.length > 80 ? '...' : ''}"`;
        const link = `/prefeituras`;

        // Se quem enviou é FRANQUEADO ou MASTER → notifica admins
        if (session.type === 'franqueado' || session.type === 'master') {
            await notifyAdmins(title, notifContent, link);
        }

        // Se quem enviou é ADMIN → notifica franqueado/master dono da prefeitura
        if (session.type === 'admin') {
            await notifyPrefeituraOwner(id, title, notifContent, link);
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
    }
}
