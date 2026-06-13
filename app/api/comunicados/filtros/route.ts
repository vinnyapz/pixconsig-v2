import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const isMaster = session.type === 'master';
        const isAdmin = isAdminType(session.type);

        if (!isAdmin && !isMaster) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        if (isMaster) {
            // Master vê apenas seus franqueados
            const master = await prisma.master.findUnique({ where: { email: session.email } });
            if (!master) return NextResponse.json({ error: 'Master não encontrado' }, { status: 404 });

            const franqueados = await prisma.franqueado.findMany({
                where: { masterId: master.id },
                select: { id: true, name: true, state: true, email: true },
                orderBy: { name: 'asc' },
            });

            const estados = [...new Set(franqueados.map(f => f.state).filter(Boolean))].sort();

            return NextResponse.json({ franqueados, estados, isMaster: true });
        }

        // Admin vê estados de masters e franqueados
        const [masterStates, franqueadoStates] = await Promise.all([
            prisma.master.findMany({ select: { state: true }, distinct: ['state'] }),
            prisma.franqueado.findMany({ select: { state: true }, distinct: ['state'] }),
        ]);

        const allStates = [...new Set([
            ...masterStates.map(m => m.state),
            ...franqueadoStates.map(f => f.state),
        ].filter(Boolean))].sort();

        return NextResponse.json({ estados: allStates, isMaster: false });
    } catch (error) {
        console.error('Error fetching filters:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
