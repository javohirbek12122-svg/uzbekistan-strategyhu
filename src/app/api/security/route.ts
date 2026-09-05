'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireServiceClient } from '@/lib/supabase/service';
import { consoleSettings } from '@/server/console/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 });
    }

    const settings = await consoleSettings();
    const securitySetting = settings.find((s) => s.key === 'security');
    const securityConfig = (securitySetting?.value as Record<string, unknown>) ?? {};

    const client = requireServiceClient();
    const [attemptsRes, sessionsRes, auditsRes, blockedRes, threatsRes] = await Promise.all([
      client.from('login_attempts').select('*').order('created_at', { ascending: false }).limit(100),
      client.from('admin_sessions').select('*').order('created_at', { ascending: false }).limit(50),
      client.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100),
      client.from('blocked_ips').select('*').order('created_at', { ascending: false }).limit(50),
      client.from('security_threats').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    return NextResponse.json({
      settings: securityConfig,
      attempts: attemptsRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      audits: auditsRes.data ?? [],
      blocked: blockedRes.data ?? [],
      threats: threatsRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 });
    }

    const body = await request.json();
    const client = requireServiceClient();

    switch (body.action) {
      case 'block_ip': {
        const { ip, reason, durationMinutes = 15 } = body;
        if (!ip) {
          return NextResponse.json({ error: 'IP majburiy' }, { status: 400 });
        }
        const blockedUntil = new Date(Date.now() + durationMinutes * 60_000).toISOString();
        const { error } = await client.from('blocked_ips').upsert(
          { ip, reason, blocked_until: blockedUntil },
          { onConflict: 'ip' }
        );
        if (error) throw error;
        await client.from('audit_log').insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'security.ip.block',
          entity: 'blocked_ips',
          entity_id: ip,
          after: { ip, reason, blocked_until: blockedUntil },
        });
        return NextResponse.json({ ok: true });
      }

      case 'unblock_ip': {
        const { ip } = body;
        if (!ip) {
          return NextResponse.json({ error: 'IP majburiy' }, { status: 400 });
        }
        const { error } = await client.from('blocked_ips').delete().eq('ip', ip);
        if (error) throw error;
        await client.from('audit_log').insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'security.ip.unblock',
          entity: 'blocked_ips',
          entity_id: ip,
        });
        return NextResponse.json({ ok: true });
      }

      case 'update_security_settings': {
        const settings = await consoleSettings();
        const securitySetting = settings.find((s) => s.key === 'security');
        const current = (securitySetting?.value as Record<string, unknown>) ?? {};
        const newSettings = { ...current, ...body.settings };

        const { error } = await client
          .from('settings')
          .upsert({ key: 'security', value: newSettings, updated_by: user.id }, { onConflict: 'key' });
        if (error) throw error;
        await client.from('audit_log').insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'security.settings.update',
          entity: 'settings',
          entity_id: 'security',
          before: current,
          after: newSettings,
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'Noma’lum amal' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 });
  }
}
