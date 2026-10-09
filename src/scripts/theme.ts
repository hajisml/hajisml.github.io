// "Nuclear mode" light/dark toggle with the blade/shockwave animation and a
// triangular view-transition reveal (ported from the design's toggleTheme()).
import { $$, reduceMotion, root } from './state';

const label = (light: boolean) => (light ? 'Nuclear mode on — turn off' : 'Nuclear mode off — turn on');

function sync() {
  const light = root.dataset.theme === 'light';
  for (const b of $$('[data-theme-btn]')) {
    b.setAttribute('aria-label', label(light));
    b.title = label(light);
    b.setAttribute('aria-pressed', String(light));
  }
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', light ? '#f4efec' : '#1d181c');
}

function animateIcons(on: boolean) {
  if (reduceMotion || !document.body.animate) return;
  const ease = 'cubic-bezier(.2,.8,.2,1)';
  for (const ic of $$('[data-nuke]')) {
    const bl = ic.querySelector('[data-nuke-blades]')!, wv = ic.querySelector('[data-nuke-wave]')!, co = ic.querySelector('[data-nuke-core]')!;
    if (on) {
      co.animate([{ transform: 'scale(1)' }, { transform: 'scale(2.6)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 650, easing: ease });
      bl.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.55)', opacity: 0.25, offset: 0.35 }, { transform: 'scale(0.9)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)' }], { duration: 750, easing: ease });
      wv.animate([{ transform: 'scale(0.3)', opacity: 0.9 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.1,.7,.3,1)' });
      wv.animate([{ transform: 'scale(0.3)', opacity: 0.6 }, { transform: 'scale(1.8)', opacity: 0 }], { duration: 700, delay: 140, easing: 'cubic-bezier(.1,.7,.3,1)' });
    } else {
      bl.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.55)', opacity: 0.5, offset: 0.4 }, { transform: 'scale(1.08)', offset: 0.75 }, { transform: 'scale(1)' }], { duration: 650, easing: ease });
      wv.animate([{ transform: 'scale(2)', opacity: 0 }, { transform: 'scale(0.4)', opacity: 0.7 }, { transform: 'scale(0.2)', opacity: 0 }], { duration: 500, easing: 'ease-in' });
      co.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.4)' }, { transform: 'scale(1)' }], { duration: 600, easing: ease });
    }
  }
}

function toggle(btn: HTMLElement) {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  const apply = () => {
    root.dataset.theme = next;
    try { localStorage.setItem('halim-theme', next); } catch {}
    sync();
  };
  animateIcons(next === 'light');
  if (!document.startViewTransition || reduceMotion) { apply(); return; }
  const b = btn.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(innerWidth - cx, cy), Math.hypot(cx, innerHeight - cy), Math.hypot(innerWidth - cx, innerHeight - cy));
  const tri = (r: number) => `polygon(${cx}px ${cy - r}px, ${cx + r * 0.866}px ${cy + r * 0.5}px, ${cx - r * 0.866}px ${cy + r * 0.5}px)`;
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => root.animate({ clipPath: [tri(0), tri(far * 2.1)] }, { duration: 850, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
}

for (const b of $$('[data-theme-btn]')) b.addEventListener('click', () => toggle(b));
sync();
