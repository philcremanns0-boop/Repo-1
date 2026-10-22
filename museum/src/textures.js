import * as THREE from 'three';

// Alle Texturen des Raums werden prozedural gezeichnet – nichts davon muss
// über das Netz geladen werden, das hält Ladezeit und Bundle klein.

const SRGB = THREE.SRGBColorSpace;
let ANISO = 4;
export const setAnisotropy = (n) => { ANISO = n; };

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function toTex(c, { srgb = true, wrap = false, mip = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = SRGB;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = ANISO;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  return t;
}
function grain(ctx, w, h, amt) {
  const d = ctx.getImageData(0, 0, w, h);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    p[i] += n; p[i + 1] += n; p[i + 2] += n;
  }
  ctx.putImageData(d, 0, 0);
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ───────────── Raum ───────────── */

export function wallTexture() {
  const [c, g] = mk(64, 512);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0.0, '#d2d4d8');   // oben (unter der dunklen Decke)
  grd.addColorStop(0.12, '#dfe1e4');
  grd.addColorStop(0.45, '#eceded');
  grd.addColorStop(0.88, '#e2e3e6');
  grd.addColorStop(0.97, '#c3c4c8');  // Sockel
  grd.addColorStop(1.0, '#b3b4b9');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 512);
  grain(g, 64, 512, 5);
  return toTex(c, { wrap: true });
}

export function floorTexture() {
  const [c, g] = mk(512, 512);
  g.fillStyle = '#e6e4e0'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 70 + Math.random() * 150;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() < 0.5;
    gr.addColorStop(0, dark ? 'rgba(150,146,140,0.055)' : 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  }
  grain(g, 512, 512, 7);
  g.fillStyle = 'rgba(120,116,110,0.16)';
  g.fillRect(0, 0, 512, 2); g.fillRect(0, 0, 2, 512);
  return toTex(c, { wrap: true });
}

export function ceilingTexture() {
  const [c, g] = mk(256, 256);
  g.fillStyle = '#2a2e36'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#4a505b';
  g.fillRect(0, 0, 256, 5); g.fillRect(0, 0, 5, 256);
  g.fillStyle = 'rgba(255,255,255,0.03)';
  g.fillRect(4, 4, 252, 252);
  grain(g, 256, 256, 6);
  return toTex(c, { wrap: true });
}

export function blackWallTexture() {
  const [c, g] = mk(64, 256);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#23262e');
  grd.addColorStop(0.5, '#383d49');
  grd.addColorStop(1, '#262a32');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 256);
  grain(g, 64, 256, 4);
  return toTex(c, { wrap: true });
}

