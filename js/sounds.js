// Starter-Kit (synthetisch, offline gerendert), Chop-Analyse, Waveform-Peaks, Default-Projekt.
const SR = 44100;

function noise(c, dur) {
  const b = c.createBuffer(1, Math.ceil(dur * SR), SR);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}
const env = (c, g, t, peak, dec) => {
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
};
const mk = (c, type, f, t = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; };
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

function sat(c, amt = 3) {
  const w = c.createWaveShaper();
  const k = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = (i / 512) - 1; k[i] = Math.tanh(x * amt); }
  w.curve = k;
  return w;
}

const DEFS = [
  ['kick', 'Kick', 'Drums', 0.5, (c) => {
    const o = mk(c, 'sine', 160); o.frequency.exponentialRampToValueAtTime(48, 0.14);
    const g = c.createGain(); env(c, g, 0, 1, 0.45);
    o.connect(sat(c, 2)).connect(g).connect(c.destination); o.start(); o.stop(0.5);
  }],
  ['kick808', '808 Kick lang', 'Drums', 1.4, (c) => {
    const o = mk(c, 'sine', 120); o.frequency.exponentialRampToValueAtTime(42, 0.1);
    const g = c.createGain(); env(c, g, 0, 1, 1.3);
    o.connect(sat(c, 2.5)).connect(g).connect(c.destination); o.start(); o.stop(1.4);
  }],
  ['snare', 'Snare', 'Drums', 0.35, (c) => {
    const n = noise(c, 0.35), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.7;
    const g = c.createGain(); env(c, g, 0, 0.9, 0.22); n.connect(f).connect(g).connect(c.destination); n.start();
    const o = mk(c, 'triangle', 200), g2 = c.createGain(); env(c, g2, 0, 0.7, 0.12); o.connect(g2).connect(c.destination); o.start(); o.stop(0.2);
  }],
  ['clap', 'Clap', 'Drums', 0.4, (c) => {
    const n = noise(c, 0.4), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1;
    const g = c.createGain();
    [0, 0.012, 0.024].forEach((t) => { g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); });
    g.gain.setValueAtTime(0.9, 0.036); g.gain.exponentialRampToValueAtTime(0.0001, 0.3);
    n.connect(f).connect(g).connect(c.destination); n.start();
  }],
  ['hat', 'Hi-Hat zu', 'Drums', 0.12, (c) => {
    const n = noise(c, 0.12), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = c.createGain(); env(c, g, 0, 0.6, 0.05); n.connect(f).connect(g).connect(c.destination); n.start();
  }],
  ['hatopen', 'Hi-Hat offen', 'Drums', 0.5, (c) => {
    const n = noise(c, 0.5), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = c.createGain(); env(c, g, 0, 0.5, 0.35); n.connect(f).connect(g).connect(c.destination); n.start();
  }],
  ['rim', 'Rim', 'Drums', 0.1, (c) => {
    const g = c.createGain(); env(c, g, 0, 0.8, 0.04);
    [1700, 480].forEach((f) => { const o = mk(c, 'square', f); o.connect(g); o.start(); o.stop(0.08); });
    g.connect(c.destination);
  }],
  ['tom', 'Tom', 'Drums', 0.5, (c) => {
    const o = mk(c, 'sine', 180); o.frequency.exponentialRampToValueAtTime(95, 0.25);
    const g = c.createGain(); env(c, g, 0, 0.9, 0.4); o.connect(g).connect(c.destination); o.start(); o.stop(0.5);
  }],
  ['cowbell', 'Cowbell', 'Drums', 0.4, (c) => {
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1.2;
    const g = c.createGain(); env(c, g, 0, 0.7, 0.28);
    [560, 845].forEach((x) => { const o = mk(c, 'square', x); o.connect(f); o.start(); o.stop(0.4); });
    f.connect(g).connect(c.destination);
  }],
  ['shaker', 'Shaker', 'Drums', 0.2, (c) => {
    const n = noise(c, 0.2), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 6500; f.Q.value = 1.5;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, 0); g.gain.linearRampToValueAtTime(0.6, 0.03); g.gain.exponentialRampToValueAtTime(0.0001, 0.17);
    n.connect(f).connect(g).connect(c.destination); n.start();
  }],
  ['bass808', '808 Bass (A1)', 'Bass', 1.6, (c) => {
    const o = mk(c, 'sine', 62); o.frequency.exponentialRampToValueAtTime(55, 0.08);
    const g = c.createGain(); env(c, g, 0, 1, 1.5); o.connect(sat(c, 3)).connect(g).connect(c.destination); o.start(); o.stop(1.6);
  }],
  ['stab', 'Soul-Keys Akkord', 'Soul', 2, (c) => {
    const m = c.createGain(); m.gain.value = 0.22;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    [50, 53, 57, 60, 64].forEach((n, i) => {
      const f = hz(n);
      const car = mk(c, 'sine', f), mod = mk(c, 'sine', f * 1), mg = c.createGain();
      mg.gain.setValueAtTime(f * 1.6, 0); mg.gain.exponentialRampToValueAtTime(f * 0.05, 1.2);
      mod.connect(mg).connect(car.frequency);
      const g = c.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(1, 0.004 + i * 0.002); g.gain.exponentialRampToValueAtTime(0.0001, 1.9);
      car.connect(g).connect(m); car.start(); mod.start(); car.stop(2); mod.stop(2);
    });
    m.connect(lp).connect(c.destination);
  }],
  ['ooh', 'Chor "Ooh"', 'Soul', 1.6, (c) => {
    const m = c.createGain(); m.gain.setValueAtTime(0, 0); m.gain.linearRampToValueAtTime(0.5, 0.12); m.gain.setValueAtTime(0.5, 1.2); m.gain.linearRampToValueAtTime(0, 1.55);
    const vib = mk(c, 'sine', 5.2), vg = c.createGain(); vg.gain.value = 6; vib.connect(vg); vib.start(); vib.stop(1.6);
    [[300, 5], [870, 8], [2240, 12]].forEach(([fr, q]) => {
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = q;
      const gg = c.createGain(); gg.gain.value = fr < 400 ? 1 : fr < 1000 ? 0.5 : 0.2;
      [-9, -3, 0, 4, 9].forEach((d) => {
        const o = mk(c, 'sawtooth', hz(57)); o.detune.value = d; vg.connect(o.detune); o.connect(f); o.start(); o.stop(1.6);
      });
      f.connect(gg).connect(m);
    });
    m.connect(c.destination);
  }],
  ['strings', 'Streicher', 'Soul', 1.8, (c) => {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const m = c.createGain(); m.gain.setValueAtTime(0, 0); m.gain.linearRampToValueAtTime(0.16, 0.2); m.gain.setValueAtTime(0.16, 1.4); m.gain.linearRampToValueAtTime(0, 1.75);
    [53, 57, 60, 64].forEach((n) => [-7, 0, 7].forEach((d) => {
      const o = mk(c, 'sawtooth', hz(n)); o.detune.value = d; o.connect(lp); o.start(); o.stop(1.8);
    }));
    lp.connect(m).connect(c.destination);
  }],
  ['vinyl', 'Vinyl-Knistern', 'FX', 3, (c) => {
    const n = noise(c, 3), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
    const g = c.createGain(); g.gain.value = 0.015; n.connect(f).connect(g).connect(c.destination); n.start();
    const b = c.createBuffer(1, 3 * SR, SR), d = b.getChannelData(0);
    for (let i = 0; i < 40; i++) { const p = (Math.random() * d.length) | 0; d[p] = (Math.random() - 0.5) * 1.2; d[p + 1] = -d[p] * 0.5; }
    const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start();
  }],
  ['riser', 'Riser', 'FX', 2, (c) => {
    const n = noise(c, 2), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(7000, 1.9);
    const g = c.createGain(); g.gain.setValueAtTime(0.05, 0); g.gain.linearRampToValueAtTime(0.8, 1.9); g.gain.linearRampToValueAtTime(0, 2);
    n.connect(f).connect(g).connect(c.destination); n.start();
  }],
];

