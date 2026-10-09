// Drifting "snow" particles that react to scroll speed (ported from startSnow()).
import { $, motion, reduceMotion, root } from './state';

const c = $<HTMLCanvasElement>('canvas[data-snow]');
if (c) {
  const ctx = c.getContext('2d')!;
  let W = 0, H = 0;
  const size = () => {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener('resize', size);

  type Flake = { x: number; y: number; z: number; r: number; vy: number; ph: number; a: number; warm: boolean };
  const n = Math.round(Math.min(220, Math.max(70, (W * H) / 8000)));
  const make = (initial: boolean): Flake => {
    const z = Math.pow(Math.random(), 1.6);
    return { x: Math.random() * W, y: initial ? Math.random() * H : -12, z, r: 0.5 + z * 3.4, vy: 0.15 + z * 0.85, ph: Math.random() * Math.PI * 2, a: 0.25 + z * 0.6, warm: Math.random() < 0.3 };
  };
  const flakes = Array.from({ length: n }, () => make(true));
  const sprite = (col: string) => {
    const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d')!, gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(0.35, `rgba(${col},0.85)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, S, S); return cv;
  };
  const dark = { w: sprite('246,240,236'), k: sprite('232,214,196') }, light = { w: sprite('92,74,84'), k: sprite('150,112,80') };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const sp = root.dataset.theme === 'light' ? light : dark;
    for (const f of flakes) {
      const d = f.r * 3.2;
      ctx.globalAlpha = f.a;
      ctx.drawImage(f.warm ? sp.k : sp.w, f.x - d / 2, f.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  };

  if (reduceMotion) draw();
  else {
    let push = 0, wind = 0, last = 0, raf = 0;
    const tick = (t: number) => {
      const dt = last ? Math.min(3, (t - last) / 16.667) : 1; last = t;
      const impulse = motion.scrollVel; motion.scrollVel = 0;
      push += (impulse * 0.1 - push * 0.1) * dt;
      push *= Math.pow(0.9, dt);
      wind += (Math.max(-1, Math.min(1, impulse / 60)) * 0.04 - wind * 0.04) * dt;
      const turb = 1 + Math.min(4, Math.abs(push) / 6);
      for (const f of flakes) {
        f.y += (f.vy - push * (0.15 + f.z * 0.9)) * dt;
        f.x += (Math.sin(t / 1400 + f.ph) * 0.25 * turb * (0.4 + f.z) + wind * 2.5 * f.z) * dt;
        if (f.y > H + 14) Object.assign(f, make(false));
        else if (f.y < -14) Object.assign(f, make(false), { y: H + 12 });
        if (f.x > W + 14) f.x = -12; else if (f.x < -14) f.x = W + 12;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = 0; raf = requestAnimationFrame(tick); }
    });
    raf = requestAnimationFrame(tick);
  }
}
