import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPasswordResetTokenByToken } from '@/lib/tokens';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    const existingToken = await getPasswordResetTokenByToken(token);

    if (!existingToken) {
      return NextResponse.json(
        { error: 'Token inválido!' },
        { status: 400 }
      );
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      return NextResponse.json(
        { error: 'Token expirado!' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.email },
    });

    if (!existingUser) {
       return NextResponse.json(
        { error: 'Email não existe!' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Algo deu errado.', details: String(error) },
      { status: 500 }
    );
  }
}
