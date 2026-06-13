import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { notifyAdmins, notifyPrefeituraOwner } from '@/lib/notification-helpers';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'prefeituras');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const files = await prisma.prefeituraFile.findMany({
            where: { prefeituraId: id },
            orderBy: { uploadDate: 'desc' }
        });
        return NextResponse.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json({ error: 'Erro ao buscar arquivos' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession();

        const prefeitura = await prisma.prefeitura.findUnique({
            where: { id },
            select: { city: true, state: true },
        });

        const contentType = request.headers.get('content-type') || '';

        let savedFile;

        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { name, url, type, size } = body;

            if (!name || !url || type !== 'LINK') {
                return NextResponse.json({ error: 'Dados inválidos para link' }, { status: 400 });
            }

            savedFile = await prisma.prefeituraFile.create({
                data: { name, url, type: 'LINK', size: 0, prefeituraId: id }
            });
        } else {
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
            }

            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou DOCX.' }, { status: 400 });
            }

            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
            }

            const prefeituraDir = path.join(UPLOAD_DIR, id);
            if (!fs.existsSync(prefeituraDir)) {
                fs.mkdirSync(prefeituraDir, { recursive: true });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const extension = path.extname(file.name);
            const filename = `${randomUUID()}${extension}`;
            const filePath = path.join(prefeituraDir, filename);
            fs.writeFileSync(filePath, buffer);

            const relativeUrl = `/uploads/prefeituras/${id}/${filename}`;

            savedFile = await prisma.prefeituraFile.create({
                data: {
                    name: file.name,
                    url: relativeUrl,
                    type: file.type,
                    size: file.size,
                    prefeituraId: id
                }
            });

            // Notificações de arquivo
            if (session) {
                const user = await prisma.user.findUnique({
                    where: { id: session.id },
                    select: { name: true },
                });
                const senderName = user?.name || session.email;
                const title = `📎 Novo arquivo em ${prefeitura?.city || 'prefeitura'}`;
                const notifContent = `${senderName} enviou o arquivo: "${file.name}"`;
                const link = `/prefeituras`;

                if (session.type === 'franqueado' || session.type === 'master') {
                    await notifyAdmins(title, notifContent, link);
                }

                if (session.type === 'admin') {
                    await notifyPrefeituraOwner(id, title, notifContent, link);
                }
            }
        }

        return NextResponse.json(savedFile, { status: 201 });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Erro ao enviar arquivo' }, { status: 500 });
    }
}
