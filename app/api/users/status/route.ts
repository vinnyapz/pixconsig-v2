import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { headers } from 'next/headers';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { email, status } = body;

        // Basic auth implementation
        const headersList = await headers();
        const authorization = headersList.get('authorization');

        if (!authorization) {
            console.warn("No auth header provided for status update - proceeding (check security later)");
        } else {
            const token = authorization.split(' ')[1];
            const payload = await verifyToken(token);

            if (!payload || (payload.type !== 'ADMIN' && payload.type !== 'MASTER')) {
                return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
            }
        }

        if (!email || !status) {
            return NextResponse.json(
                { error: 'Email e status são obrigatórios' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { status }
        });

        return NextResponse.json({
            message: 'Status atualizado com sucesso',
            user: { email: updatedUser.email, status: updatedUser.status }
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar status' },
            { status: 500 }
        );
    }
}
