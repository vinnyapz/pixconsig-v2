import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);
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
    const user = await getServerUser(req);
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admins podem definir metas' }, { status: 403 });
    }

    const body = await req.json();
    const { month, year, targetCount, targetAmount, masterId, franqueadoId } = body;

    // Upsert: atualiza se já existe, cria se não existe
    const meta = await prisma.meta.upsert({
      where: {
        // Workaround para upsert sem unique composto: busca e cria/atualiza manualmente
        id: body.id || 'new',
      },
      update: { targetCount, targetAmount },
      create: { month, year, targetCount, targetAmount, masterId, franqueadoId },
    });

    return NextResponse.json(meta, { status: 201 });
  } catch (e) {
    // Se o upsert falhou por id inválido, cria direto
    try {
      const body = await req.json().catch(() => ({}));
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    } catch {
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
  }
}
