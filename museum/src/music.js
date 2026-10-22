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

/* Kleine abgerundete Musik-Box: Zurück · Play/Pause · Weiter · Titel/Fortschritt · Lautstärke */
export class MusicPlayer {
  constructor() {
    this.root = $('#music');
    this.tracks = MUSIC;
    this.i = 0;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* iOS: Ton trotz Stumm-Schalter */ }
    this.started = false;
    let vol = 0.55;
    try { const v = parseFloat(localStorage.getItem('museum-vol')); if (!Number.isNaN(v)) vol = v; } catch { /* ignore */ }
    this.audio.volume = vol;
    if (!this.tracks.length) { this.root.hidden = true; return; }

    this.root.innerHTML = `
      <button id="m-prev" type="button">${ICON.prev}</button>
      <button id="m-play" type="button" class="main">${ICON.play}</button>
      <button id="m-next" type="button">${ICON.next}</button>
      <div class="m-info" id="m-info"><span id="m-title"></span><span id="m-artist"></span><div class="m-bar" id="m-bar"><i id="m-prog"></i></div></div>
      <label class="m-vol">${ICON.vol}<input id="m-vol" type="range" min="0" max="1" step="0.01" value="${vol}"></label>`;
    this.$ = { prev: $('#m-prev'), play: $('#m-play'), next: $('#m-next'), title: $('#m-title'), artist: $('#m-artist'), prog: $('#m-prog'), bar: $('#m-bar'), vol: $('#m-vol') };
    this.$.prev.addEventListener('click', () => this.go(-1));
    this.$.next.addEventListener('click', () => this.go(1));
    this.$.play.addEventListener('click', () => (this.audio.paused ? this.play() : this.audio.pause()));
    this.$.vol.addEventListener('input', () => {
      this.audio.volume = +this.$.vol.value;
      try { localStorage.setItem('museum-vol', String(this.audio.volume)); } catch { /* ignore */ }
    });
    this.$.bar.addEventListener('click', (e) => {
      const r = this.$.bar.getBoundingClientRect();
      if (this.audio.duration) this.audio.currentTime = ((e.clientX - r.left) / r.width) * this.audio.duration;
    });
    this.audio.addEventListener('ended', () => this.go(1));
    this.audio.addEventListener('play', () => this.sync());
    this.audio.addEventListener('pause', () => this.sync());
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.duration) this.$.prog.style.transform = `scaleX(${this.audio.currentTime / this.audio.duration})`;
    });
    onLang(() => this.sync());
    this.load(0);
  }

  load(i) {
    this.i = (i + this.tracks.length) % this.tracks.length;
    const tr = this.tracks[this.i];
    this.audio.src = tr.url;
    this.$.title.textContent = tr.title;
    this.$.artist.textContent = tr.artist;
    this.$.prog.style.transform = 'scaleX(0)';
  }

  async go(d) {
    const was = !this.audio.paused || !this.started;
    this.load(this.i + d);
    if (was) await this.play();
  }

  async play() {
    try { await this.audio.play(); this.started = true; } catch { /* Autoplay blockiert → Nutzer drückt Play */ }
    this.sync();
  }

  sync() {
    if (!this.$) return;
    const playing = !this.audio.paused;
    this.$.play.innerHTML = playing ? ICON.pause : ICON.play;
    this.$.play.setAttribute('aria-label', t(playing ? 'pause' : 'play'));
    this.$.prev.setAttribute('aria-label', t('prev'));
    this.$.next.setAttribute('aria-label', t('next'));
    this.$.vol.setAttribute('aria-label', t('volume'));
  }

  /* Erst-Track vorladen (für den Loading Screen) */
  ready(timeout = 9000) {
    if (!this.tracks.length) return Promise.resolve();
    return new Promise((res) => {
      if (this.audio.readyState >= 3) return res();
      const done = () => res();
      this.audio.addEventListener('canplaythrough', done, { once: true });
      this.audio.addEventListener('error', done, { once: true });
      setTimeout(done, timeout);
      this.audio.load();
    });
  }

  show(v) { if (this.tracks.length) this.root.hidden = !v; }
}
