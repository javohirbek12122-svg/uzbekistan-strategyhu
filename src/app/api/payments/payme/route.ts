import { NextResponse } from 'next/server';
import { handlePaymeRequest, PAYME_ERROR, verifyPaymeAuth, type PaymeRequest } from '@/lib/payments/payme';
import { logPaymentEvent, paymeStore } from '@/server/payments/stores';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
}

export async function POST(request: Request) {
  const env = serverEnv();
  const ip = clientIp(request);

  let body: PaymeRequest;
  try {
    body = (await request.json()) as PaymeRequest;
  } catch {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: PAYME_ERROR.PARSE, message: { uz: 'Parse error', ru: 'Parse error', en: 'Parse error' } },
    });
  }

  if (!verifyPaymeAuth(request.headers.get('authorization'), env.payme.merchantKey)) {
    const response = {
      jsonrpc: '2.0' as const,
      id: body.id,
      error: {
        code: PAYME_ERROR.INSUFFICIENT_PRIVILEGE,
        message: { uz: 'Ruxsat yo\'q', ru: 'Нет доступа', en: 'Forbidden' },
      },
    };
    await logPaymentEvent({
      provider: 'payme',
      method: body.method,
      request: { method: body.method },
      response,
      signatureValid: false,
      ip,
    });
    return NextResponse.json(response, { status: 200 });
  }

  const response = await handlePaymeRequest(body, paymeStore());
  await logPaymentEvent({
    provider: 'payme',
    method: body.method,
    request: body,
    response,
    signatureValid: true,
    ip,
  });
  return NextResponse.json(response);
}
