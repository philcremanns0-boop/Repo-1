// Audio-Engine: Voices, Sequencer (Lookahead-Scheduler), Metronom, Vocal-Layer.
// Pre-decodierte AudioBuffers + pointerdown-Trigger = minimale Latenz.

const LOOKAHEAD = 0.12;
const TICK_MS = 25;
const semi = (s) => Math.pow(2, s / 12);

export const buffers = new Map(); // soundId -> AudioBuffer

export const engine = {
  ctx: null,
  master: null,
  project: null, // wird von ui.js gesetzt
  voices: new Map(), // "bank:pad" -> Set(voice)
  chokes: new Map(), // group -> Set(voice)
  last: null, // letzte Voice (für LCD-Playhead)
  playing: false,
  rec: false,
  metro: false,
  t0: 0, // ctx-Zeit von Absolut-Step 0
  nextAbs: 0,
  timer: null,
  vocalSrc: null,
  onStep: null,
  onChange: null,
  onHit: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC({ latencyHint: 'interactive' });
    const c = this.ctx;
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -4;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.002;
    comp.release.value = 0.12;
    this.master.connect(comp).connect(c.destination);
    this.vocalGain = c.createGain();
    this.vocalGain.connect(this.master);
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.resume();
    });
  },

  // Muss in einer Nutzergeste aufgerufen werden (iOS).
  resume() {
    this.init();
    const c = this.ctx;
    if (c.state === 'running') return Promise.resolve();
    const p = c.resume();
    try { // stiller Impuls entsperrt iOS zuverlässig
      const s = c.createBufferSource();
      s.buffer = c.createBuffer(1, 1, c.sampleRate);
      s.connect(c.destination);
      s.start(0);
    } catch {}
    return p;
  },

  decode(arrayBuffer) {
    this.init();
    return new Promise((res, rej) => this.ctx.decodeAudioData(arrayBuffer, res, rej));
  },

  setMaster(v) { if (this.master) this.master.gain.value = v; },

  get stepDur() { return 60 / this.project.bpm / 4; },
  get loopSteps() { return this.project.bars * 16; },

  // Position im Loop in Steps (Float, absolut)
  absPos() { return (this.ctx.currentTime - this.t0) / this.stepDur; },
  loopPos() { const p = this.absPos(); const n = this.loopSteps; return ((p % n) + n) % n; },

  // ---- Pads -------------------------------------------------------------
  trigger(bank, idx, when = 0, opts = {}) {
    const pad = this.project.banks[bank][idx];
    const buf = pad && pad.sound && buffers.get(pad.sound);
    if (!buf) return null;
    const c = this.ctx;
    const t = Math.max(when, c.currentTime);
    const key = bank + ':' + idx;
    let set = this.voices.get(key);
    if (!set) this.voices.set(key, (set = new Set()));
    if (pad.choke) {
      let g = this.chokes.get(pad.choke);
      if (!g) this.chokes.set(pad.choke, (g = new Set()));
      for (const v of [...g]) this.stopVoice(v, t);
    }
    if (set.size >= 4) this.stopVoice(set.values().next().value, t);

    const rate = semi(pad.pitch || 0);
    const dur = buf.duration;
    const off = pad.start * dur;
    const len = Math.max(0.005, (pad.end - pad.start) * dur);
    const mode = opts.seq && pad.mode !== 'oneshot' ? 'oneshot' : pad.mode;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = c.createGain();
    const vol = (pad.gain ?? 1) * (opts.vel ?? 1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.002);
    src.connect(g).connect(this.master);
    const v = { src, g, key, pad, t, rate, off, len, dur, set, choke: pad.choke };
    if (mode === 'loop') {
      src.loop = true;
      src.loopStart = off;
      src.loopEnd = off + len;
      src.start(t, off);
    } else if (mode === 'hold') {
      src.start(t, off, len);
      v.hold = true;
    } else {
      src.start(t, off, len);
    }
    if (mode !== 'loop') {
      const endT = t + len / rate;
      g.gain.setValueAtTime(vol, Math.max(t + 0.003, endT - 0.006));
      g.gain.linearRampToValueAtTime(0, endT);
    }
    src.onended = () => {
      set.delete(v);
      if (v.choke) this.chokes.get(v.choke)?.delete(v);
      try { g.disconnect(); } catch {}
      if (this.onChange) this.onChange();
    };
    set.add(v);
    if (opts.seq) this.onHit?.(bank, idx, t);
    if (pad.choke) this.chokes.get(pad.choke).add(v);
    if (!opts.seq || t - c.currentTime < 0.05) this.last = v;
    return v;
  },

  release(v) { if (v && v.hold) this.stopVoice(v); },

  stopVoice(v, when = 0) {
    const c = this.ctx;
    const t = Math.max(when, c.currentTime);
    try {
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setTargetAtTime(0, t, 0.012);
      v.src.stop(t + 0.07);
    } catch {}
  },

  isPlayingPad(bank, idx) { return (this.voices.get(bank + ':' + idx)?.size || 0) > 0; },

  stopAll() {
    for (const set of this.voices.values()) for (const v of [...set]) this.stopVoice(v);
  },

  anyActive() {
    for (const s of this.voices.values()) if (s.size) return true;
    return this.playing;
  },

  // Sound ohne Pad vorhören
  preview(id, start = 0, end = 1, pitch = 0) {
    const buf = buffers.get(id);
    if (!buf) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = semi(pitch);
    src.connect(this.master);
    src.start(0, start * buf.duration, Math.max(0.01, (end - start) * buf.duration));
    this.previewSrc?.stop?.call(this.previewSrc, 0);
    this.previewSrc = src;
  },

  // ---- Transport / Sequencer ----------------------------------------------
  start() {
    if (this.playing) return;
    this.resume();
    const c = this.ctx;
    this.t0 = c.currentTime + 0.06;
    this.nextAbs = 0;
    this.playing = true;
    this.startVocal(this.t0);
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
    this.onChange?.();
  },

  stop() {
    if (!this.playing) { this.stopAll(); return; }
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.stopVocal();
    this.stopAll();
    this.onChange?.();
  },

  schedule() {
    const c = this.ctx;
    const horizon = c.currentTime + LOOKAHEAD;
    const n = this.loopSteps;
    const sd = this.stepDur;
    const pat = this.project.pattern;
    for (;;) {
      const abs = this.nextAbs;
      const tTick = this.t0 + abs * sd;
      if (tTick > horizon) break;
      const step = abs % n;
      if (this.metro && step % 4 === 0) this.click(tTick, step % 16 === 0);
      for (let i = 0; i < pat.length; i++) {
        const e = pat[i];
        if (Math.floor(e.s) !== step) continue;
        if (e.skip === abs) { e.skip = undefined; continue; }
        this.trigger(e.b, e.p, tTick + (e.s - step) * sd, { seq: true, vel: e.v ?? 1 });
      }
      this.nextAbs++;
    }
  },

  click(t, accent) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = accent ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.06);
  },

  setBpm(bpm) {
    bpm = Math.max(40, Math.min(240, Math.round(bpm)));
    if (this.playing) { // Position beibehalten
      const pos = this.absPos();
      this.project.bpm = bpm;
      this.t0 = this.ctx.currentTime - pos * this.stepDur;
      this.nextAbs = Math.ceil(pos);
      this.updateVocalRate();
    } else this.project.bpm = bpm;
    return bpm;
  },

  // Treffer live aufnehmen (quantisiert auf 1/16)
  recordHit(bank, idx, vel = 1) {
    if (!this.rec || !this.playing) return;
    const n = this.loopSteps;
    const pos = this.absPos();
    const q = this.project.quantize !== false;
    const absStep = q ? Math.round(pos) : Math.floor(pos);
    let s = q ? absStep % n : ((pos % n) + n) % n;
    const e = { s, b: bank, p: idx, v: vel, skip: absStep };
    this.project.pattern.push(e);
    this.onChange?.();
  },

  undoRecord() { this.project.pattern.pop(); },
  clearPattern() { this.project.pattern.length = 0; },

  // ---- Vocal-Layer --------------------------------------------------------
  vocalRate() {
    const v = this.project.vocal;
    return v.match && v.bpm ? this.project.bpm / v.bpm : 1;
  },

  startVocal(t) {
    this.stopVocal();
    const v = this.project.vocal;
    const buf = v.sound && buffers.get(v.sound);
    if (!buf || v.mute) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = this.vocalRate();
    src.loop = !!v.loop;
    this.vocalGain.gain.value = v.gain ?? 1;
    src.connect(this.vocalGain);
    const nudge = (v.nudge || 0) / 1000;
    const off = (v.offset || 0) + Math.max(0, -nudge) * src.playbackRate.value;
    src.start(t + Math.max(0, nudge), off);
    src.onended = () => { if (this.vocalSrc === src) this.vocalSrc = null; };
    this.vocalSrc = src;
  },

  stopVocal() {
    try { this.vocalSrc?.stop(); } catch {}
    this.vocalSrc = null;
  },

  updateVocalRate() {
    if (this.vocalSrc) this.vocalSrc.playbackRate.value = this.vocalRate();
  },

  // ---- Mikrofon -----------------------------------------------------------
  async record() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
    const mime = types.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.start();
    return {
      stop: () => new Promise((res) => {
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          res(new Blob(chunks, { type: mr.mimeType || mime || 'audio/mp4' }));
        };
        mr.stop();
      }),
      cancel: () => { try { mr.stop(); } catch {} stream.getTracks().forEach((t) => t.stop()); },
    };
  },
};
