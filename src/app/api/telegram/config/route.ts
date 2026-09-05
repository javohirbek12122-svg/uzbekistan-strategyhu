import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('telegram_config')
      .select('value')
      .eq('key', 'admin_group_id')
      .maybeSingle();

    if (error) {
      console.error('[telegram/config] read error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      groupId: data?.value || null,
      configured: !!data?.value,
    });
  } catch (error) {
    console.error('[telegram/config] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('telegram_config')
      .upsert({ key: 'admin_group_id', value: String(groupId), updated_at: new Date().toISOString() });

    if (error) {
      console.error('[telegram/config] write error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, groupId });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
