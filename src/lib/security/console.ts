import 'server-only';
import { cookies, headers } from 'next/headers';
import { authenticator } from 'otplib';
import { serviceClient, requireServiceClient } from '../supabase/service';
import { createClient } from '../supabase/server';
import { serverEnv } from '../env';
import { decryptSecret, encryptSecret, generateRecoveryCodes, randomToken, sha256 } from './crypto';

export const CONSOLE_COOKIE = 'pe_console';
export const CONSOLE_PATH = '/__console';

const DEFAULT_SESSION_HOURS = 8;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_MINUTES = 15;

const TOTP_WINDOW_BACK = 1;
const TOTP_WINDOW_FORWARD = 1;

authenticator.options = { window: [TOTP_WINDOW_BACK, TOTP_WINDOW_FORWARD], step: 30 };

export interface SecuritySettings {
  require_mfa: boolean;
  ip_allowlist_enabled: boolean;
  session_hours: number;
  max_login_attempts: number;
  lockout_minutes: number;
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const client = serviceClient();
  if (!client) {
    return {
      require_mfa: true,
      ip_allowlist_enabled: false,
      session_hours: DEFAULT_SESSION_HOURS,
      max_login_attempts: DEFAULT_MAX_ATTEMPTS,
      lockout_minutes: DEFAULT_LOCKOUT_MINUTES,
    };
  }
  const { data } = await client.from('settings').select('value').eq('key', 'security').maybeSingle();
  const value = (data?.value ?? {}) as Partial<SecuritySettings>;
  return {
    require_mfa: value.require_mfa ?? true,
    ip_allowlist_enabled: value.ip_allowlist_enabled ?? false,
    session_hours: value.session_hours ?? DEFAULT_SESSION_HOURS,
    max_login_attempts: value.max_login_attempts ?? DEFAULT_MAX_ATTEMPTS,
    lockout_minutes: value.lockout_minutes ?? DEFAULT_LOCKOUT_MINUTES,
  };
}

/**
 * Client IP for the allow-list check and the audit trail. `x-forwarded-for` is
 * appended to by each proxy, so the trustworthy entry is the one written by the
 * hop closest to the app: with `TRUSTED_PROXY_HOPS=n` the n-th value from the
 * right is used, and client-supplied values to its left are ignored.
 */
export async function requestMeta() {
  const h = await headers();
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1));
  const chain = (h.get('x-forwarded-for') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const forwarded = chain.length >= hops ? chain[chain.length - hops] : undefined;
  const ip = forwarded || h.get('x-real-ip') || null;
  return { ip, userAgent: h.get('user-agent') };
}

export async function isEmailAllowlisted(email: string): Promise<boolean> {
  const client = serviceClient();
  if (!client) return false;
  const { data } = await client
    .from('admin_allowlist')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

export async function isIpAllowed(ip: string | null): Promise<boolean> {
  const settings = await getSecuritySettings();
  if (!settings.ip_allowlist_enabled) return true;
  if (!ip) return false;
  const client = serviceClient();
  if (!client) return false;
  const { data } = await client.from('admin_ip_allowlist').select('cidr');
  const list = (data ?? []) as { cidr: string }[];
  // Fail closed: an enabled but empty allow-list must not permit everyone.
  if (list.length === 0) return false;
  return list.some((row) => ipInCidr(ip, row.cidr));
}

/** IPv4 CIDR containment (IPv6 entries are compared literally). */
export function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split('/');
  if (!ip.includes('.') || !range.includes('.')) return ip === range;
  const bits = bitsRaw ? Number(bitsRaw) : 32;
  const toInt = (value: string) =>
    value.split('.').reduce((acc, part) => (acc << 8) + (Number(part) & 255), 0) >>> 0;
  if (bits === 0) return true;
  const mask = bits >= 32 ? 0xffffffff : (0xffffffff << (32 - bits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(range) & mask);
}

export async function recordLoginAttempt(identifier: string, successful: boolean, ip: string | null) {
  const client = serviceClient();
  if (!client) return;
  await client
    .from('login_attempts')
    .insert({ identifier: identifier.toLowerCase(), ip, scope: 'console', successful });
}

export async function isLockedOut(identifier: string): Promise<boolean> {
  const settings = await getSecuritySettings();
  const client = serviceClient();
  if (!client) return false;
  const since = new Date(Date.now() - settings.lockout_minutes * 60_000).toISOString();
  const { data } = await client
    .from('login_attempts')
    .select('successful, created_at')
    .eq('identifier', identifier.toLowerCase())
    .eq('scope', 'console')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(settings.max_login_attempts);

  const rows = data ?? [];
  return rows.length >= settings.max_login_attempts && rows.every((row) => !row.successful);
}

export async function hasAdminRole(userId: string): Promise<boolean> {
  const client = serviceClient();
  if (!client) return false;
  const { data } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'manager']);
  return (data ?? []).length > 0;
}

// ---------------------------------------------------------------------------
// TOTP enrolment
// ---------------------------------------------------------------------------
export interface MfaRecord {
  user_id: string;
  secret_encrypted: string;
  confirmed_at: string | null;
  last_used_step: number | null;
}

export async function getMfa(userId: string): Promise<MfaRecord | null> {
  const client = requireServiceClient();
  const { data } = await client
    .from('admin_mfa')
    .select('user_id, secret_encrypted, confirmed_at, last_used_step')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as MfaRecord | null) ?? null;
}

