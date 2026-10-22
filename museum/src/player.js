import * as THREE from 'three';
import { angDiff } from './actors.js';
import { t } from './i18n.js';

const RADIUS = 0.3;
const WALK = 2.5, RUN = 4.4;

/* ───────────── Kamera ───────────── */
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0; this.pitch = 0.3; this.dist = 4.4;
    this.pos = new THREE.Vector3(0, 3, 12);
    this.look = new THREE.Vector3(0, 1.4, 8);
    this._d = new THREE.Vector3(); this._t = new THREE.Vector3(); this._l = new THREE.Vector3();
    this.snapNext = true;
    this.bounds = { minX: -12, maxX: 12, minZ: -9, maxZ: 11 };
  }

  /* Sichtfeld-abhängige Distanz, bei der ein Rahmen den Screen füllt. */
  fitDistance(frame) {
    const f = this.camera.fov * Math.PI / 360;
    const dh = (frame.h * 1.4) / (2 * Math.tan(f));
    const dw = (frame.w * 1.3) / (2 * Math.tan(f) * this.camera.aspect);
    return Math.max(dh, dw, 1.1);
  }

  update(dt, input, local, colliders, mode, frame) {
    // Eingabe
    if (input.lookDX || input.lookDY) {
      const sens = input.touch ? 0.0065 : 0.0048;
      this.yaw -= input.lookDX * sens;
      this.pitch = Math.max(-0.25, Math.min(1.15, this.pitch + input.lookDY * sens));
    }
    if (input.turn) this.yaw -= input.turn * 1.9 * dt;
    if (input.zoom) this.dist = Math.max(1.8, Math.min(7, this.dist + input.zoom * 0.45));

    const target = this._t, want = this._d, look = this._l;
    let rate;
    if (mode === 'viewing' && frame) {
      const d = this.fitDistance(frame);
      look.copy(frame.center);
      want.copy(frame.center).addScaledVector(frame.normal, d);
      rate = 3.6;
    } else {
      const p = local.pos;
      target.set(p.x, p.y + (local.anim === 'sit' ? 1.0 : 1.38), p.z);
      const cp = Math.cos(this.pitch);
      want.set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);
      let d = this.dist;
      d = this._clip(target, want, d, colliders);
      want.multiplyScalar(d).add(target);
      const B = this.bounds;
      want.x = Math.max(B.minX + 0.2, Math.min(B.maxX - 0.2, want.x));
      want.z = Math.max(B.minZ + 0.2, Math.min(B.maxZ - 0.2, want.z));
      want.y = Math.max(0.35, Math.min(3.9, want.y));
      look.copy(target);
      rate = mode === 'approach' || mode === 'reading' ? 6 : 24;
    }
    if (this.snapNext) { this.pos.copy(want); this.look.copy(look); this.snapNext = false; }
    const k = 1 - Math.exp(-rate * dt);
    this.pos.lerp(want, k);
    this.look.lerp(look, k);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }

  /* Kürzt die Kamera-Distanz an hohen Wänden (Strahl vs. AABB in XZ). */
  _clip(origin, dir, dist, colliders) {
    let best = dist;
    const ox = origin.x, oz = origin.z, dx = dir.x, dz = dir.z;
    for (const c of colliders) {
      if (!c.tall) continue;
      const m = 0.2;
      let tmin = 0, tmax = best + 0.3;
      let ok = true;
      for (const [o, d, lo, hi] of [[ox, dx, c.minX - m, c.maxX + m], [oz, dz, c.minZ - m, c.maxZ + m]]) {
        if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { ok = false; break; } continue; }
        let t1 = (lo - o) / d, t2 = (hi - o) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
        if (tmin > tmax) { ok = false; break; }
      }
      if (ok && tmin > 0.05 && tmin < best) best = tmin;
    }
    return Math.max(0.9, best - 0.15);
  }
}

/* ───────────── Lokaler Spieler ───────────── */
export class LocalPlayer {
  constructor(actor, world, input, rig) {
    this.actor = actor; this.world = world; this.input = input; this.rig = rig;
    this.state = 'free';           // free | approach | viewing | reading | sitting
    this.onRead = () => {}; this.onCloseRead = () => {};
    this.frame = null; this.seatInfo = null;
    this.vel = new THREE.Vector2();
    this.waveT = 0; this.dancing = false;
    this.prompt = null;
    this._lastMove = 0;
    this._others = () => [];
  }

  get pos() { return this.actor.pos; }
  get anim() { return this.actor.anim; }

