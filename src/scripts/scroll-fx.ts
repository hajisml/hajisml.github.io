// Home-page scroll choreography (ported from measure / heroScroll / quoteScroll /
// workScroll / introHero / playHeroIn / heroOut / updateScroll).
import { $, $$, reduceMotion } from './state';
import { onPersonaSwitch } from './persona';

type Geo = {
  vh: number; vw: number; tri: number[][]; cx: number; cy: number; sMax: number; heroRange: number;
  qTop: number; qH: number; tlTop: number; tlH: number;
  nodes: { n: HTMLElement; yr: HTMLElement | null; c: number }[];
  secTops: [string, number][];
};

const nav = $('nav[data-nav]')!;
const scrim = $('[data-scrim]');
const ring = $<SVGSVGElement>('svg[data-ring]');
const heroEls = $$('[data-hero]').sort((a, b) => +a.dataset.hero! - +b.dataset.hero!);
const heroDir = (el: HTMLElement) => +(el.dataset.dir || -1);
const Q = { tri1: $('[data-q="tri1"]'), tri2: $('[data-q="tri2"]'), mark: $('[data-q="mark"]'), text: $('[data-q="text"]'), cap: $('[data-q="cap"]') };

let geo: Geo | null = null;
let introDone = false, introT = 0, lastHeroT = -1, lastHeroLive: boolean | null = null, lastQ = -1, tlP = -1;

const visibleTimeline = () => $$('[data-tl]').find(ol => ol.offsetParent !== null) || null;

function measure() {
  const y = window.scrollY, vh = innerHeight, vw = innerWidth;
  const top = (el: Element | null) => (el ? el.getBoundingClientRect().top + y : 0);
  const hdr = document.getElementById('top'), qs = document.getElementById('quote'), ol = visibleTimeline();
  const k = Math.max(vw / 1920, vh / 1080), ox = (vw - 1920 * k) / 2, oy = (vh - 1080 * k) / 2;
  const tri = [[960, 138], [1347, 808], [573, 808]].map(([x, yy]) => [ox + x * k, oy + yy * k]);
  const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
  let sMax = 1;
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = tri[i], [bx, by] = tri[(i + 1) % 3];
    let nx = by - ay, ny = ax - bx; const len = Math.hypot(nx, ny); nx /= len; ny /= len;
    let d = nx * (ax - cx) + ny * (ay - cy); if (d < 0) { nx = -nx; ny = -ny; d = -d; }
    for (const [px, py] of [[0, 0], [vw, 0], [0, vh], [vw, vh]]) sMax = Math.max(sMax, (nx * (px - cx) + ny * (py - cy)) / d);
  }
  geo = {
    vh, vw, tri, cx, cy, sMax,
    heroRange: Math.max(1, (hdr ? hdr.offsetHeight : vh * 2.5) - vh),
    qTop: top(qs), qH: qs ? qs.offsetHeight : 0,
    tlTop: top(ol), tlH: ol ? ol.offsetHeight : 0,
    nodes: ol ? $$('[data-tl-node]', ol).map(n => { const b = n.getBoundingClientRect(); return { n, yr: n.parentElement!.querySelector<HTMLElement>('[data-tl-year]'), c: b.top + y + b.height / 2 }; }) : [],
    secTops: ['work', 'about', 'experience', 'skills', 'learning', 'contact'].map(id => { const el = document.getElementById(id); return el ? [id, top(el)] as [string, number] : null; }).filter(Boolean) as [string, number][],
  };
  lastHeroT = -1; lastQ = -1; tlP = -1;
  for (const o of geo.nodes) delete o.n.dataset.on;
}

