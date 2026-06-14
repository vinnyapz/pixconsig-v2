import { isAdminType } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, getCurrentFranqueadoId, getCurrentMasterId } from '@/lib/auth-server';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        let count = 0;

        if (isAdminType(session.type)) {
            count = await prisma.prefeitura.count({
                where: {
                    status: {
                        in: ['AGUARDANDO_ANALISE', 'PROCESSO_EM_ANDAMENTO']
                    }
                }
            });
        } else if (session.type === 'master') {
            const masterId = await getCurrentMasterId();
            if (masterId) {
                count = await prisma.prefeitura.count({
                    where: {
                        status: 'AGUARDANDO_DECRETO',
                        masterId: masterId
                    }
                });
            }
        } else if (session.type === 'franqueado') {
            const franqueadoId = await getCurrentFranqueadoId();
            if (franqueadoId) {
                count = await prisma.prefeitura.count({
                    where: {
                        status: 'AGUARDANDO_DECRETO',
                        franqueadoId: franqueadoId
                    }
                });
            }
        }

        return NextResponse.json({ count });

    } catch (error) {
        console.error('Error counting pending prefeituras:', error);
        return NextResponse.json({ error: 'Erro ao contar pendências' }, { status: 500 });
    }
}
