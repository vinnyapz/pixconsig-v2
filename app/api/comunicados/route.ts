import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';
import { sendComunicadoEmail } from '@/lib/mail';

// GET — histórico de comunicados
export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const isAdmin = isAdminType(session.type);
        const isMaster = session.type === 'master';
        if (!isAdmin && !isMaster) return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });

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
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const isAdmin = isAdminType(session.type);
        const isMaster = session.type === 'master';
        if (!isAdmin && !isMaster) return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });

        const { title, message, target, estados, franqueadoIds, masterIds } = await request.json();

        if (!title || !message || !target) {
            return NextResponse.json({ error: 'Título, mensagem e destinatário são obrigatórios' }, { status: 400 });
        }

        // Bloqueia envio se modo manutenção estiver ativo
        const maintenance = await prisma.appSetting.findUnique({ where: { key: 'maintenance_mode' } }).catch(() => null);
        if (maintenance?.value === 'true') {
            return NextResponse.json({ error: 'Modo teste ativo. Desative o modo teste antes de enviar comunicados.' }, { status: 403 });
        }

        let recipients: { id: string; email: string; name: string }[] = [];

        if (isMaster) {
            // Master só envia para seus franqueados
            const master = await prisma.master.findUnique({ where: { email: session.email } });
            if (!master) return NextResponse.json({ error: 'Master não encontrado' }, { status: 404 });

            const whereClause: any = { masterId: master.id };
            if (franqueadoIds?.length > 0) {
                whereClause.id = { in: franqueadoIds };
            } else if (estados?.length > 0) {
                whereClause.state = { in: estados };
            }

            const franqueados = await prisma.franqueado.findMany({
                where: whereClause,
                select: { email: true, name: true },
            });

            for (const f of franqueados) {
                const user = await prisma.user.findUnique({
                    where: { email: f.email },
                    select: { id: true, email: true, name: true },
                });
                if (user) recipients.push(user);
            }

        } else {
            // Admin
            const stateFilter = estados?.length > 0 ? { state: { in: estados } } : {};
            const hasSpecificPeople = (franqueadoIds && franqueadoIds.length > 0) || (masterIds && masterIds.length > 0);

            // Admins — só quando target=ADMIN ou ALL sem seleção específica
            if (target === 'ADMIN' || (target === 'ALL' && !hasSpecificPeople)) {
                const admins = await prisma.user.findMany({
                    where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, status: 'ACTIVE' },
                    select: { id: true, email: true, name: true },
                });
                recipients.push(...admins);
            }

            // Masters
            if (target === 'MASTER' || (target === 'ALL' && (!hasSpecificPeople || (masterIds && masterIds.length > 0)))) {
                const masterWhere: any = { ...stateFilter };
                if (masterIds && masterIds.length > 0) masterWhere.id = { in: masterIds };
                const masters = await prisma.master.findMany({
                    where: masterWhere,
                    select: { email: true, name: true },
                });
                for (const m of masters) {
                    const user = await prisma.user.findUnique({
                        where: { email: m.email },
                        select: { id: true, email: true, name: true },
                    });
                    if (user) recipients.push(user);
                }
            }

            // Franqueados
            if (target === 'FRANQUEADO' || (target === 'ALL' && (!hasSpecificPeople || (franqueadoIds && franqueadoIds.length > 0)))) {
                const franqueadoWhere: any = { ...stateFilter };
                if (franqueadoIds && franqueadoIds.length > 0) franqueadoWhere.id = { in: franqueadoIds };
                const franqueados = await prisma.franqueado.findMany({
                    where: franqueadoWhere,
                    select: { email: true, name: true },
                });
                for (const f of franqueados) {
                    const user = await prisma.user.findUnique({
                        where: { email: f.email },
                        select: { id: true, email: true, name: true },
                    });
                    if (user) recipients.push(user);
                }
            }
        }

        // Debug log
        console.log('[COMUNICADOS] target:', target);
        console.log('[COMUNICADOS] franqueadoIds:', franqueadoIds);
        console.log('[COMUNICADOS] masterIds:', masterIds);
        console.log('[COMUNICADOS] recipients antes de dedup:', recipients.length, recipients.map(r => r.email));

        // Remover duplicatas por id
        const unique = Array.from(new Map(recipients.map(u => [u.id, u])).values());
        console.log('[COMUNICADOS] unique recipients:', unique.length);

        if (unique.length > 0) {
            // Notificação no sistema
            await prisma.notification.createMany({
                data: unique.map(u => ({
                    userId: u.id,
                    type: 'SYSTEM' as const,
                    title,
                    content: message,
                    link: '/dashboard',
                })),
            });

            // Email
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

        return NextResponse.json({ success: true, totalSent: unique.length });
    } catch (error) {
        console.error('Error sending comunicado:', error);
        return NextResponse.json({ error: 'Erro ao enviar comunicado' }, { status: 500 });
    }
}
