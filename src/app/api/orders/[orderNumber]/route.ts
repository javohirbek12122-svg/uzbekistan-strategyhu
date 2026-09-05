import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status, payment_receipts(rejected_reason)')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const receiptArray = order.payment_receipts as unknown as { rejected_reason: string | null }[] | null;
    const receipt = receiptArray?.[0] ?? null;
    return NextResponse.json({
      payment_status: order.payment_status,
      rejected_reason: receipt?.rejected_reason || null,
    });
  } catch (error) {
    console.error('[orders/status] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
