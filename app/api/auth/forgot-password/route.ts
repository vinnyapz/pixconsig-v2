import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const passwordResetToken = await generatePasswordResetToken(email);
      await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ message: 'Email de recuperação enviado!' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
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
