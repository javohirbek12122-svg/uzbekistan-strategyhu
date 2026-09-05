import { NextResponse } from 'next/server';
import { Bot } from 'grammy';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getGroupId(supabase: SupabaseClient<any, any, any>): Promise<string | null> {
  const { data } = await supabase
    .from('telegram_config')
    .select('value')
    .eq('key', 'admin_group_id')
    .maybeSingle();

  return data?.value || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setGroupId(supabase: SupabaseClient<any, any, any>, chatId: string) {
  await supabase
    .from('telegram_config')
    .upsert({ key: 'admin_group_id', value: chatId, updated_at: new Date().toISOString() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
    const supabase = await createClient();

    const chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;

    if (chatId && String(chatId).startsWith('-100')) {
      const stored = await getGroupId(supabase);
      if (!stored || stored !== String(chatId)) {
        await setGroupId(supabase, String(chatId));
        console.log(`[telegram/webhook] Auto-discovered and saved group ID: ${chatId}`);
      }
    }

    if (body.callback_query) {
      const callback = body.callback_query;
      const groupId = await getGroupId(supabase);

      if (!groupId) {
        return NextResponse.json({ ok: true, message: 'Group ID not configured yet' });
      }

      const [action, orderNumber] = callback.data.split('_');

      if (action === 'approve' || action === 'reject') {
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('order_number', orderNumber)
          .single();

        if (order) {
          if (action === 'approve') {
            await supabase
              .from('orders')
              .update({ status: 'pending_payment', payment_status: 'paid', updated_at: new Date().toISOString() })
              .eq('id', order.id);

            await supabase
              .from('payment_receipts')
              .update({ verified_by_admin: callback.from?.username ?? null, updated_at: new Date().toISOString() })
              .eq('order_id', order.id);

            await bot.api.editMessageText(
              callback.message.chat.id,
              callback.message.message_id,
              `✅ TASDIQLANDI${callback.from?.username ? ` (Admin: @${callback.from.username})` : ''}`,
            );
          } else if (action === 'reject') {
            await bot.api.editMessageText(
              callback.message.chat.id,
              callback.message.message_id,
              `❌ RAD ETILDI\nSabab: Admin tomonidan rad etildi`,
            );
          }

          await bot.api.answerCallbackQuery(callback.id, { text: action === 'approve' ? 'Tasdiqlandi' : 'Rad etildi' });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram/webhook] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'telegram' });
}
