import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large. Maximum size is 10MB.' }, { status: 413 });
  }

  const formData = await req.formData();
  const files = formData.getAll('files');

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const urls = [];

  for (const file of files) {
    if (!file || typeof file === 'string') continue;

    // Zip Bomb / Arbitrary File Protection
    // Instantly reject any file that isn't a whitelisted image type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported Media Type. Expected image, received ${file.type || 'unknown'}` }, { status: 415 });
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      continue;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);
    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls, count: urls.length });
}
