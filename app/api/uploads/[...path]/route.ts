import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } }
) {
    try {
        const filePath = path.join(process.cwd(), 'public', 'uploads', ...params.path);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('Not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = params.path[params.path.length - 1].split('.').pop()?.toLowerCase();

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
