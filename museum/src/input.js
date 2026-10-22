// Tastatur, Maus-Drag, Touch-Joystick → einheitlicher Input-Zustand.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.move = { x: 0, y: 0 };    // x rechts, y vor
    this.run = false;
    this.lookDX = 0; this.lookDY = 0; this.zoom = 0;
    this.pressed = new Set();       // Tasten, die seit dem letzten Frame gedrückt wurden
    this.enabled = true;
    this.locked = false;          // Pointer-Lock aktiv (Minecraft-Mausblick)
    this.lockAllowed = true;
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.stick = { id: null, x: 0, y: 0, cx: 0, cy: 0 };
    this.lookId = null; this.lx = 0; this.ly = 0;
    this._bind();
  }

  _bind() {
    const typing = () => document.activeElement && document.activeElement.tagName === 'INPUT';
    addEventListener('keydown', (e) => {
      if (typing()) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => { this.keys.clear(); this.stick.id = null; this.stick.x = this.stick.y = 0; });

    const cv = this.canvas;
    cv.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && this.lockAllowed && !document.pointerLockElement && cv.requestPointerLock) {
        try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch { /* Drag-Fallback */ }
      }
      if (e.pointerType === 'touch') {
        if (this.lookId === null) { this.lookId = e.pointerId; this.lx = e.clientX; this.ly = e.clientY; cv.setPointerCapture(e.pointerId); }
        return;
      }
      if (e.button === 0 || e.button === 2) { this.lookId = e.pointerId; this.lx = e.clientX; this.ly = e.clientY; cv.setPointerCapture(e.pointerId); cv.classList.add('dragging'); }
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookId) return;
      this.lookDX += e.clientX - this.lx; this.lookDY += e.clientY - this.ly;
      this.lx = e.clientX; this.ly = e.clientY;
    });
    const end = (e) => { if (e.pointerId === this.lookId) { this.lookId = null; cv.classList.remove('dragging'); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === cv; cv.classList.toggle('locked', this.locked); });
    document.addEventListener('mousemove', (e) => { if (this.locked) { this.lookDX += e.movementX; this.lookDY += e.movementY; } });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom += Math.sign(e.deltaY); }, { passive: false });

    // Joystick
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    const R = 46;
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px,${dy}px)`; };
    stick.addEventListener('pointerdown', (e) => {
      const r = stick.getBoundingClientRect();
      this.stick.id = e.pointerId; this.stick.cx = r.left + r.width / 2; this.stick.cy = r.top + r.height / 2;
      stick.setPointerCapture(e.pointerId); stick.dispatchEvent(new PointerEvent('pointermove', e));
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stick.id) return;
      let dx = e.clientX - this.stick.cx, dy = e.clientY - this.stick.cy;
      const l = Math.hypot(dx, dy);
      if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
      this.stick.x = dx / R; this.stick.y = -dy / R; setKnob(dx, dy);
    });
    const sEnd = (e) => { if (e.pointerId === this.stick.id) { this.stick.id = null; this.stick.x = this.stick.y = 0; setKnob(0, 0); } };
    stick.addEventListener('pointerup', sEnd); stick.addEventListener('pointercancel', sEnd);
  }

  /* pro Frame aufrufen */
  poll() {
    const k = this.keys;
    let x = 0, y = 0;
    if (this.enabled) {
      if (k.has('w') || k.has('arrowup')) y += 1;
      if (k.has('s') || k.has('arrowdown')) y -= 1;
      if (k.has('d')) x += 1;
      if (k.has('a')) x -= 1;
      x += this.stick.x; y += this.stick.y;
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    this.move.x = x; this.move.y = y;
    this.run = this.enabled && (k.has('shift') || Math.hypot(this.stick.x, this.stick.y) > 0.92);
    this.turn = this.enabled ? (k.has('arrowright') ? 1 : 0) - (k.has('arrowleft') ? 1 : 0) : 0; // Pfeil links/rechts = Kamera drehen
  }

  took(key) { return this.pressed.has(key); }
  endFrame() {
    this.pressed.clear();
    this.lookDX = 0; this.lookDY = 0; this.zoom = 0;
  }
}

Input.prototype.releaseLock = function releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); };
