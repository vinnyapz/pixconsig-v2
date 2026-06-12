
import { prisma } from '@/lib/prisma';

async function main() {
    const email = 'nani.buterfly@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });
    console.log('User found:', user);

    if (user) {
        const franqueado = await prisma.franqueado.findUnique({
            where: { email },
        });
        console.log('Franqueado found:', franqueado);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
