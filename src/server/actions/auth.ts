'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { publicEnv } from '@/lib/env';
import { signInSchema, signUpSchema, zodToFormState, type FormState } from '@/lib/validation';
import { audit, isEmailAllowlisted } from '@/lib/security/console';

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/`,
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
    },
  });
  if (error) {
    const message = error.message.toLowerCase().includes('already registered')
      ? 'Bu email bilan hisob allaqachon mavjud'
      : 'Ro\'yxatdan o\'tishda xatolik yuz berdi';
    return { ok: false, message };
  }
  redirect('/auth/login?registered=1');
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, message: 'Email yoki parol xato' };

  // Blocked customers are signed out immediately.
  const { data: profile } = await serviceClient()
    .from('profiles')
    .select('is_blocked')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    return { ok: false, message: 'Hisobingiz vaqtincha bloklangan' };
  }

  await audit({ actorId: data.user.id, actorEmail: data.user.email, action: 'auth.sign_in' });

  const next = String(formData.get('next') ?? '');
  // Console users always land on the console gate, never on a public page.
  if (next.startsWith('/__console') && (await isEmailAllowlisted(parsed.data.email))) {
    redirect('/__console/login');
  }
  redirect(next && next.startsWith('/') ? next : '/');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
