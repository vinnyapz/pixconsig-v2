import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { createSystemMessage, notifyPrefeituraOwner, notifyAdmins, getStatusLabel } from '@/lib/notification-helpers';

// Mapa de transições válidas
// Agora com INATIVA e REPROVADA separados
const TRANSITIONS: Record<string, {
    allowedTypes: string[];       // UserTypes permitidos
    nextStatus: string;           // Próximo status em caso de sucesso
}> = {
    'APROVAR': {
        // Fase 1 -> Fase 2 (Admin aprova)
        allowedTypes: ['admin'],
        nextStatus: 'AGUARDANDO_DECRETO',
    },
    'REPROVAR': {
        // Fase 1 -> REPROVADA (Admin reprova)
        allowedTypes: ['admin'],
        nextStatus: 'REPROVADA',
    },
    'ENVIAR_DECRETO': {
        // Fase 2 -> Fase 3 (Franqueado envia decreto)
        allowedTypes: ['franqueado'],
        nextStatus: 'PROCESSO_EM_ANDAMENTO',
    },
    'FINALIZAR': {
        // Fase 3 -> Fase 4 (Admin finaliza)
        allowedTypes: ['admin'],
        nextStatus: 'ATIVA',
    },
};

// Mapa de qual status permite qual ação
const STATUS_ACTIONS: Record<string, string[]> = {
    'AGUARDANDO_ANALISE': ['APROVAR', 'REPROVAR'],
    'AGUARDANDO_DECRETO': ['ENVIAR_DECRETO'],
    'PROCESSO_EM_ANDAMENTO': ['FINALIZAR'],
    'ATIVA': [], // Sem ações de workflow automáticas
    'INATIVA': [],
    'REPROVADA': [],
};

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { action, rejectionReason } = await request.json();

        // 1. Buscar prefeitura atual
        const prefeitura = await prisma.prefeitura.findUnique({
            where: { id },
            select: { status: true, cnpj: true, city: true }
        });

        if (!prefeitura) {
            return NextResponse.json({ error: 'Prefeitura não encontrada' }, { status: 404 });
        }

        // 2. Verificar se ação é válida para o status atual
        const allowedActions = STATUS_ACTIONS[prefeitura.status] || [];
        if (!allowedActions.includes(action)) {
            return NextResponse.json(
                { error: `Ação '${action}' não permitida para o status '${prefeitura.status}'` },
                { status: 400 }
            );
        }

        // 3. Verificar permissão do usuário
        const transition = TRANSITIONS[action];
        if (!transition.allowedTypes.includes(session.type)) {
            return NextResponse.json(
                { error: 'Você não tem permissão para esta ação' },
                { status: 403 }
            );
        }

        // 4. Validar motivo de reprovação
        if (action === 'REPROVAR' && (!rejectionReason || rejectionReason.trim() === '')) {
            return NextResponse.json(
                { error: 'Motivo da reprovação é obrigatório' },
                { status: 400 }
            );
        }

        // 5. Na aprovação (Fase 1), verificar duplicidade de CNPJ/Nome
        let duplicateWarning: string | null = null;
        if (action === 'APROVAR') {
            const duplicates = await prisma.prefeitura.findMany({
                where: {
                    id: { not: id },
                    status: { in: ['AGUARDANDO_DECRETO', 'PROCESSO_EM_ANDAMENTO', 'ATIVA'] },
                    OR: [
                        ...(prefeitura.cnpj ? [{ cnpj: prefeitura.cnpj }] : []),
                        { city: prefeitura.city },
                    ],
                },
                select: { id: true, city: true, status: true },
            });

            if (duplicates.length > 0) {
                duplicateWarning = `Atenção: Prefeitura com mesmo CNPJ/Cidade já existe nas fases: ${duplicates.map((d: any) => `${d.city} (${d.status})`).join(', ')}`;
            }
        }

        // 6. Executar transição
        const updated = await prisma.prefeitura.update({
            where: { id },
            data: {
                status: transition.nextStatus as any,
                rejectionReason: action === 'REPROVAR' ? rejectionReason : undefined,
            },
            include: {
                master: true,
                franqueado: true,
                loans: true,
                files: true,
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });

        // Mensagem de sistema no chat
        try {
            const statusLabel = getStatusLabel(transition.nextStatus);
            await createSystemMessage(
                id,
                `🔄 Status atualizado para "${statusLabel}" por ${session.type.toUpperCase()}.`
            );
        } catch (e) {
            console.error('Erro ao criar mensagem de sistema:', e);
        }

        // Notificar dono da prefeitura
        try {
            const statusLabel = getStatusLabel(transition.nextStatus);

            if (action === 'ENVIAR_DECRETO') {
                await notifyAdmins(
                    'Decreto Enviado',
                    `O franqueado enviou o decreto da prefeitura ${prefeitura.city}. Status atualizado para "${statusLabel}".`,
                    `/prefeituras`
                );
            } else {
                await notifyPrefeituraOwner(
                    id,
                    'Status da Prefeitura Atualizado',
                    `A prefeitura ${prefeitura.city} teve status alterado para "${statusLabel}".`,
                    `/prefeituras`
                );
            }
        } catch (e) {
            console.error('Erro ao notificar dono:', e);
        }

        return NextResponse.json({
            prefeitura: updated,
            ...(duplicateWarning && { warning: duplicateWarning }),
        });
    } catch (error) {
        console.error('Error updating prefeitura status:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar status' },
            { status: 500 }
        );
    }
}