export function washTexture() {
  const [c, g] = mk(128, 256);
  g.save();
  g.scale(1, 2);
  const gr = g.createRadialGradient(64, 20, 0, 64, 20, 64);
  gr.addColorStop(0, 'rgba(255,248,235,0.95)');
  gr.addColorStop(0.35, 'rgba(255,248,235,0.38)');
  gr.addColorStop(1, 'rgba(255,248,235,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.restore();
  return toTex(c, { mip: false });
}

export function blobTexture() {
  const [c, g] = mk(64, 64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(20,22,28,0.55)');
  gr.addColorStop(0.55, 'rgba(20,22,28,0.22)');
  gr.addColorStop(1, 'rgba(20,22,28,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return toTex(c, { mip: false });
}

/* Weicher Kontaktschatten (Rechteck) für Möbel & Sockel. */
export function boxShadowTexture() {
  const [c, g] = mk(128, 128);
  g.filter = 'blur(10px)';
  g.fillStyle = 'rgba(30,32,40,0.5)';
  g.fillRect(28, 28, 72, 72);
  return toTex(c, { mip: false });
}

/* ───────────── Fotos (Platzhalter) ───────────── */

const PALETTES = [
  ['#f6c9a8', '#d8727a', '#3b2b4e', '#1c1526'],
  ['#f2dcb4', '#e0956b', '#5a3a4c', '#2a1b25'],
  ['#c9d6e8', '#8fa3c7', '#3e4a73', '#1a2038'],
  ['#f4b8a0', '#c9506b', '#442a56', '#1d1328'],
  ['#e8d3b8', '#b68a6a', '#4a3a36', '#201a1a'],
  ['#d7c8e8', '#a78bc0', '#4d3a68', '#211833'],
];

export function placeholderPhoto(i, w = 768, h = 1024) {
  const [c, g] = mk(w, h);
  const pal = PALETTES[i % PALETTES.length];
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, pal[0]); sky.addColorStop(0.55, pal[1]); sky.addColorStop(1, pal[2]);
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  // sun glow
  const sx = w * (0.25 + ((i * 0.37) % 0.5)), sy = h * 0.34;
  const sg = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.6);
  sg.addColorStop(0, 'rgba(255,240,210,0.9)'); sg.addColorStop(0.3, 'rgba(255,214,170,0.35)'); sg.addColorStop(1, 'rgba(255,200,160,0)');
  g.fillStyle = sg; g.fillRect(0, 0, w, h);
  // distant hills
  g.fillStyle = pal[2] + 'aa';
  g.beginPath(); g.moveTo(0, h * 0.62);
  for (let x = 0; x <= w; x += 32) g.lineTo(x, h * (0.58 + 0.05 * Math.sin(x * 0.011 + i) + 0.03 * Math.sin(x * 0.027)));
  g.lineTo(w, h); g.lineTo(0, h); g.fill();
  // two people, close together
  const cx = w * 0.5 + (i % 2 ? -20 : 20), by = h * 1.02;
  g.fillStyle = pal[3];
  const person = (x, scale, tilt) => {
    g.save(); g.translate(x, by); g.rotate(tilt);
    g.beginPath(); g.ellipse(0, -h * 0.2 * scale, w * 0.17 * scale, h * 0.2 * scale, 0, Math.PI, 0); g.lineTo(w * 0.17 * scale, 0); g.lineTo(-w * 0.17 * scale, 0); g.fill();
    g.beginPath(); g.ellipse(0, -h * 0.425 * scale, w * 0.085 * scale, w * 0.1 * scale, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  person(cx - w * 0.12, 1.0, 0.08);
  person(cx + w * 0.13, 1.06, -0.09);
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  grain(g, w, h, 14);
  const t = toTex(c);
  t.userData = { aspect: w / h };
  return t;
}

/* Animierter Platzhalter für den Wand-Screen (Sonnenuntergang). */
export function createScreenCanvas() {
  const W = 640, H = 360;
  const [c, g] = mk(W, H);
  const parts = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.4 + Math.random() * 1.6, v: 4 + Math.random() * 14 }));
  const tex = toTex(c, { mip: false });
  tex.userData = { aspect: W / H };
  const draw = (t) => {
    const k = 0.5 + 0.5 * Math.sin(t * 0.15);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2b2540'); sky.addColorStop(0.45, k > 0.5 ? '#d56f5c' : '#c9674f'); sky.addColorStop(0.75, '#f2b27a'); sky.addColorStop(1, '#5b3a35');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const sg = g.createRadialGradient(W * 0.62, H * 0.62, 0, W * 0.62, H * 0.62, 220);
    sg.addColorStop(0, 'rgba(255,236,190,0.95)'); sg.addColorStop(0.25, 'rgba(255,200,150,0.5)'); sg.addColorStop(1, 'rgba(255,170,130,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3b2630';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, H * 0.78 + Math.sin(x * 0.02 + 1) * 14 + Math.sin(x * 0.007) * 22);
    g.lineTo(W, H); g.fill();
    // zwei Silhouetten, Hand in Hand
    g.fillStyle = '#1b1218';
    const sway = Math.sin(t * 0.6) * 1.5;
    const fig = (x, hh, w) => {
      const by = H * 0.9;
      g.beginPath(); g.moveTo(x - w, by); g.quadraticCurveTo(x - w * 1.05, by - hh * 0.72, x - w * 0.5, by - hh * 0.78);
      g.lineTo(x + w * 0.5, by - hh * 0.78); g.quadraticCurveTo(x + w * 1.05, by - hh * 0.72, x + w, by); g.closePath(); g.fill();
      g.beginPath(); g.arc(x, by - hh * 0.9, w * 0.42, 0, Math.PI * 2); g.fill();
    };
    fig(W * 0.46 + sway, 92, 22); fig(W * 0.545 + sway, 82, 20);
    g.fillRect(W * 0.485 + sway, H * 0.9 - 56, W * 0.035, 5);
    g.fillStyle = 'rgba(255,225,190,0.7)';
    for (const p of parts) {
      p.y -= p.v * 0.016; p.x += Math.sin(t + p.s * 9) * 0.3;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      g.fillRect(p.x, p.y, p.s, p.s);
    }
    tex.needsUpdate = true;
  };
  draw(0);
  return { texture: tex, draw };
}

