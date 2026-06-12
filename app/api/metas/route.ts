import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const metas = await prisma.meta.findMany({
      where: { month, year },
      include: {
        franqueado: { select: { id: true, name: true } },
        master: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(metas);
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admins podem definir metas' }, { status: 403 });
    }

    const body = await req.json();
    const { month, year, targetCount, targetAmount, masterId, franqueadoId } = body;

    const meta = await prisma.meta.create({
      data: { month, year, targetCount, targetAmount, masterId, franqueadoId },
    });

    return NextResponse.json(meta, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
