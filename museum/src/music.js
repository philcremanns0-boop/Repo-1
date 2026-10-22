import { MUSIC } from './config.js';
import { t, onLang } from './i18n.js';

const $ = (s) => document.querySelector(s);
const ICON = {
  prev: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M16 5h2v14h-2zM4 5l10.5 7L4 19z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  vol: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
};

const XFADE = 4;      // Sekunden Überblendung am Songende
const XFADE_SKIP = 1.2; // Sekunden Überblendung beim Weiterklicken

/* Musik-Box mit zwei „Decks“: Songs werden am Ende ineinander überblendet.
   Lautstärke und Fades laufen über Web Audio (GainNodes) – das funktioniert auch auf iOS,
   wo audio.volume ignoriert wird. */
export class MusicPlayer {
  constructor() {
    this.root = $('#music');
    this.tracks = MUSIC;
    this.i = 0;
    this.volume = 0.55;
    this.playing = false;
    this.started = false;
    try { const v = parseFloat(localStorage.getItem('museum-vol')); if (!Number.isNaN(v)) this.volume = Math.min(1, Math.max(0, v)); } catch { /* privater Modus */ }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* iOS: Ton trotz Stumm-Schalter */ }
    if (!this.tracks.length) { this.root.hidden = true; return; }

    this.decks = [this._makeDeck(), this._makeDeck()];
    this.cur = 0;

