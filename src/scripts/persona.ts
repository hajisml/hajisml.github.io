// Software / Design portfolio switch (ported from setPersona() and the picker handlers).
// Both personas are in the HTML; switching flips <html data-persona>. Pages can hook
// into the switch (the home page slides the hero out and back in around it).
import { $$, persona, reduceMotion, root, type PersonaId } from './state';

type Hooks = { before?: (dir: number) => number; after?: (dir: number) => void };
const hooks: Hooks[] = [];
/** Register page behaviour around a switch. `before` returns how long to wait (ms) before swapping. */
export const onPersonaSwitch = (h: Hooks) => hooks.push(h);

const order: PersonaId[] = ['dev', 'design'];
let switching = false;

function syncPickers() {
  const id = persona();
  for (const opt of $$('[data-persona-id]')) opt.setAttribute('aria-checked', String(opt.dataset.personaId === id));
}

function iconMove(dir: number, phase: 'out' | 'in') {
  if (reduceMotion) return;
  for (const el of $$('[data-picker-icon]')) {
    if (phase === 'out') {
      el.style.transition = 'transform .28s cubic-bezier(.7,0,.84,0), opacity .22s ease';
      el.style.transform = `translateY(${dir * 150}%)`; el.style.opacity = '0';
    } else {
      el.style.transition = 'none';
      el.style.transform = `translateY(${-dir * 150}%)`; el.style.opacity = '0';
      void el.offsetHeight;
      el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1), opacity .3s ease';
      el.style.transform = 'translateY(0)'; el.style.opacity = '1';
    }
  }
}

export function setPersona(id: PersonaId) {
  closePickers();
  if (id === persona() || switching) return;
  switching = true;
  const dir = order.indexOf(id) > order.indexOf(persona()) ? -1 : 1;
  iconMove(dir, 'out');
  const main = document.querySelector<HTMLElement>('[data-main]');
  if (main) { main.style.opacity = '0'; main.style.transform = 'translateY(10px)'; }
  const wait = Math.max(300, ...hooks.map(h => h.before?.(dir) ?? 0));
  setTimeout(() => {
    root.dataset.persona = id;
    try { localStorage.setItem('halim-persona', id); } catch {}
    const u = new URL(location.href);
    if (id === 'dev') u.searchParams.delete('persona'); else u.searchParams.set('persona', id);
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    syncPickers();
    requestAnimationFrame(() => {
      if (main) { main.style.opacity = ''; main.style.transform = ''; }
      iconMove(dir, 'in');
      hooks.forEach(h => h.after?.(dir));
      document.dispatchEvent(new CustomEvent('persona:change', { detail: id }));
      switching = false;
    });
  }, wait);
}

/* Picker menus (one in the desktop nav, one in the mobile nav) */
const hover = () => matchMedia('(hover: hover)').matches;
let hoverT = 0;

function setOpen(picker: HTMLElement, on: boolean) {
  picker.classList.toggle('open', on);
  picker.querySelector('[data-picker-btn]')!.setAttribute('aria-expanded', String(on));
  const menu = picker.querySelector('[data-picker-menu]')!;
  menu.setAttribute('aria-hidden', String(!on));
  for (const o of $$('[role="menuitemradio"]', menu)) o.tabIndex = on ? 0 : -1;
}
function closePickers() { for (const p of $$('[data-picker]')) setOpen(p, false); }

for (const picker of $$('[data-picker]')) {
  const btn = picker.querySelector<HTMLElement>('[data-picker-btn]')!;
  const menu = picker.querySelector<HTMLElement>('[data-picker-menu]')!;
  picker.addEventListener('mouseenter', () => { if (!hover()) return; clearTimeout(hoverT); setOpen(picker, true); });
  picker.addEventListener('mouseleave', () => { if (!hover()) return; clearTimeout(hoverT); hoverT = window.setTimeout(() => setOpen(picker, false), 220); });
  btn.addEventListener('click', e => {
    const kb = e.detail === 0;
    // With a mouse, hover has already opened it — a click shouldn't close it again.
    const on = (!kb && hover()) || !picker.classList.contains('open');
    setOpen(picker, on);
    if (on && kb) setTimeout(() => menu.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(), 40);
  });
  menu.addEventListener('keydown', e => {
    const items = $$('[role="menuitemradio"]', menu);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); (e.key === 'Home' ? items[0] : items[items.length - 1])?.focus(); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(picker, false); if (e.key === 'Escape') btn.focus(); }
  });
  for (const opt of $$('[data-persona-id]', menu)) opt.addEventListener('click', () => setPersona(opt.dataset.personaId as PersonaId));
}
document.addEventListener('pointerdown', e => {
  for (const p of $$('[data-picker]')) if (p.classList.contains('open') && !p.contains(e.target as Node)) setOpen(p, false);
});
addEventListener('keydown', e => { if (e.key === 'Escape') closePickers(); });
syncPickers();
