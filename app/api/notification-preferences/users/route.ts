import { isAdminType } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !isAdminType(session.type)) {
      return NextResponse.json({ error: 'Apenas admins' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true, type: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    // Buscar preferências de todos
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: users.map(u => u.id) } },
    });

    const prefsMap = Object.fromEntries(prefs.map(p => [p.userId, p]));

    return NextResponse.json(users.map(u => ({
      ...u,
      preferences: prefsMap[u.id] || null,
    })));
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
