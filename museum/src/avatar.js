import * as THREE from 'three';
import { blobTexture } from './textures.js';

/* Zwei Cartoon-Figuren, an Seb & Mia aus „La La Land“ angelehnt (bewusst witzig überzeichnet:
   große Köpfe, große Hände). Alles prozedural: Pivot-Hierarchie + Mathe-Animation, kein Modell-Download. */

export const CHARACTERS = { boy: 'Seb', girl: 'Mia' };

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
  if (!geoCache.has('cap')) geoCache.set('cap', new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.6));
  return geoCache.get('cap');
};
const skirtGeo = () => {
  if (!geoCache.has('skirt')) geoCache.set('skirt', new THREE.CylinderGeometry(0.15, 0.31, 0.4, 22, 1, true));
  return geoCache.get('skirt');
};

// Toon-Shading mit 3 Stufen → wirkt gezeichnet statt „Plastik“
let gradient;
const toonGradient = () => {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;
    gradient.needsUpdate = true;
  }
  return gradient;
};
const matCache = new Map();
const toon = (c, side) => {
  const k = `${c}|${side || 0}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient(), side: side || THREE.FrontSide }));
  return matCache.get(k);
};
let proxyMat;
const proxyMaterial = () => proxyMat || (proxyMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
const skirtShadowGeo = () => {
  if (!geoCache.has('skirtS')) geoCache.set('skirtS', new THREE.CylinderGeometry(0.15, 0.31, 0.4, 14));
  return geoCache.get('skirtS');
};
let blobMat;
const blobMaterial = () => blobMat || (blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));

function ball(mat, sx, sy, sz, x, y, z, parent) {
  const m = new THREE.Mesh(sphereGeo(), mat);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const pivot = (parent, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g;
};
function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HIP_H = 0.82;
const K = ['hipsY', 'torsoX', 'torsoY', 'torsoZ', 'headX', 'headY', 'headZ',
  'aLx', 'aLz', 'aRx', 'aRz', 'eL', 'eR', 'tLx', 'tLz', 'tRx', 'tRz', 'kL', 'kR', 'skirt', 'bodyY'];
const KI = Object.fromEntries(K.map((k, i) => [k, i]));

const SKIN = { boy: 0xe9b08e, girl: 0xf0bf9f };

export class Avatar {
  constructor(lookName = 'boy') {
    const mia = lookName === 'girl';
    this.look = mia ? 'girl' : 'boy';
    this.root = new THREE.Group();
    this.anim = 'idle';
    this.phase = 0;
    this.t = Math.random() * 10;
    this.cur = new Float32Array(K.length);
    this.tgt = new Float32Array(K.length);
    this.cur[KI.hipsY] = this.tgt[KI.hipsY] = HIP_H;
    this.lookYaw = 0;      // Blick-/Kopfdrehung zu einer anderen Figur (relativ zur Körperrichtung)
    this.talking = false;  // Mund bewegt sich, solange eine Sprechblase da ist
    this._look = 0; this._blinkAt = 1 + Math.random() * 3; this._blink = 0; this._mood = 0;

    const skin = toon(SKIN[this.look]);
    const white = toon(0xf4f1ea), dark = toon(0x2a1c18);
    // Seb: grauer Anzug, weißes Hemd, schmale schwarze Krawatte, braune Schuhe. Mia: gelbes Kleid, rotblonde Wellen.
    const C = mia
      ? { top: toon(0xf1c232), arm: skin, legs: skin, shoes: toon(0x1d1b1f), hair: toon(0xb5542d), brow: toon(0x8f4020) }
      : { top: toon(0x5c616c), arm: toon(0x5c616c), legs: toon(0x4a4e58), shoes: toon(0x6b4630), hair: toon(0x6a4a2a), brow: toon(0x4d3420) };

    const body = new THREE.Group();
    this.root.add(body);
    this.body = body;

    /* Hüfte & Oberkörper */
    this.hips = pivot(body, 0, HIP_H, 0);
    ball(mia ? C.top : C.legs, 0.155, 0.1, 0.115, 0, 0, 0, this.hips);
    this.torso = pivot(this.hips, 0, 0.03, 0);
    const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.19, 6, 14), C.top);
    chest.scale.set(1.1, 1, 0.82); chest.position.y = 0.23; this.torso.add(chest);
    if (!mia) {
      // Hemd-Streifen + Krawatte + Kragen
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.012), white);
      shirt.position.set(0, 0.27, 0.113); this.torso.add(shirt);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.24, 0.012), toon(0x16161a));
      tie.position.set(0, 0.25, 0.121); this.torso.add(tie);
      ball(white, 0.07, 0.03, 0.07, 0, 0.43, 0.04, this.torso);
    } else {
      ball(C.top, 0.15, 0.05, 0.1, 0, 0.38, 0, this.torso);
      this.skirt = pivot(this.hips, 0, 0.03, 0);
      const sk = new THREE.Mesh(skirtGeo(), toon(0xf5c92f, THREE.DoubleSide));
      sk.position.y = -0.17; sk.scale.z = 0.94; this.skirt.add(sk);
    }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10), skin);
    neck.position.y = 0.46; this.torso.add(neck);

    /* Kopf (groß, witzig) */
    this.head = pivot(this.torso, 0, 0.52, 0);
    ball(skin, 0.185, 0.178, 0.175, 0, 0.11, 0, this.head);
    ball(skin, 0.032, 0.048, 0.03, 0.18, 0.1, -0.005, this.head);
    ball(skin, 0.032, 0.048, 0.03, -0.18, 0.1, -0.005, this.head);
    this.eyes = [];   // Augen als Gruppe, damit das Blinzeln nur die Höhe skaliert
    this.brows = [];
    for (const sx of [-1, 1]) {
      const eye = pivot(this.head, sx * 0.07, 0.124, 0.158);
      ball(white, 0.04, 0.05, 0.022, 0, 0.001, -0.006, eye);
      ball(dark, 0.019, 0.028, 0.012, sx * 0.002, -0.002, 0.01, eye);
      ball(white, 0.006, 0.007, 0.004, sx * 0.008, 0.009, 0.02, eye);
      this.eyes.push(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(mia ? 0.06 : 0.075, mia ? 0.011 : 0.02, 0.012), C.brow);
      brow.position.set(sx * 0.073, mia ? 0.185 : 0.178, 0.16); brow.rotation.z = sx * (mia ? 0.18 : -0.1); this.head.add(brow);
      this.brows.push({ m: brow, y: brow.position.y });
    }
    // Nase (bei Seb markanter) & Lächeln
    ball(skin, mia ? 0.024 : 0.036, mia ? 0.026 : 0.04, mia ? 0.03 : 0.04, 0, 0.085, 0.178, this.head);
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.0075, 6, 16, Math.PI), toon(0x8a3a3a));
    smile.rotation.z = Math.PI; smile.position.set(0, 0.062, 0.162); smile.scale.set(1, 0.8, 1); this.head.add(smile);
    this.smile = smile;
    this.cheeks = [];
    if (mia) {
      const blush = toon(0xf0a08e);
      this.cheeks.push(ball(blush, 0.032, 0.02, 0.01, 0.105, 0.075, 0.15, this.head), ball(blush, 0.032, 0.02, 0.01, -0.105, 0.075, 0.15, this.head));
    } else {
      ball(skin, 0.07, 0.04, 0.05, 0, 0.012, 0.13, this.head);               // markantes Kinn
    }

    /* Haare */
    const cap = new THREE.Mesh(capGeo(), C.hair);
    cap.scale.set(0.2, 0.2, 0.195); cap.position.set(0, 0.115, -0.006); cap.rotation.x = -0.58;
    this.head.add(cap);
    if (mia) {
      // Wellen bis zur Schulter, Seitenscheitel, Locken-Enden
      const back = new THREE.Mesh(limbGeo(0.12, 0.2), C.hair);
      back.scale.set(1.45, 1, 0.8); back.position.set(0, 0.16, -0.1); this.head.add(back);
      for (const sx of [-1, 1]) {
        const side = new THREE.Mesh(limbGeo(0.052, 0.16), C.hair);
        side.position.set(sx * 0.178, 0.1, 0.0); side.rotation.z = sx * 0.12; this.head.add(side);
        ball(C.hair, 0.075, 0.075, 0.075, sx * 0.205, -0.1, 0.0, this.head);
        ball(C.hair, 0.07, 0.07, 0.07, sx * 0.17, -0.12, -0.07, this.head);
      }
      ball(C.hair, 0.12, 0.07, 0.085, -0.04, 0.265, 0.1, this.head);      // Seitenscheitel-Welle
      ball(C.hair, 0.09, 0.05, 0.07, 0.09, 0.245, 0.11, this.head);
    } else {
      // zurückgegelte Tolle
      ball(C.hair, 0.15, 0.1, 0.17, 0, 0.26, 0.05, this.head);
      ball(C.hair, 0.12, 0.07, 0.12, 0, 0.3, 0.0, this.head);
      for (const sx of [-1, 1]) ball(C.hair, 0.022, 0.07, 0.03, sx * 0.178, 0.15, 0.04, this.head);   // Koteletten
      ball(C.hair, 0.16, 0.1, 0.12, 0, 0.13, -0.11, this.head);
    }

    /* Arme: Seb mit langen Ärmeln & Manschetten, Mia mit kurzen Ärmeln */
    const arm = (side) => {
      const sh = pivot(this.torso, side * 0.205, 0.38, 0);
      ball(mia ? C.top : C.arm, 0.062, 0.062, 0.062, 0, 0, 0, sh);
      const up = new THREE.Mesh(limbGeo(0.056, 0.16), mia ? skin : C.arm); sh.add(up);
      if (mia) ball(C.top, 0.066, 0.07, 0.066, 0, -0.02, 0, sh);
      const el = pivot(sh, 0, -0.27, 0);
      const lo = new THREE.Mesh(limbGeo(0.05, 0.15), C.arm); el.add(lo);
      if (!mia) ball(white, 0.05, 0.03, 0.05, 0, -0.245, 0, el);
      ball(skin, 0.058, 0.066, 0.05, 0, -0.29, 0.005, el);
      return { sh, el };
    };
    const aL = arm(1), aR = arm(-1);
    this.shL = aL.sh; this.elL = aL.el; this.shR = aR.sh; this.elR = aR.el;

    /* Beine */
    const leg = (side) => {
      const th = pivot(this.hips, side * 0.088, -0.02, 0);
      const up = new THREE.Mesh(limbGeo(0.082, 0.22), C.legs); th.add(up);
      const kn = pivot(th, 0, -0.37, 0);
      const lo = new THREE.Mesh(limbGeo(0.068, 0.24), C.legs); kn.add(lo);
      ball(C.shoes, 0.078, 0.058, 0.145, 0, -0.385, 0.05, kn);
      return { th, kn };
    };
    const lL = leg(1), lR = leg(-1);
    this.thL = lL.th; this.knL = lL.kn; this.thR = lR.th; this.knR = lR.kn;

    this._addShadowProxies(mia);

    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), blobMaterial());
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; blob.renderOrder = 2;
    this.root.add(blob);
  }

  /* Schatten: wenige unsichtbare Hüllen (Rumpf, Kopf, Arme, Beine) werfen den Schatten, statt der ~70 sichtbaren Teile.
     Sie hängen an denselben Gelenken und bewegen sich daher mit jeder Animation mit. */
  _addShadowProxies(mia) {
    const mat = proxyMaterial();
    const add = (geo, parent, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true; m.position.set(x, y, z); m.scale.set(sx, sy, sz);
      parent.add(m); return m;
    };
    add(sphereGeo(), this.hips, 0, 0, 0, 0.16, 0.11, 0.12);
    add(limbGeo(0.14, 0.2), this.torso, 0, 0.46, 0, 1.15, 1, 0.78);
    add(sphereGeo(), this.head, 0, 0.11, 0, 0.19, 0.18, 0.18);
    for (const [sh, el] of [[this.shL, this.elL], [this.shR, this.elR]]) {
      add(limbGeo(0.052, 0.17), sh); add(limbGeo(0.046, 0.15), el);
      add(sphereGeo(), el, 0, -0.29, 0, 0.055, 0.065, 0.05);
    }
    for (const [th, kn] of [[this.thL, this.knL], [this.thR, this.knR]]) {
      add(limbGeo(0.082, 0.22), th); add(limbGeo(0.068, 0.24), kn);
      add(sphereGeo(), kn, 0, -0.385, 0.05, 0.075, 0.058, 0.14);
    }
    if (mia) add(skirtShadowGeo(), this.skirt, 0, -0.17, 0, 1, 1, 0.94);
  }

  setAnim(a) { this.anim = a; }

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
      tg[KI.aLz] = 0.08; tg[KI.aRz] = -0.08;
      tg[KI.eL] = -(run ? 1.1 : 0.3) - Math.max(0, s) * 0.2; tg[KI.eR] = -(run ? 1.1 : 0.3) - Math.max(0, -s) * 0.2;
      tg[KI.hipsY] = HIP_H - 0.03 + Math.abs(c) * (run ? 0.045 : 0.025);
      tg[KI.torsoX] = run ? 0.16 : 0.04;
      tg[KI.torsoY] = s * 0.1; tg[KI.headY] = -s * 0.06;
      tg[KI.skirt] = -0.1 * Math.abs(s) - (run ? 0.12 : 0.04);
    } else if (a === 'sit') {
      tg[KI.hipsY] = 0.09;
      tg[KI.tLx] = tg[KI.tRx] = -1.5; tg[KI.tLz] = 0.05; tg[KI.tRz] = -0.05;
      tg[KI.kL] = tg[KI.kR] = 1.5;
      tg[KI.aLx] = tg[KI.aRx] = -0.5; tg[KI.eL] = tg[KI.eR] = -0.95;
      tg[KI.aLz] = 0.12; tg[KI.aRz] = -0.12;
      tg[KI.torsoX] = -0.02 + breathe * 0.01;
      tg[KI.headY] = Math.sin(t * 0.5) * 0.14; tg[KI.headX] = 0.03;
      tg[KI.skirt] = -1.25;
    } else if (a === 'dance') {
      const p = t * 5.2, s = Math.sin(p), c = Math.cos(p), s2 = Math.sin(p * 0.5);
      tg[KI.hipsY] = HIP_H - 0.08 + Math.abs(s) * 0.07;
      tg[KI.aLz] = 1.38 + s * 0.08; tg[KI.aRz] = -1.38 + s * 0.08;
      tg[KI.aLx] = c * 0.18; tg[KI.aRx] = -c * 0.18;
      tg[KI.eL] = -0.15 - Math.max(0, s) * 0.3; tg[KI.eR] = -0.15 - Math.max(0, -s) * 0.3;
      tg[KI.tLz] = 0.2; tg[KI.tRz] = -0.2;
      tg[KI.tLx] = -0.38 + s2 * 0.5; tg[KI.tRx] = -0.38 - s2 * 0.5;
      tg[KI.kL] = 0.75 + Math.max(0, -s2) * 0.6; tg[KI.kR] = 0.75 + Math.max(0, s2) * 0.6;
      tg[KI.torsoY] = s2 * 0.35; tg[KI.torsoZ] = s * 0.07;
      tg[KI.headZ] = -s * 0.1; tg[KI.headY] = -s2 * 0.2;
      tg[KI.skirt] = -0.25 + s2 * 0.25;
    } else if (a === 'clap') {
      const c = Math.abs(Math.sin(t * 9));
      tg[KI.aLx] = tg[KI.aRx] = -1.05; tg[KI.aLz] = 0.32 - c * 0.3; tg[KI.aRz] = -0.32 + c * 0.3;
      tg[KI.eL] = tg[KI.eR] = -1.35;
      tg[KI.torsoX] = 0.05; tg[KI.headX] = -0.05 + c * 0.05; tg[KI.headZ] = Math.sin(t * 4.5) * 0.06;
      tg[KI.hipsY] = HIP_H - 0.01 + c * 0.012;
      tg[KI.tLz] = 0.04; tg[KI.tRz] = -0.04;
    } else if (a === 'heart') {
      // beide Hände aufs Herz, leichtes Wiegen
      const sw = Math.sin(t * 2.4);
      tg[KI.aLx] = tg[KI.aRx] = -0.55; tg[KI.aLz] = 0.2; tg[KI.aRz] = -0.2;
      tg[KI.eL] = tg[KI.eR] = -1.9;
      tg[KI.headZ] = 0.14 + sw * 0.04; tg[KI.torsoZ] = sw * 0.05; tg[KI.headX] = 0.06;
      tg[KI.hipsY] = HIP_H + Math.sin(t * 4.8) * 0.006;
      tg[KI.tLz] = 0.04; tg[KI.tRz] = -0.04;
    } else if (a === 'bow') {
      const ph = this.emoteT || 0;   // Sekunden seit Start der Emote (Actor)
      const d = ph < 0.5 ? ph / 0.5 : ph < 1.5 ? 1 : Math.max(0, 1 - (ph - 1.5) / 0.6);
      tg[KI.torsoX] = 0.95 * d; tg[KI.headX] = 0.25 * d;
      tg[KI.aLx] = tg[KI.aRx] = 0.35 * d; tg[KI.aLz] = 0.12; tg[KI.aRz] = -0.12;
      tg[KI.hipsY] = HIP_H - 0.02 * d;
      tg[KI.tLx] = tg[KI.tRx] = -0.15 * d;
    } else if (a === 'cheer') {
      const jump = Math.abs(Math.sin(t * 6.5));
      tg[KI.bodyY] = jump * 0.2;
      tg[KI.aLz] = 2.65 + Math.sin(t * 13) * 0.12; tg[KI.aRz] = -2.65 - Math.sin(t * 13 + 1) * 0.12;
      tg[KI.eL] = tg[KI.eR] = -0.2;
      tg[KI.tLx] = tg[KI.tRx] = -0.25 * jump; tg[KI.kL] = tg[KI.kR] = 0.5 * jump;
      tg[KI.hipsY] = HIP_H - 0.05 + jump * 0.05;
      tg[KI.headX] = -0.18; tg[KI.torsoX] = -0.08;
      tg[KI.skirt] = -0.5 * jump;
    } else if (a === 'wave') {
      tg[KI.aRz] = -2.65; tg[KI.aRx] = 0.1;
      tg[KI.eR] = -0.5 + Math.sin(t * 9) * 0.55;
      tg[KI.aLz] = 0.1; tg[KI.aLx] = Math.sin(t * 1.5) * 0.03;
      tg[KI.headZ] = 0.1; tg[KI.torsoZ] = 0.03;
      tg[KI.tLz] = 0.03; tg[KI.tRz] = -0.03;
    } else {
      tg[KI.aLz] = 0.11 + breathe * 0.01; tg[KI.aRz] = -0.11 - breathe * 0.01;
      tg[KI.aLx] = Math.sin(t * 1.3) * 0.03; tg[KI.aRx] = -Math.sin(t * 1.3) * 0.03;
      tg[KI.eL] = tg[KI.eR] = -0.12;
      tg[KI.torsoX] = breathe * 0.008; tg[KI.hipsY] = HIP_H + breathe * 0.004;
      tg[KI.headY] = Math.sin(t * 0.43) * 0.1; tg[KI.headX] = Math.sin(t * 0.31) * 0.03;
      tg[KI.tLz] = 0.03; tg[KI.tRz] = -0.03;
      // selten: Kopf neigen, Schultern zucken, Gewicht verlagern
      const f = Math.pow(Math.max(0, Math.sin(t * 0.43 + 1.3)), 12);
      tg[KI.headZ] = f * 0.14; tg[KI.torsoZ] = f * 0.035; tg[KI.aLz] += f * 0.08; tg[KI.aRz] -= f * 0.08;
      const g = Math.pow(Math.max(0, Math.sin(t * 0.27 + 0.4)), 16);
      tg[KI.tLz] += g * 0.05; tg[KI.tRz] += g * 0.02; tg[KI.hipsY] -= g * 0.012;
    }

    // Blickkontakt: Kopf dreht sich zur anderen Figur (nur wenn sie nicht zu weit hinten steht)
    this._look += (this.lookYaw - this._look) * (1 - Math.exp(-5 * dt));
    if (a !== 'bow' && a !== 'sit') tg[KI.headY] += this._look * 0.85;
    else if (a === 'sit') tg[KI.headY] += this._look * 0.6;

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
    if (this.skirt) this.skirt.rotation.x = c[KI.skirt];
    this.body.position.y = c[KI.bodyY];

    // Gesicht: Blinzeln, Sprechen, gute Laune
    this._blinkAt -= dt;
    if (this._blinkAt <= 0) { this._blink = 0.14; this._blinkAt = 2.2 + Math.random() * 4.5; }
    let open = 1;
    if (this._blink > 0) { this._blink -= dt; open = Math.abs(this._blink / 0.07 - 1) ; open = Math.max(0.08, open); }
    const happy = a === 'heart' || a === 'cheer' || a === 'dance' || a === 'clap' || a === 'wave' ? 1 : 0;
    this._mood += (happy - this._mood) * (1 - Math.exp(-6 * dt));
    for (const e of this.eyes) e.scale.y = open * (1 - 0.25 * this._mood);
    for (const b of this.brows) b.m.position.y = b.y + 0.012 * this._mood + (this.talking ? 0.006 * Math.sin(t * 9) : 0);
    const talk = this.talking ? 0.5 + 0.5 * Math.abs(Math.sin(t * 13)) : 0;
    this.smile.scale.set(1 + 0.25 * this._mood, 0.8 + 0.45 * this._mood + talk * 0.6, 1);
    for (const ch of this.cheeks) ch.scale.set(0.032 * (1 + 0.5 * (a === 'heart' ? 1 : this._mood * 0.4)), 0.02 * (1 + 0.5 * (a === 'heart' ? 1 : this._mood * 0.4)), 0.01);
  }
}
