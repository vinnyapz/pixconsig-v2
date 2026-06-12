
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session || session.type !== 'franqueado') {
            return NextResponse.json(
                { error: 'Unauthorized or not a franchisee' },
                { status: 401 }
            );
        }

        const franqueado = await prisma.franqueado.findUnique({
            where: { email: session.email },
            include: {
                master: true
            }
        });

        if (!franqueado) {
            return NextResponse.json(
                { error: 'Franqueado not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(franqueado);
    } catch (error) {
        console.error('Error fetching franqueado details:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do franqueado' },
            { status: 500 }
        );
    }
}
