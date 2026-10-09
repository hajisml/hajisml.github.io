// Full-screen section wheel (ported from toggleMenu / wheelUpdate / wheelTo / menuWheel / touch handlers).
import { $, $$, focusSoon, setOverlay } from './state';
import { activeSection } from './scroll-fx';

const menu = $('[data-menu]');
const wheel = $('[data-wheel]');
const buttons = $$('[data-menu-btn]');
const ids = ['top', 'work', 'about', 'experience', 'skills', 'learning', 'contact'];
const H = 72;
let sel = 0, isOpen = false;

function wheelUpdate() {
  if (!wheel) return;
  const st = wheel.scrollTop, items = $$('[data-wi]', wheel);
  sel = Math.round(st / H);
  items.forEach((it, i) => {
    const d = i - st / H, a = Math.min(Math.abs(d), 3);
    it.style.transform = `perspective(700px) rotateX(${(-d * 24).toFixed(2)}deg) scale(${(1 - a * 0.07).toFixed(3)})`;
    it.style.opacity = Math.max(0.12, 1 - a * 0.32).toFixed(3);
    it.style.color = Math.abs(d) < 0.5 ? 'oklch(var(--gl) 0.07 70)' : '';
    it.setAttribute('aria-selected', String(Math.abs(d) < 0.5));
  });
}
const wheelTo = (i: number, smooth: boolean) => { if (!wheel) return; sel = i; wheel.scrollTo({ top: i * H, behavior: smooth ? 'smooth' : 'auto' }); };

export function setMenu(on: boolean, refocus = true) {
  if (!menu || on === isOpen) return;
  isOpen = on;
  menu.classList.toggle('open', on);
  menu.setAttribute('aria-hidden', String(!on));
  document.documentElement.classList.toggle('menu-open', on);
  for (const b of buttons) { b.setAttribute('aria-expanded', String(on)); b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); }
  setOverlay('menu', on);
  for (const p of $$('[data-picker].open')) p.classList.remove('open');
  if (on) {
    requestAnimationFrame(() => { wheelTo(Math.max(0, ids.indexOf(activeSection())), false); wheelUpdate(); focusSoon(wheel); });
  } else if (refocus) {
    buttons.find(b => b.offsetParent !== null)?.focus({ preventScroll: true });
  }
}

if (menu && wheel) {
  for (const b of buttons) b.addEventListener('click', () => setMenu(!isOpen));

  let raf = 0;
  wheel.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; wheelUpdate(); }); });

  $$('[data-wi]', wheel).forEach((a, i) => a.addEventListener('click', e => {
    if (i !== sel) { e.preventDefault(); wheelTo(i, true); return; }
    setMenu(false, false);
  }));

  // Scrolling or swiping anywhere on the overlay steps the wheel.
  let acc = 0, accT = 0, stepT = 0, tY: number | null = null;
  menu.addEventListener('wheel', e => {
    if ((e.target as Element).closest('[data-wheel]')) return;
    const now = performance.now();
    if (now - accT > 220) acc = 0;
    accT = now;
    acc += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
    if (Math.abs(acc) < 40 || now - stepT < 110) return;
    stepT = now;
    const dir = Math.sign(acc); acc = 0;
    wheelTo(Math.max(0, Math.min(6, sel + dir)), true);
  }, { passive: true });
  menu.addEventListener('touchstart', e => { tY = (e.target as Element).closest('[data-wheel]') ? null : e.touches[0].clientY; }, { passive: true });
  menu.addEventListener('touchmove', e => {
    if (tY == null) return;
    const y = e.touches[0].clientY, d = tY - y;
    if (Math.abs(d) < 44) return;
    tY = y;
    wheelTo(Math.max(0, Math.min(6, sel + Math.sign(d))), true);
  }, { passive: true });

  addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); wheelTo(Math.max(0, Math.min(6, sel + (e.key === 'ArrowDown' ? 1 : -1))), true); }
    else if (e.key === 'Enter' && !(e.target as Element).closest?.('[data-wi]')) { e.preventDefault(); $$('[data-wi]', wheel)[sel]?.click(); }
    else if (e.key === 'Escape') setMenu(false);
  });
}
