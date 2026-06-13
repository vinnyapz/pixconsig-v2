import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

const KEY = 'maintenance_mode';

export async function GET() {
    try {
        const setting = await prisma.appSetting.findUnique({ where: { key: KEY } }).catch(() => null);
        return NextResponse.json({ active: setting?.value === 'true' });
    } catch (error) {
        return NextResponse.json({ active: false });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || session.type !== 'superadmin') {
            return NextResponse.json(
                { error: 'Apenas SuperAdmins podem alterar o modo manutenção.' },
                { status: 403 }
            );
        }

        const { active } = await request.json();

        await prisma.appSetting.upsert({
            where: { key: KEY },
            update: { value: active ? 'true' : 'false' },
            create: { key: KEY, value: active ? 'true' : 'false' },
        });

        return NextResponse.json({
            message: active ? 'Modo manutenção ativado.' : 'Modo manutenção desativado.',
            active,
        });
    } catch (error) {
        console.error('Error toggling maintenance mode:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
