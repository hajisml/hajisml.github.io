// Contact form. With a Turnstile site key the message goes to /api/contact
// (spam check + email via Resend). Without one, or if the API isn't set up,
// it falls back to opening the visitor's mail app addressed to the site owner.
import { $, persona } from './state';

const form = $<HTMLFormElement>('form[data-contact]');
const siteKey = form?.dataset.turnstile || '';
let started = 0;

function ownerEmail() {
  const block = document.querySelector<HTMLElement>(`[data-p="${persona()}"] [data-copy]`);
  return block?.dataset.copy || '';
}

function setStatus(state: 'idle' | 'sending' | 'sent' | 'error', note = '') {
  if (!form) return;
  form.setAttribute('aria-busy', String(state === 'sending'));
  $('[data-submit-label]', form)!.textContent = state === 'sending' ? 'Sending…' : 'Send message';
  $('[data-submit-icon]', form)!.style.setProperty('--i', `url(/assets/icons/lucide/${state === 'sending' ? 'loader' : 'send'}.svg)`);
  $('[data-form-status]', form)!.textContent =
    note || (state === 'sent' ? 'Thanks — I’ll be in touch soon.' : state === 'error' ? 'Something went wrong. Email me directly instead.' : '');
}

function mailto(name: string, from: string, message: string) {
  const to = ownerEmail();
  location.href = `mailto:${to}?subject=${encodeURIComponent('Hello from ' + name)}&body=${encodeURIComponent(message + '\n\n— ' + name + ' (' + from + ')')}`;
}

if (form) {
  if (siteKey) {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true; s.defer = true;
    document.head.append(s);
  }
  form.addEventListener('focusin', () => { started ||= Date.now(); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const from = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    // Spam traps: a hidden field humans never fill, and a minimum time on the form.
    if (data.get('website') || !started || Date.now() - started < 3000) { form.reset(); setStatus('sent'); return; }

    if (!siteKey) { mailto(name, from, message); setStatus('sent'); return; }
    const token = String(data.get('cf-turnstile-response') || '');
    if (!token) { setStatus('idle', 'Please complete the quick check above, then send again.'); return; }

    setStatus('sending');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: from, message, persona: persona(), website: data.get('website') || '', elapsed: Date.now() - started, token }),
      });
      if (r.status === 503) { mailto(name, from, message); setStatus('sent'); return; }
      if (!r.ok) throw new Error(String(r.status));
      form.reset(); started = 0; setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
    }
  });
}
