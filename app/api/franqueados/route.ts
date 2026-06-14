import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { sendWelcomeEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const masterId = searchParams.get('masterId');

        if (!masterId) {
            return NextResponse.json(
                { error: 'Master ID é obrigatório' },
                { status: 400 }
            );
        }

        // Find the correct Master ID (same logic as POST)
        let dbMaster = await prisma.master.findUnique({
            where: { id: masterId }
        });

        if (!dbMaster) {
            const user = await prisma.user.findUnique({
                where: { id: masterId }
            });

            if (user) {
                dbMaster = await prisma.master.findUnique({
                    where: { email: user.email }
                });
            }
        }

        if (!dbMaster) {
            return NextResponse.json(
                { error: 'Master não encontrado' },
                { status: 404 }
            );
        }

        const franqueadosDB = await prisma.franqueado.findMany({
            where: {
                masterId: dbMaster.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                prefeituras: {
                    include: {
                        loans: true
                    }
                }
            }
        });

        // Get status from User table since Franqueado table doesn't have it
        const emails = franqueadosDB.map((f: any) => f.email);
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: emails
                }
            },
            select: {
                email: true,
                status: true
            }
        });

        const userStatusMap = new Map(users.map((u: any) => [u.email.toLowerCase(), u.status]));

        const franqueados = franqueadosDB.map((f: any) => {
            const loanAmount = f.prefeituras.reduce((acc: any, p: any) => {
                return acc + p.loans.filter((l: any) => l.status === 'PAID').reduce((lAcc: any, l: any) => lAcc + l.amount, 0);
            }, 0);

            const userStatus = userStatusMap.get(f.email.toLowerCase());
            // Default to 'active' if user not found (shouldn't happen for created ones) or if status is ACTIVE
            // Otherwise 'inactive'
            const status = userStatus === 'ACTIVE' ? 'active' : 'inactive';

            return {
                ...f,
                citiesRegistered: f.prefeituras.length,
                loanAmount,
                registrationDate: f.createdAt.toISOString().split('T')[0],
                status
            };
        });

        return NextResponse.json(franqueados);
    } catch (error) {
        console.error('Error fetching franqueados:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar franqueados' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, document, address, city, state, zipCode, commissionRate, masterId } = body;

        // Basic validation
        if (!name || !email || !phone || !masterId) {
            return NextResponse.json(
                { error: 'Nome, email, telefone e master são obrigatórios' },
                { status: 400 }
            );
        }

        // Check for duplicate email
        const existingFranqueado = await prisma.franqueado.findUnique({
            where: { email }
        });

        if (existingFranqueado) {
            return NextResponse.json(
                { error: 'Email já cadastrado' },
                { status: 400 }
            );
        }

        // Find the correct Master ID
        // First try to find a Master with the given ID
        let dbMaster = await prisma.master.findUnique({
            where: { id: masterId }
        });

        // If not found, try to find a User with the given ID and then match by email
        if (!dbMaster) {
            const user = await prisma.user.findUnique({
                where: { id: masterId }
            });

            if (user) {
                dbMaster = await prisma.master.findUnique({
                    where: { email: user.email }
                });
            }
        }

        if (!dbMaster) {
            return NextResponse.json(
                { error: 'Master não encontrado. Verifique se o usuário master tem um registro de Master associado.' },
                { status: 400 }
            );
        }


        const { password, sendEmail } = body;
        const generatedPassword = password || Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(generatedPassword);

        // Transaction to create both Franqueado and User
        const [franqueado, user] = await prisma.$transaction([
            prisma.franqueado.create({
                data: {
                    name,
                    email,
                    phone,
                    document,
                    address,
                    city,
                    state,
                    zipCode,
                    commissionRate: parseFloat(commissionRate) || 10,
                    master: {
                        connect: { id: dbMaster.id }
                    }
                }
            }),
            prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    type: 'FRANQUEADO',
                    status: 'ACTIVE'
                }
            })
        ]);

        let emailSent = false;
        if (sendEmail) {
            emailSent = await sendWelcomeEmail(email, generatedPassword);
        }

        return NextResponse.json({
            ...franqueado,
            generatedPassword: sendEmail ? undefined : generatedPassword,
            emailSent
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating franqueado:', error);
        return NextResponse.json(
            { error: 'Erro ao criar franqueado' },
            { status: 500 }
        );
    }
}
