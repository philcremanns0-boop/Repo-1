import { engine, buffers } from './engine.js';
import * as store from './store.js';
import { renderStarter, STARTER, peaks, trimStart, chopPoints, COLORS, newPad, defaultProject } from './sounds.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BANKS = ['A', 'B', 'C', 'D'];
const ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3]; // MPC-Layout: Pad 1 unten links
const keyToPad = {};
['1234', 'qwer', 'asdf', 'zxcv'].forEach((row, r) => [...row].forEach((k, c) => { keyToPad[k] = (3 - r) * 4 + c; }));

let P = null;
let bank = 0;
let editMode = false;
let sel = 0;
let lcdSound = null;
const meta = new Map(); // soundId -> {name, dur}
const peakCache = new Map();
const urlSounds = new Map(); // Pack-URL -> soundId
const down = new Map(); // pointerId|key -> {i, v}
let wake = null;

// ---- Toast / Sheet ----------------------------------------------------------
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

let acts = {};
let onClose = null;
function sheet(html, a = {}, mount) {
  closeSheet(true);
  acts = a;
  $('#sheet').innerHTML = html;
  $('#sheetWrap').hidden = false;
  mount?.($('#sheet'));
}
function closeSheet(silent) {
  if ($('#sheetWrap').hidden && !silent) return;
  $('#sheetWrap').hidden = true;
  const f = onClose;
  onClose = null;
  acts = {};
  if (f) f();
}
const sheetOpen = () => !$('#sheetWrap').hidden;

// ---- Persistenz ---------------------------------------------------------------
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => store.saveProject({ name: '__current', data: P }), 500);
}

function normalize(p) {
  const d = defaultProject();
  const o = { ...d, ...p, vocal: { ...d.vocal, ...(p.vocal || {}) } };
  o.banks = d.banks.map((_, b) => Array.from({ length: 16 }, (__, i) => newPad(p.banks?.[b]?.[i] || {})));
  o.pattern = Array.isArray(p.pattern) ? p.pattern : [];
  return o;
}

async function ensureSounds(p) {
  const ids = store.usedSoundIds(p);
  let missing = 0;
  for (const id of ids) {
    if (buffers.has(id)) continue;
    const s = await store.getSound(id);
    if (!s) { missing++; continue; }
    try {
      buffers.set(id, await engine.decode(await s.blob.arrayBuffer()));
      meta.set(id, { name: s.name, dur: s.dur });
    } catch { missing++; }
  }
  if (missing) toast(missing + ' Sound(s) fehlen in diesem Projekt');
}

async function addSound(blob, name) {
  const buf = await engine.decode(await blob.arrayBuffer());
  const id = store.uid();
  await store.putSound({ id, name, blob, dur: buf.duration });
  buffers.set(id, buf);
  meta.set(id, { name, dur: buf.duration });
  return id;
}

function setProject(p) {
  engine.stop();
  P = p;
  engine.project = P;
  engine.setMaster(P.master ?? 0.9);
  $('#master').value = P.master ?? 0.9;
  $('#projName').textContent = P.name;
  $('#bars').value = P.bars;
  $('#bpmVal').textContent = P.bpm;
  renderGrid();
  updateTransport();
  lcdSound = null;
  kick();
}

// ---- Pads ---------------------------------------------------------------------------
const pads = [];
function buildGrid() {
  const g = $('#grid');
  g.innerHTML = '';
  ORDER.forEach((i) => {
    const el = document.createElement('button');
    el.className = 'pad';
    el.dataset.i = i;
    el.innerHTML = `<span class="n">${i + 1}</span><span class="t"></span>`;
    g.appendChild(el);
    pads[i] = el;
  });
  const b = $('#banks');
  b.innerHTML = BANKS.map((n, i) => `<button data-b="${i}">${n}</button>`).join('');
  const leds = $('#leds');
  leds.innerHTML = Array.from({ length: 16 }, (_, i) => `<i class="${i % 4 ? '' : 'beat'}"></i>`).join('');
}

function renderGrid() {
  P.banks[bank].forEach((p, i) => {
    const el = pads[i];
    el.style.setProperty('--c', COLORS[p.color % COLORS.length]);
    el.classList.toggle('empty', !p.sound);
    el.classList.toggle('edit', editMode);
    $('.t', el).textContent = p.name || (p.sound ? meta.get(p.sound)?.name || '' : '');
  });
  [...$('#banks').children].forEach((b, i) => b.classList.toggle('on', i === bank));
  $('#btnEdit').classList.toggle('on', editMode);
}

function flash(i) {
  const el = pads[i];
  el.classList.add('hit');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('hit'), 110);
}

