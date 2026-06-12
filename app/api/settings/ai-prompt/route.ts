import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'ai_prompt' },
    });

    return NextResponse.json({
      prompt: setting?.value || "Você é um assistente especializado em empréstimos consignados."
    });
  } catch (error) {
    console.error('Error fetching AI prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Optional: Check if user is admin/master
    // const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
    // if (user?.type !== 'ADMIN') ...

    const { prompt } = await req.json();

    if (typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt must be a string' }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: 'ai_prompt' },
      update: { value: prompt },
      create: { key: 'ai_prompt', value: prompt },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving AI prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