    this.root.innerHTML = `
      <button id="m-prev" type="button">${ICON.prev}</button>
      <button id="m-play" type="button" class="main">${ICON.play}</button>
      <button id="m-next" type="button">${ICON.next}</button>
      <div class="m-info" id="m-info"><span id="m-title"></span><span id="m-artist"></span><div class="m-bar" id="m-bar"><i id="m-prog"></i></div></div>
      <label class="m-vol">${ICON.vol}<input id="m-vol" type="range" min="0" max="1" step="0.01" value="${this.volume}"></label>`;
    this.$ = { prev: $('#m-prev'), play: $('#m-play'), next: $('#m-next'), title: $('#m-title'), artist: $('#m-artist'), prog: $('#m-prog'), bar: $('#m-bar'), vol: $('#m-vol') };
    this.$.prev.addEventListener('click', () => this.go(-1));
    this.$.next.addEventListener('click', () => this.go(1));
    this.$.play.addEventListener('click', () => (this.playing ? this.pause() : this.play()));
    this.$.vol.addEventListener('input', () => {
      this.volume = +this.$.vol.value;
      this._applyVolume();
      try { localStorage.setItem('museum-vol', String(this.volume)); } catch { /* ignore */ }
    });
    this.$.bar.addEventListener('click', (e) => {
      const r = this.$.bar.getBoundingClientRect(), a = this.deck.el;
      if (a.duration) a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
    });
    onLang(() => this.sync());
    this._show(0);
    this.decks[0].el.src = this.tracks[0].url;
  }

  get deck() { return this.decks[this.cur]; }

  _makeDeck() {
    const el = new Audio();
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    const d = { el, gain: null, idx: -1, fading: false };
    el.addEventListener('timeupdate', () => this._tick(d));
    el.addEventListener('ended', () => { if (d === this.deck && this.playing) this._crossTo(this.i + 1, XFADE_SKIP); });
    return d;
  }

  /* Web Audio erst nach einer Nutzergeste anlegen */
  _ensureCtx() {
    if (this.ctx || this.ctxFailed) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();   // Nutzer-Lautstärke
      this.duckNode = this.ctx.createGain(); // Absenken (Exit)
      this.master.connect(this.duckNode); this.duckNode.connect(this.ctx.destination);
      for (const d of this.decks) {
        d.gain = this.ctx.createGain();
        d.gain.gain.value = d === this.deck ? 1 : 0;
        this.ctx.createMediaElementSource(d.el).connect(d.gain);
        d.gain.connect(this.master);
      }
      this._applyVolume();
    } catch (e) {
      console.warn('WebAudio unavailable, falling back to element volume', e);
      this.ctx = null; this.ctxFailed = true;
      this.decks.forEach((d) => { d.el.volume = this.volume; });
    }
  }

  _applyVolume() {
    if (this.ctx) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    else this.decks.forEach((d) => { d.el.volume = this.volume; });
  }

  _ramp(param, to, secs) {
    const now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(to, now + Math.max(0.02, secs));
  }

  _show(i) {
    this.i = (i + this.tracks.length) % this.tracks.length;
    const tr = this.tracks[this.i];
    this.$.title.textContent = tr.title;
    this.$.artist.textContent = tr.artist;
  }

  /* Am Songende rechtzeitig den nächsten einblenden */
  _tick(d) {
    if (d !== this.deck) return;
    const a = d.el;
    if (a.duration && this.$) this.$.prog.style.transform = `scaleX(${a.currentTime / a.duration})`;
    if (this.playing && !d.fading && this.tracks.length > 1 && a.duration && a.duration - a.currentTime < XFADE && a.duration > XFADE * 2) {
      this._crossTo(this.i + 1, XFADE);
    }
  }

  /* Blendet in `secs` Sekunden zum Song mit Index n über. */
  async _crossTo(n, secs) {
    const from = this.deck, to = this.decks[1 - this.cur];
    from.fading = true;
    this._show(n);
    to.el.src = this.tracks[this.i].url;
    to.el.currentTime = 0;
    if (this.ctx) to.gain.gain.value = 0;
    this.cur = 1 - this.cur;
    to.fading = false;
    try { await to.el.play(); } catch { /* Autoplay-Sperre → bleibt still bis Play */ }
    if (this.ctx) {
      this._ramp(to.gain.gain, 1, secs);
      this._ramp(from.gain.gain, 0, secs);
    } else {
      const t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / (secs * 1000));
        to.el.volume = this.volume * k; from.el.volume = this.volume * (1 - k);
        if (k < 1) requestAnimationFrame(step);
      };
      step();
    }
    setTimeout(() => { if (from !== this.deck) { from.el.pause(); from.fading = false; } }, secs * 1000 + 120);
    this.sync();
  }

  async go(d) {
    if (this.playing) return this._crossTo(this.i + d, XFADE_SKIP);
    this._show(this.i + d);
    this.deck.el.src = this.tracks[this.i].url;
    this.$.prog.style.transform = 'scaleX(0)';
  }

  async play() {
    if (!this.tracks.length) return;
    this._ensureCtx();
    try { if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume(); } catch { /* ignore */ }
    try {
      await this.deck.el.play();
      this.playing = true; this.started = true;
      if (this.ctx) this.deck.gain.gain.value = 1;
    } catch { this.playing = false; }
    this.sync();
  }

  pause() {
    this.playing = false;
    this.decks.forEach((d) => d.el.pause());
    this.sync();
  }

  /* Lautstärke temporär absenken (z. B. beim Exit) und wieder anheben. */
  duck(level, secs = 2) {
    if (!this.ctx) return;
    this._ramp(this.duckNode.gain, level, secs);
  }

  sync() {
    if (!this.$) return;
    this.$.play.innerHTML = this.playing ? ICON.pause : ICON.play;
    this.$.play.setAttribute('aria-label', t(this.playing ? 'pause' : 'play'));
    this.$.prev.setAttribute('aria-label', t('prev'));
    this.$.next.setAttribute('aria-label', t('next'));
    this.$.vol.setAttribute('aria-label', t('volume'));
  }

  /* Erst-Track vorladen (für den Loading Screen) */
  ready(timeout = 9000) {
    if (!this.tracks.length) return Promise.resolve();
    return new Promise((res) => {
      const a = this.decks[0].el;
      if (a.readyState >= 3) return res();
      const done = () => res();
      a.addEventListener('canplaythrough', done, { once: true });
      a.addEventListener('error', done, { once: true });
      setTimeout(done, timeout);
      a.load();
    });
  }

  show(v) { if (this.tracks.length) this.root.hidden = !v; }
}
