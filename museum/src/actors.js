import * as THREE from 'three';
import { Avatar } from './avatar.js';
import { NameTag, Bubble } from './labels.js';
import { t } from './i18n.js';
import { heartTexture } from './textures.js';

const TAU = Math.PI * 2;
let heartMat;
const getHeartMat = () => heartMat || (heartMat = new THREE.SpriteMaterial({ map: heartTexture(), transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));

export const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

/* Eine Figur in der Welt (lokal oder remote): Avatar + Namensschild + Sprechblase. */
export class Actor {
  constructor(scene, { id, name, look }) {
    this.id = id; this.name = name; this.lookName = look;
    this.avatar = new Avatar(look);
    this.tag = new NameTag(name);
    this.bubble = new Bubble();
    scene.add(this.avatar.root, this.tag.sprite, this.bubble.sprite);
    this.scene = scene;
    this.pos = new THREE.Vector3();
    this.heading = 0;
    this.anim = 'idle';
    this.viewing = -1;   // Rahmen-Index
    this.seat = -1;
    this.speed = 0;
    this.views = null;
    this.emoteT = 0; this._prevAnim = 'idle';
    this.lookAt = null;  // Position einer anderen Figur, zu der der Kopf sich dreht
    this.hearts = []; this._heartAcc = 0;
    // Remote-Ziele
    this.tPos = new THREE.Vector3(); this.tHeading = 0; this.remote = false;
  }

  say(text) { this.bubble.say(text); }

  /* Netzwerk-Zustand übernehmen */
  applyState(s, snap = false) {
    this.tPos.set(s.x, s.y, s.z); this.tHeading = s.h;
    this.anim = s.a; this.viewing = s.v; this.seat = s.s;
    if (snap) { this.pos.copy(this.tPos); this.heading = this.tHeading; }
  }

  update(dt) {
    if (this.remote) {
      const k = 1 - Math.exp(-11 * dt);
      const px = this.pos.x, pz = this.pos.z;
      this.pos.lerp(this.tPos, k);
      this.heading += angDiff(this.heading, this.tHeading) * k;
      this.speed = Math.hypot(this.pos.x - px, this.pos.z - pz) / Math.max(dt, 1e-3);
    }
    const a = this.avatar;
    if (this.anim !== this._prevAnim) { this._prevAnim = this.anim; this.emoteT = 0; } else this.emoteT += dt;
    a.emoteT = this.emoteT;
    a.talking = this.bubble.life > 0;
    // Blickkontakt
    let ly = 0;
    if (this.lookAt && this.anim !== 'bow') {
      const d = angDiff(this.heading, Math.atan2(this.lookAt.x - this.pos.x, this.lookAt.z - this.pos.z));
      if (Math.abs(d) < 1.9) ly = Math.max(-0.9, Math.min(0.9, d));
    }
    a.lookYaw = ly;
    a.setAnim(this.anim);
    a.update(dt, this.speed);
    a.root.position.copy(this.pos);
    a.root.rotation.y = this.heading;
    const sitting = this.anim === 'sit';
    const top = this.pos.y + (sitting ? 1.0 : 1.72);
    // Namensschild: „Viewing“/„Reading“ über dem Objekt
    const v = this.viewing >= 0 && this.views ? this.views[this.viewing] : null;
    if (v) {
      this.tag.set(t(v.kind === 'book' ? 'reading' : 'viewing'));
      this.tag.sprite.position.copy(v.top);
    } else {
      this.tag.set(null);
      this.tag.sprite.position.set(this.pos.x, top + 0.12, this.pos.z);
    }
    this.bubble.sprite.position.set(this.pos.x, top + 0.3, this.pos.z);
    this.bubble.update(dt);
    this._updateHearts(dt, top);
  }

  /* Herz-Emote: kleine Herzen steigen über dem Kopf auf */
  _updateHearts(dt, top) {
    if (this.anim === 'heart') {
      this._heartAcc += dt;
      if (this._heartAcc > 0.28 && this.hearts.length < 9) {
        this._heartAcc = 0;
        const sp = new THREE.Sprite(getHeartMat());
        sp.renderOrder = 22;
        sp.position.set(this.pos.x + (Math.random() - 0.5) * 0.4, top - 0.15, this.pos.z + (Math.random() - 0.5) * 0.4);
        sp.userData = { life: 0, dur: 1.5 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.12, size: 0.13 + Math.random() * 0.08 };
        this.scene.add(sp); this.hearts.push(sp);
      }
    }
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i], u = h.userData;
      u.life += dt;
      const k = u.life / u.dur;
      if (k >= 1) { this.scene.remove(h); this.hearts.splice(i, 1); continue; }
      h.position.y += dt * 0.5; h.position.x += u.vx * dt;
      const pop = k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1;
      h.scale.setScalar(u.size * pop);
    }
  }

  dispose() {
    this.scene.remove(this.avatar.root, this.tag.sprite, this.bubble.sprite);
    this.hearts.forEach((h) => this.scene.remove(h));
    this.bubble.dispose();
  }
}