function decodeBytea(value: string): Buffer {
  // supabase-js returns bytea as a `\x...` hex string.
  return value.startsWith('\\x') ? Buffer.from(value.slice(2), 'hex') : Buffer.from(value, 'base64');
}

function encodeBytea(buffer: Buffer): string {
  return `\\x${buffer.toString('hex')}`;
}

export async function enrollMfa(userId: string, email: string) {
  const env = serverEnv();
  const secret = authenticator.generateSecret();
  const { codes, hashed } = generateRecoveryCodes();
  const client = requireServiceClient();

  await client
    .from('admin_mfa')
    .upsert(
      {
        user_id: userId,
        secret_encrypted: encodeBytea(encryptSecret(secret, env.consoleEncryptionKey)),
        confirmed_at: null,
        recovery_codes_hashed: hashed,
      },
      { onConflict: 'user_id' },
    );

  return {
    secret,
    otpauthUrl: authenticator.keyuri(email, 'Parkent E-Mart Console', secret),
    recoveryCodes: codes,
  };
}

export async function verifyTotp(userId: string, token: string): Promise<boolean> {
  const record = await getMfa(userId);
  if (!record) return false;
  const secret = decryptSecret(decodeBytea(record.secret_encrypted), serverEnv().consoleEncryptionKey);
  const normalized = token.replace(/\s/g, '');

  if (!authenticator.check(normalized, secret)) return false;

  // Replay protection: a code may be used once. The verifier accepts a ±1-step
  // window, so the used step must also block the neighbouring steps that would
  // still accept the very same code.
  const step = Math.floor(Date.now() / 30_000);
  if (record.last_used_step !== null && step <= record.last_used_step + TOTP_WINDOW_FORWARD + TOTP_WINDOW_BACK) {
    return false;
  }

  await requireServiceClient()
    .from('admin_mfa')
    .update({ last_used_step: step, confirmed_at: record.confirmed_at ?? new Date().toISOString() })
    .eq('user_id', userId);
  return true;
}

export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const client = requireServiceClient();
  const { data } = await client
    .from('admin_mfa')
    .select('recovery_codes_hashed')
    .eq('user_id', userId)
    .maybeSingle();
  const codes = (data?.recovery_codes_hashed ?? []) as string[];
  const hash = sha256(code.trim().toUpperCase());
  if (!codes.includes(hash)) return false;
  await client
    .from('admin_mfa')
    .update({ recovery_codes_hashed: codes.filter((c) => c !== hash) })
    .eq('user_id', userId);
  return true;
}

// ---------------------------------------------------------------------------
// Console session (second factor gate, separate from the Supabase session)
// ---------------------------------------------------------------------------
export async function issueConsoleSession(userId: string) {
  const settings = await getSecuritySettings();
  const { ip, userAgent } = await requestMeta();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + settings.session_hours * 3_600_000);
  const client = requireServiceClient();

  await client.from('admin_sessions').insert({
    user_id: userId,
    token_hash: sha256(token),
    ip,
    user_agent: userAgent,
    expires_at: expiresAt.toISOString(),
  });

  const store = await cookies();
  store.set(CONSOLE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: CONSOLE_PATH,
    expires: expiresAt,
  });
}

export async function revokeConsoleSession() {
  const store = await cookies();
  const token = store.get(CONSOLE_COOKIE)?.value;
  if (token) {
    const client = serviceClient();
    if (client) {
      await client
        .from('admin_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token_hash', sha256(token));
    }
  }
  // The cookie was written with an explicit path; a path-less delete would emit
  // a clearing directive for `/` and leave the real cookie in place.
  store.set(CONSOLE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: CONSOLE_PATH,
    maxAge: 0,
  });
}

export interface ConsoleIdentity {
  userId: string;
  email: string;
  role: 'admin' | 'manager';
}

/**
 * Full console gate: Supabase session + allow-listed e-mail + privileged role +
 * IP allow-list + a valid, unexpired MFA-passed console session.
 */
export async function getConsoleIdentity(): Promise<ConsoleIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  if (!(await isEmailAllowlisted(user.email))) return null;

  const client = serviceClient();
  if (!client) return null;
  const { data: roles } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'manager']);
  const role = (roles ?? []).some((r) => r.role === 'admin')
    ? 'admin'
    : (roles ?? []).length > 0
      ? 'manager'
      : null;
  if (!role) return null;

  const { ip } = await requestMeta();
  if (!(await isIpAllowed(ip))) return null;

  const store = await cookies();
  const token = store.get(CONSOLE_COOKIE)?.value;
  if (!token) return null;
  const { data: session } = await client
    .from('admin_sessions')
    .select('user_id, expires_at, revoked_at')
    .eq('token_hash', sha256(token))
    .maybeSingle();
  if (!session || session.user_id !== user.id) return null;
  if (session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;

  return { userId: user.id, email: user.email, role: role as 'admin' | 'manager' };
}

export async function requireConsole(): Promise<ConsoleIdentity> {
  const identity = await getConsoleIdentity();
  if (!identity) throw new Error('console_forbidden');
  return identity;
}

export async function requireAdmin(): Promise<ConsoleIdentity> {
  const identity = await requireConsole();
  if (identity.role !== 'admin') throw new Error('console_forbidden');
  return identity;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
export async function audit(input: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  const { ip, userAgent } = await requestMeta();
  const client = serviceClient();
  if (!client) return;
  await client.from('audit_log').insert({
    actor_id: input.actorId ?? null,
    actor_email: input.actorEmail ?? null,
    action: input.action,
    entity: input.entity ?? null,
    entity_id: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    ip,
    user_agent: userAgent,
  });
}
