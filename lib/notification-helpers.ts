import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const STATUS_LABELS: Record<string, string> = {
    AGUARDANDO_ANALISE: 'Aguardando Análise',
    AGUARDANDO_DECRETO: 'Aguardando Decreto',
    PROCESSO_EM_ANDAMENTO: 'Processo em Andamento',
    ATIVA: 'Ativa',
    INATIVA: 'Inativa',
    REPROVADA: 'Reprovada',
};

type NotifType = 'onMessage' | 'onFile' | 'onStatusChange' | 'onNewRequest' | 'onFollowUp' | 'onPrefeituraAlert';

// ============================================
// Email transporter (mesma config do mail.ts)
// ============================================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendNotificationEmail(to: string, title: string, content: string, link: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
    const logoUrl = `${baseUrl}/logo-grupo.jpg`;
    const fullLink = `${baseUrl}${link}`;

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr>
          <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
            <img src="${logoUrl}" alt="Logo Grupo Raman" width="150" style="display: block; width: 150px; max-width: 100%; height: auto;">
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #0066A1;">${title}</h2>
            <p style="margin: 0 0 25px 0; color: #555555;">${content}</p>
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${fullLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                Ver no Sistema
              </a>
            </div>
            <p style="margin: 0; font-size: 13px; color: #999999;">
              Você está recebendo este email porque tem notificações ativas no PixConsig.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Grupo Raman. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: `"PixConsig" <${process.env.SMTP_USER}>`,
            to,
            subject: `🔔 ${title}`,
            html,
        });
    } catch (error) {
        // Não deixa o email quebrar o fluxo principal
        console.error('Erro ao enviar email de notificação:', error);
    }
}

// ============================================
// Helpers internos
// ============================================

async function isMaintenanceModeActive(): Promise<boolean> {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'maintenance_mode' } }).catch(() => null);
    return setting?.value === 'true';
}

async function isSuperAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { type: true },
    });
    return user?.type === 'SUPERADMIN';
}

async function filterUsersByPreference(userIds: string[], type: NotifType): Promise<string[]> {
    const prefs = await prisma.notificationPreference.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, [type]: true },
    });

    const prefsMap = Object.fromEntries(prefs.map((p: Record<string, any>) => [p.userId, p[type] as boolean]));

    return userIds.filter(id => {
        if (!(id in prefsMap)) return true;
        return prefsMap[id] === true;
    });
}

// ============================================
// Exports públicos
// ============================================

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

export async function notifyAdmins(
    title: string,
    content: string,
    link: string,
    type: NotifType = 'onMessage',
    senderUserId?: string
) {
    if (await isMaintenanceModeActive()) return;
    if (senderUserId && await isSuperAdmin(senderUserId)) return;

    const admins = await prisma.user.findMany({
        where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, status: 'ACTIVE' },
        select: { id: true, email: true },
    });

    if (admins.length === 0) return;

    const allIds = admins.map((a: { id: string; email: string }) => a.id);
    const filteredIds = await filterUsersByPreference(allIds, type);
    if (filteredIds.length === 0) return;

    // Salva no sistema
    await prisma.notification.createMany({
        data: filteredIds.map(userId => ({
            userId,
            type: 'MESSAGE' as const,
            title,
            content,
            link,
        })),
    });

    // Envia email para cada admin filtrado
    const filteredAdmins = admins.filter((a: { id: string; email: string }) => filteredIds.includes(a.id));
    await Promise.allSettled(
        filteredAdmins.map((a: { email: string }) => sendNotificationEmail(a.email, title, content, link))
    );
}

export async function notifyPrefeituraOwner(
    prefeituraId: string,
    title: string,
    content: string,
    link: string,
    type: NotifType = 'onMessage',
    senderUserId?: string
) {
    if (await isMaintenanceModeActive()) return;
    if (senderUserId && await isSuperAdmin(senderUserId)) return;

    const prefeitura = await prisma.prefeitura.findUnique({
        where: { id: prefeituraId },
        select: { masterId: true, franqueadoId: true },
    });

    if (!prefeitura) return;

    // Coleta email + userId dos donos
    const owners: { id: string; email: string }[] = [];

    if (prefeitura.masterId) {
        const master = await prisma.master.findUnique({
            where: { id: prefeitura.masterId },
            select: { email: true },
        });
        if (master) {
            const masterUser = await prisma.user.findUnique({
                where: { email: master.email },
                select: { id: true, email: true },
            });
            if (masterUser) owners.push(masterUser);
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
                select: { id: true, email: true },
            });
            if (franqueadoUser) owners.push(franqueadoUser);
        }
    }

    if (owners.length === 0) return;

    const ownerIds = owners.map(o => o.id);
    const filteredIds = await filterUsersByPreference(ownerIds, type);
    if (filteredIds.length === 0) return;

    // Salva no sistema
    await prisma.notification.createMany({
        data: filteredIds.map(userId => ({
            userId,
            type: 'STATUS_CHANGE' as const,
            title,
            content,
            link,
        })),
    });

    // Envia email para cada dono filtrado
    const filteredOwners = owners.filter(o => filteredIds.includes(o.id));
    await Promise.allSettled(
        filteredOwners.map((o: { email: string }) => sendNotificationEmail(o.email, title, content, link))
    );
}

export function getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
}
