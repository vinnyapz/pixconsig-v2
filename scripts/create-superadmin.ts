import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@pixconsig.com.br';
    const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2024!';
    
    const hash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
        where: { email },
        update: { type: 'SUPERADMIN' },
        create: {
            name: 'Super Admin',
            email,
            password: hash,
            type: 'SUPERADMIN',
        },
    });
    
    console.log('✅ SuperAdmin criado/atualizado:', user.email);
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password);
}

main().finally(() => prisma.$disconnect());