function heroScroll(y: number) {
  const g = geo!;
  const t = Math.max(0, Math.min(1, y / g.heroRange));
  const live = introDone && !reduceMotion;
  if (t === lastHeroT && live === lastHeroLive) return;
  lastHeroT = t; lastHeroLive = live;
  const c = Math.max(0, Math.min(1, (t - 0.08) / 0.92));
  const ce = c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
  const pts = (s: number) => g.tri.map(([x, yy]) => [g.cx + (x - g.cx) * s, g.cy + (yy - g.cy) * s]);
  if (scrim) scrim.style.clipPath = t >= 1 ? 'none' : 'polygon(' + pts(ce * g.sMax * 1.03).map(([x, yy]) => `${x.toFixed(1)}px ${yy.toFixed(1)}px`).join(', ') + ')';
  if (ring) {
    const o = Math.min(1, c * 8) * (1 - ce);
    ring.style.opacity = o.toFixed(3);
    if (o > 0.001) ring.firstElementChild!.setAttribute('points', pts(1 + ce * (g.sMax * 1.12 - 1)).map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
  }
  if (!live) return;
  const n = heroEls.length;
  heroEls.forEach((el, i) => {
    const p = Math.max(0, Math.min(1, (t / 0.75 - (n - 1 - i) * 0.1) / 0.6));
    const e = p * p * (3 - 2 * p);
    el.style.transform = `translate3d(${(heroDir(el) * e * 60).toFixed(2)}vw, 0, 0)`;
    el.style.opacity = (1 - e).toFixed(3);
    el.style.visibility = e >= 1 ? 'hidden' : '';
  });
}

function quoteScroll(y: number) {
  const g = geo!, vh = g.vh;
  if (!g.qH || !Q.text) return;
  const top = g.qTop - y;
  if (top + g.qH < -50 || top > vh + 50) return;
  const cl = (v: number) => Math.max(0, Math.min(1, v)), sm = (v: number) => v * v * (3 - 2 * v);
  const q = reduceMotion ? 1 : cl((vh * 0.6 - top) / (vh * 0.6 + (g.qH - vh) * 0.85));
  if (q === lastQ) return;
  lastQ = q;
  const words = Q.text.children as HTMLCollectionOf<HTMLElement>, N = words.length, wq = cl((q - 0.08) / 0.72) * N;
  for (let i = 0; i < N; i++) {
    const l = cl(wq - i), e = sm(l), s = words[i].style;
    s.opacity = (0.16 + 0.84 * e).toFixed(3);
    s.transform = `translate3d(0, ${((1 - e) * 0.18).toFixed(3)}em, 0)`;
    s.color = l > 0 && l < 1 ? 'oklch(var(--gl) 0.07 70)' : '';
  }
  const m = sm(cl(q / 0.12));
  if (Q.mark) { Q.mark.style.opacity = m.toFixed(3); Q.mark.style.transform = `translate3d(0, ${((1 - m) * -40).toFixed(1)}px, 0) scale(${(0.6 + 0.4 * m).toFixed(3)})`; }
  const L = sm(cl((q - 0.8) / 0.15));
  if (Q.cap) {
    Q.cap.style.opacity = L.toFixed(3);
    (Q.cap.firstElementChild as HTMLElement).style.transform = (Q.cap.lastElementChild as HTMLElement).style.transform = `scaleX(${L.toFixed(3)})`;
  }
  const fade = Math.min(1, q * 5), r = 1 - sm(q);
  if (Q.tri1) { Q.tri1.style.opacity = fade.toFixed(3); Q.tri1.style.transform = `translate(-50%, -50%) rotate(${(-120 * r).toFixed(2)}deg) scale(${(0.7 + 0.3 * sm(q)).toFixed(3)})`; }
  if (Q.tri2) { Q.tri2.style.opacity = fade.toFixed(3); Q.tri2.style.transform = `translate(-50%, -50%) rotate(${(120 * r).toFixed(2)}deg) scale(${(0.55 + 0.45 * sm(q)).toFixed(3)})`; }
}

function timelineScroll(y: number) {
  const g = geo!, ol = visibleTimeline(), fill = ol?.querySelector<HTMLElement>('[data-tl-fill]');
  if (!fill || !g.tlH) return;
  const line = g.vh * 0.55;
  if (g.tlTop - y > g.vh * 1.2 && tlP === 0) return;
  const p = Math.max(0, Math.min(1, (y + line - g.tlTop) / g.tlH));
  if (p !== tlP) { tlP = p; fill.style.transform = `scaleY(${p.toFixed(4)})`; }
  for (const o of g.nodes) {
    const on = o.c - y < line;
    if (o.n.dataset.on === String(on)) continue;
    o.n.dataset.on = String(on);
    o.n.classList.toggle('on', on);
    o.yr?.classList.toggle('on', on);
  }
}

let active = '';
function activeNav(y: number) {
  let a = 'top';
  const line = y + geo!.vh * 0.4;
  for (const [id, t] of geo!.secTops) if (t < line) a = id;
  if (a === active) return;
  active = a;
  for (const l of $$('[data-sec]')) l.classList.toggle('is-active', l.dataset.sec === a);
}
export const activeSection = () => active || 'top';

export function update() {
  if (!geo || geo.vh !== innerHeight || geo.vw !== innerWidth) measure();
  const y = window.scrollY;
  heroScroll(y);
  quoteScroll(y);
  timelineScroll(y);
  activeNav(y);
}
/** Call after layout changes (filters, persona switch, fonts). */
export function remeasure() { geo = null; requestAnimationFrame(update); }

/* Hero intro / out / in */
function playHeroIn(base: number, withNav: boolean) {
  const ease = 'cubic-bezier(.16,1,.3,1)';
  introDone = false;
  clearTimeout(introT);
  if (withNav) nav.style.transition = `transform .9s ${ease}, opacity .6s ease`;
  heroEls.forEach((e, i) => { const d = base + i * 110; e.style.transition = `transform 1.1s ${ease} ${d}ms, opacity .8s ease ${d}ms`; });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (withNav) { nav.style.transform = 'translateX(-50%)'; nav.style.opacity = '1'; }
    heroEls.forEach(e => { e.style.transform = 'translate3d(0, 0, 0)'; e.style.opacity = '1'; e.style.visibility = ''; });
  }));
  introT = window.setTimeout(() => {
    introDone = true;
    heroEls.forEach(e => { e.style.transition = ''; });
    if (withNav) nav.style.transition = '';
    lastHeroT = -1; update();
  }, base + heroEls.length * 110 + 1150);
}

