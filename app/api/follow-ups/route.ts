import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const prefeituraId = searchParams.get('prefeituraId');
    const pendingOnly = searchParams.get('pending') === 'true';

    const followUps = await prisma.followUp.findMany({
      where: {
        ...(prefeituraId ? { prefeituraId } : {}),
        ...(pendingOnly ? { done: false } : {}),
      },
      include: { prefeitura: { select: { city: true, state: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(followUps);
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { prefeituraId, title, description, dueDate } = body;

    if (!prefeituraId || !title || !dueDate) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        prefeituraId,
        title,
        description,
        dueDate: new Date(dueDate),
        createdById: user.id,
      },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
