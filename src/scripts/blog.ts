// Blog search overlay (ported from openSearch / closeSearch / searchHits / searchKey).
import { $, $$, focusSoon, persona, setOverlay } from './state';

type Hit = { slug: string; title: string; summary: string; tags: string[]; persona: string; date: string };

const dlg = $('[data-search]');
const input = $<HTMLInputElement>('[data-search-input]');
const results = $('[data-search-results]');
const none = $('[data-search-none]');
const ring = $('[data-search-ring]');
const buttons = $$('[data-search-btn]');
const index: Hit[] = JSON.parse($('[data-search-index]')?.textContent || '[]');
let isOpen = false, sel = 0, hits: Hit[] = [];

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function render() {
  if (!results || !input || !none || !ring) return;
  const q = input.value;
  const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
  hits = index.filter(p => p.persona === persona()).filter(p => {
    const hay = [p.title, p.summary, ...p.tags].join(' ').toLowerCase();
    return toks.every(t => hay.includes(t));
  });
  sel = Math.min(sel, Math.max(0, hits.length - 1));
  ring.classList.toggle('has-q', !!q);
  results.innerHTML = hits.map((p, i) => `
    <a id="sr-${p.slug}" role="option" aria-selected="${i === sel}" href="/blog/${p.slug}/" class="result" data-i="${i}">
      <span aria-hidden="true" class="mark"></span>
      <span style="flex:1; min-width:0; display:flex; flex-direction:column; gap:6px">
        <span style="font-size:clamp(16px,2vw,19px); font-weight:600; line-height:1.3; text-wrap:balance">${esc(p.title)}</span>
        <span style="display:flex; flex-wrap:wrap; gap:4px 12px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:rgb(var(--ink) / 0.68)"><span style="white-space:nowrap; color:var(--gold)">${esc(p.date)}</span><span>${esc(p.tags.slice(0, 4).map(t => '#' + t).join('  '))}</span></span>
      </span>
      <span class="mi" aria-hidden="true" style="--i:url(/assets/icons/lucide/arrow-up-right.svg); width:16px; height:16px"></span>
    </a>`).join('');
  none.hidden = !(q && !hits.length);
  none.textContent = `No posts match “${q}”.`;
  input.setAttribute('aria-activedescendant', hits.length ? `sr-${hits[sel].slug}` : '');
  for (const a of $$('[data-i]', results)) a.addEventListener('mouseenter', () => { sel = +a.dataset.i!; mark(); });
}
function mark() {
  for (const a of $$('[data-i]', results!)) a.setAttribute('aria-selected', String(+a.dataset.i! === sel));
  if (hits.length) input!.setAttribute('aria-activedescendant', `sr-${hits[sel].slug}`);
}

function setOpen(on: boolean, refocus = true) {
  if (!dlg || on === isOpen) return;
  isOpen = on;
  dlg.classList.toggle('open', on);
  dlg.setAttribute('aria-hidden', String(!on));
  setOverlay('search', on);
  for (const b of buttons) {
    b.setAttribute('aria-expanded', String(on));
    b.setAttribute('aria-label', on ? 'Close search' : 'Search blog posts');
    const icon = $('[data-search-icon]', b)!;
    icon.style.setProperty('--i', `url(/assets/icons/lucide/${on ? 'x' : 'search'}.svg)`);
    icon.style.transform = `rotate(${on ? 90 : 0}deg)`;
  }
  if (on) { sel = 0; render(); focusSoon(input); }
  else if (refocus) buttons.find(b => b.offsetParent !== null)?.focus({ preventScroll: true });
}

if (dlg && input) {
  for (const b of buttons) b.addEventListener('click', () => setOpen(!isOpen));
  dlg.addEventListener('click', e => { if (!(e.target as Element).closest('[data-search-panel]')) setOpen(false); });
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (hits.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; mark(); } }
    else if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); location.href = `/blog/${hits[sel].slug}/`; }
  });
  addEventListener('keydown', e => {
    if (isOpen && e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (!isOpen && e.key === '/' && !(e.target as Element).closest?.('input, textarea')) { e.preventDefault(); setOpen(true); }
  });
}
