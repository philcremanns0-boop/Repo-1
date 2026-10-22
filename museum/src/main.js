import './style.css';
import * as THREE from 'three';
import { CONFIG, PHOTO_URLS, VIDEO_URL, BOOKS, fmtCoords, mapUrl } from './config.js';
import { t, pick, getLang, setLang, onLang } from './i18n.js';
import { guessLook } from './gender.js';
import { CHARACTERS } from './avatar.js';
import { MusicPlayer } from './music.js';
import * as UI from './ui.js';
import * as T from './textures.js';
import { buildWorld } from './world.js';
import { Actor } from './actors.js';
import { CameraRig, LocalPlayer, EMOTE_KEYS } from './player.js';
import { Input } from './input.js';
import { Net, cleanCode, warmIce } from './net.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#gl');
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const DEBUG = new URLSearchParams(location.search).has('debug');

UI.initIcons();
UI.initTexts();

/* ═════════════ Renderer (früh anlegen, kostet nichts) ═════════════ */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
// Bei WebGL-Kontextverlust (iOS unter Speicherdruck) lädt die Seite sauber neu
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setTimeout(() => location.reload(), 300); });

/* ═════════════ Assets vorladen (startet sofort beim Seitenaufruf) ═════════════ */
const prog = { assets: 0, build: 0, gpu: 0 };
const realProgress = () => prog.assets * 0.5 + prog.build * 0.12 + prog.gpu * 0.38;

async function fetchRetry(url, tries = 3) {
  for (let i = 0; ; i++) {
    try { const r = await fetch(url); if (r.ok) return r; throw new Error(`HTTP ${r.status}`); }
    catch (e) { if (i >= tries - 1) throw e; await new Promise((res) => setTimeout(res, 400 * (i + 1))); }
  }
}

async function decodePhoto(url, MAX = 1280) {
  const blob = await (await fetchRetry(url)).blob();
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
  // Nach dem GPU-Upload den CPU-Pixelpuffer freigeben (spart auf iPhone/iPad viel Arbeitsspeicher)
  tex.onUpdate = () => { tex.onUpdate = null; c.width = c.height = 1; };
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
  tex.userData = { aspect: v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9 };
  return { texture: tex, video: v, draw: null };
}

const music = new MusicPlayer();

const assetsPromise = (async () => {
  const fontJobs = [
    '400 40px "EB Garamond"', 'italic 400 40px "EB Garamond"', '500 40px "EB Garamond"',
  ].map((f) => document.fonts.load(f).catch(() => {}));
  await Promise.all(fontJobs);
  prog.assets = 0.05;

  // Fotos je Bereich laden (fehlt ein Bereich → schlichte Platzhalter)
  const jobs = [];
  for (const [sec, urls] of Object.entries(PHOTO_URLS)) urls.forEach((u, i) => jobs.push({ sec, u, i }));
  const results = { hero: [], us: [], moments: [], flowers: [] };
  const MAXPX = { hero: 1400, us: 1200, moments: 1280, flowers: 900 };
  let done = 0;
  const queue = jobs.slice();
  const worker = async () => {
    while (queue.length) {
      const j = queue.shift();
      try { results[j.sec][j.i] = await decodePhoto(j.u, MAXPX[j.sec]); } catch (e) { console.warn('photo failed', j.u, e); }
      done++; prog.assets = 0.05 + 0.65 * (done / jobs.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const photos = {};
  const need = { hero: 1, us: 7, moments: 12, flowers: 22 };
  for (const sec of Object.keys(need)) {
    photos[sec] = results[sec].filter(Boolean);
    if (!photos[sec].length) {
      for (let i = 0; i < need[sec]; i++) { const tx = T.emptyPhoto(i); photos[sec].push({ texture: tx, aspect: tx.userData.aspect }); }
    }
  }
  prog.assets = 0.72;

  let screen = null;
  if (VIDEO_URL) screen = await loadVideo(VIDEO_URL);
  if (!screen) { const sc = T.createScreenCanvas(); screen = { texture: sc.texture, draw: sc.draw, video: null }; }
  prog.assets = 0.85;
  await music.ready();
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
let look = 'boy', manualLook = false;
const charName = $('#char-name');
const paintLook = () => { charName.textContent = CHARACTERS[look]; };
const autoLook = () => { if (!manualLook) { look = nameInput.value.trim() ? guessLook(nameInput.value) : 'boy'; paintLook(); } };
nameInput.addEventListener('input', autoLook);
$('#char-switch').addEventListener('click', () => { manualLook = true; look = look === 'boy' ? 'girl' : 'boy'; paintLook(); });
paintLook();

const readName = () => nameInput.value.trim().slice(0, 16) || CHARACTERS[look];
const showMain = () => { $('#panel-main').hidden = false; $('#panel-multi').hidden = true; status.textContent = ''; };
const showMulti = () => { $('#panel-main').hidden = true; $('#panel-multi').hidden = false; status.textContent = ''; };

$('#btn-multi').addEventListener('click', () => { warmIce(); showMulti(); if (!codeInput.value) codeInput.focus(); });
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
  if (room.length === 5) { codeInput.value = room; showMulti(); }
}

/* ═════════════ Zugangscode (einfache Hürde, kein echter Schutz – siehe README) ═════════════ */
{
  const gate = $('#gate'), form = $('#gate-form'), inp = $('#gate-input'), msg = $('#gate-msg');
  const KEY = 'museum-unlocked';
  let ok = !CONFIG.password;
  try { if (localStorage.getItem(KEY) === CONFIG.password) ok = true; } catch { /* privater Modus */ }
  if (ok) gate.remove();
  else {
    gate.hidden = false;
    if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => inp.focus(), 50);
    const check = () => {
      if (inp.value === CONFIG.password) {
        try { localStorage.setItem(KEY, CONFIG.password); } catch { /* ignore */ }
        msg.textContent = '';
        inp.blur();
        UI.hideScreen('#gate');
        setTimeout(() => gate.remove(), 1000);
        warmIce();
      } else {
        msg.textContent = t('gateWrong');
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        inp.value = '';
      }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); check(); });
    inp.addEventListener('input', () => { msg.textContent = ''; if (inp.value.length >= CONFIG.password.length) check(); });
  }
}

/* ═════════════ App-Installation & Offline-Cache ═════════════ */
{
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  let deferred = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; if (!standalone) $('#btn-install').hidden = false; });
  $('#btn-install').addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    deferred = null; $('#btn-install').hidden = true;
  });
  addEventListener('appinstalled', () => { $('#btn-install').hidden = true; });
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !standalone) $('#ios-hint').hidden = false;
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}

