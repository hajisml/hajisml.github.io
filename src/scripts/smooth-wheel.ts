// Eased mouse-wheel scrolling (ported from smoothWheel()). Skipped for reduced
// motion, pinch/zoom gestures, horizontal scrolls, overlays and scrollable widgets.
import { overlayOpen, reduceMotion } from './state';

let raf = 0, target = 0, y = window.scrollY;
addEventListener('scroll', () => { if (!raf) y = window.scrollY; }, { passive: true });

addEventListener('wheel', e => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || reduceMotion || overlayOpen()) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  const t = e.target as Element | null;
  if (t && t.closest && t.closest('textarea, select, pre, [data-wheel], [role="dialog"], [role="menu"]')) return;
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
  const max = document.documentElement.scrollHeight - innerHeight;
  if (!raf) y = window.scrollY;
  target = Math.max(0, Math.min(max, (raf ? target : window.scrollY) + dy));
  if (raf) return;
  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(48, now - last); last = now;
    const k = 1 - Math.pow(1 - 0.12, dt / 16.667);
    y += (target - y) * k;
    if (Math.abs(target - y) < 0.4) y = target;
    window.scrollTo({ top: y, behavior: 'instant' });
    if (y === target) { raf = 0; return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}, { passive: false });
