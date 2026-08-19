'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { publicEnv } from '@/lib/env';
import {
  phoneSignInSchema,
  signInSchema,
  signUpSchema,
  zodToFormState,
  type FormState,
} from '@/lib/validation';
import { audit, isEmailAllowlisted } from '@/lib/security/console';

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/`,
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
    },
  });
  if (error) {
    const normalized = error.message.toLowerCase();
    const message = normalized.includes('already registered') || normalized.includes('already been registered')
      ? 'Bu email bilan hisob allaqachon mavjud'
      : normalized.includes('password')
        ? 'Parol kamida 10 belgi, katta-kichik harf va raqamdan iborat bo\'lsin'
        : normalized.includes('rate limit')
          ? 'Juda ko\'p urinish bo\'ldi. Bir necha daqiqadan keyin qayta urinib ko\'ring.'
          : 'Ro\'yxatdan o\'tishda xatolik yuz berdi. Email manzilini tekshirib, qayta urinib ko\'ring.';
    return { ok: false, message };
  }
  if (!data.user) return { ok: false, message: 'Hisob yaratilmadi. Qayta urinib ko\'ring.' };

  // This project currently has email confirmation enabled but no working SMS
  // provider. Confirm the newly created account server-side, then establish a
  // normal session so the customer can use the site immediately.
  if (!data.session) {
    const { error: confirmError } = await serviceClient().auth.admin.updateUserById(data.user.id, {
      email_confirm: true,
    });
    if (confirmError) return { ok: false, message: 'Hisob tasdiqlanmadi. Qayta urinib ko\'ring.' };

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signInError) return { ok: false, message: 'Hisob yaratildi, lekin kirish amalga oshmadi.' };
  }

  redirect('/?welcome=1');
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

export async function sendPhoneCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = phoneSignInSchema.pick({ phone: true }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
    options: {
      shouldCreateUser: true,
      data: { phone: parsed.data.phone, full_name: 'Mijoz' },
    },
  });
  if (error) return { ok: false, message: 'SMS yuborilmadi. Raqamni tekshiring yoki keyinroq urinib ko\'ring.' };
  return { ok: true, message: 'SMS kodi yuborildi. 6 xonali kodni kiriting.' };
}

export async function verifyPhoneCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = phoneSignInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token!,
    type: 'sms',
  });
  if (error || !data.user) return { ok: false, message: 'SMS kodi noto\'g\'ri yoki muddati tugagan.' };

  const { data: profile } = await serviceClient()
    .from('profiles')
    .select('is_blocked')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    return { ok: false, message: 'Hisobingiz vaqtincha bloklangan' };
  }

  await audit({ actorId: data.user.id, actorEmail: data.user.email, action: 'auth.sms_sign_in' });
  const next = String(formData.get('next') ?? '');
  redirect(next && next.startsWith('/') ? next : '/');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
