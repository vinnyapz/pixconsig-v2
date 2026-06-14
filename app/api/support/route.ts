import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';

// GET — buscar mensagens de uma conversa
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const withUserId = searchParams.get('userId');
        const isAdmin = isAdminType(session.type);

        if (isAdmin && withUserId) {
            // Admin lendo conversa com um usuário específico
            const messages = await (prisma as any).supportMessage.findMany({
                where: {
                    OR: [
                        { senderId: session.id, recipientId: withUserId },
                        { senderId: withUserId, recipientId: session.id },
                    ],
                },
                orderBy: { createdAt: 'asc' },
            });

                if (messages.length > 0) console.log('[SUPPORT GET] primeiro msg keys:', Object.keys(messages[0]));
            if (messages.length > 0) console.log('[SUPPORT GET] primeiro msg attachment_url:', (messages[0] as any).attachment_url, 'attachmentUrl:', (messages[0] as any).attachmentUrl);
            // Marcar mensagens do usuário como lidas
            await (prisma as any).supportMessage.updateMany({
                where: { senderId: withUserId, recipientId: session.id, read: false },
                data: { read: true },
            });

            return NextResponse.json(messages);

        } else if (isAdmin) {
            // Admin listando todas as conversas (agrupadas por usuário)
            const messages = await (prisma as any).supportMessage.findMany({
                orderBy: { createdAt: 'desc' },
            });

            // Agrupar por conversa (par de usuários)
            const conversationsMap = new Map<string, any>();

            for (const msg of messages) {
                const otherUserId = msg.senderType === 'user' ? msg.senderId : msg.recipientId;
                const otherUserName = msg.senderType === 'user' ? msg.senderName : '';

                if (!conversationsMap.has(otherUserId)) {
                    conversationsMap.set(otherUserId, {
                        userId: otherUserId,
                        userName: otherUserName || msg.senderName,
                        lastMessage: msg.content,
                        lastMessageAt: msg.createdAt,
                        unread: 0,
                    });
                }

                if (msg.senderType === 'user' && !msg.read) {
                    conversationsMap.get(otherUserId).unread++;
                }
            }

            // Buscar nomes dos usuários
            const conversations = Array.from(conversationsMap.values());
            for (const conv of conversations) {
                const user = await prisma.user.findUnique({
                    where: { id: conv.userId },
                    select: { name: true, type: true, email: true },
                });
                if (user) {
                    conv.userName = user.name;
                    conv.userType = user.type;
                    conv.userEmail = user.email;
                }
            }

            // Calcular tempos de resposta para cada conversa
            for (const conv of conversations) {
                const msgs = messages.filter((m: any) => {
                    const otherId = m.senderType === 'user' ? m.senderId : m.recipientId;
                    return otherId === conv.userId;
                });

                // Última mensagem do usuário
                const lastUserMsg = [...msgs].reverse().find((m: any) => m.senderType === 'user');
                // Última mensagem do admin
                const lastAdminMsg = [...msgs].reverse().find((m: any) => m.senderType === 'admin');

                conv.lastUserMessageAt = lastUserMsg?.createdAt || null;
                conv.lastAdminMessageAt = lastAdminMsg?.createdAt || null;
            }

            return NextResponse.json(conversations.sort((a: any, b: any) =>
                new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            ));

        } else {
            // Usuário comum vendo suas próprias mensagens
            const adminUsers = await prisma.user.findMany({
                where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, status: 'ACTIVE' },
                select: { id: true },
                take: 1,
            });
            const adminId = adminUsers[0]?.id;
            if (!adminId) return NextResponse.json([]);

            const messages = await (prisma as any).supportMessage.findMany({
                where: {
                    OR: [
                        { senderId: session.id },
                        { recipientId: session.id },
                    ],
                },
                orderBy: { createdAt: 'asc' },
            });
                if (messages.length > 0) console.log('[SUPPORT GET USER] keys:', Object.keys(messages[0]), 'attachment_url:', (messages[0] as any).attachment_url);

            // Marcar mensagens do admin como lidas
            await (prisma as any).supportMessage.updateMany({
                where: { recipientId: session.id, senderType: 'admin', read: false },
                data: { read: true },
            });

            return NextResponse.json(messages);
        }
    } catch (error) {
        console.error('Support GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// POST — enviar mensagem
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const { content, recipientId, attachmentUrl, attachmentName, attachmentType } = await req.json();
        if (!content?.trim() && !attachmentUrl) return NextResponse.json({ error: 'Mensagem ou anexo obrigatório' }, { status: 400 });

        const isAdmin = isAdminType(session.type);

        let targetRecipientId = recipientId;

        if (!isAdmin) {
            // Usuário envia para o primeiro admin disponível
            const admin = await prisma.user.findFirst({
                where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, status: 'ACTIVE' },
                select: { id: true },
            });
            if (!admin) return NextResponse.json({ error: 'Nenhum admin disponível' }, { status: 404 });
            targetRecipientId = admin.id;
        }

        const message = await (prisma as any).supportMessage.create({
            data: {
                content: content?.trim() || '',
                senderType: isAdmin ? 'admin' : 'user',
                senderId: session.id,
                senderName: (session as any).name || session.email,
                recipientId: targetRecipientId,
                read: false,
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null,
                attachmentType: attachmentType || null,
            },
        });

        // Notificar o destinatário
        await prisma.notification.create({
            data: {
                userId: targetRecipientId,
                type: 'MESSAGE',
                title: `💬 Nova mensagem de ${(session as any).name || session.email}`,
                content: content.trim().substring(0, 100),
                link: isAdmin ? `/prefeituras` : `/settings`,
            },
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('[SUPPORT POST ERROR]:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
