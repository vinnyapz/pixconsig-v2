import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Adicionar parâmetros de pool na DATABASE_URL para evitar esgotamento de conexões
    const url = process.env.DATABASE_URL || '';
    const separator = url.includes('?') ? '&' : '?';
    const datasourceUrl = `${url}${separator}connection_limit=5&pool_timeout=30`;

    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasourceUrl,
    });
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
