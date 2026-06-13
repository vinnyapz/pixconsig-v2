import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const isMaster = session.type === 'master';
        const isAdmin = isAdminType(session.type);

        if (!isAdmin && !isMaster) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const target = searchParams.get('target') || 'ALL';

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

        // Admin — busca franqueados e/ou masters dependendo do target
        const [masterStates, franqueadoStates] = await Promise.all([
            prisma.master.findMany({ select: { state: true }, distinct: ['state'] }),
            prisma.franqueado.findMany({ select: { state: true }, distinct: ['state'] }),
        ]);

        const allStates = [...new Set([
            ...masterStates.map(m => m.state),
            ...franqueadoStates.map(f => f.state),
        ].filter(Boolean))].sort();

        // Buscar lista de franqueados se target for FRANQUEADO ou ALL
        let franqueados: { id: string; name: string; state: string | null; email: string }[] = [];
        if (target === 'FRANQUEADO' || target === 'ALL') {
            franqueados = await prisma.franqueado.findMany({
                select: { id: true, name: true, state: true, email: true },
                orderBy: { name: 'asc' },
            });
        }

        // Buscar lista de masters se target for MASTER ou ALL
        let masters: { id: string; name: string; state: string | null; email: string }[] = [];
        if (target === 'MASTER' || target === 'ALL') {
            masters = await prisma.master.findMany({
                select: { id: true, name: true, state: true, email: true },
                orderBy: { name: 'asc' },
            });
        }

        return NextResponse.json({ estados: allStates, franqueados, masters, isMaster: false });
    } catch (error) {
        console.error('Error fetching filters:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
