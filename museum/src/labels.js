import * as THREE from 'three';
import { labelTexture, bubbleTexture } from './textures.js';

/* Namensschild-Sprite (immer sichtbar, billboard). */
export class NameTag {
  constructor(name) {
    this.mat = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.renderOrder = 20;
    this.name = name;
    this.mode = '';
    this.set('name');
  }
  set(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    const l = mode === 'viewing' ? labelTexture(this._viewing || 'Viewing', { dot: false }) : labelTexture(this.name, { dot: true });
    this.mat.map = l.texture; this.mat.needsUpdate = true;
    this.sprite.scale.set(0.15 * l.aspect, 0.15, 1);
  }
  setViewingText(t) { this._viewing = t; }
}

/* Sprechblase mit Auto-Ablauf. */
export class Bubble {
  constructor() {
    this.mat = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, opacity: 0 });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.renderOrder = 21;
    this.sprite.visible = false;
    this.life = 0;
    this.age = 0;
    this.tex = null;
  }
  say(text, secs = 6) {
    if (this.tex) this.tex.dispose();
    const b = bubbleTexture(text);
    this.tex = b.texture;
    this.mat.map = b.texture; this.mat.needsUpdate = true;
    this.sprite.scale.set(0.17 * b.aspect, 0.17, 1);
    this.sprite.center.set(0.5, 0);
    this.life = secs; this.age = 0; this.sprite.visible = true;
  }
  update(dt) {
    if (this.life <= 0) return;
    this.life -= dt; this.age += dt;
    this.mat.opacity = Math.max(0, Math.min(1, this.age * 6, this.life * 3));
    if (this.life <= 0) this.sprite.visible = false;
  }
  dispose() { if (this.tex) this.tex.dispose(); this.mat.dispose(); }
}
