import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
    try {
        const commissions = await prisma.commissionConfig.findMany();

        // Default values if not set
        const settings = {
            servidorPublicoMasterCommission: 15,
            servidorPublicoFranqueadoCommission: 10,
            contratadoMasterCommission: 12,
            contratadoFranqueadoCommission: 8,
        };

        // Map database values to settings object
        commissions.forEach((c: any) => {
            if (c.loanType === 'SERVIDOR') {
                if (c.userType === 'MASTER') settings.servidorPublicoMasterCommission = c.percentage;
                if (c.userType === 'FRANQUEADO') settings.servidorPublicoFranqueadoCommission = c.percentage;
            } else if (c.loanType === 'CONTRATADO') {
                if (c.userType === 'MASTER') settings.contratadoMasterCommission = c.percentage;
                if (c.userType === 'FRANQUEADO') settings.contratadoFranqueadoCommission = c.percentage;
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching commission settings:', error);
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

        const body = await req.json();
        const {
            servidorPublicoMasterCommission,
            servidorPublicoFranqueadoCommission,
            contratadoMasterCommission,
            contratadoFranqueadoCommission,
        } = body;

        // Validate inputs
        if (
            typeof servidorPublicoMasterCommission !== 'number' ||
            typeof servidorPublicoFranqueadoCommission !== 'number' ||
            typeof contratadoMasterCommission !== 'number' ||
            typeof contratadoFranqueadoCommission !== 'number'
        ) {
            return NextResponse.json({ error: 'Invalid commission values' }, { status: 400 });
        }

        // Uses a transaction to update or create commission configurations one by one
        await prisma.$transaction(async (tx: any) => {
            const configs = [
                { u: 'MASTER', l: 'SERVIDOR', v: servidorPublicoMasterCommission },
                { u: 'FRANQUEADO', l: 'SERVIDOR', v: servidorPublicoFranqueadoCommission },
                { u: 'MASTER', l: 'CONTRATADO', v: contratadoMasterCommission },
                { u: 'FRANQUEADO', l: 'CONTRATADO', v: contratadoFranqueadoCommission },
            ];

            for (const config of configs) {
                const existing = await tx.commissionConfig.findFirst({
                    where: {
                        userType: config.u,
                        loanType: config.l,
                    },
                });

                if (existing) {
                    await tx.commissionConfig.update({
                        where: { id: existing.id },
                        data: { percentage: config.v },
                    });
                } else {
                    await tx.commissionConfig.create({
                        data: {
                            userType: config.u,
                            loanType: config.l,
                            percentage: config.v,
                        },
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving commission settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
