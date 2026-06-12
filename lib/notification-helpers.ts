
import { prisma } from '@/lib/prisma';

// Mapa de labels amigáveis para status
const STATUS_LABELS: Record<string, string> = {
    AGUARDANDO_ANALISE: 'Aguardando Análise',
    AGUARDANDO_DECRETO: 'Aguardando Decreto',
    PROCESSO_EM_ANDAMENTO: 'Processo em Andamento',
    ATIVA: 'Ativa',
    INATIVA: 'Inativa',
    REPROVADA: 'Reprovada',
};

/** Cria uma mensagem de sistema no chat da prefeitura */
export async function createSystemMessage(
    prefeituraId: string,
    content: string
) {
    return prisma.prefeituraMessage.create({
        data: {
            content,
            senderName: 'Sistema',
            senderType: 'ADMIN',
            senderId: 'system',
            isSystemMessage: true,
            prefeituraId,
        },
    });
}

/** Notifica todos os ADMINs */
export async function notifyAdmins(
    title: string,
    content: string,
    link: string
) {
    const admins = await prisma.user.findMany({
        where: { type: 'ADMIN', status: 'ACTIVE' },
        select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
        data: admins.map((admin) => ({
            userId: admin.id,
            type: 'STATUS_CHANGE' as const,
            title,
            content,
            link,
        })),
    });
}

/** Notifica o Master/Franqueado dono da prefeitura */
export async function notifyPrefeituraOwner(
    prefeituraId: string,
    title: string,
    content: string,
    link: string
) {
    const prefeitura = await prisma.prefeitura.findUnique({
        where: { id: prefeituraId },
        select: { masterId: true, franqueadoId: true },
    });

    if (!prefeitura) return;

    const ownerIds: string[] = [];

    // Buscar userId do Master vinculado
    if (prefeitura.masterId) {
        const master = await prisma.master.findUnique({
            where: { id: prefeitura.masterId },
            select: { email: true },
        });
        if (master) {
            const masterUser = await prisma.user.findUnique({
                where: { email: master.email },
                select: { id: true },
            });
            if (masterUser) ownerIds.push(masterUser.id);
        }
    }

    // Buscar userId do Franqueado vinculado
    if (prefeitura.franqueadoId) {
        const franqueado = await prisma.franqueado.findUnique({
            where: { id: prefeitura.franqueadoId },
            select: { email: true },
        });
        if (franqueado) {
            const franqueadoUser = await prisma.user.findUnique({
                where: { email: franqueado.email },
                select: { id: true },
            });
            if (franqueadoUser) ownerIds.push(franqueadoUser.id);
        }
    }

    if (ownerIds.length === 0) return;

    await prisma.notification.createMany({
        data: ownerIds.map((userId) => ({
            userId,
            type: 'STATUS_CHANGE' as const,
            title,
            content,
            link,
        })),
    });
}

export function getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
}
