// Persistenz: IndexedDB (Audio-Blobs + Projekte) mit In-Memory-Fallback.
const DB = 'pad-sampler';
let dbp = null;
const mem = { sounds: new Map(), projects: new Map() };

function db() {
  if (!dbp) {
    dbp = new Promise((res) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('sounds', { keyPath: 'id' });
          r.result.createObjectStore('projects', { keyPath: 'name' });
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(null);
      } catch { res(null); }
    });
  }
  return dbp;
}

async function tx(store, mode, fn) {
  const d = await db();
  if (!d) return fn(null, store);
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const out = fn(t.objectStore(store), store);
    t.oncomplete = () => res(out?.result ?? out);
    t.onerror = t.onabort = () => rej(t.error);
  });
}

const put = (store, val, key) => tx(store, 'readwrite', (os) => {
  if (!os) { mem[store].set(val[key], val); return; }
  os.put(val);
});
const get = async (store, key) => {
  const d = await db();
  if (!d) return mem[store].get(key);
  return new Promise((res) => {
    const r = d.transaction(store).objectStore(store).get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => res(undefined);
  });
};
const all = async (store) => {
  const d = await db();
  if (!d) return [...mem[store].values()];
  return new Promise((res) => {
    const r = d.transaction(store).objectStore(store).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => res([]);
  });
};
const del = (store, key) => tx(store, 'readwrite', (os) => (os ? os.delete(key) : mem[store].delete(key)));

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const putSound = (s) => put('sounds', s, 'id'); // {id,name,blob,dur}
export const getSound = (id) => get('sounds', id);
export const listSounds = () => all('sounds');
export const deleteSound = (id) => del('sounds', id);
export const saveProject = (p) => put('projects', p, 'name');
export const loadProject = (name) => get('projects', name);
export const listProjects = async () => (await all('projects')).map((p) => p.name).filter((n) => n !== '__current');
export const deleteProject = (name) => del('projects', name);

export function usedSoundIds(p) {
  const ids = new Set();
  p.banks.forEach((b) => b.forEach((x) => x.sound && ids.add(x.sound)));
  if (p.vocal.sound) ids.add(p.vocal.sound);
  return [...ids].filter((i) => !i.startsWith('builtin:'));
}

const b64 = (blob) => new Promise((res) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.readAsDataURL(blob);
});

export async function exportProject(p) {
  const sounds = [];
  for (const id of usedSoundIds(p)) {
    const s = await getSound(id);
    if (s) sounds.push({ id, name: s.name, dur: s.dur, data: await b64(s.blob) });
  }
  return new Blob([JSON.stringify({ v: 1, project: p, sounds })], { type: 'application/json' });
}

export async function importProject(file) {
  const j = JSON.parse(await file.text());
  if (!j.project || !j.project.banks) throw new Error('Ungültige Datei');
  for (const s of j.sounds || []) {
    const blob = await (await fetch(s.data)).blob();
    await putSound({ id: s.id, name: s.name, dur: s.dur, blob });
  }
  return j.project;
}
