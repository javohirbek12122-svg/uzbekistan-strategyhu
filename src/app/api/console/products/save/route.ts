import { NextRequest, NextResponse } from 'next/server';
import { saveProduct } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await saveProduct(initialFormState, formData);
  if (!result) return NextResponse.json({ ok: false, message: 'Unknown error' }, { status: 500 });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
