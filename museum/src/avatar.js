import * as THREE from 'three';
import { blobTexture } from './textures.js';

/* Stilisierte, vollständig prozedurale Figuren (kein Modell-Download).
   Skelett = Hierarchie aus Pivots, Animation = reine Mathematik → kostet praktisch nichts. */

export const LOOKS = {
  boy: {
    skin: 0xe6aa88, top: 0x2b7882, vest: 0x2d323b, pants: 0x2b3450, shoes: 0x1c1d21,
    hair: 0x4a3024, hairStyle: 'curly', scale: 1.0,
  },
  girl: {
    skin: 0xe0a888, top: 0xb52f36, vest: null, pants: 0x2d3039, shoes: 0x33261f,
    hair: 0x55321f, hairStyle: 'long', scale: 0.955,
  },
};

const geoCache = new Map();
const limbGeo = (r, len) => {
  const k = `l${r}|${len}`;
  if (!geoCache.has(k)) { const g = new THREE.CapsuleGeometry(r, len, 5, 12); g.translate(0, -(len / 2 + r), 0); geoCache.set(k, g); }
  return geoCache.get(k);
};
const sphereGeo = () => {
  if (!geoCache.has('s')) geoCache.set('s', new THREE.SphereGeometry(1, 20, 14));
  return geoCache.get('s');
};
const capGeo = () => {
  if (!geoCache.has('cap')) geoCache.set('cap', new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.62));
  return geoCache.get('cap');
};
const matCache = new Map();
const lam = (c) => {
  if (!matCache.has(c)) matCache.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return matCache.get(c);
};
let blobMat;
const blobMaterial = () => blobMat || (blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));

