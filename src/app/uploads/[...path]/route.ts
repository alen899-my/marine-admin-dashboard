import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const filePath = (await params).path.join('/');
        const absolutePath = path.join(process.cwd(), 'public/uploads', filePath);

        // 1. Security Check: Prevent directory traversal
        const uploadsBase = path.join(process.cwd(), 'public/uploads');
        if (!absolutePath.startsWith(uploadsBase)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Check if file exists
        if (!fs.existsSync(absolutePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 3. Get file data
        const fileBuffer = fs.readFileSync(absolutePath);

        // Manual extension mapping to avoid extra dependencies
        const ext = path.extname(absolutePath).toLowerCase();
        const mimeMap: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.ico': 'image/x-icon',
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';

        // 4. Return file with correct headers
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error('File Serving Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}