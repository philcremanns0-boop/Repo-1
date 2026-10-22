import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from './textures.js';
import { CONFIG } from './config.js';
import { pick, t as tr } from './i18n.js';

/*  Grundriss (Draufsicht, x → rechts, z → zum Betrachter)

      z=-9  ┌──────────┬────────────────┬──────────┐
            │  About   │    Moments     │  Words   │
            │   us     │  (Screen, Bank,│ (Bücher, │
            │          │   schwarze     │  Lesepulte│
            │          │   Wand)        │  Teppich)│
      z= 3  ├───┬──────┴──┬──────────┬──┴──────┬───┤
            │        Eingangshalle  (Bank, Hero)  ├─ Exit →
      z=11  └─────────────────────────────────────┘
        x=-12                                     x=12                */

const H = 4.2;
export const HALL = { minX: -12, maxX: 12, minZ: -9, maxZ: 11, h: H };
const MARGIN = 0.32;
const ALCOVE = { minX: 12, maxX: 14.4, minZ: 6.65, maxZ: 8.55 };

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3(1, 1, 1);
const M4 = (x, y, z, ry = 0, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s);

class Batch {
  constructor() { this.map = new Map(); }
  add(geo, mat, matrix) {
    const g = geo.clone();
    g.applyMatrix4(matrix);
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(g);
  }
  build(parent) {
    for (const [mat, list] of this.map) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, mat);
      mesh.matrixAutoUpdate = false;
      mesh.renderOrder = mat.transparent ? 1 : 0;
      parent.add(mesh);
    }
  }
}

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const plane = (w, h) => new THREE.PlaneGeometry(w, h);
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export function buildWorld({ photos, screen, books }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14161d);
  const batch = new Batch();
  const textures = [];
  const colliders = [];
  const frames = [];
  const bookViews = [];
  const benches = [];
  const redrawers = [];
  const track = (x) => { textures.push(x); return x; };

  /* ───── Licht ───── */
  // Warmes „Golden Hour“-Licht: niedrige, honigfarbene Sonne + kühler, rosiger Gegenlicht-Hauch
  const key = new THREE.DirectionalLight(0xffe0b8, 1.2); key.position.set(-8, 6, 7);
  const fill = new THREE.DirectionalLight(0xd9c6ff, 0.35); fill.position.set(7, 5, -9);
  scene.add(new THREE.HemisphereLight(0xfff5e8, 0xd2c1ab, 2.3), key, fill);

  /* ───── Materialien ───── */
  const wallTex = track(T.wallTexture());
  const repMat = (tex, len, div, cls) => {
    const c = tex.clone(); c.repeat.set(Math.max(1, len / div), 1); c.needsUpdate = true;
    return new cls({ map: c });
  };
  const blackTex = track(T.blackWallTexture());
  const M = {
    white: new THREE.MeshLambertMaterial({ color: 0xf3ece1 }),
    black: new THREE.MeshLambertMaterial({ color: 0x15171b }),
    frame: new THREE.MeshLambertMaterial({ color: 0x101114 }),
    mat: new THREE.MeshLambertMaterial({ color: 0xf6f0e4 }),
    wood: new THREE.MeshLambertMaterial({ color: 0xd6c4a4 }),
    walnut: new THREE.MeshLambertMaterial({ color: 0x6d4a33 }),
    paper: new THREE.MeshLambertMaterial({ color: 0xf3eee0 }),
    base: new THREE.MeshLambertMaterial({ color: 0xb4b5b9 }),
    glass: new THREE.MeshLambertMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.14, depthWrite: false }),
    pot: new THREE.MeshLambertMaterial({ color: 0xc9b9a3 }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x4f6b45 }),
    leaf2: new THREE.MeshLambertMaterial({ color: 0x6b8a58 }),
    wash: new THREE.MeshBasicMaterial({ map: track(T.washTexture()), color: 0xffd3a0, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    shadow: new THREE.MeshBasicMaterial({ map: track(T.boxShadowTexture()), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    pool: new THREE.MeshBasicMaterial({ map: track(T.poolTexture()), color: 0xffc98f, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    bulb: new THREE.MeshBasicMaterial({ color: 0xffe3b5 }),
  };
  const spineMats = [0x7a2f2a, 0x2f4a5c, 0x5b6b3a, 0xc9a35b, 0x3b3b44, 0x8a5a3a, 0xa8b3a0, 0x6b3e5a, 0xd8cfc0, 0x24382f].map((c) => new THREE.MeshLambertMaterial({ color: c }));

  /* ───── Boden, Decke ───── */
  const W = HALL.maxX - HALL.minX, D = HALL.maxZ - HALL.minZ, cz = (HALL.minZ + HALL.maxZ) / 2;
  const floorTex = track(T.floorTexture());
  floorTex.repeat.set(W / 4, D / 4);
  const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
  const floor = new THREE.Mesh(plane(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, cz);
  scene.add(floor);
  const ceilTex = track(T.ceilingTexture());
  ceilTex.repeat.set(W / 0.9, D / 0.9);
  const ceil = new THREE.Mesh(plane(W, D), new THREE.MeshLambertMaterial({ map: ceilTex }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, cz);
  scene.add(ceil);

  /* ───── Wände ───── */
  const addWallBox = (len, h, thick, cx, y0, cz2, alongX, black) => {
    const mat = black ? repMat(blackTex, len, 4, THREE.MeshLambertMaterial) : repMat(wallTex, len, 3, THREE.MeshLambertMaterial);
    const m = new THREE.Mesh(alongX ? box(len, h, thick) : box(thick, h, len), mat);
    m.position.set(cx, y0 + h / 2, cz2);
    scene.add(m);
  };
  /* Wand entlang einer Achse mit Türöffnungen. fixed = feste Koordinate, a..b = Verlauf, gaps = [[von,bis],…] */
  const wall = (alongX, fixed, a, b, gaps = [], o = {}) => {
    const thick = o.thick ?? 0.22, headerY = o.headerY ?? 3.0, collide = o.collide ?? true, black = o.black;
    const cuts = [a];
    gaps.forEach(([g0, g1]) => { cuts.push(g0, g1); });
    cuts.push(b);
    const place = (s, e, y0, h, solid) => {
      const len = e - s, mid = (s + e) / 2;
      if (len < 0.01) return;
      addWallBox(len, h, thick, alongX ? mid : fixed, y0, alongX ? fixed : mid, alongX, black);
      if (y0 === 0 && !black) {
        for (const side of [-1, 1]) {
          const off = side * (thick / 2 + 0.008);
          batch.add(box(alongX ? len : 0.016, 0.1, alongX ? 0.016 : len), M.base, M4(alongX ? mid : fixed + off, 0.05, alongX ? fixed + off : mid));
        }
      }
      if (solid && collide) colliders.push(alongX
        ? { minX: s, maxX: e, minZ: fixed - thick / 2, maxZ: fixed + thick / 2, tall: true }
        : { minX: fixed - thick / 2, maxX: fixed + thick / 2, minZ: s, maxZ: e, tall: true });
    };
    for (let i = 0; i < cuts.length; i += 2) place(cuts[i], cuts[i + 1], 0, H, true);
    gaps.forEach(([g0, g1]) => place(g0, g1, headerY, H - headerY, false));
  };

  // Außenwände (Innenkante genau auf HALL-Grenze)
  wall(true, HALL.minZ - 0.15, HALL.minX - 0.3, HALL.maxX + 0.3, [], { thick: 0.3, collide: false });
  wall(true, HALL.maxZ + 0.15, HALL.minX - 0.3, HALL.maxX + 0.3, [], { thick: 0.3, collide: false });
  wall(false, HALL.minX - 0.15, HALL.minZ, HALL.maxZ, [], { thick: 0.3, collide: false });
  wall(false, HALL.maxX + 0.15, HALL.minZ, HALL.maxZ, [[ALCOVE.minZ, ALCOVE.maxZ]], { thick: 0.3, collide: false, headerY: 3.0 });
  // Trennwand zur Eingangshalle mit drei Türen
  const DOORS = [-8.5, 0, 8.5];
  wall(true, 3.0, HALL.minX, HALL.maxX, DOORS.map((x) => [x - 1.4, x + 1.4]));
  // Raumtrenner mit Durchgang
  for (const x of [-5, 5]) wall(false, x, HALL.minZ, 3.0, [[-5.3, -2.7]]);

  /* ───── Exit-Nische ───── */
  {
    const a = ALCOVE, len = a.maxX - a.minX, w = a.maxZ - a.minZ;
    const fl = new THREE.Mesh(plane(len, w), floorMat);
    fl.rotation.x = -Math.PI / 2; fl.position.set((a.minX + a.maxX) / 2, 0.002, (a.minZ + a.maxZ) / 2);
    scene.add(fl);
    batch.add(box(len, 0.1, w), M.black, M4((a.minX + a.maxX) / 2, 3.0 + 0.05, (a.minZ + a.maxZ) / 2));
    for (const z of [a.minZ - 0.1, a.maxZ + 0.1]) batch.add(box(len, 3.0, 0.2), M.white, M4((a.minX + a.maxX) / 2, 1.5, z));
    const glow = new THREE.Mesh(plane(w, 3.0), new THREE.MeshBasicMaterial({ map: track(T.doorLightTexture()), toneMapped: false }));
    glow.position.set(a.maxX - 0.01, 1.5, (a.minZ + a.maxZ) / 2); glow.rotation.y = -Math.PI / 2;
    scene.add(glow);
    const fg = new THREE.Mesh(plane(2.6, 2.6), new THREE.MeshBasicMaterial({ map: track(T.floorGlowTexture()), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    fg.rotation.x = -Math.PI / 2; fg.position.set(a.maxX - 0.2, 0.006, (a.minZ + a.maxZ) / 2); fg.rotation.z = Math.PI;
    scene.add(fg);
    const sign = T.canvasTex(512, 160, (g, w2, h2) => T.drawExitSign(g, w2, h2, tr('exit')));
    redrawers.push(sign.redraw); track(sign.texture);
    const sm = new THREE.Mesh(plane(1.5, 0.47), new THREE.MeshBasicMaterial({ map: sign.texture, toneMapped: false }));
    sm.position.set(HALL.maxX - 0.12, 3.6, (a.minZ + a.maxZ) / 2); sm.rotation.y = -Math.PI / 2;
    scene.add(sm);
  }

  /* ───── Schildchen-Atlas ───── */
  const labelDefs = [];
  const atlas = T.canvasTex(1024, 1024, (g, w, h) => T.drawLabels(g, w, h, labelDefs, pick, tr('no')));
  track(atlas.texture);
  const labelMat = new THREE.MeshLambertMaterial({ map: atlas.texture });
  const addLabel = (def, matrix, wd = 0.25) => {
    const id = labelDefs.push(def) - 1;
    const g = plane(wd, wd / 2);
    const uv = g.attributes.uv, c = id % T.LABEL_COLS, r = Math.floor(id / T.LABEL_COLS);
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (c + uv.getX(i)) / T.LABEL_COLS, 1 - (r + 1 - uv.getY(i)) / T.LABEL_ROWS);
    }
    batch.add(g, labelMat, matrix);
  };

  /* ───── Rahmen ───── */
  const photoMats = new Map();
  const photoMat = (tx) => {
    if (!photoMats.has(tx)) photoMats.set(tx, new THREE.MeshBasicMaterial({ map: tx, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    return photoMats.get(tx);
  };
  const wallSpots = [];
  const lamps = [];
  const counters = { us: 0, moments: 0, hero: 0 };
  const addFrame = (section, spec) => {
    const list = photos[section];
    const n = counters[section]++;
    const ph = list[n % list.length];
    const asp = ph.aspect;
    const w = Math.min(spec.w, spec.h * asp), h = w / asp;
    const mat = 0.07, bd = 0.028;
    const ow = w + 2 * (mat + bd), oh = h + 2 * (mat + bd);
    const [x, y, z] = spec.pos;
    const base = M4(x, y, z, spec.ry);
    const local = (lx, ly, lz) => base.clone().multiply(M4(lx, ly, lz));
    batch.add(box(ow, oh, 0.05), M.frame, local(0, 0, 0.025));
    batch.add(box(w + 2 * mat, h + 2 * mat, 0.056), M.mat, local(0, 0, 0.028));
    const nx = Math.sin(spec.ry), nz = Math.cos(spec.ry);
    batch.add(plane(w, h), photoMat(ph.texture), M4(x + nx * 0.0585, y, z + nz * 0.0585, spec.ry));
    const rx = Math.cos(spec.ry), rz = -Math.sin(spec.ry);
    const off = ow / 2 + 0.2;
    const cap = (CONFIG.captions[section] || [])[n] || {};
    if (!spec.noLabel) addLabel(
      { title: cap.title, meta: cap.meta, place: spec.place, n: n + 1 },
      M4(x + rx * off + nx * 0.006, y - oh / 2 + 0.17, z + rz * off + nz * 0.006, spec.ry),
    );
    const center = new THREE.Vector3(x + nx * 0.06, y, z + nz * 0.06);
    frames.push({
      kind: 'frame', index: frames.length, center, normal: new THREE.Vector3(nx, 0, nz), w: ow, h: oh,
      top: center.clone().add(new THREE.Vector3(0, oh / 2 + 0.16, 0)),
      stand: new THREE.Vector3(x + nx * (spec.stand ?? 1.7), 0, z + nz * (spec.stand ?? 1.7)),
    });
    if (!spec.noSpot) wallSpots.push({ x, z, nx, nz });
  };

  const PI = Math.PI;
  const placeUs = { en: 'About us' }, placeMo = { en: 'Moments' };
  placeUs.es = CONFIG.sections.us.title.es; placeUs.en = CONFIG.sections.us.title.en;
  placeMo.es = CONFIG.sections.moments.title.es; placeMo.en = CONFIG.sections.moments.title.en;
  const S = { w: 1.0, h: 1.5 }, S2 = { w: 1.1, h: 1.45 };

  /* Eingangshalle: schwarzes Paneel, Hero-Foto, Sockel mit Schild */
  {
    const bp = new THREE.Mesh(box(7.6, H, 0.12), repMat(blackTex, 7.6, 4, THREE.MeshLambertMaterial));
    bp.position.set(0, H / 2, HALL.maxZ - 0.06); scene.add(bp);
    addFrame('hero', { pos: [0, 2.1, HALL.maxZ - 0.12], ry: PI, w: 1.6, h: 2.1, stand: 2.6, noLabel: true });
    const px = 0, pz = HALL.maxZ - 0.62;
    batch.add(box(3.4, 0.56, 1.0), M.white, M4(px, 0.28, pz));
    batch.add(plane(4.6, 2.2), M.shadow, M4(px, 0.006, pz, 0, -PI / 2));
    colliders.push({ minX: -1.7, maxX: 1.7, minZ: pz - 0.5, maxZ: pz + 0.5, tall: false });
    const pq = T.canvasTex(1024, 560, (g, w, h) => T.drawPlaque(g, w, h, pick(CONFIG.plaque)));
    redrawers.push(pq.redraw); track(pq.texture);
    const pm = new THREE.Mesh(plane(1.5, 0.82), new THREE.MeshBasicMaterial({ map: pq.texture, toneMapped: false }));
    pm.position.set(px + 0.95, 0.56 + 0.43, pz - 0.2); pm.rotation.set(-0.42, PI, 0, 'YXZ');
    scene.add(pm);
    batch.add(box(1.54, 0.86, 0.05), M.black, M4(pm.position.x, pm.position.y, pm.position.z + 0.03, PI, -0.42));
  }

  /* About us (links) */
  {
    const left = [-7.2, -4.4, -1.6, 1.1];
    left.forEach((z) => addFrame('us', { pos: [HALL.minX, 1.62, z], ry: PI / 2, ...S, place: placeUs }));
    [-7.2, 0.5].forEach((z) => addFrame('us', { pos: [-5 - 0.11, 1.62, z], ry: -PI / 2, ...S, place: placeUs }));
    addFrame('us', { pos: [-8.5, 1.42, HALL.minZ], ry: 0, ...S, place: placeUs });
    const wt = T.canvasTex(1024, 256, (g, w, h) => T.drawWallText(g, w, h, pick(CONFIG.sections.us.title), pick(CONFIG.sections.us.sub)));
    redrawers.push(wt.redraw); track(wt.texture);
    const m = new THREE.Mesh(plane(3.6, 0.9), new THREE.MeshBasicMaterial({ map: wt.texture, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.set(-8.5, 3.0, HALL.minZ + 0.012); scene.add(m);
    plant(-11.2, 2.0);
  }

  /* Moments (Mitte) */
  {
    const PL = { minX: -2.9, maxX: 2.9, minZ: -2.6, maxZ: -0.2, h: 0.2 };
    var plinth = PL;
    batch.add(box(PL.maxX - PL.minX, PL.h, PL.maxZ - PL.minZ), M.white, M4(0, PL.h / 2, (PL.minZ + PL.maxZ) / 2));
    batch.add(plane(PL.maxX - PL.minX + 1.6, PL.maxZ - PL.minZ + 1.6), M.shadow, M4(0, 0.006, (PL.minZ + PL.maxZ) / 2, 0, -PI / 2));
    const FW = { z: -1.45, w: 4.8, h: 3.7, d: 0.26 };
    const fw = new THREE.Mesh(box(FW.w, FW.h, FW.d), repMat(blackTex, FW.w, 4, THREE.MeshLambertMaterial));
    fw.position.set(0, PL.h + FW.h / 2, FW.z); scene.add(fw);
    colliders.push({ minX: -FW.w / 2, maxX: FW.w / 2, minZ: FW.z - FW.d / 2, maxZ: FW.z + FW.d / 2, tall: true });
    [-1.2, 1.2].forEach((x) => addFrame('moments', { pos: [x, PL.h + 1.75, FW.z + FW.d / 2], ry: 0, ...S2, stand: 2.2, place: placeMo }));
    [-7.2, 0.5].forEach((z) => {
      addFrame('moments', { pos: [-5 + 0.11, 1.62, z], ry: PI / 2, ...S2, place: placeMo });
      addFrame('moments', { pos: [5 - 0.11, 1.62, z], ry: -PI / 2, ...S2, place: placeMo });
    });
    // Screen an der Rückwand
    const sx = 0, sy = 2.0, sz = HALL.minZ + 0.05;
    batch.add(box(3.9, 2.3, 0.1), M.black, M4(sx, sy, sz));
    const sm = new THREE.Mesh(plane(3.6, 2.025), new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }));
    sm.position.set(sx, sy, sz + 0.055); scene.add(sm);
    addBench(0, -5.4, PI);
    plant(4.2, 1.9);
  }

  /* Words (rechts) */
  {
    bookcase(8.7, HALL.minZ + 0.02, 0, 6.4, 3.1);
    bookcase(HALL.maxX - 0.02, -3.6, -PI / 2, 6.6, 2.7);
    const rug = new THREE.Mesh(plane(4.3, 5.9), new THREE.MeshLambertMaterial({ map: track(T.rugTexture()) }));
    rug.rotation.x = -PI / 2; rug.position.set(8.5, 0.008, -3.3); rug.rotation.z = 0;
    scene.add(rug);
    const spots = [[7.2, -0.8, 0.35], [9.8, -2.5, -0.4], [7.2, -4.3, 0.3], [9.8, -6.0, -0.3], [7.2, -6.9, 0.2], [10.2, 0.2, -0.5], [9.9, -7.4, -0.2], [7.0, 1.3, 0.45]];
    const covers = [0x5a1f26, 0x1f3a4a, 0x2d4a33, 0x4a3a1f, 0x3a2a4a, 0x1d1d22];
    books.slice(0, spots.length).forEach((b, i) => lectern(spots[i], b, covers[i % covers.length]));
    lamps.push(...spots.slice(0, Math.min(books.length, spots.length)).map(([x, z]) => [x, 1.55, z]));
    plant(11.0, 2.0);
  }

  /* Lobby */
  addBench(0, 7.4, 0);
  plant(-11.0, 10.0); plant(11.0, 10.2); plant(-3.6, 3.7);

  /* ───── Türschilder ───── */
  [['us', -8.5], ['moments', 0], ['words', 8.5]].forEach(([k, x], i) => {
    const sec = CONFIG.sections[k];
    const tx = T.canvasTex(1024, 300, (g, w, h) => T.drawSign(g, w, h, pick(sec.title), pick(sec.sub), `0${i + 1}`));
    redrawers.push(tx.redraw); track(tx.texture);
    const m = new THREE.Mesh(plane(1.9, 0.557), new THREE.MeshBasicMaterial({ map: tx.texture, toneMapped: false }));
    m.position.set(x, 3.58, 3.0 + 0.115); scene.add(m);
  });

  /* ───── Schienen, Strahler, Lichtkegel ───── */
  const up = new THREE.Vector3(0, 1, 0);
  const rail = (x, z, w, d) => batch.add(box(w, 0.05, d), M.black, M4(x, H - 0.03, z));
  rail(0, HALL.minZ + 1.1, W - 1, 0.05);
  rail(HALL.minX + 1.1, -3, 0.05, 11);
  rail(HALL.maxX - 1.1, -3, 0.05, 11);
  rail(0, 9.9, 9, 0.05);
  const seen = new Set();
  for (const s of wallSpots) {
    const k = `${Math.round(s.x * 0.5)}|${Math.round(s.z * 0.5)}|${s.nx.toFixed(1)}|${s.nz.toFixed(1)}`;
    if (seen.has(k)) continue; seen.add(k);
    batch.add(plane(3.4, 2.6), M.pool, M4(s.x + s.nx * 1.15, 0.012, s.z + s.nz * 1.15, Math.atan2(s.nx, s.nz), -PI / 2));
    batch.add(plane(3.2, 3.0), M.wash, M4(s.x + s.nx * 0.014, 2.7, s.z + s.nz * 0.014, Math.atan2(s.nx, s.nz)));
    const fx = s.x + s.nx * 0.85, fz = s.z + s.nz * 0.85, fy = H - 0.3;
    const dir = new THREE.Vector3(s.x - fx, 2.4 - fy, s.z - fz).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    batch.add(new THREE.CylinderGeometry(0.055, 0.07, 0.24, 10), M.black, new THREE.Matrix4().compose(new THREE.Vector3(fx, fy, fz), q, _s));
    batch.add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), M.black, M4(fx, H - 0.15, fz));
  }

  /* ───── Bauteile ───── */
  function addBench(x, z, yaw, len = 2.2) {
    batch.add(box(len, 0.06, 0.46), M.wood, M4(x, 0.44, z, yaw));
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    for (const sgn of [-1, 1]) batch.add(box(0.05, 0.41, 0.36), M.black, M4(x + rx * sgn * (len / 2 - 0.2), 0.205, z + rz * sgn * (len / 2 - 0.2), yaw));
    batch.add(plane(len + 0.9, 1.5), M.shadow, M4(x, 0.006, z, yaw, -PI / 2));
    const ex = (Math.abs(rx) * len + Math.abs(rz) * 0.46) / 2, ez = (Math.abs(rz) * len + Math.abs(rx) * 0.46) / 2;
    colliders.push({ minX: x - ex, maxX: x + ex, minZ: z - ez, maxZ: z + ez, tall: false });
    const seats = [-0.5, 0.5].map((o) => ({ x: x + rx * o, z: z + rz * o, y: 0.47 }));
    benches.push({ index: benches.length, x, z, yaw, seats, seatBase: benches.length * 2 });
  }

  function plant(x, z) {
    batch.add(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 14), M.pot, M4(x, 0.2, z));
    batch.add(plane(1.1, 1.1), M.shadow, M4(x, 0.006, z, 0, -PI / 2));
    const r = rng(Math.floor(x * 7 + z * 13 + 100));
    for (let i = 0; i < 9; i++) {
      const a = r() * PI * 2, d = r() * 0.12, h = 0.55 + r() * 0.75;
      const geo = new THREE.SphereGeometry(0.15 + r() * 0.08, 8, 6);
      geo.scale(0.9, 1.5, 0.55);
      batch.add(geo, i % 2 ? M.leaf : M.leaf2, M4(x + Math.cos(a) * d, 0.4 + h / 2, z + Math.sin(a) * d, a, 0, (r() - 0.5) * 0.7));
    }
    colliders.push({ minX: x - 0.2, maxX: x + 0.2, minZ: z - 0.2, maxZ: z + 0.2, tall: false });
  }

  function bookcase(cx, cz0, ry, w, h) {
    const base = M4(cx, 0, cz0, ry);
    const L = (lx, ly, lz) => base.clone().multiply(M4(lx, ly, lz));
    batch.add(box(w, h, 0.03), M.walnut, L(0, h / 2, 0.015));
    for (const s of [-1, 1]) batch.add(box(0.04, h, 0.36), M.walnut, L(s * (w / 2 - 0.02), h / 2, 0.18));
    const rows = 5, gap = (h - 0.06) / rows, r = rng(Math.floor(w * 31 + h * 17));
    for (let i = 0; i <= rows; i++) batch.add(box(w - 0.08, 0.035, 0.34), M.walnut, L(0, 0.03 + i * gap, 0.18));
    for (let i = 0; i < rows; i++) {
      let x = -w / 2 + 0.08;
      const y0 = 0.05 + i * gap + 0.0175;
      while (x < w / 2 - 0.1) {
        if (r() < 0.07) { x += 0.12 + r() * 0.2; continue; }
        const bw = 0.028 + r() * 0.035, bh = Math.min(gap - 0.05, 0.22 + r() * 0.2), lean = r() < 0.06 ? 0.2 : 0;
        batch.add(box(bw, bh, 0.22), spineMats[Math.floor(r() * spineMats.length)], L(x + bw / 2, y0 + bh / 2, 0.16).multiply(M4(0, 0, 0, 0, 0, lean)));
        x += bw + 0.004 + (lean ? 0.06 : 0);
      }
    }
    batch.add(plane(w + 0.9, 1.0), M.shadow, L(0, 0.006, 0.45).multiply(M4(0, 0, 0, 0, -PI / 2)));
  }

  function lectern([x, z, ry], book, cover) {
    const base = M4(x, 0, z, ry);
    const L = (lx, ly, lz, rx = 0, rz2 = 0) => base.clone().multiply(M4(lx, ly, lz, 0, rx, rz2));
    batch.add(box(0.36, 0.84, 0.28), M.walnut, L(0, 0.42, 0));
    batch.add(box(0.62, 0.04, 0.44), M.walnut, L(0, 0.88, 0.02, -0.38));
    const coverMat = new THREE.MeshLambertMaterial({ color: cover });
    batch.add(box(0.58, 0.02, 0.4), coverMat, L(0, 0.915, 0.02, -0.38));
    batch.add(box(0.27, 0.025, 0.37), M.paper, L(-0.135, 0.935, 0.02, -0.38, 0.05));
    batch.add(box(0.27, 0.025, 0.37), M.paper, L(0.135, 0.935, 0.02, -0.38, -0.05));
    batch.add(plane(1.3, 1.1), M.shadow, L(0, 0.006, 0.0).multiply(M4(0, 0, 0, 0, -PI / 2)));
    addLabel({ title: { en: book.en.title, es: book.es.title }, meta: () => tr('read'), n: 0 }, L(0, 0.55, 0.146), 0.3);
    const nx = Math.sin(ry), nz = Math.cos(ry);
    const center = new THREE.Vector3(x + nx * 0.1, 0.95, z + nz * 0.1);
    colliders.push({ minX: x - 0.28, maxX: x + 0.28, minZ: z - 0.28, maxZ: z + 0.28, tall: false });
    bookViews.push({
      kind: 'book', book, index: frames.length + bookViews.length, center,
      normal: new THREE.Vector3(nx, 0, nz), top: new THREE.Vector3(x, 1.5, z),
      stand: new THREE.Vector3(x + nx * 1.0, 0, z + nz * 1.0), w: 0.6, h: 0.6,
    });
  }

  /* ───── Stimmung: Lichterkette, Leselampen, schwebender Staub im Licht ───── */
  const glowTex = track(T.glowTexture());
  const glowPts = (pts, size, opacity, color) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    const m = new THREE.PointsMaterial({ map: glowTex, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, color, toneMapped: false });
    const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
    return p;
  };
  {
    const bulbs = [];
    const arc = (x0, x1, y, z, sag, n) => {
      for (let i = 0; i <= n; i++) {
        const u = i / n, x = x0 + (x1 - x0) * u, yy = y - sag * 4 * u * (1 - u);
        bulbs.push([x, yy, z]);
      }
    };
    arc(-3.7, 0, 3.75, HALL.maxZ - 0.3, 0.55, 8);
    arc(0, 3.7, 3.75, HALL.maxZ - 0.3, 0.55, 8);
    arc(-3.7, 3.7, 3.95, HALL.maxZ - 0.3, 0.2, 14);
    bulbs.forEach(([x, y, z]) => batch.add(new THREE.SphereGeometry(0.028, 8, 6), M.bulb, M4(x, y, z)));
    glowPts(bulbs, 0.34, 0.85, 0xffcf8a);
    if (lamps.length) glowPts(lamps, 0.9, 0.5, 0xffc98a);
  }
  const DUST = 240, dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST * 3);
  const rr2 = rng(42);
  for (let i = 0; i < DUST; i++) {
    dustSeed[i * 3] = dustPos[i * 3] = HALL.minX + 1 + rr2() * (W - 2);
    dustSeed[i * 3 + 1] = dustPos[i * 3 + 1] = 0.4 + rr2() * 3.4;
    dustSeed[i * 3 + 2] = dustPos[i * 3 + 2] = HALL.minZ + 1 + rr2() * (D - 2);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTex, size: 0.075, sizeAttenuation: true, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe2b8, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  batch.build(scene);
  atlas.redraw();

  /* ───── Boden-Höhe, Begrenzung ───── */
  const groundY = (x, z) => {
    const P = plinth;
    const dx = Math.max(P.minX - x, 0, x - P.maxX), dz = Math.max(P.minZ - z, 0, z - P.maxZ);
    return P.h * Math.max(0, 1 - Math.hypot(dx, dz) / 0.3);
  };
  const clamp = (p) => {
    const inAlcove = p.x > HALL.maxX - 0.2 && p.z > ALCOVE.minZ + 0.32 && p.z < ALCOVE.maxZ - 0.32;
    p.z = Math.max(HALL.minZ + MARGIN, Math.min(HALL.maxZ - MARGIN, p.z));
    if (inAlcove) {
      p.z = Math.max(ALCOVE.minZ + MARGIN, Math.min(ALCOVE.maxZ - MARGIN, p.z));
      p.x = Math.max(HALL.minX + MARGIN, Math.min(ALCOVE.maxX - MARGIN, p.x));
    } else {
      p.x = Math.max(HALL.minX + MARGIN, Math.min(HALL.maxX - MARGIN, p.x));
    }
  };
  const views = [...frames, ...bookViews];
  const spawns = [[-0.8, 5.0], [0.8, 5.0], [-2.4, 5.6], [2.4, 5.6], [-0.8, 6.0], [0.8, 6.0]];

  const heartMesh = null;
  return {
    scene, textures, colliders, frames, books: bookViews, views, benches, groundY, clamp, spawns,
    bounds: { minX: HALL.minX, maxX: HALL.maxX + 0.25, minZ: HALL.minZ, maxZ: HALL.maxZ },
    exitZone: { minX: ALCOVE.minX + 1.1, maxX: ALCOVE.maxX, minZ: ALCOVE.minZ, maxZ: ALCOVE.maxZ },
    relocalize() { atlas.redraw(); redrawers.forEach((f) => f()); },
    update(time) {
      // Staubkörnchen treiben langsam durchs Licht
      for (let i = 0; i < DUST; i++) {
        const k = i * 3, ph = dustSeed[k] * 1.7 + i;
        dustPos[k] = dustSeed[k] + Math.sin(time * 0.11 + ph) * 0.6;
        dustPos[k + 1] = dustSeed[k + 1] + Math.sin(time * 0.09 + ph * 1.3) * 0.35;
        dustPos[k + 2] = dustSeed[k + 2] + Math.cos(time * 0.1 + ph) * 0.6;
      }
      dustGeo.attributes.position.needsUpdate = true;
    },
  };
}
