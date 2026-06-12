import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Ensure upload directory exists
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
        return NextResponse.json(
            { error: 'Erro ao buscar arquivos' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const contentType = request.headers.get('content-type') || '';

        // Handle Links (JSON)
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { name, url, type, size } = body;

            if (!name || !url || type !== 'LINK') {
                return NextResponse.json({ error: 'Dados inválidos para link' }, { status: 400 });
            }

            const savedFile = await prisma.prefeituraFile.create({
                data: {
                    name,
                    url,
                    type: 'LINK',
                    size: 0,
                    prefeituraId: id
                }
            });
            return NextResponse.json(savedFile, { status: 201 });
        }

        // Handle Files (FormData)
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'Nenhum arquivo enviado' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou DOCX.' },
                { status: 400 }
            );
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo 10MB.' },
                { status: 400 }
            );
        }

        // Prepare directory
        const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'prefeituras');
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const prefeituraDir = path.join(UPLOAD_DIR, id);
        if (!fs.existsSync(prefeituraDir)) {
            fs.mkdirSync(prefeituraDir, { recursive: true });
        }

        // Generate filename
        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const extension = path.extname(originalName);
        const filename = `${randomUUID()}${extension}`;
        const filePath = path.join(prefeituraDir, filename);

        // Save file
        fs.writeFileSync(filePath, buffer);

        // Save to database
        const relativeUrl = `/uploads/prefeituras/${id}/${filename}`;

        const savedFile = await prisma.prefeituraFile.create({
            data: {
                name: originalName,
                url: relativeUrl,
                type: file.type,
                size: file.size,
                prefeituraId: id
            }
        });

        return NextResponse.json(savedFile, { status: 201 });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Erro ao enviar arquivo' },
            { status: 500 }
        );
    }
}
