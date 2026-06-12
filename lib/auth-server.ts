
import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { prisma } from '@/lib/prisma';

export async function getServerSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const payload = await verifyToken(token);

        return payload as { id: string; email: string; type: string };
    } catch (error) {
        return null;
    }
}

export async function getCurrentFranqueadoId() {
    const session = await getServerSession();
    if (!session || session.type !== 'franqueado') return null;

    const franqueado = await prisma.franqueado.findUnique({
        where: { email: session.email }
    });

    return franqueado?.id || null;
}

export async function getCurrentMasterId() {
    const session = await getServerSession();
    if (!session || session.type !== 'master') return null;

    const master = await prisma.master.findUnique({
        where: { email: session.email }
    });

    return master?.id || null;
}
