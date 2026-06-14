import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';
import { sendComunicadoEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const { prefeituraId, subject, message, target = 'ambos' } = await request.json();

        if (!prefeituraId || !subject || !message) {
            return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        const prefeitura = await prisma.prefeitura.findUnique({
            where: { id: prefeituraId },
            select: {
                city: true,
                state: true,
                masterId: true,
                franqueadoId: true,
            },
        });

        if (!prefeitura) {
            return NextResponse.json({ error: 'Prefeitura não encontrada' }, { status: 404 });
        }

        const recipients: { name: string; email: string; role: string }[] = [];

        // Buscar Master responsável
        if (prefeitura.masterId && (target === 'master' || target === 'ambos')) {
            const master = await prisma.master.findUnique({
                where: { id: prefeitura.masterId },
                select: { name: true, email: true },
            });
            if (master) recipients.push({ ...master, role: 'Master' });
        }

        // Buscar Franqueado responsável
        if (prefeitura.franqueadoId && (target === 'franqueado' || target === 'ambos')) {
            const franqueado = await prisma.franqueado.findUnique({
                where: { id: prefeitura.franqueadoId },
                select: { name: true, email: true },
            });
            if (franqueado) recipients.push({ ...franqueado, role: 'Franqueado' });
        }

        if (recipients.length === 0) {
            return NextResponse.json({ error: 'Nenhum responsável encontrado para esta prefeitura' }, { status: 404 });
        }

        const prefeituraLabel = `${prefeitura.city} - ${prefeitura.state}`;
        const fullSubject = `[${prefeituraLabel}] ${subject}`;
        const fullMessage = `📍 Prefeitura: ${prefeituraLabel}\n\n${message}`;

        // Salvar notificação no sistema + enviar email
        for (const r of recipients) {
            const user = await prisma.user.findUnique({
                where: { email: r.email },
                select: { id: true },
            });

            if (user) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: 'SYSTEM',
                        title: fullSubject,
                        content: message,
                        link: `/prefeituras`,
                    },
                });
            }

            await sendComunicadoEmail(r.email, r.name, fullSubject, fullMessage);
        }

        return NextResponse.json({
            success: true,
            sentTo: recipients.map(r => ({ name: r.name, role: r.role, email: r.email })),
        });
    } catch (error) {
        console.error('Error sending direct message:', error);
        return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
    }
}