/* ───────────── Schilder ───────────── */

export function plaqueTexture(cfg) {
  const [c, g] = mk(1024, 560);
  g.fillStyle = '#101216'; g.fillRect(0, 0, 1024, 560);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 0, 1024, 560);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.font = '600 22px "Inter Variable", sans-serif';
  g.letterSpacing = '5px';
  g.fillText(cfg.kicker || '', 64, 88);
  g.letterSpacing = '0px';
  g.fillStyle = '#fff';
  g.font = '400 132px "Instrument Serif", serif';
  g.fillText(cfg.title || '', 60, 232);
  g.fillStyle = 'rgba(255,255,255,0.68)';
  g.font = '400 30px "Inter Variable", sans-serif';
  (cfg.text || '').split('\n').forEach((ln, i) => g.fillText(ln, 64, 318 + i * 44));
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.font = 'italic 400 34px "Instrument Serif", serif';
  g.fillText(cfg.signature || '', 64, 496);
  return toTex(c);
}

export function cardTexture(text) {
  const [c, g] = mk(128, 80);
  g.fillStyle = '#f3f2ef'; g.fillRect(0, 0, 128, 80);
  g.fillStyle = '#9a9aa0';
  g.fillRect(14, 20, 70, 5); g.fillRect(14, 34, 96, 3); g.fillRect(14, 44, 82, 3);
  return toTex(c);
}

/* ───────────── Labels & Sprechblasen ───────────── */

const labelCache = new Map();
export function labelTexture(text, { dot = true, serif = false } = {}) {
  const key = `${text}|${dot}|${serif}`;
  const hit = labelCache.get(key);
  if (hit) return hit;
  const S = 3, H = 26, padX = 11, dotW = dot ? 14 : 0;
  const font = serif ? `italic 400 15px "Instrument Serif", serif` : `600 12px "Inter Variable", sans-serif`;
  const [m, mg] = mk(8, 8);
  mg.font = font;
  const tw = Math.ceil(mg.measureText(text).width);
  const W = tw + padX * 2 + dotW;
  const [c, g] = mk(W * S, H * S);
  g.scale(S, S);
  rr(g, 0, 0, W, H, H / 2);
  g.fillStyle = 'rgba(22,24,31,0.94)'; g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.stroke();
  if (dot) { g.fillStyle = '#ff9a3c'; g.beginPath(); g.arc(padX + 3, H / 2, 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#fff'; g.font = font; g.textBaseline = 'middle';
  g.fillText(text, padX + dotW, H / 2 + 0.5);
  const tex = toTex(c, { mip: false });
  const out = { texture: tex, aspect: W / H };
  labelCache.set(key, out);
  return out;
}

export function bubbleTexture(text) {
  const S = 3, maxW = 190, pad = 11, lh = 17;
  const font = '500 13px "Inter Variable", system-ui, sans-serif';
  const [m, mg] = mk(8, 8);
  mg.font = font;
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (mg.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 5);
  const tw = Math.max(...shown.map((l) => mg.measureText(l).width));
  const W = Math.ceil(tw + pad * 2), Hh = shown.length * lh + pad * 2 - 4, tail = 7;
  const [c, g] = mk(W * S, (Hh + tail) * S);
  g.scale(S, S);
  g.fillStyle = 'rgba(0,0,0,0.12)'; rr(g, 0, 1.5, W, Hh, 12); g.fill();
  g.fillStyle = '#fff'; rr(g, 0, 0, W, Hh, 12); g.fill();
  g.beginPath(); g.moveTo(W / 2 - 5, Hh - 0.5); g.lineTo(W / 2, Hh + tail); g.lineTo(W / 2 + 5, Hh - 0.5); g.fill();
  g.fillStyle = '#16181f'; g.font = font; g.textBaseline = 'top';
  shown.forEach((l, i) => g.fillText(l, pad, pad - 1 + i * lh));
  return { texture: toTex(c, { mip: false }), aspect: W / (Hh + tail) };
}
