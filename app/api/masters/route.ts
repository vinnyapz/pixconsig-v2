import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { sendWelcomeEmail } from '@/lib/mail';

export async function GET() {
    try {
        const masters = await prisma.master.findMany({
            orderBy: {
                name: 'asc'
            },
            include: {
                franqueados: {
                    include: {
                        prefeituras: true
                    }
                }
            }
        });
        return NextResponse.json(masters);
    } catch (error) {
        console.error('Error fetching masters:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar masters' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            document,
            address,
            city,
            state,
            zipCode,
            commissionRate,
            password, // New field
            sendEmail // New field
        } = body;

        // Basic validation
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Nome e email são obrigatórios' },
                { status: 400 }
            );
        }

        // New validation for password if creating a new master (implied by this endpoint structure)
        if (!password) {
            return NextResponse.json(
                { error: 'Senha é obrigatória para cadastro de master' },
                { status: 400 }
            );
        }

        // Check for duplicate email in Master table
        const existingMaster = await prisma.master.findUnique({
            where: { email }
        });

        if (existingMaster) {
            return NextResponse.json(
                { error: 'Email já cadastrado como Master' },
                { status: 400 }
            );
        }

        // Check for duplicate email in User table
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email já cadastrado como Usuário' },
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // Transaction to ensure both or neither are created
        const result = await prisma.$transaction(async (tx: any) => {
            // Create Master
            const master = await tx.master.create({
                data: {
                    name,
                    email,
                    phone,
                    document,
                    address,
                    city,
                    state,
                    zipCode,
                    commissionRate: parseFloat(commissionRate) || 15
                }
            });

            // Create User associated with Master (indirectly via email logic, though schema suggests they are distinct entities but linked by concept)
            // Note: Schema doesn't strictly link Master to User via ID, but they share email.
            // Admin logic usually treats them as same entity in different contexts.

            await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    type: 'MASTER',
                    status: 'ACTIVE'
                }
            });

            return master;
        });

        // Send Email outside transaction to avoid blocking or rollback on email fail (unless critical)
        // Usually better to log email failure than fail the whole registration
        if (sendEmail) {
            try {
                await sendWelcomeEmail(email, password);
            } catch (emailError) {
                console.error("Failed to send welcome email:", emailError);
                // We don't return error here, just log it. The master/user is created.
            }
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating master:', error);
        return NextResponse.json(
            { error: 'Erro ao criar master' },
            { status: 500 }
        );
    }
}
