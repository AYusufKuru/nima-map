/**
 * Eski istemciler veya ayrı dağıtımlar `create-user` yerine bu endpoint’i
 * çağırıyorsa silme işlemi yine çalışır. Gövde: `{ "user_id": "<uuid>" }`.
 * Yetkilendirme: Bearer oturumu + profiles.role === 'admin'.
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://localhost:19000',
  'https://nima-map.vercel.app',
];

const MAX_BODY_BYTES = 48_000;

function parseAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS')?.trim();
  const extra = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra])];
}

function corsHeaders(req: Request, allowed: string[]): Record<string, string> | null {
  const origin = req.headers.get('Origin');
  const base: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, prefer, x-supabase-api-version',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (!origin || !allowed.includes(origin)) {
    return null;
  }
  return { ...base, 'Access-Control-Allow-Origin': origin };
}

function json(body: unknown, status: number, cors: Record<string, string> | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cors) Object.assign(headers, cors);
  return new Response(JSON.stringify(body), { status, headers });
}

serve(async (req) => {
  const allowedOrigins = parseAllowedOrigins();
  const cors = corsHeaders(req, allowedOrigins);

  if (req.method === 'OPTIONS') {
    if (!cors) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Yalnızca POST' }, 405, cors);
  }

  if (!cors) {
    return new Response(JSON.stringify({ error: 'İzin verilmeyen köken (Origin). ALLOWED_ORIGINS ile ekleyin.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const len = req.headers.get('Content-Length');
  if (len && Number(len) > MAX_BODY_BYTES) {
    return json({ error: 'İstek gövdesi çok büyük' }, 413, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Sunucu yapılandırması eksik' }, 500, cors);
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return json({ error: 'Geçersiz gövde' }, 400, cors);
  }
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: 'İstek gövdesi çok büyük' }, 413, cors);
  }

  let body: { user_id?: string };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ error: 'Geçersiz JSON' }, 400, cors);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Oturum gerekli' }, 401, cors);
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: authData, error: authErr } = await adminClient.auth.getUser(token);
  if (authErr || !authData.user) {
    return json({ error: 'Oturum geçersiz' }, 401, cors);
  }
  const adminUserId = authData.user.id;

  const { data: prof, error: pErr } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', adminUserId)
    .maybeSingle();
  if (pErr || prof?.role !== 'admin') {
    return json({ error: 'Yönetici yetkisi yok' }, 403, cors);
  }

  const userId = body.user_id?.trim();
  if (!userId) {
    return json({ error: 'user_id gerekli' }, 400, cors);
  }
  if (userId === adminUserId) {
    return json({ error: 'Kendi hesabınızı silemezsiniz' }, 400, cors);
  }

  const { data: targetProf } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (!targetProf) {
    return json({ error: 'Kullanıcı bulunamadı' }, 404, cors);
  }
  if (targetProf.role === 'admin') {
    const { count } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return json({ error: 'Son yönetici silinemez' }, 400, cors);
    }
  }

  const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
  if (delErr) {
    return json({ error: delErr.message }, 400, cors);
  }
  return json({ ok: true }, 200, cors);
});