export const STARTER = DEFS.map(([id, name, cat]) => ({ id: 'builtin:' + id, name, cat }));

export async function renderStarter() {
  const out = new Map();
  await Promise.all(DEFS.map(async ([id, , , dur, fn]) => {
    const c = new OfflineAudioContext(1, Math.ceil(dur * SR), SR);
    fn(c);
    out.set('builtin:' + id, await c.startRendering());
  }));
  return out;
}

// ---- Analyse ---------------------------------------------------------------
export function peaks(buf, n) {
  const d = buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / n)), out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    let lo = 0, hi = 0;
    for (let j = i * step, e = Math.min(d.length, j + step); j < e; j += 2) { const v = d[j]; if (v < lo) lo = v; if (v > hi) hi = v; }
    out[i * 2] = lo; out[i * 2 + 1] = hi;
  }
  return out;
}

export function trimStart(buf, thr = 0.02) {
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > thr) return Math.max(0, i - 0.003 * buf.sampleRate) / d.length;
  return 0;
}

// Liefert Slice-Grenzen als Fraktionen [0..1], Länge count+1.
export function chopPoints(buf, count = 16, mode = 'equal') {
  const pts = [0];
  if (mode === 'equal') {
    for (let i = 1; i < count; i++) pts.push(i / count);
    pts.push(1);
    return pts;
  }
  const d = buf.getChannelData(0), hop = 512, n = Math.floor(d.length / hop);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < hop; j += 2) s += d[i * hop + j] ** 2; e[i] = Math.sqrt(s / (hop / 2)); }
  const flux = new Float32Array(n);
  for (let i = 1; i < n; i++) flux[i] = Math.max(0, e[i] - e[i - 1] * 1.05);
  const minGap = Math.max(2, Math.floor(0.12 * buf.sampleRate / hop));
  const cand = [];
  for (let i = 2; i < n - 2; i++) if (flux[i] > flux[i - 1] && flux[i] >= flux[i + 1] && flux[i] > 0) cand.push(i);
  cand.sort((a, b) => flux[b] - flux[a]);
  const chosen = [];
  for (const i of cand) {
    if (chosen.length >= count - 1) break;
    if (chosen.every((j) => Math.abs(j - i) >= minGap)) chosen.push(i);
  }
  if (chosen.length < count - 1) return chopPoints(buf, count, 'equal');
  chosen.sort((a, b) => a - b);
  chosen.forEach((i) => pts.push(Math.max(0, (i * hop - 0.004 * buf.sampleRate) / d.length)));
  pts.push(1);
  return pts;
}

