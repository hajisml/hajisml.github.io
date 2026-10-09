// Project modal on the home page. Cards are real links to /projects/<slug>/;
// here they open the same content in a dialog and the URL follows along, so
// back/forward and refresh all behave.
import { $, $$, focusSoon, persona, setOverlay } from './state';
import { TITLES } from './titles';

const modal = $('[data-modal]');
const body = $('[data-modal-body]');
const card = $('[data-modal-card]');
const closeBtn = $('[data-modal-close]');
let openSlug: string | null = null;
let returnFocus: HTMLElement | null = null;

const slugFromPath = () => location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/)?.[1] ?? null;
const tpl = (slug: string) => $<HTMLTemplateElement>(`template[data-project-tpl="${slug}"]`);

function show(slug: string) {
  const t = tpl(slug);
  if (!modal || !body || !card || !t) return false;
  if (!openSlug) returnFocus = document.activeElement as HTMLElement;
  openSlug = slug;
  body.replaceChildren(t.content.cloneNode(true));
  card.setAttribute('aria-labelledby', `pd-${slug}`);
  document.title = `${t.dataset.title} — Haji Ibrahim`;
  modal.hidden = false;
  modal.scrollTop = 0;
  setOverlay('modal', true);
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('in')));
  focusSoon(closeBtn);
  return true;
}

function hide() {
  if (!modal || !openSlug) return;
  openSlug = null;
  modal.classList.remove('in');
  document.title = TITLES[persona()];
  setOverlay('modal', false);
  setTimeout(() => { if (!openSlug) { modal.hidden = true; body!.replaceChildren(); } }, 300);
  returnFocus?.focus({ preventScroll: true });
  returnFocus = null;
}

export function initProjects() {
  if (!modal) return;
  for (const a of $$<HTMLAnchorElement>('a[data-project]')) {
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (show(a.dataset.project!)) history.pushState({ modal: true }, '', `/projects/${a.dataset.project}/` + location.search);
    });
  }
  const close = () => {
    if (history.state?.modal) history.back();
    else { hide(); history.replaceState(null, '', '/' + location.search + '#work'); }
  };
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && openSlug) close(); });
  addEventListener('popstate', () => {
    const slug = slugFromPath();
    if (slug) show(slug); else hide();
  });

  // Links from the old single-page site: /#project/<slug>.
  const legacy = location.hash.match(/^#project\/([a-z0-9-]+)$/)?.[1];
  if (legacy && show(legacy)) history.replaceState(null, '', `/projects/${legacy}/` + location.search);
}
