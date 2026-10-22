import './style.css';
import * as THREE from 'three';
import { CONFIG, PHOTO_URLS, VIDEO_URL } from './config.js';
import { t } from './i18n.js';
import * as UI from './ui.js';
import * as T from './textures.js';
import { buildWorld } from './world.js';
import { Actor } from './actors.js';
import { CameraRig, LocalPlayer } from './player.js';
import { Input } from './input.js';
import { Net, cleanCode } from './net.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#gl');
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const DEBUG = new URLSearchParams(location.search).has('debug');

UI.initTexts();

/* ═════════════ Renderer (früh anlegen, kostet nichts) ═════════════ */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
T.setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.08, 90);
const DPR_MAX = Math.min(devicePixelRatio || 1, 2);
let dpr = DPR_MAX;
function resize() {
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 0.8 ? 68 : 58;   // Hochformat: weiter
  camera.updateProjectionMatrix();
}
resize();
addEventListener('resize', resize);

/* ═════════════ Assets vorladen (startet sofort beim Seitenaufruf) ═════════════ */
const prog = { assets: 0, build: 0, gpu: 0 };
const realProgress = () => prog.assets * 0.5 + prog.build * 0.12 + prog.gpu * 0.38;

async function decodePhoto(url) {
  const MAX = 1600;
  const blob = await (await fetch(url)).blob();
  let src, w, h;
  try {
    src = await createImageBitmap(blob);
    w = src.width; h = src.height;
  } catch {
    src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(blob); });
    w = src.naturalWidth; h = src.naturalHeight;
  }
  const s = Math.min(1, MAX / Math.max(w, h));
  const cw = Math.max(2, Math.round(w * s)), ch = Math.max(2, Math.round(h * s));
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, cw, ch);
  if (src.close) src.close();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return { texture: tex, aspect: cw / ch };
}

async function loadVideo(url) {
  const v = document.createElement('video');
  v.src = url; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  await new Promise((res) => {
    const done = () => res();
    v.addEventListener('loadeddata', done, { once: true });
    v.addEventListener('error', done, { once: true });
    setTimeout(done, 9000);
    v.load();
  });
  if (v.readyState < 2) return null;
  const tex = new THREE.VideoTexture(v);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  return { texture: tex, video: v, draw: null };
}

const assetsPromise = (async () => {
  const fontJobs = [
    '400 40px "Instrument Serif"', 'italic 400 40px "Instrument Serif"',
    '500 14px "Inter Variable"', '600 14px "Inter Variable"',
  ].map((f) => document.fonts.load(f).catch(() => {}));
  await Promise.all(fontJobs);
  prog.assets = 0.08;

  const photos = [];
  if (PHOTO_URLS.length) {
    let done = 0;
    const queue = PHOTO_URLS.map((u, i) => [u, i]);
    const results = new Array(PHOTO_URLS.length);
    const worker = async () => {
      while (queue.length) {
        const [u, i] = queue.shift();
        try { results[i] = await decodePhoto(u); } catch (e) { console.warn('photo failed', u, e); }
        done++; prog.assets = 0.08 + 0.72 * (done / PHOTO_URLS.length);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    results.filter(Boolean).forEach((r) => photos.push(r));
  }
  if (!photos.length) {
    for (let i = 0; i < 6; i++) { const tx = T.placeholderPhoto(i); photos.push({ texture: tx, aspect: tx.userData.aspect }); }
  }
  prog.assets = 0.82;

  let screen = null;
  if (VIDEO_URL) screen = await loadVideo(VIDEO_URL);
  if (!screen) { const sc = T.createScreenCanvas(); screen = { texture: sc.texture, draw: sc.draw, video: null }; }
  prog.assets = 1;
  return { photos, screen };
})();

/* ═════════════ Spielzustand ═════════════ */
let net = null;
let started = false, ready = false;
let world, rig, local, input;
const remotes = new Map();   // id → Actor
let mySettings = { name: '', look: 'boy' };

/* ═════════════ Lobby ═════════════ */
const nameInput = $('#name'), codeInput = $('#code'), status = $('#multi-status');
let look = 'boy';
const lookBtns = [...document.querySelectorAll('.look')];
const defaultName = () => (look === 'boy' ? CONFIG.from : CONFIG.to);
function setLook(l, prefill = true) {
  look = l;
  lookBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.look === l)));
  if (prefill && (!nameInput.value || nameInput.dataset.auto === '1')) { nameInput.value = defaultName(); nameInput.dataset.auto = '1'; }
}
nameInput.addEventListener('input', () => { nameInput.dataset.auto = '0'; });
lookBtns.forEach((b) => b.addEventListener('click', () => setLook(b.dataset.look)));
setLook('boy');

