// Fade-and-rise as sections enter the viewport (ported from reveal()).
import { $$, reduceMotion } from './state';

let io: IntersectionObserver | null = null;

export function reveal() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  io ??= new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target as HTMLElement;
    io!.unobserve(el);
    el.style.transition = `opacity .6s ease ${el.dataset.rvd}ms, transform .7s cubic-bezier(.2,.8,.2,1) ${el.dataset.rvd}ms`;
    el.style.opacity = ''; el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 800 + Number(el.dataset.rvd));
  }), { rootMargin: '0px 0px -8% 0px' });
  let k = 0;
  // Only elements that are currently shown (the other persona's are display:none).
  for (const el of $$('[data-reveal]')) {
    if (el.dataset.rv || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
    el.dataset.rv = '1'; el.dataset.rvd = String((k++ % 3) * 70);
    el.style.opacity = '0'; el.style.transform = 'translateY(22px)';
    io.observe(el);
  }
}
