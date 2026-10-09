// Small shared state for the page scripts (each module is loaded once per page).
export type PersonaId = 'dev' | 'design';

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const root = document.documentElement;

/** Scroll velocity accumulated between snow frames (the snow drifts with your scrolling). */
export const motion = { scrollVel: 0, lastY: window.scrollY };
addEventListener('scroll', () => {
  const y = window.scrollY;
  motion.scrollVel += y - motion.lastY;
  motion.lastY = y;
}, { passive: true });

export const persona = (): PersonaId => (root.dataset.persona === 'design' ? 'design' : 'dev');

/** Overlays (menu, project modal, search) lock page scroll and make the page behind inert. */
const open = new Set<string>();
export function setOverlay(name: string, on: boolean) {
  if (on) open.add(name); else open.delete(name);
  const blocked = open.size > 0;
  document.body.style.overflow = blocked ? 'hidden' : '';
  root.classList.toggle('lock', blocked);
  for (const sel of ['main', 'footer', 'header#top']) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.inert = blocked;
  }
  const nav = document.querySelector<HTMLElement>('nav[data-nav]');
  if (nav) nav.inert = open.has('modal');
}
export const overlayOpen = (name?: string) => (name ? open.has(name) : open.size > 0);

export const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)];

/** Focus an element inside an overlay that is still fading in (retries until it can take focus). */
export function focusSoon(el: HTMLElement | null | undefined, tries = 10) {
  if (!el) return;
  const attempt = (n: number) => {
    el.focus({ preventScroll: true });
    if (document.activeElement !== el && n > 0) setTimeout(() => attempt(n - 1), 40);
  };
  requestAnimationFrame(() => attempt(tries));
}
