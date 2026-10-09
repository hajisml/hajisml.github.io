// POST /api/contact — Cloudflare Pages Function.
// Checks the spam traps, verifies the Turnstile token, then emails the message via Resend.
// Secrets (set with `wrangler pages secret put`): TURNSTILE_SECRET, RESEND_API_KEY.
// Variables: CONTACT_TO (where mail goes), CONTACT_FROM (optional, defaults to Resend's test sender).

interface Env {
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}
type Body = { name?: unknown; email?: unknown; message?: unknown; persona?: unknown; website?: unknown; elapsed?: unknown; token?: unknown };

const json = (status: number, data: Record<string, unknown>) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Not configured yet: tell the page to fall back to mailto.
  if (!env.TURNSTILE_SECRET || !env.RESEND_API_KEY || !env.CONTACT_TO) return json(503, { error: 'not_configured' });

  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json(403, { error: 'origin' });
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) return json(415, { error: 'type' });

  let body: Body;
  try { body = await request.json(); } catch { return json(400, { error: 'json' }); }

  const name = str(body.name, 120), email = str(body.email, 200), message = str(body.message, 5000);
  const persona = body.persona === 'design' ? 'design' : 'dev';
  // Bots: pretend it worked so they don't retry.
  if (str(body.website, 200) || Number(body.elapsed) < 3000) return json(200, { ok: true });
  if (!name || !EMAIL.test(email) || message.length < 2) return json(422, { error: 'fields' });

  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', str(body.token, 2048));
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.append('remoteip', ip);
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const outcome = (await verify.json()) as { success?: boolean };
  if (!outcome.success) return json(403, { error: 'turnstile' });

  const subject = `Portfolio (${persona === 'design' ? 'Design' : 'Software'}): message from ${name}`;
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>',
      to: env.CONTACT_TO.split(',').map(s => s.trim()),
      reply_to: email,
      subject,
      text: `${message}\n\n— ${name} <${email}>`,
      html: `<p style="white-space:pre-wrap">${esc(message)}</p><p>— ${esc(name)} &lt;${esc(email)}&gt;</p>`,
    }),
  });
  if (!sent.ok) return json(502, { error: 'send' });
  return json(200, { ok: true });
};

export const onRequest: PagesFunction<Env> = () => json(405, { error: 'method' });
