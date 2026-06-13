import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';
import { sendComunicadoEmail } from '@/lib/mail';

// GET — histórico de comunicados
export async function GET() {
    try {
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const comunicados = await (prisma as any).comunicado.findMany({
            orderBy: { sentAt: 'desc' },
            take: 20,
        });

        return NextResponse.json(comunicados);
    } catch (error) {
        console.error('Error fetching comunicados:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// POST — enviar novo comunicado
export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const { title, message, target } = await request.json();

        if (!title || !message || !target) {
            return NextResponse.json({ error: 'Título, mensagem e destinatário são obrigatórios' }, { status: 400 });
        }

        // Buscar destinatários conforme o target
        let userEmails: { id: string; email: string; name: string }[] = [];

        if (target === 'ALL' || target === 'ADMIN') {
            const admins = await prisma.user.findMany({
                where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, status: 'ACTIVE' },
                select: { id: true, email: true, name: true },
            });
            userEmails.push(...admins);
        }

        if (target === 'ALL' || target === 'MASTER') {
            const masters = await prisma.master.findMany({
                select: { id: true, email: true, name: true },
            });
            // Buscar o userId de cada master pelo email
            for (const m of masters) {
                const user = await prisma.user.findUnique({
                    where: { email: m.email },
                    select: { id: true, email: true, name: true },
                });
                if (user) userEmails.push(user);
            }
        }

        if (target === 'ALL' || target === 'FRANQUEADO') {
            const franqueados = await prisma.franqueado.findMany({
                select: { id: true, email: true, name: true },
            });
            for (const f of franqueados) {
                const user = await prisma.user.findUnique({
                    where: { email: f.email },
                    select: { id: true, email: true, name: true },
                });
                if (user) userEmails.push(user);
            }
        }

        // Remover duplicatas por id
        const unique = Array.from(new Map(userEmails.map(u => [u.id, u])).values());

        // Salvar notificação no sistema para cada destinatário
        if (unique.length > 0) {
            await prisma.notification.createMany({
                data: unique.map(u => ({
                    userId: u.id,
                    type: 'SYSTEM' as const,
                    title,
                    content: message,
                    link: '/dashboard',
                })),
            });

            // Enviar email para todos
            await Promise.allSettled(
                unique.map(u => sendComunicadoEmail(u.email, u.name, title, message))
            );
        }

        // Salvar no histórico
        await (prisma as any).comunicado.create({
            data: {
                title,
                message,
                target,
                sentById: session.id,
                totalSent: unique.length,
            },
        });

        return NextResponse.json({
            success: true,
            totalSent: unique.length,
        });
    } catch (error) {
        console.error('Error sending comunicado:', error);
        return NextResponse.json({ error: 'Erro ao enviar comunicado' }, { status: 500 });
    }
}