function updateLive() {
  P.banks[bank].forEach((p, i) => pads[i].classList.toggle('live', p.mode !== 'oneshot' && engine.isPlayingPad(bank, i)));
}

function press(key, i) {
  if (down.has(key)) return;
  const go = () => {
    const p = P.banks[bank][i];
    sel = i;
    flash(i);
    if (editMode) openEditor(i);
    if (!p.sound) { down.set(key, { i }); return; }
    if (p.mode === 'loop' && engine.isPlayingPad(bank, i)) {
      engine.voices.get(bank + ':' + i).forEach((v) => engine.stopVoice(v));
      down.set(key, { i });
    } else {
      const v = engine.trigger(bank, i);
      down.set(key, { i, v });
      engine.recordHit(bank, i);
    }
    lcdSound = p.sound;
    updateLive();
    kick();
  };
  if (engine.ctx.state !== 'running') engine.resume().then(go); else go();
}

function lift(key) {
  const d = down.get(key);
  if (!d) return;
  down.delete(key);
  engine.release(d.v);
}

// ---- LCD ---------------------------------------------------------------------------
const cv = $('#wave');
const g2 = cv.getContext('2d');
function sizeCanvas(c) {
  const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.max(1, Math.round(r.width * d));
  c.height = Math.max(1, Math.round(r.height * d));
  return d;
}
function peaksFor(id) {
  let pk = peakCache.get(id);
  if (!pk && buffers.get(id)) peakCache.set(id, (pk = peaks(buffers.get(id), 600)));
  return pk;
}
function drawWave(c, id, start, end, playFrac, handles = false) {
  const hi = '#ffd23f', lo = handles ? '#3a4a3f' : '#2b6b3f';
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const pk = id && peaksFor(id);
  if (!pk) return;
  const n = pk.length / 2, w = c.width / n, mid = c.height / 2;
  for (let i = 0; i < n; i++) {
    const f = i / n;
    ctx.fillStyle = f >= start && f <= end ? hi : lo;
    const a = Math.max(1, (pk[i * 2 + 1] - pk[i * 2]) * mid * 0.95);
    ctx.fillRect(i * w, mid - (pk[i * 2 + 1] * mid * 0.95), Math.max(1, w - 0.5), a);
  }
  if (handles) {
    ctx.fillStyle = '#ffd23f';
    const gw = Math.max(3, c.width / 200), gh = Math.max(14, c.height / 6);
    [[start, 1], [end, -1]].forEach(([f, d]) => {
      const x = Math.round(f * c.width);
      ctx.fillRect(x - gw / 2, 0, gw, c.height);
      ctx.fillRect(x - (d > 0 ? 0 : gh), 0, gh, gh); ctx.fillRect(x - (d > 0 ? 0 : gh), c.height - gh, gh, gh);
    });
  }
  if (playFrac != null) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(playFrac * c.width), 0, Math.max(2, c.width / 300), c.height);
  }
}

let raf = 0;
function kick() { if (!raf) raf = requestAnimationFrame(frame); }
function frame() {
  raf = 0;
  if (!P) return;
  const p = lcdSound && P.banks[bank][sel];
  const v = engine.last;
  let frac = null;
  if (v && v.set.has(v) && v.pad.sound === lcdSound) {
    const el = (engine.ctx.currentTime - v.t) * v.rate / v.dur;
    if (el >= 0) { frac = v.off / v.dur + el; if (v.pad.mode === 'loop') { const s = v.pad.start, e = v.pad.end; frac = s + (((frac - s) % (e - s)) + (e - s)) % (e - s); } }
  }
  const pp = p && p.sound === lcdSound ? p : null;
  drawWave(cv, lcdSound, pp ? pp.start : 0, pp ? pp.end : 1, frac);
  if (pp) {
    $('#lcdName').textContent = pp.name || meta.get(pp.sound)?.name || '—';
    $('#lcdSub').textContent = `${BANKS[bank]}${sel + 1} · ${pp.pitch >= 0 ? '+' : ''}${pp.pitch}st · ${Math.pow(2, pp.pitch / 12).toFixed(2)}×`;
  } else { $('#lcdName').textContent = 'PAD SAMPLER'; $('#lcdSub').textContent = 'Tippe ein Pad'; }
  if (engine.playing) {
    const st = Math.floor(engine.loopPos()) % 16;
    [...$('#leds').children].forEach((l, i) => l.classList.toggle('on', i === st));
  } else [...$('#leds').children].forEach((l) => l.classList.remove('on'));
  updateLive();
  if (engine.anyActive()) kick();
}
new ResizeObserver(() => { sizeCanvas(cv); kick(); }).observe(cv);

