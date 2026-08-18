import { NextResponse } from 'next/server';
import { handleClickRequest, type ClickRequest } from '@/lib/payments/click';
import { clickStore, logPaymentEvent } from '@/server/payments/stores';
import { isCallbackThrottled, recordCallbackFailure } from '@/server/payments/throttle';
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
  if (await isCallbackThrottled('click', ip)) {
    await recordCallbackFailure('click', ip);
    return NextResponse.json({ error: -1, error_note: 'SIGN CHECK FAILED' });
  }

  const response = await handleClickRequest(body, env.click.secretKey, clickStore());
  if (response.error === -1) await recordCallbackFailure('click', ip);

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