function heroOut() {
  introDone = false;
  clearTimeout(introT);
  const n = heroEls.length;
  heroEls.forEach((e, i) => {
    const d = (n - 1 - i) * 50;
    e.style.transition = `transform .42s cubic-bezier(.7,0,.84,0) ${d}ms, opacity .32s ease ${d + 80}ms`;
    e.style.transform = `translate3d(${heroDir(e) * 60}vw, 0, 0)`; e.style.opacity = '0';
  });
}

let heroOnSwitch = false;
onPersonaSwitch({
  before: () => {
    heroOnSwitch = !reduceMotion && window.scrollY < innerHeight * 0.4;
    if (heroOnSwitch) heroOut();
    return heroOnSwitch ? 520 : 300;
  },
  after: () => {
    remeasure();
    if (heroOnSwitch) playHeroIn(0, false);
  },
});

export function start() {
  if (reduceMotion) {
    heroEls.forEach(e => { e.style.transform = 'none'; e.style.opacity = '1'; });
    nav.style.transform = 'translateX(-50%)'; nav.style.opacity = '1';
    introDone = true;
  } else {
    playHeroIn(250, true);
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = window.setTimeout(remeasure, 120); });
  if ('ResizeObserver' in window) {
    let h = 0, t = 0;
    new ResizeObserver(en => { const nh = Math.round(en[0].contentRect.height); if (nh === h) return; h = nh; clearTimeout(t); t = window.setTimeout(() => { geo = null; }, 100); }).observe(document.body);
  }
  document.fonts?.ready.then(remeasure);
  update();
}
