
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { GoalSettingItem, GoalsSettingsResponse } from '@/types/dashboard';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session || session.type.toUpperCase() !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar todos os Masters e Franqueados com contagem de prefeituras
        const [masters, franqueados] = await Promise.all([
            prisma.master.findMany({
                select: {
                    id: true,
                    name: true,
                    _count: { select: { prefeituras: true } }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.franqueado.findMany({
                select: {
                    id: true,
                    name: true,
                    _count: { select: { prefeituras: true } }
                },
                orderBy: { name: 'asc' }
            })
        ]);

        // Buscar todas as metas existentes no AppSetting
        const allGoalKeys = [
            ...masters.map(m => `master_goal_prefeituras_${m.id}`),
            ...franqueados.map(f => `franqueado_goal_prefeituras_${f.id}`)
        ];

        const existingGoals = await prisma.appSetting.findMany({
            where: { key: { in: allGoalKeys } }
        });
        const goalsMap = new Map(existingGoals.map(g => [g.key, parseInt(g.value)]));

        const goals: GoalSettingItem[] = [
            ...masters.map(m => ({
                entityId: m.id,
                entityName: m.name,
                entityType: 'master' as const,
                goalPrefeituras: goalsMap.get(`master_goal_prefeituras_${m.id}`) || 100,
                currentPrefeituras: m._count.prefeituras
            })),
            ...franqueados.map(f => ({
                entityId: f.id,
                entityName: f.name,
                entityType: 'franqueado' as const,
                goalPrefeituras: goalsMap.get(`franqueado_goal_prefeituras_${f.id}`) || 10,
                currentPrefeituras: f._count.prefeituras
            }))
        ];

        const response: GoalsSettingsResponse = { goals };
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching goals settings:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.type.toUpperCase() !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { entityId, entityType, goalPrefeituras } = body;

        if (!entityId || !entityType || !goalPrefeituras) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
        }

        const key = `${entityType}_goal_prefeituras_${entityId}`;

        await prisma.appSetting.upsert({
            where: { key },
            update: { value: String(goalPrefeituras) },
            create: { key, value: String(goalPrefeituras) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving goal setting:', error);
        return NextResponse.json({ error: 'Erro ao salvar meta' }, { status: 500 });
    }
}
