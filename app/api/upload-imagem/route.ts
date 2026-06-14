import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { isAdminType } from '@/lib/auth-helpers';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'comunicados');

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session || !isAdminType(session.type)) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo não permitido. Use JPG, PNG, GIF ou WebP.' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 });
        }

        // Garantir que o diretório existe
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const ext = file.name.split('.').pop();
        const filename = `${randomUUID()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://v2.pixconsig.com.br';
        const url = `${baseUrl}/api/uploads/comunicados/${filename}`;

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
    }
}