// ---- Projekt-Defaults -----------------------------------------------------
export const COLORS = ['#2ea8ff', '#ff4d6d', '#35e0a1', '#b57bff', '#ff9f43', '#e8e8e8'];

export const newPad = (o = {}) => ({ name: '', color: 0, sound: null, start: 0, end: 1, pitch: 0, gain: 1, mode: 'oneshot', choke: 0, ...o });

export function defaultProject() {
  const B = (id) => 'builtin:' + id;
  const A = [
    ['kick', 'Kick'], ['snare', 'Snare'], ['clap', 'Clap'], ['hat', 'Hat'],
    ['kick808', '808 Kick'], ['rim', 'Rim'], ['hatopen', 'Open Hat', 3], ['tom', 'Tom'],
    ['cowbell', 'Cowbell'], ['shaker', 'Shaker'], ['bass808', '808 -5', 0, -5], ['bass808', '808', 0, 0],
    ['vinyl', 'Vinyl', 0, 0, 'loop'], ['riser', 'Riser'], ['bass808', '808 +3', 0, 3], ['bass808', '808 +7', 0, 7],
  ].map(([s, name, choke = 0, pitch = 0, mode = 'oneshot']) => newPad({ name, sound: B(s), choke, pitch, mode, color: s.startsWith('bass') || s === 'kick808' ? 1 : 0 }));
  A[3].choke = 3; A[6].choke = 3;
  const keyP = [-5, -3, -2, 0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20];
  const K = keyP.map((p) => newPad({ name: 'Keys ' + (p >= 0 ? '+' : '') + p, sound: B('stab'), pitch: p, color: 4 }));
  const ch = [5, 7, 8, 10, 12, 14, 15, 17];
  const C = [
    ...ch.map((p) => newPad({ name: 'Chipmunk +' + p, sound: B('ooh'), pitch: p, color: 3 })),
    ...ch.map((p) => newPad({ name: 'Strings ' + (p - 5), sound: B('strings'), pitch: p - 5, color: 2 })),
  ];
  return {
    name: 'Neues Projekt', bpm: 90, bars: 1, quantize: true, master: 0.9,
    banks: [A, K, C, Array.from({ length: 16 }, () => newPad())],
    pattern: [],
    vocal: { sound: null, name: '', bpm: 90, match: true, nudge: 0, offset: 0, gain: 1, mute: false, loop: false },
  };
}
