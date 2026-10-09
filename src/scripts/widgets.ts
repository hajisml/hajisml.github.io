// Small home-page widgets: project filters, toolkit cursor glow, copy-email button.
import { $$ } from './state';
import { remeasure } from './scroll-fx';

/* Project category filters (per persona block) */
for (const block of $$('[data-work]')) {
  const buttons = $$('[data-filter]', block);
  for (const b of buttons) b.addEventListener('click', () => {
    const f = b.dataset.filter!;
    for (const x of buttons) x.setAttribute('aria-pressed', String(x === b));
    for (const card of $$('[data-project]', block)) card.hidden = f !== 'All' && card.dataset.cat !== f;
    remeasure();
  });
}

/* Toolkit spotlight that follows the mouse */
for (const area of $$('[data-glow-area]')) {
  let pt: [number, number] | null = null, raf = 0;
  area.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pt = [e.clientX, e.clientY];
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!pt) return;
      const [x, y] = pt;
      for (const el of $$('[data-glow]', area)) { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', x - r.left + 'px'); el.style.setProperty('--my', y - r.top + 'px'); }
    });
  });
  area.addEventListener('pointerleave', () => {
    pt = null;
    for (const el of $$('[data-glow]', area)) { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); }
  });
}

/* Copy email */
const status = document.querySelector<HTMLElement>('[data-copy-status]');
for (const b of $$('[data-copy]')) {
  let t = 0;
  b.addEventListener('click', () => {
    navigator.clipboard?.writeText(b.dataset.copy!).catch(() => {});
    const icon = b.querySelector<HTMLElement>('[data-copy-icon]')!;
    icon.style.setProperty('--i', 'url(/assets/icons/lucide/check.svg)');
    b.setAttribute('aria-label', 'Email copied'); b.title = 'Email copied';
    if (status) status.textContent = 'Email address copied to clipboard';
    clearTimeout(t);
    t = window.setTimeout(() => {
      icon.style.setProperty('--i', 'url(/assets/icons/lucide/copy.svg)');
      b.setAttribute('aria-label', 'Copy email address'); b.title = 'Copy email address';
      if (status) status.textContent = '';
    }, 1800);
  });
}
