import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { sendOrderToAdminGroup } from '@/lib/telegram/bot';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderNumber = String(formData.get('orderNumber') || '');
    const customerPhone = String(formData.get('customerPhone') || '');
    const cardLastFour = String(formData.get('cardLastFour') || '');
    const receipt = formData.get('receipt') as File | null;

    if (!orderNumber || !customerPhone || !cardLastFour || !receipt) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, items, order_number')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts');
    const fileName = `${uuidv4()}-${receipt.name}`;
    const filePath = join(uploadDir, fileName);
    const arrayBuffer = await receipt.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const receiptUrl = `/uploads/receipts/${fileName}`;

    const { data: receiptRecord, error: receiptError } = await supabase
      .from('payment_receipts')
      .insert({
        order_id: order.id,
        card_last_four: cardLastFour,
        receipt_url: receiptUrl,
      })
      .select('id')
      .single();

    if (receiptError) {
      console.error('[checkout/submit] receipt insert error', receiptError);
      return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500 });
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const itemsSummary = (items as { name: string; quantity: number }[]).map((item) => `${item.name} (${item.quantity} dona)`).join(', ');

    const telegramMsgId = await sendOrderToAdminGroup({
      orderNumber: order.order_number,
      totalAmount: String(order.total),
      cardLastFour,
      customerPhone,
      items: itemsSummary || 'Mahsulotlar',
      createdAt: new Date().toLocaleString('uz-UZ'),
    }).catch((err) => {
      console.error('[checkout/submit] telegram send error', err);
      return null;
    });

    if (telegramMsgId && receiptRecord) {
      await supabase
        .from('payment_receipts')
        .update({ telegram_msg_id: telegramMsgId })
        .eq('id', receiptRecord.id);
    }

    return NextResponse.json({ ok: true, orderNumber });
  } catch (error) {
    console.error('[checkout/submit] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