// Sprache
document.querySelectorAll('#lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
onLang(() => {
  UI.initTexts();
  if (world) { world.relocalize(); refreshHints(); UI.setRoom(net ? net.code : null, net ? net.count : 1); }
  if (reading) openReader(reading);
});

async function begin(mode) {
  if (started) return;
  mySettings = { name: readName(), look };
  busy(true);
  music.play();                       // Klick = Nutzergeste → Musik darf starten
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
    status.textContent = type === 'peer-unavailable' ? t('notFound') : type === 'full' ? t('full') : type === 'no-direct' ? t('noDirect') : t('netError');
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
  world = buildWorld({ photos, screen, books: BOOKS });
  world.screenSource = screen;
  prog.build = 0.5;
  input = new Input(canvas);
  rig = new CameraRig(camera);
  rig.bounds = world.bounds;
  if (input.touch) { $('#touch').hidden = false; document.body.classList.add('touch'); }
  if (net) document.body.classList.add('mp');

  const me = new Actor(world.scene, { id: net ? net.myId : 'me', name: mySettings.name, look: mySettings.look });
  me.views = world.views;
  local = new LocalPlayer(me, world, input, rig);
  local.setOthers(() => [...remotes.values()]);
  local.onRead = openReader; local.onCloseRead = closeReader;
  // spielerspezifischer Spawn
  const idx = net ? Math.max(0, [...net.players.keys()].indexOf(net.myId)) : 0;
  local.spawn(idx);
  me.update(0.016);
  rig.update(0.016, input, me, world.colliders, 'free', null);
  prog.build = 1;

  // Zweiten Look ebenfalls instanziieren (Shader/Geometrien warm), dann wieder entfernen
  const tmp = new Actor(world.scene, { id: 'tmp', name: '…', look: mySettings.look === 'boy' ? 'girl' : 'boy' });
  tmp.pos.set(me.pos.x + 0.6, 0, me.pos.z); tmp.update(0.016);
  tmp.bubble.say('Hi'); tmp.bubble.update(0.1);

  // GPU: alle Texturen hochladen (verteilt auf Frames, damit der Balken weiterläuft)
  const texs = [...world.textures, ...Object.values(photos).flat().map((p) => p.texture), screen.texture];
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
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.ready.then((reg) => {
      const urls = performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('/assets/'));
      if (reg.active) reg.active.postMessage({ type: 'cache', urls });
    }).catch(() => {});
  }
  await barDone;
  await new Promise((r) => setTimeout(r, 250));

  // Los geht's
  enterWorld();
  UI.hideScreen('#loading');
}

