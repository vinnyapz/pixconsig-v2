import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};
import { getServerSession } from '@/lib/auth-server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'suporte');

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });

        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo não permitido. Use imagens, PDF ou documentos Word/Excel.' }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20MB.' }, { status: 400 });
        }

        // Subpasta por usuário (usando os primeiros 8 chars do ID para não expor o ID completo)
        const userFolder = session.id.substring(0, 8);
        const UPLOAD_DIR = path.join(BASE_UPLOAD_DIR, userFolder);

        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const ext = file.name.split('.').pop();
        const filename = `${randomUUID()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://v2.pixconsig.com.br';
        const isImage = file.type.startsWith('image/');

        return NextResponse.json({
            url: `${baseUrl}/api/uploads/suporte/${userFolder}/${filename}`,
            name: file.name,
            type: file.type,
            isImage,
        });
    } catch (error) {
        console.error('Support upload error:', error);
        return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
    }
}
