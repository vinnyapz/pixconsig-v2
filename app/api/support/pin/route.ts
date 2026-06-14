import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json({ error: 'Apenas admins podem fixar mensagens' }, { status: 403 });
        }

        const { messageId, pinned } = await req.json();
        if (!messageId) return NextResponse.json({ error: 'messageId obrigatório' }, { status: 400 });

        await (prisma as any).supportMessage.update({
            where: { id: messageId },
            data: {
                pinned,
                pinnedAt: pinned ? new Date() : null,
            },
        });

        return NextResponse.json({ success: true, pinned });
    } catch (error) {
        console.error('Pin error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
