import { CONFIG } from './config.js';
import { t, getLang } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initTexts() {
  document.documentElement.lang = getLang() === 'es' ? 'es-CL' : 'en';
  $$('#lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  document.title = CONFIG.title;
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $$('[data-ph]').forEach((el) => { el.placeholder = t(el.dataset.ph); });
  $$('[data-title]').forEach((el) => { el.textContent = CONFIG.title; });
  $$('[data-from]').forEach((el) => { el.textContent = CONFIG.from; });
  $$('[data-to]').forEach((el) => { el.textContent = CONFIG.to; });
}

const barFill = $('#bar-fill'), barPct = $('#bar-pct');
export function setProgress(p) {
  barFill.style.transform = `scaleX(${p})`;
  barPct.textContent = `${Math.round(p * 100)}%`;
}

export function show(id) { const el = $(id); el.hidden = false; requestAnimationFrame(() => el.classList.remove('out')); }
export function hideScreen(id) {
  const el = $(id); el.classList.add('out');
  setTimeout(() => { el.hidden = true; }, 950);
}

let toastTimer;
export function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

/* Interaktions-Prompt, der neben der Figur schwebt */
const promptEl = $('#prompt'), pKey = $('#prompt-key'), pLabel = $('#prompt-label');
let lastP = '', px = -1, py = -1;
export function setPrompt(p, sx, sy) {
  if (!p) { if (!promptEl.hidden) promptEl.hidden = true; lastP = ''; return; }
  const sig = p.key + p.label;
  if (sig !== lastP) { pKey.textContent = p.key; pLabel.textContent = p.label; lastP = sig; }
  if (promptEl.hidden) promptEl.hidden = false;
  if (Math.abs(sx - px) > 0.4 || Math.abs(sy - py) > 0.4) {
    px = sx; py = sy;
    promptEl.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px)`;
  }
}

export function setRoom(code, count) {
  const pill = $('#roompill');
  if (!code) { pill.hidden = true; return; }
  pill.hidden = false;
  $('#room-text').innerHTML = `${t('room')} <b>${code}</b> · ${count} ${t('online')}`;
}
export function onCopy(fn) {
  const b = $('#room-copy');
  b.addEventListener('click', async () => {
    const ok = await fn();
    if (ok) { b.textContent = t('copied'); setTimeout(() => (b.textContent = t('copy')), 1400); }
  });
}