function ball(mat, sx, sy, sz, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(sphereGeo(), mat);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
const pivot = (parent, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g;
};

const HIP_H = 0.9;

// Pose-Kanäle
const K = ['hipsY', 'torsoX', 'torsoY', 'torsoZ', 'headX', 'headY', 'headZ',
  'aLx', 'aLz', 'aRx', 'aRz', 'eL', 'eR', 'tLx', 'tLz', 'tRx', 'tRz', 'kL', 'kR'];
const KI = Object.fromEntries(K.map((k, i) => [k, i]));

export class Avatar {
  constructor(lookName = 'boy') {
    const L = LOOKS[lookName] || LOOKS.boy;
    this.look = lookName;
    this.root = new THREE.Group();
    this.anim = 'idle';
    this.phase = 0;
    this.t = Math.random() * 10;
    this.cur = new Float32Array(K.length);
    this.tgt = new Float32Array(K.length);
    this.cur[KI.hipsY] = HIP_H;
    this.tgt[KI.hipsY] = HIP_H;

    const skin = lam(L.skin), top = lam(L.top), pants = lam(L.pants), shoes = lam(L.shoes), hair = lam(L.hair);
    const body = new THREE.Group();
    body.scale.setScalar(L.scale);
    this.root.add(body);
    this.body = body;

    // Hüfte
    this.hips = pivot(body, 0, HIP_H, 0);
    ball(pants, 0.165, 0.105, 0.115, 0, 0.0, 0, this.hips);

    // Oberkörper
    this.torso = pivot(this.hips, 0, 0.04, 0);
    const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.25, 6, 14), top);
    chest.scale.set(1.15, 1, 0.76); chest.position.y = 0.27; this.torso.add(chest);
    if (L.vest) {
      const vest = new THREE.Mesh(new THREE.CapsuleGeometry(0.146, 0.21, 6, 14), lam(L.vest));
      vest.scale.set(1.17, 1, 0.84); vest.position.set(0, 0.25, 0.004); this.torso.add(vest);
      ball(top, 0.075, 0.05, 0.06, 0, 0.54, 0.03, this.torso);   // Hemdkragen
    }
    // Hals & Kopf
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.1, 10), skin);
    neck.position.y = 0.58; this.torso.add(neck);
    this.head = pivot(this.torso, 0, 0.67, 0);
    ball(skin, 0.122, 0.138, 0.13, 0, 0.075, 0.005, this.head);
    // Augen & Brauen
    const eye = lam(0x2a1c18);
    ball(eye, 0.016, 0.023, 0.01, 0.048, 0.07, 0.122, this.head);
    ball(eye, 0.016, 0.023, 0.01, -0.048, 0.07, 0.122, this.head);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.007, 0.006), lam(L.hair));
    const b1 = brow.clone(); b1.position.set(0.05, 0.108, 0.122); b1.rotation.z = -0.1; this.head.add(b1);
    const b2 = brow.clone(); b2.position.set(-0.05, 0.108, 0.122); b2.rotation.z = 0.1; this.head.add(b2);
    ball(lam(0xc0705f), 0.018, 0.0065, 0.008, 0, 0.022, 0.126, this.head); // Mund
    ball(skin, 0.013, 0.016, 0.014, 0, 0.05, 0.133, this.head); // Nase
    // Haare
    const cap = new THREE.Mesh(capGeo(), hair);
    cap.scale.set(0.133, 0.148, 0.14); cap.position.set(0, 0.078, -0.004); cap.rotation.x = -0.62;
    this.head.add(cap);
    if (L.hairStyle === 'long') {
      const back = new THREE.Mesh(limbGeo(0.1, 0.3), hair);
      back.scale.set(1.2, 1, 0.62); back.position.set(0, 0.12, -0.085); back.rotation.x = 0.06; this.head.add(back);
      for (const sx of [-1, 1]) {
        const side = new THREE.Mesh(limbGeo(0.03, 0.27), hair);
        side.position.set(sx * 0.118, 0.1, 0.02); side.rotation.z = sx * 0.04; this.head.add(side);
      }
      // Pony
      ball(hair, 0.105, 0.04, 0.07, 0.014, 0.185, 0.07, this.head);
    } else {
      // Locken
      const rnd = mulberry(7);
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2, e = 0.25 + rnd() * 0.75;
        const r = 0.12;
        ball(hair, 0.046, 0.046, 0.046, Math.cos(a) * r * Math.sin(e), 0.085 + r * 1.15 * Math.cos(e), Math.sin(a) * r * Math.sin(e) - 0.015, this.head);
      }
    }

    // Arme
    const arm = (side) => {
      const sh = pivot(this.torso, side * 0.205, 0.5, 0);
      ball(top, 0.054, 0.054, 0.054, 0, 0, 0, sh);
      const up = new THREE.Mesh(limbGeo(0.052, 0.19), top); sh.add(up);
      const el = pivot(sh, 0, -0.29, 0);
      const lo = new THREE.Mesh(limbGeo(0.046, 0.17), top); el.add(lo);
      ball(skin, 0.05, 0.058, 0.042, 0, -0.29, 0.005, el);
      return { sh, el };
    };
    const aL = arm(1), aR = arm(-1);
    this.shL = aL.sh; this.elL = aL.el; this.shR = aR.sh; this.elR = aR.el;

    // Beine
    const leg = (side) => {
      const th = pivot(this.hips, side * 0.092, -0.02, 0);
      const up = new THREE.Mesh(limbGeo(0.08, 0.24), pants); th.add(up);
      const kn = pivot(th, 0, -0.38, 0);
      const lo = new THREE.Mesh(limbGeo(0.064, 0.27), pants); kn.add(lo);
      ball(shoes, 0.072, 0.056, 0.135, 0, -0.4, 0.05, kn);
      return { th, kn };
    };
    const lL = leg(1), lR = leg(-1);
    this.thL = lL.th; this.knL = lL.kn; this.thR = lR.th; this.knR = lR.kn;

    // Blob-Schatten
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), blobMaterial());
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; blob.renderOrder = 2;
    this.root.add(blob);
    this.blob = blob;

    this.root.traverse((o) => { if (o.isMesh && o !== blob) { o.matrixAutoUpdate = true; } });
  }

  setAnim(a) { this.anim = a; }

  /* speed: aktuelle Bewegungsgeschwindigkeit (m/s) für Schrittfrequenz */
  update(dt, speed = 0) {
    this.t += dt;
    const t = this.t, tg = this.tgt, a = this.anim;
    tg.fill(0); tg[KI.hipsY] = HIP_H;
    const breathe = Math.sin(t * 1.9);

    if (a === 'walk' || a === 'run') {
      const run = a === 'run';
      this.phase += dt * (run ? 11.5 : 7.4) * Math.min(1.25, Math.max(0.6, speed / (run ? 4.2 : 2.5)));
      const p = this.phase, s = Math.sin(p), c = Math.cos(p);
      const A = run ? 0.95 : 0.62;
      tg[KI.tLx] = s * A; tg[KI.tRx] = -s * A;
      tg[KI.kL] = Math.max(0, -c) * (run ? 1.5 : 0.95); tg[KI.kR] = Math.max(0, c) * (run ? 1.5 : 0.95);
      tg[KI.aLx] = -s * (run ? 0.95 : 0.55); tg[KI.aRx] = s * (run ? 0.95 : 0.55);
      tg[KI.aLz] = 0.06; tg[KI.aRz] = -0.06;
      tg[KI.eL] = -(run ? 1.1 : 0.3) - Math.max(0, s) * 0.2; tg[KI.eR] = -(run ? 1.1 : 0.3) - Math.max(0, -s) * 0.2;
      tg[KI.hipsY] = HIP_H - 0.01 + Math.abs(c) * (run ? 0.045 : 0.025) - 0.02;
      tg[KI.torsoX] = run ? 0.16 : 0.04;
      tg[KI.torsoY] = s * 0.1; tg[KI.headY] = -s * 0.06;
    } else if (a === 'sit') {
      tg[KI.hipsY] = 0.095;
      tg[KI.tLx] = tg[KI.tRx] = -1.5; tg[KI.tLz] = 0.05; tg[KI.tRz] = -0.05;
      tg[KI.kL] = tg[KI.kR] = 1.5;
      tg[KI.aLx] = tg[KI.aRx] = -0.5; tg[KI.eL] = tg[KI.eR] = -0.95;
      tg[KI.aLz] = 0.1; tg[KI.aRz] = -0.1;
      tg[KI.torsoX] = -0.02 + breathe * 0.01;
      tg[KI.headY] = Math.sin(t * 0.5) * 0.14; tg[KI.headX] = 0.03;
    } else if (a === 'dance') {
      const p = t * 5.2, s = Math.sin(p), c = Math.cos(p), s2 = Math.sin(p * 0.5);
      tg[KI.hipsY] = HIP_H - 0.07 + Math.abs(s) * 0.07;
      tg[KI.aLz] = 1.38 + s * 0.08; tg[KI.aRz] = -1.38 + s * 0.08;
      tg[KI.aLx] = c * 0.18; tg[KI.aRx] = -c * 0.18;
      tg[KI.eL] = -0.15 - Math.max(0, s) * 0.3; tg[KI.eR] = -0.15 - Math.max(0, -s) * 0.3;
      tg[KI.tLz] = 0.2; tg[KI.tRz] = -0.2;
      tg[KI.tLx] = -0.38 + s2 * 0.5; tg[KI.tRx] = -0.38 - s2 * 0.5;
      tg[KI.kL] = 0.75 + Math.max(0, -s2) * 0.6; tg[KI.kR] = 0.75 + Math.max(0, s2) * 0.6;
      tg[KI.torsoY] = s2 * 0.35; tg[KI.torsoZ] = s * 0.07;
      tg[KI.headZ] = -s * 0.1; tg[KI.headY] = -s2 * 0.2;
    } else if (a === 'wave') {
      tg[KI.aRz] = -2.65; tg[KI.aRx] = 0.1;
      tg[KI.eR] = -0.5 + Math.sin(t * 9) * 0.55;
      tg[KI.aLz] = 0.08; tg[KI.aLx] = Math.sin(t * 1.5) * 0.03;
      tg[KI.headZ] = 0.1; tg[KI.torsoZ] = 0.03;
      tg[KI.tLz] = 0.03; tg[KI.tRz] = -0.03;
    } else {
      // idle
      tg[KI.aLz] = 0.09 + breathe * 0.01; tg[KI.aRz] = -0.09 - breathe * 0.01;
      tg[KI.aLx] = Math.sin(t * 1.3) * 0.03; tg[KI.aRx] = -Math.sin(t * 1.3) * 0.03;
      tg[KI.eL] = tg[KI.eR] = -0.12;
      tg[KI.torsoX] = breathe * 0.008; tg[KI.hipsY] = HIP_H + breathe * 0.004;
      tg[KI.headY] = Math.sin(t * 0.43) * 0.1; tg[KI.headX] = Math.sin(t * 0.31) * 0.03;
      tg[KI.tLz] = 0.03; tg[KI.tRz] = -0.03;
    }

    const k = 1 - Math.exp(-16 * dt), c = this.cur;
    for (let i = 0; i < K.length; i++) c[i] += (tg[i] - c[i]) * k;

    this.hips.position.y = c[KI.hipsY];
    this.torso.rotation.set(c[KI.torsoX], c[KI.torsoY], c[KI.torsoZ]);
    this.head.rotation.set(c[KI.headX], c[KI.headY], c[KI.headZ]);
    this.shL.rotation.set(c[KI.aLx], 0, c[KI.aLz]);
    this.shR.rotation.set(c[KI.aRx], 0, c[KI.aRz]);
    this.elL.rotation.x = c[KI.eL]; this.elR.rotation.x = c[KI.eR];
    this.thL.rotation.set(c[KI.tLx], 0, c[KI.tLz]);
    this.thR.rotation.set(c[KI.tRx], 0, c[KI.tRz]);
    this.knL.rotation.x = c[KI.kL]; this.knR.rotation.x = c[KI.kR];
  }
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
