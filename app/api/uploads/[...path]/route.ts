import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePath } = await params;
        const fullPath = path.join(process.cwd(), 'public', 'uploads', ...filePath);

        if (!fs.existsSync(fullPath)) {
            return new NextResponse('Not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(fullPath);
        const ext = filePath[filePath.length - 1].split('.').pop()?.toLowerCase();

        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        };

        const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error) {
        return new NextResponse('Error', { status: 500 });
    }
}