  spawn(i) {
    const [x, z] = this.world.spawns[i % this.world.spawns.length];
    this.actor.pos.set(x, this.world.groundY(x, z), z);
    this.actor.heading = Math.PI;
    this.rig.yaw = 0;
    this.rig.snapNext = true;
  }

  setOthers(fn) { this._others = fn; }

  _seatTaken(id) { return this._others().some((o) => o.seat === id); }

  _nearestSeat() {
    const p = this.actor.pos;
    let best = null, bd = 1.55;
    for (const b of this.world.benches) {
      b.seats.forEach((s, i) => {
        const id = b.seatBase + i;
        if (this._seatTaken(id)) return;
        const d = Math.hypot(s.x - p.x, s.z - p.z);
        if (d < bd) { bd = d; best = { bench: b, seat: s, id }; }
      });
    }
    return best;
  }

  _nearestView() {
    const p = this.actor.pos;
    let best = null, bd = 2.6;
    for (const f of this.world.views) {
      if (f.kind === 'frame') {
        const rel = p.clone().sub(f.center);
        if (rel.x * f.normal.x + rel.z * f.normal.z < 0.4) continue; // nur von vorn
      }
      const d = Math.hypot(f.stand.x - p.x, f.stand.z - p.z);
      if (d < (f.kind === 'book' ? 1.7 : bd) && d < bd) { bd = d; best = f; }
    }
    return best;
  }

