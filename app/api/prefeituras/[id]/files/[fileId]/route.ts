import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string, fileId: string }> }
) {
    const { id, fileId } = await params;

    try {

        // Get file info from database
        const file = await prisma.prefeituraFile.findUnique({
            where: { id: fileId }
        });

        if (!file) {
            return NextResponse.json(
                { error: 'Arquivo não encontrado' },
                { status: 404 }
            );
        }

        // Delete from database
        await prisma.prefeituraFile.delete({
            where: { id: fileId }
        });

        // Delete from filesystem
        const filePath = path.join(process.cwd(), 'public', file.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return NextResponse.json({ message: 'Arquivo removido com sucesso' });

    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
            { error: 'Erro ao remover arquivo' },
            { status: 500 }
        );
    }
}
