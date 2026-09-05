import { NextRequest, NextResponse } from 'next/server';
import { requireServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, message: 'Fayl tanlanmagan' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ ok: false, message: 'Faqat rasm fayllari qabul qilinadi' }, { status: 400 });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, message: 'Fayl hajmi 5MB dan oshmasligi kerak' }, { status: 400 });
    }

    const magicBytes = await file.slice(0, 4).arrayBuffer();
    const magicHex = Array.from(new Uint8Array(magicBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const validMagic = {
      jpeg: ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe8'],
      png: ['89504e47'],
      webp: ['52494646'],
      avif: ['00000018', '00000020'],
    };

    const fileType = Object.entries(validMagic).find(([, magics]) => magics.some((magic) => magicHex.startsWith(magic)));
    if (!fileType) {
      return NextResponse.json({ ok: false, message: 'Fayl formati noto‘g‘ri' }, { status: 400 });
    }

    const bucket = 'product-images';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, '-')}`;
    const path = `${fileName}`;

    const { error } = await requireServiceClient().storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    const { data: publicUrl } = requireServiceClient().storage.from(bucket).getPublicUrl(path);

    try {
      await requireServiceClient().from('audit_log').insert({
        actor_email: 'system',
        action: 'upload',
        entity: 'product_images',
        entity_id: path,
        after: { url: publicUrl.publicUrl, size: file.size, type: file.type },
      });
    } catch {
      // Ignore audit errors
    }

    return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
  } catch {
    return NextResponse.json({ ok: false, message: 'Yuklashda xatolik yuz berdi' }, { status: 500 });
  }
}
