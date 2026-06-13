import { isAdminType } from '@/lib/auth-helpers';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { getServerSession } from '@/lib/auth-server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verificar autenticação
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json(
                { error: 'Acesso não autorizado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, email, password, type, status } = body;

        // Verificar se usuário existe
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Verificar conflito de email
        const emailConflict = await prisma.user.findFirst({
            where: {
                email,
                id: { not: id }, // Excluir o atual da busca
            },
        });

        if (emailConflict) {
            return NextResponse.json(
                { error: 'Já existe outro usuário com este e-mail' },
                { status: 409 }
            );
        }

        // Preparar dados para update
        const dataToUpdate: any = {
            name,
            email,
            type: type.toUpperCase() as any,
            status: status.toUpperCase() as any,
        };

        // Se senha foi enviada, fazer hash
        if (password && password.trim() !== '') {
            dataToUpdate.password = await hashPassword(password);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                status: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar usuário' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verificar autenticação
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json(
                { error: 'Acesso não autorizado' },
                { status: 403 }
            );
        }

        // Impedir auto-exclusão
        if (session.id === id) {
            return NextResponse.json(
                { error: 'Você não pode excluir seu próprio usuário.' },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir usuário' },
            { status: 500 }
        );
    }
}
