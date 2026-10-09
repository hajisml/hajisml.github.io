// The nav pill turns more opaque once the page has scrolled.
import { $ } from './state';

const nav = $('nav[data-nav]');
if (nav) {
  let ticking = false;
  const update = () => { ticking = false; nav.classList.toggle('solid', window.scrollY > 40); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
