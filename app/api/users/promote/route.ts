import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || session.type !== 'superadmin') {
            return NextResponse.json(
                { error: 'Apenas SuperAdmins podem promover usuários.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, promote } = body; // promote: true = vira SUPERADMIN, false = volta para ADMIN

        if (!userId || typeof promote !== 'boolean') {
            return NextResponse.json(
                { error: 'userId e promote são obrigatórios' },
                { status: 400 }
            );
        }

        // Não pode alterar a si mesmo
        if (userId === session.id) {
            return NextResponse.json(
                { error: 'Você não pode alterar seu próprio nível.' },
                { status: 400 }
            );
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Só pode promover ADMINs ou rebaixar SUPERADMINs
        if (promote && targetUser.type !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Apenas usuários do tipo ADMIN podem ser promovidos a SUPERADMIN.' },
                { status: 400 }
            );
        }

        if (!promote && targetUser.type !== 'SUPERADMIN') {
            return NextResponse.json(
                { error: 'Usuário não é SUPERADMIN.' },
                { status: 400 }
            );
        }

        const newType = promote ? 'SUPERADMIN' : 'ADMIN';

        await prisma.user.update({
            where: { id: userId },
            data: { type: newType as any },
        });

        return NextResponse.json({
            message: promote
                ? 'Usuário promovido a SuperAdmin com sucesso.'
                : 'Usuário rebaixado para Admin com sucesso.',
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
