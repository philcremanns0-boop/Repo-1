// Vercel-Funktion: liefert TURN-Zugangsdaten für WebRTC (Multiplayer hinter strengen Routern / im Mobilfunknetz).
// Die Schlüssel stehen NICHT im Code, sondern als Umgebungsvariablen in Vercel (Project → Settings → Environment Variables):
//   Cloudflare Realtime TURN:  CLOUDFLARE_TURN_KEY_ID  +  CLOUDFLARE_TURN_API_TOKEN
//   oder Metered.ca:           METERED_DOMAIN (z. B. meinname.metered.live)  +  METERED_API_KEY
// Ist nichts gesetzt, kommt eine leere Liste zurück und der Client nutzt seine Standard-Server.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const empty = { iceServers: [] };
  try {
    const { CLOUDFLARE_TURN_KEY_ID: cfId, CLOUDFLARE_TURN_API_TOKEN: cfToken, METERED_DOMAIN: mDomain, METERED_API_KEY: mKey } = process.env;

    if (cfId && cfToken) {
      const headers = { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' };
      const body = JSON.stringify({ ttl: 6 * 3600 });
      for (const path of ['generate-ice-servers', 'generate']) {
        const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${cfId}/credentials/${path}`, { method: 'POST', headers, body });
        if (!r.ok) continue;
        const j = await r.json();
        const list = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
        // STUN-Einträge ohne Zugangsdaten bringt der Client selbst mit
        const turn = list.filter((s) => s.username && s.credential);
        if (turn.length) return res.status(200).send(JSON.stringify({ iceServers: turn }));
      }
    }

    if (mDomain && mKey) {
      const r = await fetch(`https://${mDomain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(mKey)}`);
      if (r.ok) {
        const list = await r.json();
        if (Array.isArray(list)) return res.status(200).send(JSON.stringify({ iceServers: list.filter((s) => s.username && s.credential) }));
      }
    }
  } catch { /* Fehler nie an den Client durchreichen */ }
  return res.status(200).send(JSON.stringify(empty));
}
