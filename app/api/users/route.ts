import { isAdminType } from '@/lib/auth-helpers';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { getServerSession } from '@/lib/auth-server';
import { sendWelcomeEmail } from '@/lib/mail';

export async function GET(request: Request) {
    try {
        // Verificar autenticação
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json(
                { error: 'Acesso não autorizado. Apenas administradores podem listar usuários.' },
                { status: 403 }
            );
        }

        // Buscar usuários (excluindo senha)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                status: true,
                createdAt: true,
                // Não incluir password
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar usuários' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // Verificar autenticação
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json(
                { error: 'Acesso não autorizado. Apenas administradores podem criar usuários.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, email, password, type, status, sendEmail } = body;

        // Validação básica
        if (!name || !email || !password || !type) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: Nome, Email, Senha e Tipo' },
                { status: 400 }
            );
        }

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Já existe um usuário com este e-mail' },
                { status: 409 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // Mapear string para Enums do Prisma, se necessário
        // Assumindo que o frontend envia valores que batem com o Enum (ADMIN, MASTER, FRANQUEADO)
        // Caso envie lowercase, converter para uppercase
        const userType = type.toUpperCase();
        const userStatus = status ? status.toUpperCase() : 'ACTIVE';

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                type: userType as any, // TypeScript pode reclamar sem cast se não bater exato com gerado
                status: userStatus as any,
            },
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                status: true,
                createdAt: true,
            },
        });

        if (sendEmail) {
            try {
                // Assuming sendWelcomeEmail is imported or available in scope. 
                // If not, we should import it at the top.
                // It was not present in the original file view, so I will add the import in a separate chunk.
                await sendWelcomeEmail(email, password);
            } catch (emailError) {
                console.error("Failed to send welcome email:", emailError);
                // Log only, do not fail the request
            }
        }

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Erro ao criar usuário' },
            { status: 500 }
        );
    }
}
