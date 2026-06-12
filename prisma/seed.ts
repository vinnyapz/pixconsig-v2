import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await hash('Skywalker428.', 12);

    try {
        const admin = await prisma.user.upsert({
            where: { email: 'ederson.almeida@maquinabot.com.br' },
            update: {},
            create: {
                email: 'ederson.almeida@maquinabot.com.br',
                name: 'Admin',
                password,
                type: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log('Admin created:', admin);
    } catch (e) {
        console.error('Error creating admin:', e);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