/* ═════════════ Multiplayer ═════════════ */
function wireNet() {
  net.on('join', (p) => { syncRemotes(); addChat(null, t('joined', p.name)); UI.setRoom(net.code, net.count); });
  net.on('leave', (id) => {
    const a = remotes.get(id);
    if (a) addChat(null, t('left', a.name));
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
    if (a) { const txt = String(m.text).slice(0, 140); a.say(txt); addChat(a.name, txt); }
  });
  net.on('unstable', () => addChat(null, t('unstable')));
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
    a.remote = true; a.views = world.views;
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

function refreshHints() { $('#hints').textContent = input.touch ? t('hintsTouch') : t('hintsDesktop'); }

function enterWorld() {
  ready = true;
  $('#hud').hidden = false;
  document.body.classList.add('in-game');
  $('#topright').prepend($('#lang'));             // Sprachwahl wandert beim Spielstart in die Leiste oben rechts
  music.show(true);
  refreshHints();
  setupFullscreen();
  setupEmotes();
  setTimeout(() => $('#hints').classList.add('fade'), 14000);
  last = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  local.update(dt);
  // Blickkontakt: jede Figur schaut zur nächsten anderen, wenn sie nah genug ist
  if (remotes.size) {
    const all = [local.actor, ...remotes.values()];
    for (const a of all) {
      let best = null, bd = 3.8 * 3.8;
      for (const b of all) { if (b === a) continue; const d = (b.pos.x - a.pos.x) ** 2 + (b.pos.z - a.pos.z) ** 2; if (d < bd) { bd = d; best = b; } }
      a.lookAt = best ? best.pos : null;
    }
  }
  for (const a of remotes.values()) a.update(dt);
  local.actor.update(dt);
  local.actor.avatar.root.visible = local.state !== 'viewing';
  // Schattenlicht folgt der Spielerin; in festen Schritten, damit die Schatten nicht flimmern
  {
    const k = world.key, lp = local.actor.pos, q = (v) => Math.round(v / 0.047) * 0.047;
    k.target.position.set(q(lp.x), 0, q(lp.z));
    k.position.copy(k.target.position).add(world.KEY_OFFSET);
  }
  world.update(now / 1000);
  checkExit();
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
  updateCaption();
  if (input.touch) { const b = $('#t-act'); b.hidden = !local.prompt; if (local.prompt) b.textContent = local.prompt.label; }

  if (!blackout) renderer.render(world.scene, camera);   // hinter dem schwarzen Overlay nichts rendern → Akku sparen
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
  else if (badFrames > 90 && world.key.castShadow) { world.key.castShadow = false; badFrames = 0; }   // bei minimaler Auflösung immer noch zu langsam → Schatten abschalten
  else if (okFrames > 400 && dpr < DPR_MAX) { dpr = Math.min(DPR_MAX, dpr + 0.25); okFrames = 0; resize(); }
}

/* ═════════════ Chat (Roblox-Stil) ═════════════ */
const chatBox = $('#chatbox'), chatLog = $('#chatlog'), chatForm = $('#chat'), chatInput = $('#chat-input');
let chatOpen = false;
const NAME_COLORS = ['#ff8fa3', '#ffb86b', '#ffe08a', '#9be3a1', '#7fd6e8', '#9db4ff', '#c9a2ff', '#ff9de0'];
const nameColor = (n) => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0; return NAME_COLORS[h % NAME_COLORS.length]; };
function addChat(name, text) {
  const p = document.createElement('p');
  p.className = name ? 'cl' : 'cl sys';
  if (name) { const b = document.createElement('b'); b.textContent = name + ':'; b.style.color = nameColor(name); p.append(b); }
  p.append(document.createTextNode(text));
  chatLog.append(p);
  while (chatLog.children.length > 40) chatLog.firstChild.remove();
  setTimeout(() => p.classList.add('old'), 14000);
}
function openChat() {
  if (!input || chatOpen) return;
  chatOpen = true; chatForm.hidden = false; chatBox.classList.add('typing'); input.enabled = false; chatInput.value = '';
  input.releaseLock();
  chatInput.focus();
}
function closeChat() {
  chatOpen = false; chatForm.hidden = true; chatBox.classList.remove('typing'); input.enabled = true; chatInput.blur();
}
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim().slice(0, 140);
  closeChat();
  if (!text) return;
  local.actor.say(text);
  addChat(local.actor.name, text);
  if (net) net.sendChat(text);
});
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChat(); e.stopPropagation(); });
addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === '/') && ready && !chatOpen && !exiting && !reading && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { e.preventDefault(); openChat(); }
});
$('#t-chat').addEventListener('click', () => (chatOpen ? closeChat() : openChat()));
$('#t-act').addEventListener('click', () => local.interactTouch());

