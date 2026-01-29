import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'pack.zip';

  try {
    const blob = await put(filename, request.body as any, {
      access: 'public',
      contentType: 'application/zip', // Ensure correct mime type
       addRandomSuffix: true, // Vercel adds a short ID to prevent overwriting but keeps name clean
    });

    return NextResponse.json(blob);
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}