// ---- Transport -----------------------------------------------------------------------
function updateTransport() {
  $('#btnPlay').classList.toggle('on', engine.playing);
  $('#btnPlay').textContent = engine.playing ? '■ STOP' : '▶ START';
  $('#btnRec').classList.toggle('on', engine.rec && engine.playing);
  $('#btnRec').classList.toggle('arm', engine.rec && !engine.playing);
  $('#btnMetro').classList.toggle('on', engine.metro);
  $('#bpmVal').textContent = P.bpm;
}

async function togglePlay() {
  await engine.resume();
  if (engine.playing) { engine.stop(); wake?.release?.().catch(() => {}); wake = null; }
  else {
    engine.start();
    navigator.wakeLock?.request('screen').then((w) => { wake = w; }).catch(() => {});
  }
  updateTransport();
  kick();
}

function setBpm(v) { P.bpm = engine.setBpm(v); $('#bpmVal').textContent = P.bpm; save(); }

let taps = [];
function tap() {
  const now = performance.now();
  if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
  taps.push(now);
  taps = taps.slice(-5);
  if (taps.length > 1) setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
}

function holdRepeat(btn, delta) {
  let t, iv;
  const stop = () => { clearTimeout(t); clearInterval(iv); };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setBpm(P.bpm + delta);
    t = setTimeout(() => { iv = setInterval(() => setBpm(P.bpm + delta), 70); }, 350);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
}

// ---- Sounds zuweisen / Dateien ---------------------------------------------------------
function freePad() { // erstes freies Pad ab der aktuellen Bank (wechselt ggf. die Bank)
  for (let k = 0; k < 4; k++) {
    const b = (bank + k) % 4, i = P.banks[b].findIndex((p) => !p.sound);
    if (i >= 0) { bank = b; return i; }
  }
  return -1;
}
function assign(id, i, name, start = 0) {
  if (i == null || i < 0) { toast('Alle Pads belegt – Sound liegt in „Meine Sounds“'); return false; }
  const p = P.banks[bank][i];
  p.sound = id; p.start = start; p.end = 1;
  p.name = name || meta.get(id)?.name || p.name;
  sel = i; lcdSound = id;
  renderGrid(); save(); kick();
  return true;
}

const fileIn = $('#fileIn');
let fileCb = null;
function pickFiles(cb, { multiple = true, accept = 'audio/*' } = {}) {
  fileCb = cb;
  fileIn.multiple = multiple;
  fileIn.accept = accept;
  fileIn.value = '';
  fileIn.click();
}
fileIn.addEventListener('change', async () => {
  const files = [...fileIn.files];
  if (!files.length || !fileCb) return;
  const cb = fileCb;
  fileCb = null;
  try { await cb(files); } catch (e) { toast('Fehler: ' + (e.message || e)); }
});

async function importFiles(files, targetPad) {
  const ids = [];
  for (const f of files) {
    toast('Lade ' + f.name + '…');
    ids.push([await addSound(f, f.name.replace(/\.[^.]+$/, '')), f.name.replace(/\.[^.]+$/, '')]);
  }
  if (targetPad != null && ids[0]) assign(ids[0][0], targetPad, ids[0][1]);
  else toast(ids.length + ' Sound(s) importiert');
  return ids;
}

