import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const cnpj = searchParams.get('cnpj');
        const city = searchParams.get('city');

        if (!cnpj && !city) {
            return NextResponse.json({ duplicates: [] });
        }

        const orConditions: any[] = [];
        if (cnpj) orConditions.push({ cnpj });
        if (city) orConditions.push({ city });

        const duplicates = await prisma.prefeitura.findMany({
            where: {
                status: { in: ['AGUARDANDO_DECRETO', 'PROCESSO_EM_ANDAMENTO', 'ATIVA'] },
                OR: orConditions,
            },
            select: { id: true, city: true, state: true, cnpj: true, status: true },
        });

        return NextResponse.json({ duplicates });
    } catch (error) {
        console.error('Error checking duplicates:', error);
        return NextResponse.json({ error: 'Erro ao verificar duplicidade' }, { status: 500 });
    }
}
