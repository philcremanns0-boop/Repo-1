import * as THREE from 'three';
import { Avatar } from './avatar.js';
import { NameTag, Bubble } from './labels.js';
import { t } from './i18n.js';

const TAU = Math.PI * 2;
export const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

/* Eine Figur in der Welt (lokal oder remote): Avatar + Namensschild + Sprechblase. */
export class Actor {
  constructor(scene, { id, name, look }) {
    this.id = id; this.name = name; this.lookName = look;
    this.avatar = new Avatar(look);
    this.tag = new NameTag(name);
    this.tag.setViewingText(t('viewing'));
    this.bubble = new Bubble();
    scene.add(this.avatar.root, this.tag.sprite, this.bubble.sprite);
    this.scene = scene;
    this.pos = new THREE.Vector3();
    this.heading = 0;
    this.anim = 'idle';
    this.viewing = -1;   // Rahmen-Index
    this.seat = -1;
    this.speed = 0;
    this.frames = null;
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
    a.setAnim(this.anim);
    a.update(dt, this.speed);
    a.root.position.copy(this.pos);
    a.root.rotation.y = this.heading;
    const sitting = this.anim === 'sit';
    const top = this.pos.y + (sitting ? 1.5 : 1.86) * (this.avatar.body.scale.x);
    // Namensschild: „Viewing“ über dem Rahmen
    if (this.viewing >= 0 && this.frames && this.frames[this.viewing]) {
      this.tag.set('viewing');
      this.tag.sprite.position.copy(this.frames[this.viewing].top);
    } else {
      this.tag.set('name');
      this.tag.sprite.position.set(this.pos.x, top + 0.12, this.pos.z);
    }
    this.bubble.sprite.position.set(this.pos.x, top + 0.3, this.pos.z);
    this.bubble.update(dt);
  }

  dispose() {
    this.scene.remove(this.avatar.root, this.tag.sprite, this.bubble.sprite);
    this.bubble.dispose();
  }
}
