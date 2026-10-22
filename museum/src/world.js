import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from './textures.js';
import { CONFIG } from './config.js';

export const HALL = { minX: -14, maxX: 14, minZ: -10, maxZ: 12, h: 4.4 };
export const BOUNDS = { minX: -13.55, maxX: 13.55, minZ: -9.55, maxZ: 11.55 };

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const M4 = (x, y, z, ry = 0, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s);

/* Sammelt statische Geometrie pro Material und baut daraus wenige große Meshes
   → minimale Draw-Calls. */
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

export function buildWorld({ photos, screen }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14161d);
  const batch = new Batch();
  const textures = [];
  const colliders = [];
  const frames = [];
  const benches = [];
  const track = (t) => { textures.push(t); return t; };

  /* ───── Licht ───── */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xeceae6, 2.9);
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.1);
  sun.position.set(-6, 12, 8);
  const fill = new THREE.DirectionalLight(0xe8efff, 0.75);
  fill.position.set(7, 7, -9);
  scene.add(hemi, sun, fill);

  /* ───── Materialien ───── */
  const wallTex = track(T.wallTexture());
  const wallMat = (len) => {
    const t = wallTex.clone();
    t.repeat.set(Math.max(1, len / 3), 1);
    t.needsUpdate = true;
    return new THREE.MeshLambertMaterial({ map: t });
  };
  const blackTex = track(T.blackWallTexture());
  const blackWallMat = (len) => {
    const t = blackTex.clone();
    t.repeat.set(Math.max(1, len / 4), 1);
    t.needsUpdate = true;
    return new THREE.MeshLambertMaterial({ map: t });
  };
  const M = {
    white: new THREE.MeshLambertMaterial({ color: 0xf1f0ed }),
    black: new THREE.MeshLambertMaterial({ color: 0x15171b }),
    frame: new THREE.MeshLambertMaterial({ color: 0x0f1013 }),
    mat: new THREE.MeshLambertMaterial({ color: 0xf6f4f0 }),
    wood: new THREE.MeshLambertMaterial({ color: 0xd9c8a9 }),
    card: new THREE.MeshLambertMaterial({ color: 0xe9e8e4 }),
    glass: new THREE.MeshLambertMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.16, depthWrite: false }),
    wash: new THREE.MeshBasicMaterial({ map: track(T.washTexture()), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    shadow: new THREE.MeshBasicMaterial({ map: track(T.boxShadowTexture()), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    heart: new THREE.MeshBasicMaterial({ color: 0xff7a8a }),
  };

  /* ───── Hülle ───── */
  const W = HALL.maxX - HALL.minX, D = HALL.maxZ - HALL.minZ, cx = 0, cz = (HALL.minZ + HALL.maxZ) / 2;

  const floorTex = track(T.floorTexture());
  floorTex.repeat.set(W / 4, D / 4);
  const floor = new THREE.Mesh(plane(W, D), new THREE.MeshLambertMaterial({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz);
  scene.add(floor);

  const ceilTex = track(T.ceilingTexture());
  ceilTex.repeat.set(W / 0.9, D / 0.9);
  const ceil = new THREE.Mesh(plane(W, D), new THREE.MeshLambertMaterial({ map: ceilTex }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, HALL.h, cz);
  scene.add(ceil);

  const wallBox = (len, thick, x, z, rotY) => {
    const m = new THREE.Mesh(box(len, HALL.h, thick), wallMat(len));
    m.position.set(x, HALL.h / 2, z); m.rotation.y = rotY;
    scene.add(m);
  };
  wallBox(W + 0.6, 0.3, 0, HALL.minZ - 0.15, 0);                         // hinten
  wallBox(W + 0.6, 0.3, 0, HALL.maxZ + 0.15, 0);                         // vorn
  wallBox(D, 0.3, HALL.minX - 0.15, cz, Math.PI / 2);                    // links
  wallBox(D, 0.3, HALL.maxX + 0.15, cz, Math.PI / 2);                    // rechts

  /* ───── Podest unter der freistehenden schwarzen Wand ───── */
  const PL = { minX: -5.5, maxX: 5.5, minZ: -6.4, maxZ: -3.0, h: 0.2 };
  batch.add(box(PL.maxX - PL.minX, PL.h, PL.maxZ - PL.minZ), M.white, M4((PL.minX + PL.maxX) / 2, PL.h / 2, (PL.minZ + PL.maxZ) / 2));
  batch.add(plane(PL.maxX - PL.minX + 1.6, PL.maxZ - PL.minZ + 1.6), M.shadow, M4((PL.minX + PL.maxX) / 2, 0.006, (PL.minZ + PL.maxZ) / 2, 0, -Math.PI / 2));

  // schwarze freistehende Wand
  const FW = { x: 0, z: -5.6, w: 8.4, h: 3.9, d: 0.28 };
  const fwMesh = new THREE.Mesh(box(FW.w, FW.h, FW.d), blackWallMat(FW.w));
  fwMesh.position.set(FW.x, PL.h + FW.h / 2, FW.z);
  scene.add(fwMesh);
  colliders.push({ minX: FW.x - FW.w / 2, maxX: FW.x + FW.w / 2, minZ: FW.z - FW.d / 2, maxZ: FW.z + FW.d / 2, tall: true });

  // schwarzes Paneel an der Rückwand rechts
  const BP = { x: 9, w: 9, h: HALL.h };
  const bpMesh = new THREE.Mesh(box(BP.w, BP.h, 0.12), blackWallMat(BP.w));
  bpMesh.position.set(BP.x, BP.h / 2, HALL.minZ + 0.06);
  scene.add(bpMesh);

  // Trennwand links (weiß)
  const PW = { x: -8, z: -3.5, w: 5.2, h: 3.9, d: 0.22 };
  const pwMesh = new THREE.Mesh(box(PW.w, PW.h, PW.d), wallMat(PW.w));
  pwMesh.position.set(PW.x, PW.h / 2, PW.z);
  scene.add(pwMesh);
  colliders.push({ minX: PW.x - PW.w / 2, maxX: PW.x + PW.w / 2, minZ: PW.z - PW.d / 2, maxZ: PW.z + PW.d / 2, tall: true });
  batch.add(plane(PW.w + 1.4, PW.d + 1.4), M.shadow, M4(PW.x, 0.006, PW.z, 0, -Math.PI / 2));

  /* ───── Sockel mit Schild („For Emma“) ───── */
  const PED = { x: 9, z: -8.85, w: 3.2, h: 0.62, d: 1.0 };
  batch.add(box(PED.w, PED.h, PED.d), M.white, M4(PED.x, PED.h / 2, PED.z));
  batch.add(plane(PED.w + 1.2, PED.d + 1.2), M.shadow, M4(PED.x, 0.006, PED.z, 0, -Math.PI / 2));
  colliders.push({ minX: PED.x - PED.w / 2, maxX: PED.x + PED.w / 2, minZ: PED.z - PED.d / 2, maxZ: PED.z + PED.d / 2, tall: false });
  {
    const pt = track(T.plaqueTexture(CONFIG.plaque));
    const pm = new THREE.Mesh(plane(1.5, 0.82), new THREE.MeshBasicMaterial({ map: pt, toneMapped: false }));
    pm.position.set(PED.x - 0.9, PED.h + 0.41 + 0.02, PED.z + 0.15);
    pm.rotation.x = -0.42;
    pm.position.y += 0.02;
    scene.add(pm);
    batch.add(box(1.54, 0.86, 0.05), M.black, M4(pm.position.x, pm.position.y, pm.position.z - 0.03, 0, -0.42));
  }

  /* ───── Glasvitrine ───── */
  {
    const gx = -1.6, gz = -9.0;
    batch.add(box(0.62, 1.0, 0.62), M.white, M4(gx, 0.5, gz));
    batch.add(plane(1.8, 1.8), M.shadow, M4(gx, 0.006, gz, 0, -Math.PI / 2));
    batch.add(box(0.5, 0.5, 0.5), M.glass, M4(gx, 1.27, gz));
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), M.heart);
    heart.position.set(gx, 1.27, gz);
    heart.userData.bob = true;
    scene.add(heart);
    colliders.push({ minX: gx - 0.31, maxX: gx + 0.31, minZ: gz - 0.31, maxZ: gz + 0.31, tall: false });
    var heartMesh = heart;
  }

  /* ───── Rahmen ───── */
  const photoMats = new Map();
  const photoMat = (i) => {
    if (!photoMats.has(i)) photoMats.set(i, new THREE.MeshBasicMaterial({ map: photos[i].texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    return photoMats.get(i);
  };
  const wallSpots = []; // für Lichtkegel

  const addFrame = (spec, idx) => {
    const pi = idx % photos.length;
    const asp = photos[pi].aspect;
    const w = Math.min(spec.w, spec.h * asp), h = w / asp;
    const mat = 0.07, bd = 0.028;
    const ow = w + 2 * (mat + bd), oh = h + 2 * (mat + bd);
    const [x, y, z] = spec.pos;
    const base = M4(x, y, z, spec.ry);
    const local = (lx, ly, lz) => base.clone().multiply(M4(lx, ly, lz));
    batch.add(box(ow, oh, 0.05), M.frame, local(0, 0, 0.025));
    batch.add(box(w + 2 * mat, h + 2 * mat, 0.056), M.mat, local(0, 0, 0.028));
    const nx = Math.sin(spec.ry), nz = Math.cos(spec.ry);
    batch.add(plane(w, h), photoMat(pi), M4(x + nx * 0.0585, y, z + nz * 0.0585, spec.ry));
    // Beschriftungskarte
    const rx = Math.cos(spec.ry), rz = -Math.sin(spec.ry);
    const off = ow / 2 + 0.2;
    batch.add(box(0.15, 0.09, 0.012), M.card, M4(x + rx * off + nx * 0.006, y - oh / 2 + 0.16, z + rz * off + nz * 0.006, spec.ry));

    const center = new THREE.Vector3(x + nx * 0.06, y, z + nz * 0.06);
    const normal = new THREE.Vector3(nx, 0, nz);
    frames.push({
      index: frames.length,
      center,
      normal,
      w: ow,
      h: oh,
      top: center.clone().add(new THREE.Vector3(0, oh / 2 + 0.16, 0)),
      stand: new THREE.Vector3(x + nx * (spec.stand ?? 1.7), 0, z + nz * (spec.stand ?? 1.7)),
    });
    if (!spec.noSpot) wallSpots.push({ x, z, nx, nz, y });
  };

  const S = { w: 1.1, h: 1.45 }, B = { w: 1.35, h: 1.8 };
  const zc = FW.z + FW.d / 2 + 0.0, zb = FW.z - FW.d / 2;
  const specs = [
    // Rückwand rechts (großes Bild über dem Sockel)
    { pos: [BP.x, 2.2, HALL.minZ + 0.12], ry: 0, w: 1.55, h: 2.05, stand: 2.2 },
    // freistehende schwarze Wand – Vorderseite
    { pos: [-1.9, PL.h + 1.85, zc], ry: 0, ...B, stand: 2.2 },
    { pos: [1.9, PL.h + 1.85, zc], ry: 0, ...B, stand: 2.2 },
    // linke Wand
    { pos: [HALL.minX, 1.7, -6.5], ry: Math.PI / 2, ...S },
    { pos: [HALL.minX, 1.7, -2.2], ry: Math.PI / 2, ...S },
    { pos: [HALL.minX, 1.7, 2.2], ry: Math.PI / 2, ...S },
    { pos: [HALL.minX, 1.7, 6.5], ry: Math.PI / 2, ...S },
    // Rückwand links
    { pos: [-11, 1.7, HALL.minZ], ry: 0, ...S },
    { pos: [-5, 1.7, HALL.minZ], ry: 0, ...S },
    { pos: [3.2, 1.7, HALL.minZ], ry: 0, ...S },
    // Trennwand
    { pos: [-9.3, 1.7, PW.z + PW.d / 2], ry: 0, ...S },
    { pos: [-6.7, 1.7, PW.z + PW.d / 2], ry: 0, ...S },
    { pos: [-9.3, 1.7, PW.z - PW.d / 2], ry: Math.PI, ...S },
    { pos: [-6.7, 1.7, PW.z - PW.d / 2], ry: Math.PI, ...S },
    // freistehende Wand – Rückseite
    { pos: [-1.9, PL.h + 1.85, zb], ry: Math.PI, ...B },
    { pos: [1.9, PL.h + 1.85, zb], ry: Math.PI, ...B },
    // rechte Wand
    { pos: [HALL.maxX, 1.7, -7], ry: -Math.PI / 2, ...S },
    { pos: [HALL.maxX, 1.7, 5], ry: -Math.PI / 2, ...S },
    { pos: [HALL.maxX, 1.7, 9], ry: -Math.PI / 2, ...S },
  ];
  specs.forEach((s, i) => addFrame(s, i));

  /* ───── Lichtkegel an den Wänden + Schienenstrahler ───── */
  const up = new THREE.Vector3(0, 1, 0);
  const rail = (x, z, w, d) => batch.add(box(w, 0.05, d), M.black, M4(x, HALL.h - 0.03, z));
  rail(0, HALL.minZ + 1.0, W - 1, 0.05);
  rail(HALL.minX + 1.0, 0, 0.05, D - 1);
  rail(HALL.maxX - 1.0, 0, 0.05, D - 1);
  rail(0, -4.6, 8, 0.05);
  const spotted = new Set();
  const spotKey = (s) => `${Math.round(s.x * 0.5)}|${Math.round(s.z * 0.5)}|${s.nx.toFixed(1)}|${s.nz.toFixed(1)}`;
  for (const s of wallSpots) {
    const k = spotKey(s);
    if (spotted.has(k)) continue; spotted.add(k);
    batch.add(plane(2.7, 2.9), M.wash, M4(s.x + s.nx * 0.014, 2.75, s.z + s.nz * 0.014, Math.atan2(s.nx, s.nz)));
    const fx = s.x + s.nx * 0.85, fz = s.z + s.nz * 0.85, fy = HALL.h - 0.3;
    const dir = new THREE.Vector3(s.x - fx, 2.5 - fy, s.z - fz).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    batch.add(new THREE.CylinderGeometry(0.055, 0.07, 0.24, 10), M.black, new THREE.Matrix4().compose(new THREE.Vector3(fx, fy, fz), q, _s));
    batch.add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), M.black, M4(fx, HALL.h - 0.15, fz));
  }

  /* ───── Bänke ───── */
  const addBench = (x, z, yaw, len = 2.2) => {
    batch.add(box(len, 0.06, 0.46), M.wood, M4(x, 0.44, z, yaw));
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    for (const sgn of [-1, 1]) batch.add(box(0.05, 0.41, 0.36), M.black, M4(x + rx * sgn * (len / 2 - 0.2), 0.205, z + rz * sgn * (len / 2 - 0.2), yaw));
    batch.add(plane(len + 0.9, 1.5), M.shadow, M4(x, 0.006, z, yaw, -Math.PI / 2));
    colliders.push({ minX: x - (Math.abs(rx) * len + Math.abs(rz) * 0.46) / 2, maxX: x + (Math.abs(rx) * len + Math.abs(rz) * 0.46) / 2, minZ: z - (Math.abs(rz) * len + Math.abs(rx) * 0.46) / 2, maxZ: z + (Math.abs(rz) * len + Math.abs(rx) * 0.46) / 2, tall: false });
    const seats = [-0.5, 0.5].map((o) => ({ x: x + rx * o, z: z + rz * o, y: 0.47 }));
    benches.push({ index: benches.length, x, z, yaw, seats, seatBase: benches.length * 2 });
  };
  addBench(0, -1.9, Math.PI);          // vor der schwarzen Wand
  addBench(10.9, -1, Math.PI / 2);     // vor dem Screen

  /* ───── Wand-Screen ───── */
  {
    const sx = HALL.maxX - 0.07, sy = 1.95, sz = -1;
    batch.add(box(0.1, 2.2, 3.9), M.black, M4(sx, sy, sz));
    const sm = new THREE.Mesh(plane(3.6, 2.025), new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }));
    sm.position.set(sx - 0.055, sy, sz);
    sm.rotation.y = -Math.PI / 2;
    scene.add(sm);
    screen.mesh = sm;
  }

  batch.build(scene);

  /* ───── Boden-Höhe & Spawn ───── */
  const groundY = (x, z) => {
    const dx = Math.max(PL.minX - x, 0, x - PL.maxX), dz = Math.max(PL.minZ - z, 0, z - PL.maxZ);
    return PL.h * Math.max(0, 1 - Math.hypot(dx, dz) / 0.3);
  };
  const spawns = [[-0.8, 8.2], [0.8, 8.2], [-2.4, 8.6], [2.4, 8.6], [-0.8, 10], [0.8, 10]];

  return {
    scene,
    textures,
    colliders,
    frames,
    benches,
    groundY,
    spawns,
    update(t) {
      if (heartMesh) heartMesh.position.y = 1.27 + Math.sin(t * 1.6) * 0.03;
    },
  };
}