/* ═════════════ Emotes, Vollbild, Karte zum Date ═════════════ */
function setupEmotes() {
  const pop = $('#emotes');
  const toggle = (v) => { pop.hidden = v === undefined ? !pop.hidden : !v; };
  $('#btn-emote').addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  $('#t-emote').addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  pop.querySelectorAll('[data-emote]').forEach((b) => b.addEventListener('click', () => { local.playEmote(b.dataset.emote); toggle(false); }));
  addEventListener('pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target)) toggle(false); });
}

function setupFullscreen() {
  const el = document.documentElement, btn = $('#btn-full');
  const can = el.requestFullscreen || el.webkitRequestFullscreen;
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  if (!can || standalone) return;     // iPhone-Safari kennt keinen Vollbild-Modus für Seiten → dort hilft „Zum Home-Bildschirm“
  btn.hidden = false;
  btn.addEventListener('click', () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  });
}

const capEl = $('#caption');
let capShown = null, capLang = '';
function updateCaption() {
  const v = local.state === 'viewing' && local.frame ? local.frame.caption : null;
  if (v !== capShown || (v && capLang !== getLang())) {
    if (v && !capShown) input.releaseLock();       // Maus freigeben, damit der „Karte öffnen“-Link anklickbar ist
    capShown = v; capLang = getLang();
    capEl.hidden = !v;
    if (v) {
      $('#cap-kicker').textContent = pick(v.kicker);
      $('#cap-place').textContent = pick(v.place);
      $('#cap-coords').textContent = fmtCoords(v);
      $('#cap-map').href = mapUrl(v);
    }
  }
}

/* ═════════════ Lesen ═════════════ */
const reader = $('#reader');
let reading = null;
function openReader(book) {
  reading = book;
  const b = book[getLang()] || book.en;
  $('#reader-kicker').textContent = pick(CONFIG.sections.words.title);
  $('#reader-title').textContent = b.title;
  const body = $('#reader-body');
  body.replaceChildren(...b.body.split(/\n\s*\n/).map((para) => { const p = document.createElement('p'); p.textContent = para; return p; }));
  reader.hidden = false;
  input.releaseLock();
  reader.querySelector('.page').scrollTop = 0;
}
function closeReader() { reading = null; reader.hidden = true; }
$('#reader-close').addEventListener('click', () => input.pressed.add('escape'));
reader.addEventListener('pointerdown', (e) => { if (e.target === reader) input.pressed.add('escape'); });

/* ═════════════ Exit: Fade → schwarz → „I love you / Te quiero“ ═════════════ */
const exitScreen = $('#exit-screen');
let exiting = false, blackout = false;
function checkExit() {
  if (exiting) return;
  const z = world.exitZone, p = local.actor.pos;
  if (local.state === 'free' && p.x > z.minX && p.x < z.maxX && p.z > z.minZ && p.z < z.maxZ) startExit();
}
function startExit() {
  exiting = true; input.enabled = false; input.releaseLock();
  music.duck(0.12, 4.5);                       // Musik wird mit dem Bild leiser
  if (chatOpen) closeChat();
  $('#exit-text').textContent = pick(CONFIG.exitText);
  $('#exit-back').textContent = t('backToMuseum');
  exitScreen.className = ''; exitScreen.hidden = false;
  void exitScreen.offsetWidth;
  exitScreen.classList.add('on');
  setTimeout(() => { exitScreen.classList.add('text'); blackout = true; }, 4300);
  setTimeout(() => exitScreen.classList.add('show-back'), 9500);
}
onLang(() => { if (exiting) { $('#exit-text').textContent = pick(CONFIG.exitText); $('#exit-back').textContent = t('backToMuseum'); } });
$('#exit-back').addEventListener('click', () => {
  const a = local.actor;
  a.pos.set(10.6, 0, 7.6); a.heading = -Math.PI / 2; local.vel.set(0, 0);
  rig.yaw = a.heading + Math.PI; rig.snapNext = true;
  exitScreen.classList.remove('text', 'show-back'); exitScreen.classList.add('out');
  blackout = false;
  music.duck(1, 2.5);
  setTimeout(() => { exitScreen.hidden = true; exiting = false; input.enabled = true; }, 1500);
});

function leave() {
  if (net) net.close();
  location.href = location.pathname;
}
$('#btn-leave').addEventListener('click', leave);
addEventListener('pagehide', () => { if (net) net.close(); });

if (DEBUG) window.__museum = { music, get world() { return world; }, get local() { return local; }, get rig() { return rig; }, remotes, get net() { return net; }, renderer, camera, THREE };
