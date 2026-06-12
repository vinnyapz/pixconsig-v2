
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { getServerSession } from '@/lib/auth-server';
import { sendWelcomeEmail } from '@/lib/mail';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verificar autenticação
        const session = await getServerSession();
        if (!session || session.type !== 'admin') {
            return NextResponse.json(
                { error: 'Acesso não autorizado' },
                { status: 403 }
            );
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Gerar nova senha aleatória
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let newPassword = "";
        for (let i = 0; i < 10; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Hash da nova senha
        const hashedPassword = await hashPassword(newPassword);

        // Atualizar senha no banco
        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
            },
        });

        // Enviar email
        try {
            await sendWelcomeEmail(user.email, newPassword);
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
            return NextResponse.json(
                { error: 'Senha resetada, mas falha ao enviar email' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'Acesso reenviado com sucesso' });

    } catch (error) {
        console.error('Error resending access:', error);
        return NextResponse.json(
            { error: 'Erro ao reenviar acesso' },
            { status: 500 }
        );
    }
}
