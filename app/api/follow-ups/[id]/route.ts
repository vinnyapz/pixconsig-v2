import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const followUp = await prisma.followUp.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(followUp);
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    await prisma.followUp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