const readName = () => (nameInput.value.trim().slice(0, 16) || defaultName());
const showMain = () => { $('#panel-main').hidden = false; $('#panel-multi').hidden = true; status.textContent = ''; };
const showMulti = () => { $('#panel-main').hidden = true; $('#panel-multi').hidden = false; status.textContent = ''; };

$('#btn-multi').addEventListener('click', () => { showMulti(); if (!codeInput.value) codeInput.focus(); });
$('#btn-back').addEventListener('click', showMain);
codeInput.addEventListener('input', () => { codeInput.value = cleanCode(codeInput.value); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-single').click(); });
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-join').click(); });

const busy = (b) => document.querySelectorAll('#start .btn').forEach((x) => { x.disabled = b; });

$('#btn-single').addEventListener('click', () => begin('single'));
$('#btn-create').addEventListener('click', () => begin('host'));
$('#btn-join').addEventListener('click', () => begin('join'));

// Einladungslink  ?room=ABCDE
{
  const room = cleanCode(new URLSearchParams(location.search).get('room'));
  if (room.length === 5) { codeInput.value = room; showMulti(); setLook('girl'); }
}

async function begin(mode) {
  if (started) return;
  mySettings = { name: readName(), look };
  busy(true);
  try {
    if (mode === 'host' || mode === 'join') {
      status.textContent = mode === 'host' ? t('creating') : t('connecting');
      net = new Net();
      if (mode === 'host') await net.host(mySettings);
      else {
        const code = cleanCode(codeInput.value);
        if (code.length !== 5) { status.textContent = t('badCode'); busy(false); return; }
        await net.join(code, mySettings);
      }
    }
  } catch (e) {
    console.warn('net', e);
    if (net) { net.close(); net = null; }
    const type = e && e.type;
    status.textContent = type === 'peer-unavailable' ? t('notFound') : type === 'full' ? t('full') : t('netError');
    busy(false);
    return;
  }
  started = true;
  UI.hideScreen('#start');
  UI.show('#loading');
  await boot(mode);
}

/* ═════════════ Bootstrap: laden, bauen, GPU aufwärmen ═════════════ */
async function boot(mode) {
  const t0 = performance.now();
  let finished = false;
  UI.setProgress(0);

  // Balken: echter Fortschritt, aber mindestens CONFIG.minLoadingMs lang sichtbar
  const barDone = new Promise((resolve) => {
    let shown = 0, last = t0;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const elapsed = now - t0;
      const timeP = Math.min(1, elapsed / CONFIG.minLoadingMs);
      const target = finished ? timeP : Math.min(realProgress(), timeP, 0.96);
      shown += (target - shown) * (1 - Math.exp(-6 * dt));
      if (finished && timeP >= 1 && shown > 0.995) shown = 1;
      UI.setProgress(shown);
      if (shown >= 1) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const { photos, screen } = await assetsPromise;

  // Welt bauen
  await nextFrame();
  world = buildWorld({ photos, screen });
  world.screenSource = screen;
  prog.build = 0.5;
  input = new Input(canvas);
  rig = new CameraRig(camera);
  if (input.touch) $('#touch').hidden = false;

  const me = new Actor(world.scene, { id: net ? net.myId : 'me', name: mySettings.name, look: mySettings.look });
  me.frames = world.frames;
  local = new LocalPlayer(me, world, input, rig);
  local.setOthers(() => [...remotes.values()]);
  // spielerspezifischer Spawn
  const idx = net ? Math.max(0, [...net.players.keys()].indexOf(net.myId)) : 0;
  local.spawn(idx);
  me.update(0.016);
  rig.update(0.016, input, me, world.colliders, 'free', null);
  prog.build = 1;

  // Zweiten Look ebenfalls instanziieren (Shader/Geometrien warm), dann wieder entfernen
  const tmp = new Actor(world.scene, { id: 'tmp', name: '…', look: mySettings.look === 'boy' ? 'girl' : 'boy' });
  tmp.pos.set(me.pos.x + 0.6, 0, me.pos.z); tmp.update(0.016);
  tmp.bubble.say('♥'); tmp.bubble.update(0.1);

  // GPU: alle Texturen hochladen (verteilt auf Frames, damit der Balken weiterläuft)
  const texs = [...world.textures, ...photos.map((p) => p.texture), screen.texture];
  world.scene.traverse((o) => {
    const m = o.material; if (m && m.map && !texs.includes(m.map)) texs.push(m.map);
  });
  let n = 0;
  for (const tx of texs) {
    renderer.initTexture(tx);
    if (++n % 3 === 0) { prog.gpu = (n / texs.length) * 0.6; await nextFrame(); }
  }
  prog.gpu = 0.6;
  try { await renderer.compileAsync(world.scene, camera); } catch { renderer.compile(world.scene, camera); }
  prog.gpu = 0.8;
  for (let i = 0; i < 4; i++) { renderer.render(world.scene, camera); await nextFrame(); }
  tmp.dispose();
  prog.gpu = 1;

  if (screen.video) { try { await screen.video.play(); } catch { /* wird bei erster Interaktion gestartet */ } }

  // Multiplayer verdrahten
  if (net) wireNet();
  syncRemotes();
  UI.setRoom(net ? net.code : null, net ? net.count : 1);

  finished = true;
  await barDone;
  await new Promise((r) => setTimeout(r, 250));

  // Los geht's
  enterWorld();
  UI.hideScreen('#loading');
}

/* ═════════════ Multiplayer ═════════════ */
function wireNet() {
  net.on('join', (p) => { syncRemotes(); UI.toast(t('joined', p.name)); UI.setRoom(net.code, net.count); });
  net.on('leave', (id) => {
    const a = remotes.get(id);
    if (a) UI.toast(t('left', a.name));
    syncRemotes(); UI.setRoom(net.code, net.count);
  });
  net.on('state', (m) => {
    const a = remotes.get(m.id);
    if (!a) return;
    a.applyState(m, !a.gotState);
    a.gotState = true;
  });
  net.on('chat', (m) => {
    const a = remotes.get(m.id);
    if (a) a.say(String(m.text).slice(0, 140));
  });
  net.on('hostLeft', () => { UI.toast(t('hostLeft'), 5000); setTimeout(() => leave(), 2400); });
  UI.onCopy(async () => {
    const url = `${location.origin}${location.pathname}?room=${net.code}`;
    try { await navigator.clipboard.writeText(url); return true; } catch { prompt(t('shareText'), url); return false; }
  });
}

function syncRemotes() {
  if (!net || !world) return;
  for (const [id, p] of net.players) {
    if (id === net.myId || remotes.has(id)) continue;
    const a = new Actor(world.scene, { id, name: p.name, look: p.look });
    a.remote = true; a.frames = world.frames;
    const [x, z] = world.spawns[remotes.size + 1] || world.spawns[0];
    a.pos.set(x, 0, z); a.tPos.copy(a.pos); a.heading = a.tHeading = Math.PI;
    remotes.set(id, a);
  }
  for (const [id, a] of remotes) {
    if (!net.players.has(id)) { a.dispose(); remotes.delete(id); }
  }
}

/* ═════════════ Spiel starten ═════════════ */
let last = 0, netT = 0, netKeep = 0, lastSnap = '';
let ema = 16.7, okFrames = 0, badFrames = 0;
const proj = new THREE.Vector3();

function enterWorld() {
  ready = true;
  $('#hud').hidden = false;
  $('#hints').textContent = input.touch ? t('hintsTouch') : t('hintsDesktop');
  setTimeout(() => $('#hints').classList.add('fade'), 14000);
  last = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  local.update(dt);
  for (const a of remotes.values()) a.update(dt);
  local.actor.update(dt);
  local.actor.avatar.root.visible = local.state !== 'viewing';
  world.update(now / 1000);
  tickScreen(now);

  // Netz: ~15 Hz
  if (net && net.count > 1) {
    netT += dt; netKeep += dt;
    if (netT >= 0.066) {
      netT = 0;
      const s = local.snapshot(), sig = `${s.x}|${s.y}|${s.z}|${s.h}|${s.a}|${s.v}|${s.s}`;
      if (sig !== lastSnap || netKeep > 1) { lastSnap = sig; netKeep = 0; net.sendState(s); }
    }
  }

  // Prompt neben der Figur
  const p = local.actor.pos;
  proj.set(p.x, p.y + 1.15, p.z).project(camera);
  const sx = (proj.x * 0.5 + 0.5) * innerWidth + 46, sy = (-proj.y * 0.5 + 0.5) * innerHeight - 14;
  const pr = chatOpen ? null : local.prompt;
  UI.setPrompt(pr, sx, sy);
  if (input.touch) { const b = $('#t-act'); b.hidden = !local.prompt; if (local.prompt) b.textContent = local.prompt.label; }

  renderer.render(world.scene, camera);
  input.endFrame();
  adapt(dt * 1000);
}

/* Der Wand-Screen läuft mit ~15 fps (Video-Texturen aktualisieren sich selbst). */
let screenAcc = 0;
function tickScreen(now) {
  if (!world) return;
  const sc = world.screenSource;
  if (!sc || !sc.draw) return;
  if (now - screenAcc > 66) { screenAcc = now; sc.draw(now / 1000); }
}

/* Adaptive Auflösung: hält das Spiel flüssig auch auf schwachen Geräten. */
function adapt(ms) {
  ema += (ms - ema) * 0.08;
  if (ema > 21) { badFrames++; okFrames = 0; } else if (ema < 13.5) { okFrames++; badFrames = 0; } else { okFrames = 0; badFrames = Math.max(0, badFrames - 1); }
  if (badFrames > 50 && dpr > 0.8) { dpr = Math.max(0.8, dpr - 0.25); badFrames = 0; resize(); }
  else if (okFrames > 400 && dpr < DPR_MAX) { dpr = Math.min(DPR_MAX, dpr + 0.25); okFrames = 0; resize(); }
}

/* ═════════════ Chat, Touch, Verlassen ═════════════ */
const chatForm = $('#chat'), chatInput = $('#chat-input');
let chatOpen = false;
function openChat() {
  if (!input) return;
  chatOpen = true; chatForm.hidden = false; input.enabled = false; chatInput.value = '';
  chatInput.focus();
}
function closeChat() {
  chatOpen = false; chatForm.hidden = true; input.enabled = true; chatInput.blur();
}
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim().slice(0, 140);
  closeChat();
  if (!text) return;
  local.actor.say(text);
  if (net) net.sendChat(text);
});
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChat(); e.stopPropagation(); });
addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && ready && !chatOpen && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { e.preventDefault(); openChat(); }
});
$('#t-chat').addEventListener('click', () => (chatOpen ? closeChat() : openChat()));
$('#t-dance').addEventListener('click', () => input.pressed.add('g'));
$('#t-act').addEventListener('click', () => local.interactTouch());

function leave() {
  if (net) net.close();
  location.href = location.pathname;
}
$('#btn-leave').addEventListener('click', leave);
addEventListener('pagehide', () => { if (net) net.close(); });

if (DEBUG) window.__museum = { get world() { return world; }, get local() { return local; }, get rig() { return rig; }, remotes, get net() { return net; }, renderer, camera, THREE };