// ---- Editor --------------------------------------------------------------------------
function openEditor(i) {
  const p = P.banks[bank][i];
  const render = () => {
    const sn = p.sound ? meta.get(p.sound)?.name || 'Sound' : 'kein Sound';
    $('#edSound').textContent = sn;
    $('#edPitchV').textContent = `${p.pitch >= 0 ? '+' : ''}${p.pitch} st · ${Math.pow(2, p.pitch / 12).toFixed(2)}×`;
    $$('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === p.mode));
    $$('.sw i').forEach((s, k) => s.classList.toggle('on', k === p.color));
  };
  const $$ = (s) => [...$('#sheet').querySelectorAll(s)];
  const redraw = () => { drawWave($('#edWave'), p.sound, p.start, p.end, null, true); };
  sheet(`
    <h2>Pad ${BANKS[bank]}${i + 1}<button class="btn" data-act="close">✕</button></h2>
    <div class="row"><label>Name</label><input type="text" data-k="name" value="${esc(p.name)}" maxlength="24"></div>
    <div class="row"><label>Farbe</label><div class="sw">${COLORS.map((c, k) => `<i data-col="${k}" style="background:${c}"></i>`).join('')}</div></div>
    <h3>Sound: <span id="edSound"></span></h3>
    <div class="row"><button class="btn" data-act="lib">♫ Library</button><button class="btn" data-act="file">📁 Datei</button><button class="btn" data-act="mic">🎙 Aufnehmen</button><button class="btn dng" data-act="clear">Leeren</button></div>
    <canvas id="edWave"></canvas>
    <p class="note">Gelbe Griffe ziehen: Start und Ende des Samples.</p>
    <div class="row"><label>Pitch</label><input type="range" min="-24" max="24" step="1" data-k="pitch" value="${p.pitch}"><b id="edPitchV"></b></div>
    <div class="row"><label></label><div class="seg"><button class="btn" data-pitch="-12">−12</button><button class="btn" data-pitch="0">0</button><button class="btn" data-pitch="5">Chipmunk +5</button><button class="btn" data-pitch="7">+7</button><button class="btn" data-pitch="12">+12</button></div></div>
    <div class="row"><label>Lautst.</label><input type="range" min="0" max="1.5" step="0.01" data-k="gain" value="${p.gain}"></div>
    <div class="row"><label>Modus</label><div class="seg"><button class="btn" data-mode="oneshot">One-Shot</button><button class="btn" data-mode="hold">Halten</button><button class="btn" data-mode="loop">Loop</button></div></div>
    <div class="row"><label>Choke</label><select data-k="choke">${[0, 1, 2, 3, 4].map((c) => `<option value="${c}" ${p.choke === c ? 'selected' : ''}>${c ? 'Gruppe ' + c : 'Aus'}</option>`).join('')}</select></div>
    <div class="row"><button class="btn pri" data-act="prev">▶ Vorhören</button></div>`,
  {
    close: () => closeSheet(),
    lib: () => openLibrary(i),
    file: () => pickFiles((f) => importFiles(f, i).then(() => openEditor(i)), { multiple: false }),
    mic: () => openMic(i),
    clear: () => { Object.assign(p, newPad({ color: p.color })); renderGrid(); save(); openEditor(i); },
    prev: () => { const v = engine.trigger(bank, i); if (v) { lcdSound = p.sound; kick(); } },
    input: (el) => {
      const k = el.dataset.k, v = el.type === 'range' || k === 'choke' ? +el.value : el.value;
      p[k] = v; render(); renderGrid(); save(); kick();
    },
    click: (t) => {
      if (t.dataset.col != null) p.color = +t.dataset.col;
      if (t.dataset.mode) p.mode = t.dataset.mode;
      if (t.dataset.pitch != null) { p.pitch = +t.dataset.pitch; $('#sheet [data-k=pitch]').value = p.pitch; }
      if (t.dataset.col != null || t.dataset.mode || t.dataset.pitch != null) { render(); renderGrid(); save(); kick(); }
    },
  },
  () => {
    const c = $('#edWave');
    sizeCanvas(c); render(); redraw();
    let drag = null;
    const pos = (e) => Math.min(1, Math.max(0, (e.clientX - c.getBoundingClientRect().left) / c.getBoundingClientRect().width));
    c.addEventListener('pointerdown', (e) => {
      const x = pos(e);
      drag = Math.abs(x - p.start) <= Math.abs(x - p.end) ? 'start' : 'end';
      c.setPointerCapture(e.pointerId);
      c.dispatchEvent(new PointerEvent('pointermove', e));
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const x = pos(e);
      if (drag === 'start') p.start = Math.min(x, p.end - 0.005); else p.end = Math.max(x, p.start + 0.005);
      redraw(); kick();
    });
    const up = () => { if (drag) { drag = null; save(); } };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    onClose = () => { renderGrid(); };
  });
}

// ---- Library -------------------------------------------------------------------------
function openLibrary(target = null, tab = 'starter') {
  const packs = openLibrary.packs || (openLibrary.packs = []);
  const tgt = () => (target != null ? target : freePad());
  const row = (o) => `<div class="item"><button class="btn" data-pv="${esc(o.id || '')}" data-url="${esc(o.url || '')}" data-name="${esc(o.name)}">▶</button><b>${esc(o.name)}</b><small>${esc(o.sub || '')}</small><button class="btn pri" data-as="${esc(o.id || '')}" data-url="${esc(o.url || '')}" data-name="${esc(o.name)}">→ Pad</button>${o.del ? `<button class="btn dng" data-del="${esc(o.id)}">✕</button>` : ''}</div>`;
  const body = async () => {
    let items = [];
    if (tab === 'starter') items = STARTER.map((s) => ({ id: s.id, name: s.name, sub: s.cat }));
    else if (tab === 'mine') items = (await store.listSounds()).map((s) => ({ id: s.id, name: s.name, sub: s.dur.toFixed(1) + ' s', del: true }));
    else items = packs.map((s) => ({ url: s.url, name: s.name, sub: s.cat || s.license || '' }));
    $('#libList').innerHTML = items.length ? items.map(row).join('') : '<p class="note">Noch nichts hier.</p>';
  };
  const resolve = async (el) => {
    const id = el.dataset.pv ?? el.dataset.as;
    if (id) return id;
    const url = el.dataset.url;
    if (urlSounds.has(url)) return urlSounds.get(url);
    toast('Lade…');
    const r = await fetch(url);
    if (!r.ok) throw new Error('Download fehlgeschlagen');
    const sid = await addSound(await r.blob(), el.dataset.name);
    urlSounds.set(url, sid);
    return sid;
  };
  sheet(`
    <h2>Library<button class="btn" data-act="close">✕</button></h2>
    <div class="row"><div class="seg">
      <button class="btn ${tab === 'starter' ? 'on' : ''}" data-tab="starter">Starter-Kit</button>
      <button class="btn ${tab === 'mine' ? 'on' : ''}" data-tab="mine">Meine Sounds</button>
      <button class="btn ${tab === 'packs' ? 'on' : ''}" data-tab="packs">Online-Packs</button></div></div>
    <p class="note">${target != null ? 'Ziel: Pad ' + BANKS[bank] + (target + 1) : 'Ziel: nächstes freies Pad'}. Starter-Kit = synthetisch erzeugt. Eigene Songs/Samples importierst du als Datei – sie bleiben nur auf deinem Gerät.</p>
    <div class="row"><button class="btn pri" data-act="import">＋ Dateien importieren</button>${tab === 'packs' ? '<button class="btn" data-act="packurl">Pack-URL laden</button>' : ''}</div>
    <div id="libList" class="list"></div>`,
  {
    close: () => closeSheet(),
    import: () => pickFiles(async (f) => { await importFiles(f, null); openLibrary(target, 'mine'); }),
    packurl: async () => {
      const u = prompt('URL einer Pack-Liste (JSON: [{"name","url","cat"}]):');
      if (!u) return;
      try {
        const j = await (await fetch(u)).json();
        const base = new URL(u, location.href);
        (Array.isArray(j) ? j : j.items || []).forEach((x) => packs.push({ ...x, url: new URL(x.url, base).href }));
        body();
      } catch { toast('Pack konnte nicht geladen werden'); }
    },
    click: async (t) => {
      try {
        if (t.dataset.tab) { openLibrary(target, t.dataset.tab); return; }
        if (t.dataset.del) {
          await store.deleteSound(t.dataset.del); buffers.delete(t.dataset.del); meta.delete(t.dataset.del);
          P.banks.forEach((b) => b.forEach((p) => { if (p.sound === t.dataset.del) p.sound = null; }));
          renderGrid(); save(); body(); return;
        }
        if ('pv' in t.dataset) { await engine.resume(); const id = await resolve(t); engine.preview(id); }
        else if ('as' in t.dataset) {
          const id = await resolve(t);
          if (assign(id, tgt(), t.dataset.name)) { toast('Zugewiesen'); if (target != null) openEditor(target); else body(); }
        }
      } catch (e) { toast(e.message || 'Fehler'); }
    },
  }, body);
}

// ---- Mikrofon ------------------------------------------------------------------------
function openMic(target = null) {
  let rec = null, t0 = 0, iv = 0;
  const stopIv = () => clearInterval(iv);
  sheet(`
    <h2>Aufnahme<button class="btn" data-act="close">✕</button></h2>
    <p class="note">Tippe zum Starten und nochmal zum Beenden. Stille am Anfang wird automatisch abgeschnitten. Ziel: ${target != null ? 'Pad ' + BANKS[bank] + (target + 1) : 'nächstes freies Pad'}.</p>
    <button class="rec-big" data-act="rec">● REC</button>
    <p class="note" id="micT" style="text-align:center">0.0 s</p>`,
  {
    close: () => closeSheet(),
    rec: async (btn) => {
      try {
        if (!rec) {
          await engine.resume();
          rec = await engine.record();
          t0 = performance.now();
          btn.classList.add('on'); btn.textContent = '■ STOP';
          iv = setInterval(() => { $('#micT').textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s'; }, 100);
        } else {
          const r = rec; rec = null; stopIv();
          const blob = await r.stop();
          const name = 'Aufnahme ' + new Date().toLocaleTimeString('de-DE');
          const id = await addSound(blob, name);
          const tp = target != null ? target : freePad();
          if (assign(id, tp, name, trimStart(buffers.get(id)))) toast('Aufnahme auf Pad ' + BANKS[bank] + (sel + 1));
          if (target != null) openEditor(target); else closeSheet();
        }
      } catch (e) { stopIv(); rec = null; toast(e.name === 'NotAllowedError' ? 'Mikrofon nicht erlaubt' : 'Aufnahme fehlgeschlagen'); }
    },
  }, () => { onClose = () => { stopIv(); rec?.cancel(); }; });
}

// ---- Chop ----------------------------------------------------------------------------
function openChop() {
  let src = null;
  const mineOpts = async () => (await store.listSounds()).map((s) => `<option value="${s.id}">${esc(s.name)} (${s.dur.toFixed(0)} s)</option>`).join('');
  sheet(`
    <h2>Song choppen<button class="btn" data-act="close">✕</button></h2>
    <p class="note">Lade deinen eigenen Song oder ein Sample. Er wird in Slices auf die Pads einer Bank verteilt – wie bei einem MPC-Chop. Die Datei bleibt lokal auf deinem Gerät.</p>
    <div class="row"><button class="btn pri" data-act="file">📁 Song laden</button><select id="chopMine"><option value="">— oder aus „Meine Sounds“ —</option></select></div>
    <p class="note" id="chopSrc">Keine Quelle gewählt.</p>
    <div class="row"><label>Slices</label><select id="chopN"><option>16</option><option>12</option><option>8</option></select></div>
    <div class="row"><label>Methode</label><select id="chopM"><option value="trans">Transienten (Schläge erkennen)</option><option value="equal">Gleichmäßig</option></select></div>
    <div class="row"><label>Pitch</label><select id="chopP"><option value="0">Original</option><option value="3">+3 st</option><option value="5">Chipmunk +5</option><option value="7">+7 st</option></select></div>
    <div class="row"><label>Ziel</label><select id="chopB">${BANKS.map((b, i) => `<option value="${i}" ${i === bank ? 'selected' : ''}>Bank ${b} (wird überschrieben)</option>`).join('')}</select></div>
    <div class="row"><label>Song-BPM</label><input id="chopBpm" type="number" min="40" max="240" placeholder="optional"></div>
    <div class="row"><button class="btn pri" data-act="go">✂ Chop!</button></div>`,
  {
    close: () => closeSheet(),
    file: () => pickFiles(async (f) => {
      toast('Lade…');
      const id = await addSound(f[0], f[0].name.replace(/\.[^.]+$/, ''));
      src = id; $('#chopSrc').textContent = '✓ ' + meta.get(id).name + ' · ' + meta.get(id).dur.toFixed(1) + ' s';
    }, { multiple: false }),
    go: () => {
      if (!src) return toast('Erst eine Quelle wählen');
      const n = +$('#chopN').value, pts = chopPoints(buffers.get(src), n, $('#chopM').value), pitch = +$('#chopP').value, b = +$('#chopB').value;
      const nm = meta.get(src).name;
      for (let i = 0; i < n; i++) P.banks[b][i] = newPad({ name: `${nm.slice(0, 14)} ${i + 1}`, sound: src, start: pts[i], end: pts[i + 1], pitch, color: i % 2 ? 3 : 0 });
      for (let i = n; i < 16; i++) P.banks[b][i] = newPad();
      const bp = +$('#chopBpm').value;
      if (bp >= 40) { setBpm(bp); P.vocal.bpm = P.vocal.bpm || bp; }
      bank = b; sel = 0; lcdSound = src;
      renderGrid(); save(); kick(); closeSheet(); toast(n + ' Slices auf Bank ' + BANKS[b]);
    },
    input: (el) => {
      if (el.id === 'chopMine' && el.value) { src = el.value; $('#chopSrc').textContent = '✓ ' + meta.get(src).name; }
    },
  }, async () => { $('#chopMine').insertAdjacentHTML('beforeend', await mineOpts()); });
}

// ---- Vocal-Layer -----------------------------------------------------------------------
function openVocal() {
  const v = P.vocal;
  const upd = () => {
    $('#vName').textContent = v.sound ? v.name || meta.get(v.sound)?.name : 'keine Acapella geladen';
    $('#vNudge').textContent = (v.nudge > 0 ? '+' : '') + v.nudge + ' ms';
    $$('[data-t]').forEach((b) => b.classList.toggle('on', !!v[b.dataset.t]));
  };
  const $$ = (s) => [...$('#sheet').querySelectorAll(s)];
  sheet(`
    <h2>Vocal-Layer<button class="btn" data-act="close">✕</button></h2>
    <p class="note">Lege eine eigene Acapella/Rap-Spur (Datei) unter deinen Beat. Sie startet synchron mit <b>START</b> und stoppt mit <b>STOP</b>. Du kannst sie jederzeit stummschalten.</p>
    <div class="row"><b id="vName"></b></div>
    <div class="row"><button class="btn pri" data-act="file">📁 Acapella laden</button><button class="btn" data-act="prev">▶ Vorhören</button><button class="btn dng" data-act="rm">Entfernen</button></div>
    <div class="row"><label>Acap.-BPM</label><input type="number" data-k="bpm" min="40" max="240" value="${v.bpm}"><button class="btn" data-act="sync">Projekt = Acap.-BPM</button></div>
    <div class="row"><label>Tempo-Match</label><button class="btn" data-t="match">Acapella ans Projekt-Tempo anpassen</button></div>
    <p class="note">Tempo-Match ändert Tempo und Tonhöhe zusammen (kein Pitch-Lock). Kleine Abweichungen klingen natürlich.</p>
    <div class="row"><label>Nudge</label><input type="range" data-k="nudge" min="-300" max="300" step="5" value="${v.nudge}"><b id="vNudge"></b></div>
    <div class="row"><label>Start bei</label><input type="number" data-k="offset" min="0" step="0.1" value="${v.offset}"> <span class="note">Sek. in der Datei</span></div>
    <div class="row"><label>Lautst.</label><input type="range" data-k="gain" min="0" max="1.5" step="0.01" value="${v.gain}"></div>
    <div class="row"><button class="btn" data-t="loop">↻ Loop</button><button class="btn" data-t="mute">🔇 Stumm</button></div>`,
  {
    close: () => closeSheet(),
    file: () => pickFiles(async (f) => {
      toast('Lade…');
      const id = await addSound(f[0], f[0].name.replace(/\.[^.]+$/, ''));
      v.sound = id; v.name = meta.get(id).name; v.offset = 0; save(); upd();
    }, { multiple: false }),
    prev: async () => { if (v.sound) { await engine.resume(); engine.vocalGain.gain.value = v.gain; engine.preview(v.sound); } },
    rm: () => { v.sound = null; v.name = ''; engine.stopVocal(); save(); upd(); },
    sync: () => { setBpm(v.bpm); },
    input: (el) => { v[el.dataset.k] = +el.value; if (el.dataset.k === 'bpm') engine.updateVocalRate(); upd(); save(); },
    click: (t) => { if (t.dataset.t) { v[t.dataset.t] = !v[t.dataset.t]; if (t.dataset.t === 'match') engine.updateVocalRate(); upd(); save(); } },
  }, upd);
}

// ---- Projekte ------------------------------------------------------------------------
async function openProjects() {
  const names = await store.listProjects();
  sheet(`
    <h2>Projekte<button class="btn" data-act="close">✕</button></h2>
    <div class="row"><input type="text" id="pn" value="${esc(P.name)}" maxlength="32"><button class="btn pri" data-act="save">💾 Speichern</button></div>
    <h3>Gespeichert</h3>
    <div class="list">${names.map((n) => `<div class="item"><b>${esc(n)}</b><button class="btn" data-load="${esc(n)}">Laden</button><button class="btn dng" data-rm="${esc(n)}">✕</button></div>`).join('') || '<p class="note">Noch keine Projekte.</p>'}</div>
    <h3>Datei</h3>
    <div class="row"><button class="btn" data-act="exp">⬇ Exportieren</button><button class="btn" data-act="imp">⬆ Importieren</button><button class="btn dng" data-act="new">Neu (Starter-Kit)</button></div>
    <p class="note">Export enthält alle eigenen Sounds. Alles liegt lokal in deinem Browser – nichts wird hochgeladen.</p>`,
  {
    close: () => closeSheet(),
    save: async () => {
      P.name = ($('#pn').value || 'Projekt').slice(0, 32);
      await store.saveProject({ name: P.name, data: P });
      $('#projName').textContent = P.name; toast('Gespeichert'); openProjects();
    },
    exp: async () => {
      const b = await store.exportProject(P), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = P.name.replace(/\W+/g, '_') + '.padsampler.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    },
    imp: () => pickFiles(async (f) => { const p = normalize(await store.importProject(f[0])); await ensureSounds(p); setProject(p); closeSheet(); toast('Importiert'); }, { multiple: false, accept: '.json,application/json' }),
    new: async () => { setProject(normalize(defaultProject())); closeSheet(); },
    click: async (t) => {
      if (t.dataset.load) { const r = await store.loadProject(t.dataset.load); if (r) { const p = normalize(r.data); await ensureSounds(p); setProject(p); closeSheet(); } }
      if (t.dataset.rm) { await store.deleteProject(t.dataset.rm); openProjects(); }
    },
  });
}

// ---- Events ----------------------------------------------------------------------------
function bind() {
  const grid = $('#grid');
  grid.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.pad');
    if (!el) return;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch {}
    press(e.pointerId, +el.dataset.i);
  });
  ['pointerup', 'pointercancel'].forEach((ev) => grid.addEventListener(ev, (e) => lift(e.pointerId)));
  grid.addEventListener('contextmenu', (e) => e.preventDefault());
  grid.addEventListener('dragover', (e) => { e.preventDefault(); e.target.closest('.pad')?.classList.add('drop'); });
  grid.addEventListener('dragleave', (e) => e.target.closest('.pad')?.classList.remove('drop'));
  grid.addEventListener('drop', async (e) => {
    e.preventDefault();
    const el = e.target.closest('.pad');
    pads.forEach((p) => p.classList.remove('drop'));
    const f = [...(e.dataTransfer?.files || [])].filter((x) => x.type.startsWith('audio/'));
    if (el && f.length) { try { await importFiles(f, +el.dataset.i); } catch { toast('Datei nicht lesbar'); } }
  });

  $('#banks').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-b]');
    if (b) { bank = +b.dataset.b; renderGrid(); kick(); }
  });

  $('#btnPlay').addEventListener('pointerdown', (e) => { e.preventDefault(); togglePlay(); });
  $('#btnRec').addEventListener('click', () => { engine.rec = !engine.rec; updateTransport(); });
  $('#btnMetro').addEventListener('click', () => { engine.metro = !engine.metro; updateTransport(); });
  $('#bpmVal').addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
  holdRepeat($('#bpmDn'), -1);
  holdRepeat($('#bpmUp'), 1);
  $('#bars').addEventListener('change', (e) => { P.bars = +e.target.value; save(); });
  $('#master').addEventListener('input', (e) => { P.master = +e.target.value; engine.setMaster(P.master); save(); });

  $('#btnEdit').addEventListener('click', () => { editMode = !editMode; renderGrid(); toast(editMode ? 'Edit: Pad antippen' : 'Edit aus'); });
  $('#btnLib').addEventListener('click', () => openLibrary());
  $('#btnMic').addEventListener('click', () => openMic());
  $('#btnChop').addEventListener('click', openChop);
  $('#btnVocal').addEventListener('click', openVocal);
  $('#btnUndo').addEventListener('click', () => { engine.undoRecord(); save(); toast('Letzter Treffer entfernt'); });
  $('#btnClear').addEventListener('click', () => { engine.clearPattern(); save(); toast('Loop geleert'); });
  $('#btnProjects').addEventListener('click', openProjects);

  const wrap = $('#sheetWrap');
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) closeSheet(); });
  const sh = $('#sheet');
  sh.addEventListener('click', (e) => {
    const t = e.target.closest('button,[data-col]');
    if (!t) return;
    if (t.dataset.act && acts[t.dataset.act]) return acts[t.dataset.act](t, e);
    acts.click?.(t, e);
  });
  sh.addEventListener('input', (e) => {
    const el = e.target;
    if (acts.input && (el.dataset.k || el.id)) acts.input(el, e);
  });

  document.addEventListener('keydown', (e) => {
    if (e.repeat || sheetOpen() || e.metaKey || e.ctrlKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
    const i = keyToPad[e.key.toLowerCase()];
    if (i != null) press('k' + e.key.toLowerCase(), i);
  });
  document.addEventListener('keyup', (e) => lift('k' + e.key.toLowerCase()));

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('#sheet,input')) e.preventDefault(); }, { passive: false });
  document.addEventListener('pointerdown', () => engine.resume(), { capture: true });

  engine.onChange = () => { updateTransport(); kick(); };
  engine.onHit = (b, i, t) => {
    if (b !== bank) return;
    setTimeout(() => flash(i), Math.max(0, (t - engine.ctx.currentTime) * 1000));
  };
}

// ---- Start -----------------------------------------------------------------------------
async function main() {
  buildGrid();
  engine.init();
  const [starter, saved, sounds] = await Promise.all([renderStarter(), store.loadProject('__current'), store.listSounds()]);
  starter.forEach((b, id) => buffers.set(id, b));
  STARTER.forEach((s) => meta.set(s.id, { name: s.name, dur: buffers.get(s.id).duration }));
  sounds.forEach((s) => meta.set(s.id, { name: s.name, dur: s.dur }));
  const p = saved ? normalize(saved.data) : defaultProject();
  await ensureSounds(p);
  bind();
  setProject(p);
  window.__app = { engine, get P() { return P; }, buffers, press, lift, get bank() { return bank; } };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
main();
