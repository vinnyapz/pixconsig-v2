
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const totalLoans = await prisma.loan.count();
        const paidLoans = await prisma.loan.count({ where: { status: 'PAID' } });

        const sampleLoans = await prisma.loan.findMany({
            where: { status: 'PAID' },
            take: 5,
            include: {
                prefeitura: {
                    include: {
                        master: true,
                        franqueado: {
                            include: {
                                master: true
                            }
                        }
                    }
                }
            }
        });

        const masters = await prisma.master.findMany({
            include: {
                franqueados: true,
                prefeituras: true
            }
        });

        return NextResponse.json({
            totalLoans,
            paidLoans,
            sampleLoans,
            masters
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