  _collide(p) {
    for (let it = 0; it < 2; it++) {
      for (const c of this.world.colliders) {
        const cx = Math.max(c.minX, Math.min(p.x, c.maxX)), cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
        let dx = p.x - cx, dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS) continue;
        if (d2 < 1e-8) { // im Inneren → zur nächsten Seite hinausschieben
          const l = p.x - c.minX, r = c.maxX - p.x, f = p.z - c.minZ, b = c.maxZ - p.z;
          const m = Math.min(l, r, f, b);
          if (m === l) p.x = c.minX - RADIUS; else if (m === r) p.x = c.maxX + RADIUS; else if (m === f) p.z = c.minZ - RADIUS; else p.z = c.maxZ + RADIUS;
        } else {
          const d = Math.sqrt(d2), push = (RADIUS - d) / d;
          p.x += dx * push; p.z += dz * push;
        }
      }
      this.world.clamp(p);
    }
  }

  _exitSpecial() {
    const a = this.actor;
    if (this.state === 'sitting') {
      const f = new THREE.Vector2(Math.sin(a.heading), Math.cos(a.heading));
      a.pos.x += f.x * 0.75; a.pos.z += f.y * 0.75;
      this._collide(a.pos);
      a.pos.y = this.world.groundY(a.pos.x, a.pos.z);
      a.seat = -1;
    }
    if (this.state === 'viewing' || this.state === 'approach' || this.state === 'reading') {
      this.rig.yaw = a.heading + Math.PI;
      a.viewing = -1;
      if (this.state === 'reading') this.onCloseRead();
    }
    this.state = 'free'; this.frame = null; this.seatInfo = null;
  }

  update(dt) {
    const inp = this.input, a = this.actor;
    inp.poll();
    const mv = inp.move, moving = Math.abs(mv.x) + Math.abs(mv.y) > 0.05;
    const took = (k) => inp.took(k);

    // Gesten
    if (took('g')) {
      if (this.state === 'free') this.dancing = !this.dancing;
      this.waveT = 0;
    }
    if (took('h') && this.state === 'free') { this.waveT = 2.4; this.dancing = false; }
    if (this.waveT > 0) this.waveT -= dt;

    // Interaktion
    const interact = took('e') || took('f');
    if (this.state === 'sitting') {
      if (interact || moving || took('escape')) this._exitSpecial();
    } else if (this.state === 'viewing' || this.state === 'approach' || this.state === 'reading') {
      if (this.state === 'reading') { /* Lese-Overlay schließt über Escape / E / Button */ if (took('escape') || took('e') || took('f')) this._exitSpecial(); }
      else if (interact || took('escape') || (moving && this.state === 'viewing')) this._exitSpecial();
    } else if (took('e')) {
      const seat = this._nearestSeat();
      const fr = this._nearestView();
      const ds = seat ? Math.hypot(seat.seat.x - a.pos.x, seat.seat.z - a.pos.z) : 9;
      const df = fr ? Math.hypot(fr.stand.x - a.pos.x, fr.stand.z - a.pos.z) : 9;
      if (seat && ds <= df + 0.6) {
        this.state = 'sitting'; this.seatInfo = seat; a.seat = seat.id; this.dancing = false; this.waveT = 0;
      } else if (fr) {
        this.state = 'approach'; this.frame = fr; this.dancing = false; this.waveT = 0;
      }
    }

    // Bewegung je Zustand
    let speed = 0;
    if (this.state === 'free') {
      if (moving) {
        this.dancing = false; this.waveT = 0;
        const fx = -Math.sin(this.rig.yaw), fz = -Math.cos(this.rig.yaw);
        const rx = -fz, rz = fx;
        let dx = fx * mv.y + rx * mv.x, dz = fz * mv.y + rz * mv.x;
        const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        const mag = Math.min(1, Math.hypot(mv.x, mv.y));
        const target = (inp.run ? RUN : WALK) * mag;
        const k = 1 - Math.exp(-12 * dt);
        this.vel.x += (dx * target - this.vel.x) * k;
        this.vel.y += (dz * target - this.vel.y) * k;
        const th = Math.atan2(dx, dz);
        a.heading += angDiff(a.heading, th) * (1 - Math.exp(-14 * dt));
      } else {
        const k = 1 - Math.exp(-14 * dt);
        this.vel.x -= this.vel.x * k; this.vel.y -= this.vel.y * k;
      }
      speed = this.vel.length();
      if (speed > 0.02) {
        a.pos.x += this.vel.x * dt; a.pos.z += this.vel.y * dt;
        this._collide(a.pos);
      }
      const gy = this.world.groundY(a.pos.x, a.pos.z);
      a.pos.y += (gy - a.pos.y) * (1 - Math.exp(-18 * dt));
      a.anim = speed > 0.3 ? (speed > 3.2 ? 'run' : 'walk') : this.waveT > 0 ? 'wave' : this.dancing ? 'dance' : 'idle';
    } else if (this.state === 'sitting') {
      const s = this.seatInfo, k = 1 - Math.exp(-10 * dt);
      const dx = s.seat.x - a.pos.x, dz = s.seat.z - a.pos.z;
      a.pos.x += dx * k; a.pos.z += dz * k; a.pos.y += (s.seat.y - a.pos.y) * k;
      a.heading += angDiff(a.heading, s.bench.yaw) * k;
      this.vel.set(0, 0);
      speed = Math.hypot(dx, dz) > 0.08 ? 1.2 : 0;
      a.anim = 'sit';
    } else {
      // approach / viewing
      const f = this.frame;
      const dx = f.stand.x - a.pos.x, dz = f.stand.z - a.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.07 && this.state === 'approach') {
        const sp = Math.min(RUN * 0.8, 1.2 + d * 2.2);
        const step = Math.min(d, sp * dt);
        a.pos.x += (dx / d) * step; a.pos.z += (dz / d) * step;
        a.heading += angDiff(a.heading, Math.atan2(dx, dz)) * (1 - Math.exp(-14 * dt));
        speed = sp; a.anim = sp > 3.2 ? 'run' : 'walk';
        this._collide(a.pos);
      } else {
        if (this.state === 'approach') {
          this.state = f.kind === 'book' ? 'reading' : 'viewing';
          if (f.kind === 'book') this.onRead(f.book);
        }
        const face = Math.atan2(-f.normal.x, -f.normal.z);
        a.heading += angDiff(a.heading, face) * (1 - Math.exp(-10 * dt));
        a.anim = 'idle'; speed = 0;
      }
      a.pos.y += (this.world.groundY(a.pos.x, a.pos.z) - a.pos.y) * (1 - Math.exp(-18 * dt));
      a.viewing = f.index;
      this.vel.set(0, 0);
    }
    a.speed = speed;

    // Kamera
    this.rig.update(dt, inp, a, this.world.colliders, this.state, this.frame);

    // Prompt
    this.prompt = null;
    if (this.state === 'sitting') this.prompt = { key: 'F', label: t('standUp') };
    else if (this.state === 'viewing') this.prompt = { key: 'E', label: t('back2') };
    else if (this.state === 'reading') this.prompt = null;
    else if (this.state === 'free') {
      const seat = this._nearestSeat();
      if (seat) this.prompt = { key: 'E', label: t('sit') };
      else { const v = this._nearestView(); if (v) this.prompt = { key: 'E', label: t(v.kind === 'book' ? 'read' : 'view') }; }
    }
  }

  interactTouch() { this.input.pressed.add(this.state === 'sitting' ? 'f' : 'e'); }

  snapshot() {
    const a = this.actor;
    const r = (v) => Math.round(v * 100) / 100;
    return { x: r(a.pos.x), y: r(a.pos.y), z: r(a.pos.z), h: r(a.heading), a: a.anim, v: a.viewing, s: a.seat };
  }
}
