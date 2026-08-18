import { NextResponse } from 'next/server';
import { handleClickRequest, type ClickRequest } from '@/lib/payments/click';
import { clickStore, logPaymentEvent } from '@/server/payments/stores';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Click posts `application/x-www-form-urlencoded`, sometimes JSON. */
async function readRequest(request: Request): Promise<ClickRequest> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as ClickRequest;
  }
  const form = await request.formData();
  return Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)])) as unknown as ClickRequest;
}

export async function POST(request: Request) {
  const env = serverEnv();
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const body = await readRequest(request);
  const response = await handleClickRequest(body, env.click.secretKey, clickStore());

  await logPaymentEvent({
    provider: 'click',
    method: body.action === '0' ? 'prepare' : 'complete',
    request: { ...body, sign_string: '•••' },
    response,
    signatureValid: response.error !== -1,
    ip,
  });

  return NextResponse.json(response);
}
