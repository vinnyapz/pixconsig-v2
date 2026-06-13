import { isAdminType } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Admin pode ver preferências de qualquer usuário
    // Outros só veem as próprias
    const targetUserId = (isAdminType(session.type) && userId) ? userId : session.id;

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: targetUserId },
    });

    // Se não existe, cria com defaults
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: targetUserId },
      });
    }

    return NextResponse.json(prefs);
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { userId, ...prefs } = body;

    const targetUserId = (isAdminType(session.type) && userId) ? userId : session.id;

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: targetUserId },
      update: prefs,
      create: { userId: targetUserId, ...prefs },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
