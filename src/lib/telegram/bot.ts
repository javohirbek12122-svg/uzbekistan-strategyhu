import { Bot } from 'grammy';
import { createClient } from '@/lib/supabase/server';

export type TelegramBot = ReturnType<typeof newBot>;

export function newBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing');
  }
  return new Bot(token);
}

export async function getAdminGroupId() {
  const envGroupId = process.env.TELEGRAM_ADMIN_GROUP_ID;
  if (envGroupId) return envGroupId;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('telegram_config')
      .select('value')
      .eq('key', 'admin_group_id')
      .maybeSingle();

    return data?.value || null;
  } catch {
    return null;
  }
}

export async function sendOrderToAdminGroup(params: {
  orderNumber: string;
  totalAmount: string;
  cardLastFour: string;
  customerPhone: string;
  items: string;
  createdAt: string;
}) {
  const bot = newBot();
  const chatId = await getAdminGroupId();
  if (!chatId) {
    console.warn('[telegram] admin_group_id not configured');
    return;
  }

  const text = [
    `<b>🛍️ YANGI BUYURTMA: #${params.orderNumber}</b>`,
    '───────────────────────',
    `<b>💰 Jami Summa:</b> ${params.totalAmount} UZS`,
    `<b>💳 Karta 4-tasisi:</b> **** ${params.cardLastFour}`,
    `<b>📞 Mijoz Tel:</b> ${params.customerPhone}`,
    `<b>📦 Mahsulotlar:</b> ${params.items}`,
    `<b>⏰ Vaqt:</b> ${params.createdAt}`,
  ].join('\n');

  const keyboard = {
    inline_keyboard: [
      [{ text: '✅ Tasdiqlash', callback_data: `approve_${params.orderNumber}` }],
      [{ text: '❌ Rad Etish', callback_data: `reject_${params.orderNumber}` }],
    ],
  };

  try {
    const result = await bot.api.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    return result.message_id;
  } catch (error) {
    console.error('[telegram] sendOrderToAdminGroup error', error);
    return null;
  }
}

export async function updateAdminMessage(params: {
  telegramMsgId: number;
  orderNumber: string;
  status: 'approved' | 'rejected';
  adminUsername?: string;
  reason?: string;
}) {
  const bot = newBot();
  const chatId = await getAdminGroupId();
  if (!chatId) return;

  const base = [
    `<b>🛍️ BUYURTMA: #${params.orderNumber}</b>`,
    '───────────────────────',
    params.status === 'approved'
      ? `<b>✅ TASDIQLANDI${params.adminUsername ? ` (Admin: @${params.adminUsername})` : ''}</b>`
      : `<b>❌ RAD ETILDI${params.reason ? `\nSabab: ${params.reason}` : ''}</b>`,
  ].join('\n');

  try {
    await bot.api.editMessageText(chatId, params.telegramMsgId, base, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('[telegram] updateAdminMessage error', error);
  }
}
