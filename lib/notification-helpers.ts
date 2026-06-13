import { prisma } from '@/lib/prisma';

const STATUS_LABELS: Record<string, string> = {
    AGUARDANDO_ANALISE: 'Aguardando Análise',
    AGUARDANDO_DECRETO: 'Aguardando Decreto',
    PROCESSO_EM_ANDAMENTO: 'Processo em Andamento',
    ATIVA: 'Ativa',
    INATIVA: 'Inativa',
    REPROVADA: 'Reprovada',
};

type NotifType = 'onMessage' | 'onFile' | 'onStatusChange' | 'onNewRequest' | 'onFollowUp' | 'onPrefeituraAlert';

/** Filtra usuários que aceitam determinado tipo de notificação */
async function filterUsersByPreference(userIds: string[], type: NotifType): Promise<string[]> {
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, [type]: true },
  });

  const prefsMap = Object.fromEntries(prefs.map(p => [p.userId, p[type] as boolean]));

  return userIds.filter(id => {
    // Se não tem preferência cadastrada, assume true (recebe por padrão)
    if (!(id in prefsMap)) return true;
    return prefsMap[id] === true;
  });
}

/** Cria uma mensagem de sistema no chat da prefeitura */
export async function createSystemMessage(prefeituraId: string, content: string) {
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

/** Notifica todos os ADMINs ativos que aceitam o tipo */
export async function notifyAdmins(
    title: string,
    content: string,
    link: string,
    type: NotifType = 'onMessage'
) {
    const admins = await prisma.user.findMany({
        where: { type: 'ADMIN', status: 'ACTIVE' },
        select: { id: true },
    });

    if (admins.length === 0) return;

    const allIds = admins.map(a => a.id);
    const filteredIds = await filterUsersByPreference(allIds, type);
    if (filteredIds.length === 0) return;

    await prisma.notification.createMany({
        data: filteredIds.map(userId => ({
            userId,
            type: 'MESSAGE' as const,
            title,
            content,
            link,
        })),
    });
}

/** Notifica o Master/Franqueado dono da prefeitura que aceitam o tipo */
export async function notifyPrefeituraOwner(
    prefeituraId: string,
    title: string,
    content: string,
    link: string,
    type: NotifType = 'onMessage'
) {
    const prefeitura = await prisma.prefeitura.findUnique({
        where: { id: prefeituraId },
        select: { masterId: true, franqueadoId: true },
    });

    if (!prefeitura) return;

    const ownerIds: string[] = [];

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

    const filteredIds = await filterUsersByPreference(ownerIds, type);
    if (filteredIds.length === 0) return;

    await prisma.notification.createMany({
        data: filteredIds.map(userId => ({
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
