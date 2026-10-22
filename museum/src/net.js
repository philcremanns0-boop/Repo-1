import { CONFIG } from './config.js';

/* Multiplayer ohne eigenen Server: WebRTC (PeerJS) Peer-to-Peer.
   Host = Raum. Der Raum-Code ist Teil der Peer-ID. Gäste verbinden sich mit dem Host,
   der Host verteilt (Sternform). Funktioniert 1:1 auf Vercel (reines Static-Hosting).
   PeerJS' kostenloser Cloud-Broker wird nur zum Verbindungsaufbau benutzt. */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PREFIX = 'ourmuseum-v1-';
export const makeCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
export const cleanCode = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

function peerOptions() {
  const q = new URLSearchParams(location.search);
  const o = { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] } };
  if (q.get('peerhost')) { // nur zum lokalen Testen mit eigenem PeerServer
    o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 9000); o.path = q.get('peerpath') || '/'; o.secure = q.get('peersecure') === '1';
  }
  return o;
}

export class Net {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.code = '';
    this.myId = null;
    this.conns = new Map();   // id → DataConnection (nur Host: alle Gäste; Gast: 'h' → Host)
    this.players = new Map(); // id → {id,name,look}
    this.handlers = {};
    this.me = null;
    this._nextId = 1;
  }

  on(ev, fn) { this.handlers[ev] = fn; return this; }
  _emit(ev, ...a) { this.handlers[ev] && this.handlers[ev](...a); }

  async _newPeer(id) {
    const { Peer } = await import('peerjs');
    return new Promise((resolve, reject) => {
      const p = id ? new Peer(id, peerOptions()) : new Peer(peerOptions());
      const to = setTimeout(() => { try { p.destroy(); } catch {} reject(new Error('timeout')); }, 12000);
      p.on('open', () => { clearTimeout(to); resolve(p); });
      p.on('error', (e) => { clearTimeout(to); reject(e); });
    });
  }

  /* ───── Host ───── */
  async host(me) {
    this.me = me; this.isHost = true; this.myId = 'h';
    for (let i = 0; i < 6; i++) {
      const code = makeCode();
      try {
        this.peer = await this._newPeer(PREFIX + code);
        this.code = code;
        break;
      } catch (e) {
        if (e && e.type === 'unavailable-id') continue;
        throw e;
      }
    }
    if (!this.peer) throw new Error('no-code');
    this.players.set('h', { id: 'h', ...me });
    this.peer.on('connection', (conn) => this._hostAccept(conn));
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch {} });
    return this.code;
  }

  _hostAccept(conn) {
    let id = null;
    conn.on('data', (m) => {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'hello' && !id) {
        if (this.players.size >= CONFIG.maxPlayers) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
        id = 'g' + this._nextId++;
        this.conns.set(id, conn);
        const p = { id, name: String(m.name || 'Guest').slice(0, 16), look: m.look === 'girl' ? 'girl' : 'boy' };
        conn.send({ t: 'welcome', id, players: [...this.players.values()] });
        this.players.set(id, p);
        this._broadcast({ t: 'join', p }, id);
        this._emit('join', p);
        return;
      }
      if (!id) return;
      if (m.t === 's' || m.t === 'c') {
        m.id = id;
        this._broadcast(m, id);
        this._emit(m.t === 's' ? 'state' : 'chat', m);
      }
    });
    const gone = () => {
      if (!id || !this.players.has(id)) return;
      this.conns.delete(id); this.players.delete(id);
      this._broadcast({ t: 'leave', id });
      this._emit('leave', id);
    };
    conn.on('close', gone); conn.on('error', gone);
  }

  /* ───── Gast ───── */
  async join(code, me) {
    this.me = me; this.isHost = false; this.code = code;
    this.peer = await this._newPeer(null);
    const hostId = PREFIX + code;
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => { if (settled) return; settled = true; reject(err); };
      const to = setTimeout(() => fail(Object.assign(new Error('timeout'), { type: 'peer-unavailable' })), 12000);
      this.peer.on('error', (e) => { clearTimeout(to); fail(e); });
      const conn = this.peer.connect(hostId, { reliable: true, serialization: 'json' });
      conn.on('open', () => conn.send({ t: 'hello', name: me.name, look: me.look }));
      conn.on('data', (m) => {
        if (!m || typeof m !== 'object') return;
        if (m.t === 'welcome') {
          clearTimeout(to);
          this.myId = m.id; this.conns.set('h', conn);
          m.players.forEach((p) => this.players.set(p.id, p));
          this.players.set(m.id, { id: m.id, ...me });
          settled = true;
          resolve(m.players);
        } else if (m.t === 'full') { clearTimeout(to); fail(Object.assign(new Error('full'), { type: 'full' })); }
        else if (m.t === 'join') { this.players.set(m.p.id, m.p); this._emit('join', m.p); }
        else if (m.t === 'leave') { this.players.delete(m.id); this._emit('leave', m.id); }
        else if (m.t === 's') this._emit('state', m);
        else if (m.t === 'c') this._emit('chat', m);
      });
      conn.on('close', () => { if (settled) this._emit('hostLeft'); else { clearTimeout(to); fail(Object.assign(new Error('closed'), { type: 'peer-unavailable' })); } });
      conn.on('error', (e) => { clearTimeout(to); fail(e); });
    });
  }

  /* ───── Senden ───── */
  _broadcast(m, exceptId) {
    for (const [id, c] of this.conns) if (id !== exceptId && c.open) c.send(m);
  }
  _send(m) {
    if (this.isHost) this._broadcast(m);
    else { const c = this.conns.get('h'); if (c && c.open) c.send(m); }
  }
  sendState(s) { this._send({ t: 's', id: this.myId, ...s }); }
  sendChat(text) { this._send({ t: 'c', id: this.myId, text }); }

  get count() { return this.players.size; }

  close() {
    try { for (const c of this.conns.values()) c.close(); } catch {}
    try { this.peer && this.peer.destroy(); } catch {}
    this.peer = null; this.conns.clear(); this.players.clear();
  }
}
